from datetime import datetime, timezone
from typing import Any
from app.models import get_repository
from app.domains.administration.services.audit_service import log_action


def _item_to_dict(item: Any) -> dict[str, Any]:
    return {
        "id": item.id,
        "description": item.description,
        "quantity": item.quantity,
        "unit": item.unit,
        "estimatedPrice": item.estimatedPrice,
        "totalPrice": item.totalPrice,
        "budgetCode": item.budgetCode,
        "specifications": item.specifications,
        "sortOrder": item.sortOrder,
    }


def _pr_to_dict(pr: Any) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": pr.id,
        "prNumber": pr.prNumber,
        "title": pr.title,
        "description": pr.description,
        "status": pr.status,
        "priority": pr.priority,
        "requiredDate": pr.requiredDate.isoformat() if pr.requiredDate else None,
        "totalEstimate": pr.totalEstimate,
        "currency": pr.currency,
        "rejectionNotes": pr.rejectionNotes,
        "createdById": pr.createdById,
        "reviewerId": pr.reviewerId,
        "approvedById": pr.approvedById,
        "createdAt": pr.createdAt.isoformat(),
        "updatedAt": pr.updatedAt.isoformat(),
        "submittedAt": pr.submittedAt.isoformat() if pr.submittedAt else None,
        "approvedAt": pr.approvedAt.isoformat() if pr.approvedAt else None,
    }
    if hasattr(pr, "items") and pr.items is not None:
        result["items"] = [_item_to_dict(i) for i in pr.items]
    else:
        result["items"] = []
    return result


def _generate_pr_number(db: Any, org_id: str) -> str:
    count = db.purchaserequisition.count(where={"orgId": org_id})
    return f"PR-{count + 1:05d}"


def _list_prs(
    org_id: str,
    user_id: str,
    permissions: list[str],
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    db = get_repository()
    where: dict[str, Any] = {"orgId": org_id}
    if "purchase_request.view_all" not in permissions:
        where["createdById"] = user_id
    if status:
        where["status"] = status
    if search:
        where["OR"] = [
            {"title": {"contains": search, "mode": "insensitive"}},
            {"prNumber": {"contains": search, "mode": "insensitive"}},
        ]
    total = db.purchaserequisition.count(where=where)
    prs = db.purchaserequisition.find_many(
        where=where,
        skip=(page - 1) * per_page,
        take=per_page,
        order={"createdAt": "desc"},
        include={"items": True},
    )
    return {
        "items": [_pr_to_dict(pr) for pr in prs],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_prs(
    org_id: str,
    user_id: str,
    permissions: list[str],
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    return _list_prs(org_id, user_id, permissions, page, per_page, status, search)


def _get_pr(pr_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    pr = db.purchaserequisition.find_first(
        where={"id": pr_id, "orgId": org_id}, include={"items": {"order_by": {"sortOrder": "asc"}}}
    )
    return _pr_to_dict(pr) if pr else None


def get_pr(pr_id: str, org_id: str) -> dict[str, Any] | None:
    return _get_pr(pr_id, org_id)


def _create_pr(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    pr_number = _generate_pr_number(db, org_id)
    items_data = data.pop("items", [])
    total = sum((i["estimated_price"] * i["quantity"] for i in items_data))
    create_data: dict[str, Any] = {
        "prNumber": pr_number,
        "title": data["title"],
        "description": data.get("description"),
        "priority": data.get("priority", "MEDIUM"),
        "currency": data.get("currency", "USD"),
        "totalEstimate": total,
        "orgId": org_id,
        "createdById": user_id,
    }
    if data.get("required_date"):
        create_data["requiredDate"] = datetime.fromisoformat(data["required_date"])
    pr = db.purchaserequisition.create(data=create_data)
    for idx, item in enumerate(items_data):
        tp = item["estimated_price"] * item["quantity"]
        db.purchaserequisitionitem.create(
            data={
                "prId": pr.id,
                "description": item["description"],
                "quantity": item["quantity"],
                "unit": item.get("unit", "PCS"),
                "estimatedPrice": item["estimated_price"],
                "totalPrice": tp,
                "budgetCode": item.get("budget_code"),
                "specifications": item.get("specifications"),
                "sortOrder": idx,
            }
        )
    return _get_pr(pr.id, org_id)


def create_pr(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    result = _create_pr(org_id, user_id, data)
    log_action("CREATE", "purchase_requisition", result["id"], new_data=result)
    return result


def _update_pr(pr_id: str, org_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_repository()
    pr = db.purchaserequisition.find_first(where={"id": pr_id, "orgId": org_id})
    if not pr:
        return None
    if pr.status != "DRAFT":
        return None
    update_data: dict[str, Any] = {}
    field_map = {
        "title": "title",
        "description": "description",
        "priority": "priority",
        "currency": "currency",
    }
    for py_key, prisma_key in field_map.items():
        if py_key in data and data[py_key] is not None:
            update_data[prisma_key] = data[py_key]
    if "required_date" in data and data["required_date"]:
        update_data["requiredDate"] = datetime.fromisoformat(data["required_date"])
    items_data = data.get("items")
    if items_data is not None:
        db.purchaserequisitionitem.delete_many(where={"prId": pr_id})
        total = 0.0
        for idx, item in enumerate(items_data):
            tp = item["estimated_price"] * item["quantity"]
            total += tp
            db.purchaserequisitionitem.create(
                data={
                    "prId": pr_id,
                    "description": item["description"],
                    "quantity": item["quantity"],
                    "unit": item.get("unit", "PCS"),
                    "estimatedPrice": item["estimated_price"],
                    "totalPrice": tp,
                    "budgetCode": item.get("budget_code"),
                    "specifications": item.get("specifications"),
                    "sortOrder": idx,
                }
            )
        update_data["totalEstimate"] = total
    if update_data:
        db.purchaserequisition.update(where={"id": pr_id}, data=update_data)
    return _get_pr(pr_id, org_id)


def update_pr(pr_id: str, org_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    result = _update_pr(pr_id, org_id, data)
    if result:
        log_action("UPDATE", "purchase_requisition", pr_id, new_data=result)
    return result


VALID_TRANSITIONS: dict[str, dict[str, str]] = {
    "submit": {"from": "DRAFT", "to": "SUBMITTED"},
    "review": {"from": "SUBMITTED", "to": "UNDER_REVIEW"},
    "approve": {"from": "UNDER_REVIEW", "to": "APPROVED"},
    "reject": {"from": "UNDER_REVIEW", "to": "REJECTED"},
    "cancel": {"from": "DRAFT", "to": "CANCELLED"},
    "revise": {"from": "REJECTED", "to": "DRAFT"},
}


def _transition_pr(
    pr_id: str, org_id: str, user_id: str, action: str, notes: str | None
) -> dict[str, Any] | None:
    db = get_repository()
    pr = db.purchaserequisition.find_first(where={"id": pr_id, "orgId": org_id})
    if not pr:
        return None
    transition = VALID_TRANSITIONS.get(action)
    if not transition or pr.status != transition["from"]:
        return None
    update_data: dict[str, Any] = {"status": transition["to"]}
    if action == "submit":
        update_data["submittedAt"] = datetime.now(timezone.utc)
    elif action == "review":
        update_data["reviewerId"] = user_id
    elif action == "approve":
        update_data["approvedById"] = user_id
        update_data["approvedAt"] = datetime.now(timezone.utc)
    elif action == "reject":
        update_data["rejectionNotes"] = notes
        update_data["reviewerId"] = user_id
    elif action == "revise":
        update_data["rejectionNotes"] = None
    db.purchaserequisition.update(where={"id": pr_id}, data=update_data)
    return _get_pr(pr_id, org_id)


def transition_pr(
    pr_id: str, org_id: str, user_id: str, action: str, notes: str | None = None
) -> dict[str, Any] | None:
    result = _transition_pr(pr_id, org_id, user_id, action, notes)
    if result:
        log_action(
            "STATUS_CHANGE",
            "purchase_requisition",
            pr_id,
            new_data={"action": action, "status": result["status"]},
        )
    return result


def _delete_pr(pr_id: str, org_id: str) -> tuple[bool, str]:
    db = get_repository()
    pr = db.purchaserequisition.find_first(where={"id": pr_id, "orgId": org_id})
    if not pr:
        return (False, "Purchase requisition not found")
    if pr.status not in ("DRAFT", "CANCELLED"):
        return (False, "Can only delete draft or cancelled requisitions")
    db.purchaserequisitionitem.delete_many(where={"prId": pr_id})
    db.purchaserequisition.delete(where={"id": pr_id})
    return (True, "Purchase requisition deleted")


def delete_pr(pr_id: str, org_id: str) -> tuple[bool, str]:
    success, msg = _delete_pr(pr_id, org_id)
    if success:
        log_action("DELETE", "purchase_requisition", pr_id)
    return (success, msg)
