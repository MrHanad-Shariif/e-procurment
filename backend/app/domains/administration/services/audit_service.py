import json
from typing import Any
from flask import request
from flask_jwt_extended import get_jwt, get_jwt_identity
from app.models import get_repository


def _create_log(
    action: str,
    entity_type: str,
    entity_id: str,
    user_id: str,
    org_id: str,
    old_data: dict[str, Any] | None = None,
    new_data: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> None:
    db = get_repository()
    data: dict[str, Any] = {
        "action": action,
        "entityType": entity_type,
        "entityId": entity_id,
        "userId": user_id,
        "orgId": org_id,
        "ipAddress": ip_address,
    }
    if old_data is not None:
        data["oldData"] = old_data
    if new_data is not None:
        data["newData"] = new_data
    db.auditlog.create(data=data)


def log_action(
    action: str,
    entity_type: str,
    entity_id: str,
    old_data: dict[str, Any] | None = None,
    new_data: dict[str, Any] | None = None,
) -> None:
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        org_id = claims.get("org_id", "")
        ip = request.remote_addr
    except Exception:
        return
    _create_log(action, entity_type, entity_id, user_id, org_id, old_data, new_data, ip)


def _list_logs(
    org_id: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    user_id: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict[str, Any]:
    db = get_repository()
    where: dict[str, Any] = {"orgId": org_id}
    if entity_type:
        where["entityType"] = entity_type
    if entity_id:
        where["entityId"] = entity_id
    if user_id:
        where["userId"] = user_id
    total = db.auditlog.count(where=where)
    logs = db.auditlog.find_many(
        where=where, skip=(page - 1) * per_page, take=per_page, order={"createdAt": "desc"}
    )
    items = [
        {
            "id": log.id,
            "action": log.action,
            "entityType": log.entityType,
            "entityId": log.entityId,
            "oldData": json.loads(log.oldData) if isinstance(log.oldData, str) else log.oldData,
            "newData": json.loads(log.newData) if isinstance(log.newData, str) else log.newData,
            "userId": log.userId,
            "ipAddress": log.ipAddress,
            "createdAt": log.createdAt.isoformat(),
        }
        for log in logs
    ]
    return {
        "items": items,
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_audit_logs(
    org_id: str,
    entity_type: str | None = None,
    entity_id: str | None = None,
    user_id: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict[str, Any]:
    return _list_logs(org_id, entity_type, entity_id, user_id, page, per_page)
