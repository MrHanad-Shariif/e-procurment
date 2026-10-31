from datetime import datetime, timezone
from typing import Any
from app.models import get_repository
from app.domains.administration.services.audit_service import log_action


def _gr_to_dict(gr: Any) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": gr.id,
        "grNumber": gr.grNumber,
        "status": gr.status,
        "receivedDate": gr.receivedDate.isoformat() if gr.receivedDate else None,
        "deliveryNoteRef": gr.deliveryNoteRef,
        "warehouse": gr.warehouse,
        "notes": gr.notes,
        "totalAmount": gr.totalAmount,
        "currency": gr.currency,
        "poId": gr.poId,
        "supplierId": gr.supplierId,
        "receivedById": gr.receivedById,
        "inspectedById": gr.inspectedById,
        "inspectedAt": gr.inspectedAt.isoformat() if gr.inspectedAt else None,
        "createdAt": gr.createdAt.isoformat(),
        "updatedAt": gr.updatedAt.isoformat(),
    }
    if hasattr(gr, "purchaseOrder") and gr.purchaseOrder:
        result["purchaseOrder"] = {
            "id": gr.purchaseOrder.id,
            "poNumber": gr.purchaseOrder.poNumber,
            "status": gr.purchaseOrder.status,
        }
    if hasattr(gr, "items") and gr.items is not None:
        result["items"] = [
            {
                "id": i.id,
                "poItemId": i.poItemId,
                "description": i.description,
                "orderedQty": i.orderedQty,
                "receivedQty": i.receivedQty,
                "acceptedQty": i.acceptedQty,
                "rejectedQty": i.rejectedQty,
                "unit": i.unit,
                "unitPrice": i.unitPrice,
                "totalPrice": i.totalPrice,
                "qualityStatus": i.qualityStatus,
                "qualityNotes": i.qualityNotes,
                "sortOrder": i.sortOrder,
            }
            for i in gr.items
        ]
    else:
        result["items"] = []
    return result


def _generate_gr_number(db: Any, org_id: str) -> str:
    count = db.goodsreceipt.count(where={"orgId": org_id})
    return f"GR-{count + 1:05d}"


def _list_grs(
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
        where["OR"] = [{"grNumber": {"contains": search, "mode": "insensitive"}}]
    total = db.goodsreceipt.count(where=where)
    grs = db.goodsreceipt.find_many(
        where=where,
        skip=(page - 1) * per_page,
        take=per_page,
        order={"createdAt": "desc"},
        include={"items": True, "purchaseOrder": True},
    )
    return {
        "items": [_gr_to_dict(g) for g in grs],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_grs(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    return _list_grs(org_id, page, per_page, status, search)


def _get_gr(gr_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    gr = db.goodsreceipt.find_first(
        where={"id": gr_id, "orgId": org_id},
        include={"items": {"order_by": {"sort_order": "asc"}}, "purchaseOrder": True},
    )
    return _gr_to_dict(gr) if gr else None


def get_gr(gr_id: str, org_id: str) -> dict[str, Any] | None:
    return _get_gr(gr_id, org_id)


def _get_po_remaining_quantities(db: Any, po_id: str, org_id: str) -> dict[str, float]:
    """Return remaining receivable qty per PO item, accounting for prior accepted GRs."""
    po = db.purchaseorder.find_first(where={"id": po_id, "orgId": org_id}, include={"items": True})
    if not po:
        return {}
    remaining: dict[str, float] = {}
    for item in po.items:
        remaining[item.id] = item.quantity
    accepted_grs = db.goodsreceipt.find_many(
        where={"poId": po_id, "orgId": org_id, "status": "ACCEPTED"}, include={"items": True}
    )
    for gr in accepted_grs:
        for gi in gr.items:
            if gi.poItemId in remaining:
                remaining[gi.poItemId] -= gi.acceptedQty
    return remaining


def _create_gr(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    po = db.purchaseorder.find_first(
        where={"id": data["po_id"], "orgId": org_id}, include={"items": True}
    )
    if not po:
        raise ValueError("Purchase order not found")
    if po.status not in ("APPROVED", "SENT", "ACKNOWLEDGED"):
        raise ValueError("Purchase order is not in a receivable state")
    gr_number = _generate_gr_number(db, org_id)
    items_data = data.pop("items", [])
    total = sum((i["unit_price"] * i["received_qty"] for i in items_data))
    create_data: dict[str, Any] = {
        "grNumber": gr_number,
        "totalAmount": total,
        "currency": data.get("currency", "USD"),
        "warehouse": data.get("warehouse"),
        "deliveryNoteRef": data.get("delivery_note_ref"),
        "notes": data.get("notes"),
        "receivedDate": datetime.fromisoformat(data["received_date"]),
        "orgId": org_id,
        "receivedById": user_id,
        "poId": data["po_id"],
        "supplierId": po.supplierId,
    }
    gr = db.goodsreceipt.create(data=create_data)
    for idx, item in enumerate(items_data):
        tp = item["unit_price"] * item["received_qty"]
        db.goodsreceiptitem.create(
            data={
                "grId": gr.id,
                "poItemId": item["po_item_id"],
                "description": item["description"],
                "orderedQty": item["ordered_qty"],
                "receivedQty": item["received_qty"],
                "acceptedQty": item.get("accepted_qty", 0),
                "rejectedQty": item.get("rejected_qty", 0),
                "unit": item.get("unit", "PCS"),
                "unitPrice": item["unit_price"],
                "totalPrice": tp,
                "qualityNotes": item.get("quality_notes"),
                "sortOrder": idx,
            }
        )
    return _get_gr(gr.id, org_id)


def create_gr(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    result = _create_gr(org_id, user_id, data)
    log_action("CREATE", "goods_receipt", result["id"], new_data=result)
    return result


VALID_GR_TRANSITIONS: dict[str, dict[str, Any]] = {
    "submit": {"from": ["DRAFT"], "to": "SUBMITTED"},
    "inspect": {"from": ["SUBMITTED"], "to": "INSPECTING"},
    "accept": {"from": ["INSPECTING", "SUBMITTED"], "to": "ACCEPTED"},
    "reject": {"from": ["INSPECTING"], "to": "REJECTED"},
    "cancel": {"from": ["DRAFT"], "to": "CANCELLED"},
}


def _transition_gr(
    gr_id: str, org_id: str, user_id: str, action: str, notes: str | None
) -> dict[str, Any] | None:
    db = get_repository()
    gr = db.goodsreceipt.find_first(where={"id": gr_id, "orgId": org_id}, include={"items": True})
    if not gr:
        return None
    transition = VALID_GR_TRANSITIONS.get(action)
    if not transition or gr.status not in transition["from"]:
        return None
    update_data: dict[str, Any] = {"status": transition["to"]}
    if action == "accept":
        update_data["inspectedById"] = user_id
        update_data["inspectedAt"] = datetime.now(timezone.utc)
        for item in gr.items:
            db.goodsreceiptitem.update(
                where={"id": item.id},
                data={"acceptedQty": item.receivedQty, "qualityStatus": "PASSED"},
            )
        accepted_total = sum((i.unitPrice * i.receivedQty for i in gr.items))
        update_data["totalAmount"] = accepted_total
    if action == "reject":
        update_data["inspectedById"] = user_id
        update_data["inspectedAt"] = datetime.now(timezone.utc)
        for item in gr.items:
            db.goodsreceiptitem.update(
                where={"id": item.id},
                data={"rejectedQty": item.receivedQty, "acceptedQty": 0, "qualityStatus": "FAILED"},
            )
    if notes:
        update_data["notes"] = notes
    db.goodsreceipt.update(where={"id": gr_id}, data=update_data)
    if action == "accept":
        _check_po_completion(db, gr.poId, org_id)
    return _get_gr(gr_id, org_id)


def _check_po_completion(db: Any, po_id: str, org_id: str) -> None:
    """Auto-complete PO if all items are fully received."""
    remaining = _get_po_remaining_quantities(db, po_id, org_id)
    if all((qty <= 0 for qty in remaining.values())):
        po = db.purchaseorder.find_first(where={"id": po_id, "orgId": org_id})
        if po and po.status in ("APPROVED", "SENT", "ACKNOWLEDGED"):
            db.purchaseorder.update(where={"id": po_id}, data={"status": "COMPLETED"})


def transition_gr(
    gr_id: str, org_id: str, user_id: str, action: str, notes: str | None = None
) -> dict[str, Any] | None:
    result = _transition_gr(gr_id, org_id, user_id, action, notes)
    if result:
        log_action(
            "STATUS_CHANGE",
            "goods_receipt",
            gr_id,
            new_data={"action": action, "status": result["status"]},
        )
    return result


def get_po_remaining(po_id: str, org_id: str) -> dict[str, float]:
    return _get_po_remaining_quantities(get_repository(), po_id, org_id)


def _get_po_remaining_api(po_id: str, org_id: str) -> dict[str, float]:
    db = get_repository()
    return _get_po_remaining_quantities(db, po_id, org_id)


def get_po_remaining_quantities(po_id: str, org_id: str) -> dict[str, float]:
    return _get_po_remaining_api(po_id, org_id)
