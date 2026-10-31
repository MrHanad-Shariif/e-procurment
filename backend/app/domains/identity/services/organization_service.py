from datetime import timedelta
from typing import Any
from sqlalchemy.exc import IntegrityError as UniqueViolationError
from app.models import get_repository
from app.domains.identity.services.auth_service import (
    _get_user_permissions,
    _get_user_roles,
    _user_to_dict,
    hash_password,
)


def _create_workspace(data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    password_hash = hash_password(data["password"])
    try:
        with db.tx(timeout=timedelta(seconds=30)) as tx:
            org = tx.organization.create(
                data={
                    "name": data["organization_name"],
                    "slug": data["org_slug"],
                    "systemName": "E-Procurement",
                    "defaultLanguage": data["preferred_language"],
                }
            )
            permissions = tx.permission.find_many()
            if not permissions:
                raise RuntimeError("Workspace permission catalog has not been initialized")
            officer_groups = {
                "purchase_request",
                "rfq",
                "purchase_order",
                "supplier",
                "goods_receipt",
                "invoice",
                "contract",
            }
            roles = [
                ("Admin", "admin", permissions),
                (
                    "Procurement Officer",
                    "procurement-officer",
                    [
                        p
                        for p in permissions
                        if p.group in officer_groups and (not p.codename.endswith(".view_all"))
                    ],
                ),
                ("Viewer", "viewer", [p for p in permissions if p.codename.endswith(".view")]),
            ]
            admin_role_id = ""
            for name, slug, role_permissions in roles:
                role = tx.role.create(
                    data={"name": name, "slug": slug, "orgId": org.id, "isSystem": True}
                )
                if slug == "admin":
                    admin_role_id = role.id
                tx.rolepermission.create_many(
                    data=[
                        {"roleId": role.id, "permissionId": permission.id}
                        for permission in role_permissions
                    ]
                )
            user = tx.user.create(
                data={
                    "firstName": data["first_name"],
                    "lastName": data["last_name"],
                    "email": data["email"],
                    "passwordHash": password_hash,
                    "preferredLanguage": data["preferred_language"],
                    "orgId": org.id,
                }
            )
            tx.userrole.create(data={"userId": user.id, "roleId": admin_role_id})
            tx.systemsettings.create(data={"orgId": org.id})
            user_permissions = _get_user_permissions(tx, user.id)
            user_roles = _get_user_roles(tx, user.id)
            profile = _user_to_dict(user, user_roles, user_permissions)
    except UniqueViolationError as error:
        raise ValueError("This workspace address is already taken") from error
    return {"user": profile, "organization": {"id": org.id, "name": org.name, "slug": org.slug}}


def create_workspace(data: dict[str, Any]) -> dict[str, Any]:
    result = _create_workspace(data)
    from app.cli import seed

    seed()
    return result
