from datetime import datetime
from typing import Any
from app.models import get_repository
from app.domains.administration.services.audit_service import log_action


def _rfq_to_dict(rfq: Any) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": rfq.id,
        "rfqNumber": rfq.rfqNumber,
        "title": rfq.title,
        "description": rfq.description,
        "status": rfq.status,
        "deadline": rfq.deadline.isoformat() if rfq.deadline else None,
        "termsAndConditions": rfq.termsAndConditions,
        "currency": rfq.currency,
        "prId": rfq.prId,
        "createdById": rfq.createdById,
        "createdAt": rfq.createdAt.isoformat(),
        "updatedAt": rfq.updatedAt.isoformat(),
    }
    if hasattr(rfq, "items") and rfq.items is not None:
        result["items"] = [
            {
                "id": i.id,
                "description": i.description,
                "quantity": i.quantity,
                "unit": i.unit,
                "specifications": i.specifications,
                "sortOrder": i.sortOrder,
            }
            for i in rfq.items
        ]
    else:
        result["items"] = []
    if hasattr(rfq, "suppliers") and rfq.suppliers is not None:
        result["suppliers"] = [
            {
                "id": rs.id,
                "supplierId": rs.supplierId,
                "status": rs.status,
                "invitedAt": rs.invitedAt.isoformat() if rs.invitedAt else None,
                "respondedAt": rs.respondedAt.isoformat() if rs.respondedAt else None,
                "notes": rs.notes,
                "supplier": {
                    "id": rs.supplier.id,
                    "name": rs.supplier.name,
                    "email": rs.supplier.email,
                }
                if hasattr(rs, "supplier") and rs.supplier
                else None,
                "bids": [
                    {
                        "id": b.id,
                        "rfqItemId": b.rfqItemId,
                        "unitPrice": b.unitPrice,
                        "totalPrice": b.totalPrice,
                        "deliveryDays": b.deliveryDays,
                        "notes": b.notes,
                    }
                    for b in (rs.bids if hasattr(rs, "bids") and rs.bids else [])
                ],
            }
            for rs in rfq.suppliers
        ]
    else:
        result["suppliers"] = []
    return result


def _generate_rfq_number(db: Any, org_id: str) -> str:
    count = db.requestforquotation.count(where={"orgId": org_id})
    return f"RFQ-{count + 1:05d}"


def _list_rfqs(
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
        where["OR"] = [
            {"title": {"contains": search, "mode": "insensitive"}},
            {"rfqNumber": {"contains": search, "mode": "insensitive"}},
        ]
    total = db.requestforquotation.count(where=where)
    rfqs = db.requestforquotation.find_many(
        where=where,
        skip=(page - 1) * per_page,
        take=per_page,
        order={"createdAt": "desc"},
        include={"items": True, "suppliers": {"include": {"supplier": True}}},
    )
    return {
        "items": [_rfq_to_dict(r) for r in rfqs],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_rfqs(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    return _list_rfqs(org_id, page, per_page, status, search)


def _get_rfq(rfq_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    rfq = db.requestforquotation.find_first(
        where={"id": rfq_id, "orgId": org_id},
        include={
            "items": {"order_by": {"sortOrder": "asc"}},
            "suppliers": {"include": {"supplier": True, "bids": True}},
        },
    )
    return _rfq_to_dict(rfq) if rfq else None


def get_rfq(rfq_id: str, org_id: str) -> dict[str, Any] | None:
    return _get_rfq(rfq_id, org_id)


def _create_rfq(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    rfq_number = _generate_rfq_number(db, org_id)
    items = data.pop("items", [])
    supplier_ids = data.pop("supplier_ids", [])
    create_data: dict[str, Any] = {
        "rfqNumber": rfq_number,
        "title": data["title"],
        "description": data.get("description"),
        "termsAndConditions": data.get("terms_and_conditions"),
        "currency": data.get("currency", "USD"),
        "orgId": org_id,
        "createdById": user_id,
    }
    if data.get("deadline"):
        create_data["deadline"] = datetime.fromisoformat(data["deadline"])
    if data.get("pr_id"):
        create_data["prId"] = data["pr_id"]
    rfq = db.requestforquotation.create(data=create_data)
    for idx, item in enumerate(items):
        db.rfqitem.create(
            data={
                "rfqId": rfq.id,
                "description": item["description"],
                "quantity": item["quantity"],
                "unit": item.get("unit", "PCS"),
                "specifications": item.get("specifications"),
                "sortOrder": idx,
            }
        )
    for sid in supplier_ids:
        db.rfqsupplier.create(data={"rfqId": rfq.id, "supplierId": sid, "status": "INVITED"})
    return _get_rfq(rfq.id, org_id)


def create_rfq(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    result = _create_rfq(org_id, user_id, data)
    log_action("CREATE", "rfq", result["id"], new_data=result)
    return result


def _invite_suppliers(rfq_id: str, org_id: str, supplier_ids: list[str]) -> dict[str, Any] | None:
    db = get_repository()
    rfq = db.requestforquotation.find_first(where={"id": rfq_id, "orgId": org_id})
    if not rfq or rfq.status not in ("DRAFT", "PUBLISHED"):
        return None
    for sid in supplier_ids:
        existing = db.rfqsupplier.find_first(where={"rfqId": rfq_id, "supplierId": sid})
        if not existing:
            db.rfqsupplier.create(data={"rfqId": rfq_id, "supplierId": sid, "status": "INVITED"})
    return _get_rfq(rfq_id, org_id)


def invite_suppliers(rfq_id: str, org_id: str, supplier_ids: list[str]) -> dict[str, Any] | None:
    result = _invite_suppliers(rfq_id, org_id, supplier_ids)
    if result:
        log_action("INVITE_SUPPLIERS", "rfq", rfq_id, new_data={"supplier_ids": supplier_ids})
    return result


def _submit_bid(
    rfq_id: str, org_id: str, rfq_supplier_id: str, bids: list[dict[str, Any]]
) -> dict[str, Any] | None:
    db = get_repository()
    rfq = db.requestforquotation.find_first(where={"id": rfq_id, "orgId": org_id})
    if not rfq or rfq.status != "PUBLISHED":
        return None
    rs = db.rfqsupplier.find_first(where={"id": rfq_supplier_id, "rfqId": rfq_id})
    if not rs:
        return None
    for bid_data in bids:
        item = db.rfqitem.find_first(where={"id": bid_data["rfq_item_id"], "rfqId": rfq_id})
        if not item:
            continue
        total = bid_data["unit_price"] * item.quantity
        existing = db.supplierbid.find_first(
            where={"rfqSupplierId": rfq_supplier_id, "rfqItemId": bid_data["rfq_item_id"]}
        )
        if existing:
            db.supplierbid.update(
                where={"id": existing.id},
                data={
                    "unitPrice": bid_data["unit_price"],
                    "totalPrice": total,
                    "deliveryDays": bid_data.get("delivery_days"),
                    "notes": bid_data.get("notes"),
                },
            )
        else:
            db.supplierbid.create(
                data={
                    "rfqSupplierId": rfq_supplier_id,
                    "rfqItemId": bid_data["rfq_item_id"],
                    "unitPrice": bid_data["unit_price"],
                    "totalPrice": total,
                    "deliveryDays": bid_data.get("delivery_days"),
                    "notes": bid_data.get("notes"),
                }
            )
    db.rfqsupplier.update(
        where={"id": rfq_supplier_id}, data={"status": "RESPONDED", "respondedAt": datetime.now()}
    )
    return _get_rfq(rfq_id, org_id)


def submit_bid(
    rfq_id: str, org_id: str, rfq_supplier_id: str, bids: list[dict[str, Any]]
) -> dict[str, Any] | None:
    result = _submit_bid(rfq_id, org_id, rfq_supplier_id, bids)
    if result:
        log_action("SUBMIT_BID", "rfq", rfq_id, new_data={"rfq_supplier_id": rfq_supplier_id})
    return result


VALID_RFQ_TRANSITIONS: dict[str, dict[str, str]] = {
    "publish": {"from": "DRAFT", "to": "PUBLISHED"},
    "close": {"from": "PUBLISHED", "to": "CLOSED"},
    "award": {"from": "CLOSED", "to": "AWARDED"},
    "cancel": {"from": "DRAFT", "to": "CANCELLED"},
}


def _transition_rfq(rfq_id: str, org_id: str, action: str) -> dict[str, Any] | None:
    db = get_repository()
    rfq = db.requestforquotation.find_first(where={"id": rfq_id, "orgId": org_id})
    if not rfq:
        return None
    transition = VALID_RFQ_TRANSITIONS.get(action)
    if not transition or rfq.status != transition["from"]:
        return None
    db.requestforquotation.update(where={"id": rfq_id}, data={"status": transition["to"]})
    return _get_rfq(rfq_id, org_id)


def transition_rfq(rfq_id: str, org_id: str, action: str) -> dict[str, Any] | None:
    result = _transition_rfq(rfq_id, org_id, action)
    if result:
        log_action(
            "STATUS_CHANGE", "rfq", rfq_id, new_data={"action": action, "status": result["status"]}
        )
    return result


def _award_supplier(rfq_id: str, org_id: str, supplier_id: str) -> dict[str, Any] | None:
    db = get_repository()
    rfq = db.requestforquotation.find_first(where={"id": rfq_id, "orgId": org_id})
    if not rfq or rfq.status != "CLOSED":
        return None
    rs = db.rfqsupplier.find_first(where={"rfqId": rfq_id, "supplierId": supplier_id})
    if not rs:
        return None
    db.rfqsupplier.update(where={"id": rs.id}, data={"status": "AWARDED"})
    others = db.rfqsupplier.find_many(where={"rfqId": rfq_id, "id": {"not": rs.id}})
    for o in others:
        if o.status != "DECLINED":
            db.rfqsupplier.update(where={"id": o.id}, data={"status": "DECLINED"})
    db.requestforquotation.update(where={"id": rfq_id}, data={"status": "AWARDED"})
    return _get_rfq(rfq_id, org_id)


def award_supplier(rfq_id: str, org_id: str, supplier_id: str) -> dict[str, Any] | None:
    result = _award_supplier(rfq_id, org_id, supplier_id)
    if result:
        log_action("AWARD", "rfq", rfq_id, new_data={"awarded_supplier_id": supplier_id})
    return result
