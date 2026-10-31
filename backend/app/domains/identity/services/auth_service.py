from datetime import datetime, timedelta, timezone
from typing import Any
import bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token
from app.models import get_repository


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    if password_hash.startswith(("$2a$", "$2b$", "$2y$")):
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    from werkzeug.security import check_password_hash

    return check_password_hash(password_hash, password)


def _get_user_permissions(db: Any, user_id: str) -> list[str]:
    from sqlalchemy import select
    from app.extensions import db as orm
    from app.models.entities import Permission, RolePermission, UserRole

    query = (
        select(Permission.codename)
        .join(RolePermission, RolePermission.permissionId == Permission.id)
        .join(UserRole, UserRole.roleId == RolePermission.roleId)
        .where(UserRole.userId == user_id)
        .distinct()
        .order_by(Permission.codename)
    )
    return list(orm.session.scalars(query))


def _get_user_roles(db: Any, user_id: str) -> list[dict[str, Any]]:
    user_roles = db.userrole.find_many(where={"userId": user_id}, include={"role": True})
    return [{"id": ur.role.id, "name": ur.role.name, "slug": ur.role.slug} for ur in user_roles]


def _user_to_dict(user: Any, roles: list[dict[str, Any]], permissions: list[str]) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "preferredLanguage": user.preferredLanguage,
        "orgId": user.orgId,
        "isActive": user.isActive,
        "roles": roles,
        "permissions": permissions,
        "mustChangePassword": bool((user.profile or {}).get("must_change_password")),
    }


def _authenticate_user(email: str, password: str, org_slug: str) -> dict[str, Any] | None:
    db = get_repository()
    org = db.organization.find_unique(where={"slug": org_slug})
    if not org or not org.isActive:
        return None
    user = db.user.find_unique(where={"email_orgId": {"email": email, "orgId": org.id}})
    if not user or not user.isActive:
        return None
    if not verify_password(password, user.passwordHash):
        return None
    permissions = _get_user_permissions(db, user.id)
    roles = _get_user_roles(db, user.id)
    return _user_to_dict(user, roles, permissions)


def authenticate_user(email: str, password: str, org_slug: str) -> dict[str, Any] | None:
    return _authenticate_user(email, password, org_slug)


def generate_tokens(user_id: str, org_id: str, permissions: list[str]) -> dict[str, str]:
    additional_claims = {"org_id": org_id, "permissions": permissions}
    access_token = create_access_token(identity=user_id, additional_claims=additional_claims)
    refresh_token = create_refresh_token(identity=user_id, additional_claims={"org_id": org_id})
    return {"accessToken": access_token, "refreshToken": refresh_token}


def _create_session(
    user_id: str,
    refresh_token: str,
    ip_address: str | None,
    user_agent: str | None,
    org_id: str,
    expires_days: int = 30,
) -> None:
    db = get_repository()
    settings = db.systemsettings.find_unique(where={"orgId": org_id})
    max_sessions = settings.maxConcurrentSessions if settings else 5
    sessions = db.session.find_many(where={"userId": user_id}, order={"createdAt": "asc"})
    if len(sessions) >= max_sessions:
        oldest = sessions[0]
        db.session.delete(where={"id": oldest.id})
    db.session.create(
        data={
            "userId": user_id,
            "refreshToken": refresh_token,
            "ipAddress": ip_address,
            "userAgent": user_agent,
            "expiresAt": datetime.now(timezone.utc) + timedelta(days=expires_days),
        }
    )


def create_session(
    user_id: str, refresh_token: str, ip_address: str | None, user_agent: str | None, org_id: str
) -> None:
    _create_session(user_id, refresh_token, ip_address, user_agent, org_id)


def _verify_refresh_token(refresh_token: str) -> bool:
    db = get_repository()
    session = db.session.find_unique(where={"refreshToken": refresh_token})
    if not session:
        return False
    expires_at = (
        session.expiresAt
        if session.expiresAt.tzinfo
        else session.expiresAt.replace(tzinfo=timezone.utc)
    )
    if expires_at < datetime.now(timezone.utc):
        db.session.delete(where={"id": session.id})
        return False
    return True


def verify_refresh_token(refresh_token: str) -> bool:
    return _verify_refresh_token(refresh_token)


def _revoke_session(refresh_token: str, user_id: str) -> None:
    db = get_repository()
    db.session.delete_many(where={"refreshToken": refresh_token, "userId": user_id})


def revoke_session(refresh_token: str, user_id: str) -> None:
    _revoke_session(refresh_token, user_id)


def _get_user_profile(user_id: str) -> dict[str, Any] | None:
    db = get_repository()
    user = db.user.find_unique(where={"id": user_id})
    if not user:
        return None
    permissions = _get_user_permissions(db, user.id)
    roles = _get_user_roles(db, user.id)
    return _user_to_dict(user, roles, permissions)


def get_user_profile(user_id: str) -> dict[str, Any] | None:
    return _get_user_profile(user_id)


def _create_user(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role_ids: list[str],
    org_id: str,
    preferred_language: str = "EN",
) -> dict[str, Any]:
    db = get_repository()
    existing = db.user.find_unique(where={"email_orgId": {"email": email, "orgId": org_id}})
    if existing:
        raise ValueError("A user with this email already exists in this organization")
    user = db.user.create(
        data={
            "email": email,
            "passwordHash": hash_password(password),
            "firstName": first_name,
            "lastName": last_name,
            "preferredLanguage": preferred_language,
            "orgId": org_id,
        }
    )
    for role_id in role_ids:
        db.userrole.create(data={"userId": user.id, "roleId": role_id})
    permissions = _get_user_permissions(db, user.id)
    roles = _get_user_roles(db, user.id)
    return _user_to_dict(user, roles, permissions)


def create_user(
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role_ids: list[str],
    org_id: str,
    preferred_language: str = "EN",
) -> dict[str, Any]:
    return _create_user(
        email, password, first_name, last_name, role_ids, org_id, preferred_language
    )


def get_user_permissions_sync(user_id: str) -> list[str]:

    def _run() -> list[str]:
        db = get_repository()
        return _get_user_permissions(db, user_id)

    return _run()
