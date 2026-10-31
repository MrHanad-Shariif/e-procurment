from typing import Any
from app.models import get_repository


def _list_roles(org_id: str) -> list[dict[str, Any]]:
    db = get_repository()
    roles = db.role.find_many(
        where={"orgId": org_id},
        include={"permissions": {"include": {"permission": True}}},
        order={"createdAt": "asc"},
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "description": r.description,
            "isSystem": r.isSystem,
            "userCount": r.users_count if hasattr(r, "users_count") else 0,
            "permissions": [
                {"id": rp.permission.id, "codename": rp.permission.codename} for rp in r.permissions
            ],
        }
        for r in roles
    ]


def list_roles(org_id: str):
    return _list_roles(org_id)


def _get_role(role_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    role = db.role.find_first(
        where={"id": role_id, "orgId": org_id},
        include={"permissions": {"include": {"permission": True}}},
    )
    if not role:
        return None
    return {
        "id": role.id,
        "name": role.name,
        "slug": role.slug,
        "description": role.description,
        "isSystem": role.isSystem,
        "permissions": [
            {
                "id": rp.permission.id,
                "codename": rp.permission.codename,
                "group": rp.permission.group,
                "description": rp.permission.description,
            }
            for rp in role.permissions
        ],
    }


def get_role(role_id: str, org_id: str):
    return _get_role(role_id, org_id)


def _create_role(
    org_id: str, name: str, slug: str, description: str | None, permission_ids: list[str]
) -> dict[str, Any]:
    db = get_repository()
    role = db.role.create(
        data={
            "name": name,
            "slug": slug,
            "description": description,
            "orgId": org_id,
            "isSystem": False,
        }
    )
    for pid in permission_ids:
        db.rolepermission.create(data={"roleId": role.id, "permissionId": pid})
    return _get_role(role.id, org_id)


def create_role(
    org_id: str, name: str, slug: str, description: str | None, permission_ids: list[str]
):
    return _create_role(org_id, name, slug, description, permission_ids)


def _update_role(role_id: str, org_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_repository()
    role = db.role.find_first(where={"id": role_id, "orgId": org_id})
    if not role:
        return None
    update_data: dict[str, Any] = {}
    if data.get("name") is not None:
        update_data["name"] = data["name"]
    if data.get("description") is not None:
        update_data["description"] = data["description"]
    db.role.update(where={"id": role_id}, data=update_data)
    return _get_role(role_id, org_id)


def update_role(role_id: str, org_id: str, data: dict[str, Any]):
    return _update_role(role_id, org_id, data)


def _delete_role(role_id: str, org_id: str) -> tuple[bool, str]:
    db = get_repository()
    role = db.role.find_first(where={"id": role_id, "orgId": org_id})
    if not role:
        return (False, "Role not found")
    if role.isSystem:
        return (False, "Cannot delete system roles")
    user_count = db.userrole.count(where={"roleId": role_id})
    if user_count > 0:
        return (False, f"Cannot delete role with {user_count} assigned users")
    db.rolepermission.delete_many(where={"roleId": role_id})
    db.role.delete(where={"id": role_id})
    return (True, "Role deleted")


def delete_role(role_id: str, org_id: str):
    return _delete_role(role_id, org_id)


def _set_role_permissions(
    role_id: str, org_id: str, permission_ids: list[str]
) -> dict[str, Any] | None:
    db = get_repository()
    role = db.role.find_first(where={"id": role_id, "orgId": org_id})
    if not role:
        return None
    db.rolepermission.delete_many(where={"roleId": role_id})
    for pid in permission_ids:
        db.rolepermission.create(data={"roleId": role_id, "permissionId": pid})
    return _get_role(role_id, org_id)


def set_role_permissions(role_id: str, org_id: str, permission_ids: list[str]):
    return _set_role_permissions(role_id, org_id, permission_ids)


def _list_permissions() -> list[dict[str, Any]]:
    db = get_repository()
    permissions = db.permission.find_many(order={"group": "asc"})
    grouped: dict[str, list[dict[str, Any]]] = {}
    for p in permissions:
        if p.group not in grouped:
            grouped[p.group] = []
        grouped[p.group].append({"id": p.id, "codename": p.codename, "description": p.description})
    return [{"group": group, "permissions": perms} for group, perms in grouped.items()]


def list_permissions():
    return _list_permissions()
