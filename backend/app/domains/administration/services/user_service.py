from typing import Any
from app.models import get_repository
from app.domains.identity.services.auth_service import (
    hash_password,
    _get_user_permissions,
    _get_user_roles,
    _user_to_dict,
)


def _list_users(
    org_id: str, page: int = 1, per_page: int = 20, search: str | None = None
) -> dict[str, Any]:
    db = get_repository()
    where: dict[str, Any] = {"orgId": org_id}
    if search:
        where["OR"] = [
            {"email": {"contains": search, "mode": "insensitive"}},
            {"firstName": {"contains": search, "mode": "insensitive"}},
            {"lastName": {"contains": search, "mode": "insensitive"}},
        ]
    total = db.user.count(where=where)
    users = db.user.find_many(
        where=where,
        skip=(page - 1) * per_page,
        take=per_page,
        order={"createdAt": "desc"},
        include={"roles": {"include": {"role": True}}},
    )
    items = []
    for u in users:
        roles = [{"id": ur.role.id, "name": ur.role.name, "slug": ur.role.slug} for ur in u.roles]
        items.append(
            {
                "id": u.id,
                "email": u.email,
                "firstName": u.firstName,
                "lastName": u.lastName,
                "preferredLanguage": u.preferredLanguage,
                "isActive": u.isActive,
                "orgId": u.orgId,
                "roles": roles,
                "createdAt": u.createdAt.isoformat(),
            }
        )
    return {
        "items": items,
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_users(org_id: str, page: int = 1, per_page: int = 20, search: str | None = None):
    return _list_users(org_id, page, per_page, search)


def _get_user(user_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    user = db.user.find_first(where={"id": user_id, "orgId": org_id})
    if not user:
        return None
    permissions = _get_user_permissions(db, user.id)
    roles = _get_user_roles(db, user.id)
    return _user_to_dict(user, roles, permissions)


def get_user(user_id: str, org_id: str):
    return _get_user(user_id, org_id)


def _update_user(user_id: str, org_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_repository()
    user = db.user.find_first(where={"id": user_id, "orgId": org_id})
    if not user:
        return None
    update_data: dict[str, Any] = {}
    field_map = {
        "first_name": "firstName",
        "last_name": "lastName",
        "preferred_language": "preferredLanguage",
    }
    for key, prisma_key in field_map.items():
        if key in data and data[key] is not None:
            update_data[prisma_key] = data[key]
    db.user.update(where={"id": user_id}, data=update_data)
    return _get_user(user_id, org_id)


def update_user(user_id: str, org_id: str, data: dict[str, Any]):
    return _update_user(user_id, org_id, data)


def _toggle_user_active(user_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    user = db.user.find_first(where={"id": user_id, "orgId": org_id})
    if not user:
        return None
    updated = db.user.update(where={"id": user_id}, data={"isActive": not user.isActive})
    permissions = _get_user_permissions(db, updated.id)
    roles = _get_user_roles(db, updated.id)
    return _user_to_dict(updated, roles, permissions)


def toggle_user_active(user_id: str, org_id: str):
    return _toggle_user_active(user_id, org_id)


def _get_user_sessions(user_id: str, org_id: str) -> list[dict[str, Any]]:
    db = get_repository()
    user = db.user.find_first(where={"id": user_id, "orgId": org_id})
    if not user:
        return []
    sessions = db.session.find_many(where={"userId": user_id}, order={"createdAt": "desc"})
    return [
        {
            "id": s.id,
            "ipAddress": s.ipAddress,
            "userAgent": s.userAgent,
            "expiresAt": s.expiresAt.isoformat(),
            "createdAt": s.createdAt.isoformat(),
        }
        for s in sessions
    ]


def get_user_sessions(user_id: str, org_id: str):
    return _get_user_sessions(user_id, org_id)


def _revoke_user_session(user_id: str, session_id: str, org_id: str) -> bool:
    db = get_repository()
    user = db.user.find_first(where={"id": user_id, "orgId": org_id})
    if not user:
        return False
    session = db.session.find_first(where={"id": session_id, "userId": user_id})
    if not session:
        return False
    db.session.delete(where={"id": session_id})
    return True


def revoke_user_session(user_id: str, session_id: str, org_id: str):
    return _revoke_user_session(user_id, session_id, org_id)
