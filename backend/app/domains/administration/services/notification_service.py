from typing import Any
from app.models import get_repository


def _notification_to_dict(n: Any) -> dict[str, Any]:
    return {
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "entityType": n.entityType,
        "entityId": n.entityId,
        "isRead": n.isRead,
        "userId": n.userId,
        "createdAt": n.createdAt.isoformat(),
    }


def _create_notification(
    user_id: str,
    org_id: str,
    type_: str,
    title: str,
    message: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
) -> dict[str, Any]:
    db = get_repository()
    n = db.notification.create(
        data={
            "type": type_,
            "title": title,
            "message": message,
            "entityType": entity_type,
            "entityId": entity_id,
            "userId": user_id,
            "orgId": org_id,
        }
    )
    return _notification_to_dict(n)


def create_notification(
    user_id: str,
    org_id: str,
    type_: str,
    title: str,
    message: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
) -> dict[str, Any]:
    return _create_notification(user_id, org_id, type_, title, message, entity_type, entity_id)


def _list_notifications(
    user_id: str, org_id: str, page: int = 1, per_page: int = 20, unread_only: bool = False
) -> dict[str, Any]:
    db = get_repository()
    where: dict[str, Any] = {"userId": user_id, "orgId": org_id}
    if unread_only:
        where["isRead"] = False
    total = db.notification.count(where=where)
    items = db.notification.find_many(
        where=where, skip=(page - 1) * per_page, take=per_page, order={"createdAt": "desc"}
    )
    return {
        "items": [_notification_to_dict(n) for n in items],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_notifications(
    user_id: str, org_id: str, page: int = 1, per_page: int = 20, unread_only: bool = False
) -> dict[str, Any]:
    return _list_notifications(user_id, org_id, page, per_page, unread_only)


def _unread_count(user_id: str, org_id: str) -> int:
    db = get_repository()
    return db.notification.count(where={"userId": user_id, "orgId": org_id, "isRead": False})


def unread_count(user_id: str, org_id: str) -> int:
    return _unread_count(user_id, org_id)


def _mark_read(notification_id: str, user_id: str) -> bool:
    db = get_repository()
    n = db.notification.find_first(where={"id": notification_id, "userId": user_id})
    if not n:
        return False
    db.notification.update(where={"id": notification_id}, data={"isRead": True})
    return True


def mark_read(notification_id: str, user_id: str) -> bool:
    return _mark_read(notification_id, user_id)


def _mark_all_read(user_id: str, org_id: str) -> int:
    db = get_repository()
    result = db.notification.update_many(
        where={"userId": user_id, "orgId": org_id, "isRead": False}, data={"isRead": True}
    )
    return result


def mark_all_read(user_id: str, org_id: str) -> int:
    return _mark_all_read(user_id, org_id)
