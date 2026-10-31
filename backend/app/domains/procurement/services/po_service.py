from datetime import datetime, timezone
from typing import Any
from app.models import get_repository
from app.domains.administration.services.audit_service import log_action


def _po_to_dict(po: Any) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": po.id,
        "poNumber": po.poNumber,
        "status": po.status,
        "totalAmount": po.totalAmount,
        "currency": po.currency,
        "deliveryDate": po.deliveryDate.isoformat() if po.deliveryDate else None,
        "deliveryAddress": po.deliveryAddress,
        "paymentTerms": po.paymentTerms,
        "notes": po.notes,
        "supplierId": po.supplierId,
        "rfqId": po.rfqId,
        "createdById": po.createdById,
        "approvedById": po.approvedById,
        "createdAt": po.createdAt.isoformat(),
        "updatedAt": po.updatedAt.isoformat(),
    }
    if hasattr(po, "supplier") and po.supplier:
        result["supplier"] = {
            "id": po.supplier.id,
            "name": po.supplier.name,
            "email": po.supplier.email,
        }
    if hasattr(po, "items") and po.items is not None:
        result["items"] = [
            {
                "id": i.id,
                "description": i.description,
                "quantity": i.quantity,
                "unit": i.unit,
                "unitPrice": i.unitPrice,
                "totalPrice": i.totalPrice,
                "sortOrder": i.sortOrder,
            }
            for i in po.items
        ]
    else:
        result["items"] = []
    return result


def _generate_po_number(db: Any, org_id: str) -> str:
    count = db.purchaseorder.count(where={"orgId": org_id})
    return f"PO-{count + 1:05d}"


def _list_pos(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    db = get_repository()
    where: dict[str, Any] = {"orgId": org_id}
    if status:
        where["status"] = status
    if search:
        where["OR"] = [{"poNumber": {"contains": search, "mode": "insensitive"}}]
    total = db.purchaseorder.count(where=where)
    pos = db.purchaseorder.find_many(
        where=where,
        skip=(page - 1) * per_page,
        take=per_page,
        order={"createdAt": "desc"},
        include={"items": True, "supplier": True},
    )
    return {
        "items": [_po_to_dict(p) for p in pos],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_pos(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    return _list_pos(org_id, page, per_page, status, search)


def _get_po(po_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    po = db.purchaseorder.find_first(
        where={"id": po_id, "orgId": org_id},
        include={"items": {"order_by": {"sortOrder": "asc"}}, "supplier": True},
    )
    return _po_to_dict(po) if po else None


def get_po(po_id: str, org_id: str) -> dict[str, Any] | None:
    return _get_po(po_id, org_id)


def _create_po(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    po_number = _generate_po_number(db, org_id)
    items_data = data.pop("items", [])
    total = sum((i["unit_price"] * i["quantity"] for i in items_data))
    create_data: dict[str, Any] = {
        "poNumber": po_number,
        "totalAmount": total,
        "currency": data.get("currency", "USD"),
        "deliveryAddress": data.get("delivery_address"),
        "paymentTerms": data.get("payment_terms"),
        "notes": data.get("notes"),
        "orgId": org_id,
        "createdById": user_id,
        "supplierId": data["supplier_id"],
    }
    if data.get("delivery_date"):
        create_data["deliveryDate"] = datetime.fromisoformat(data["delivery_date"])
    if data.get("rfq_id"):
        create_data["rfqId"] = data["rfq_id"]
    po = db.purchaseorder.create(data=create_data)
    for idx, item in enumerate(items_data):
        tp = item["unit_price"] * item["quantity"]
        db.purchaseorderitem.create(
            data={
                "poId": po.id,
                "description": item["description"],
                "quantity": item["quantity"],
                "unit": item.get("unit", "PCS"),
                "unitPrice": item["unit_price"],
                "totalPrice": tp,
                "sortOrder": idx,
            }
        )
    return _get_po(po.id, org_id)


def create_po(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    result = _create_po(org_id, user_id, data)
    log_action("CREATE", "purchase_order", result["id"], new_data=result)
    return result


VALID_PO_TRANSITIONS: dict[str, dict[str, str]] = {
    "submit": {"from": "DRAFT", "to": "PENDING_APPROVAL"},
    "approve": {"from": "PENDING_APPROVAL", "to": "APPROVED"},
    "send": {"from": "APPROVED", "to": "SENT"},
    "acknowledge": {"from": "SENT", "to": "ACKNOWLEDGED"},
    "complete": {"from": "ACKNOWLEDGED", "to": "COMPLETED"},
    "cancel": {"from": "DRAFT", "to": "CANCELLED"},
}


def _transition_po(
    po_id: str, org_id: str, user_id: str, action: str, notes: str | None
) -> dict[str, Any] | None:
    db = get_repository()
    po = db.purchaseorder.find_first(where={"id": po_id, "orgId": org_id})
    if not po:
        return None
    transition = VALID_PO_TRANSITIONS.get(action)
    if not transition or po.status != transition["from"]:
        return None
    update_data: dict[str, Any] = {"status": transition["to"]}
    if action == "approve":
        update_data["approvedById"] = user_id
    if notes:
        update_data["notes"] = notes
    db.purchaseorder.update(where={"id": po_id}, data=update_data)
    return _get_po(po_id, org_id)


def transition_po(
    po_id: str, org_id: str, user_id: str, action: str, notes: str | None = None
) -> dict[str, Any] | None:
    result = _transition_po(po_id, org_id, user_id, action, notes)
    if result:
        log_action(
            "STATUS_CHANGE",
            "purchase_order",
            po_id,
            new_data={"action": action, "status": result["status"]},
        )
    return result
