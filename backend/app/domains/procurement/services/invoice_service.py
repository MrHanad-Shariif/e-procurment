from datetime import datetime, timezone
from typing import Any
from app.models import get_repository
from app.domains.administration.services.audit_service import log_action


def _invoice_to_dict(inv: Any) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": inv.id,
        "invoiceNumber": inv.invoiceNumber,
        "supplierInvoiceRef": inv.supplierInvoiceRef,
        "status": inv.status,
        "matchStatus": inv.matchStatus,
        "subtotal": inv.subtotal,
        "taxAmount": inv.taxAmount,
        "totalAmount": inv.totalAmount,
        "currency": inv.currency,
        "dueDate": inv.dueDate.isoformat() if inv.dueDate else None,
        "paymentTerms": inv.paymentTerms,
        "notes": inv.notes,
        "poId": inv.poId,
        "grId": inv.grId,
        "supplierId": inv.supplierId,
        "createdById": inv.createdById,
        "approvedById": inv.approvedById,
        "approvedAt": inv.approvedAt.isoformat() if inv.approvedAt else None,
        "paidAt": inv.paidAt.isoformat() if inv.paidAt else None,
        "createdAt": inv.createdAt.isoformat(),
        "updatedAt": inv.updatedAt.isoformat(),
    }
    if hasattr(inv, "items") and inv.items is not None:
        result["items"] = [
            {
                "id": i.id,
                "poItemId": i.poItemId,
                "grItemId": i.grItemId,
                "description": i.description,
                "invoicedQty": i.invoicedQty,
                "unitPrice": i.unitPrice,
                "totalPrice": i.totalPrice,
                "orderedQty": i.orderedQty,
                "receivedQty": i.receivedQty,
                "qtyMatch": i.qtyMatch,
                "rateMatch": i.rateMatch,
                "sortOrder": i.sortOrder,
            }
            for i in inv.items
        ]
    else:
        result["items"] = []
    return result


def _generate_invoice_number(db: Any, org_id: str) -> str:
    count = db.purchaseinvoice.count(where={"orgId": org_id})
    return f"INV-{count + 1:05d}"


def _list_invoices(
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
            {"invoiceNumber": {"contains": search, "mode": "insensitive"}},
            {"supplierInvoiceRef": {"contains": search, "mode": "insensitive"}},
        ]
    total = db.purchaseinvoice.count(where=where)
    invoices = db.purchaseinvoice.find_many(
        where=where,
        skip=(page - 1) * per_page,
        take=per_page,
        order={"createdAt": "desc"},
        include={"items": True},
    )
    return {
        "items": [_invoice_to_dict(i) for i in invoices],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_invoices(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    return _list_invoices(org_id, page, per_page, status, search)


def _get_invoice(invoice_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    inv = db.purchaseinvoice.find_first(
        where={"id": invoice_id, "orgId": org_id},
        include={"items": {"order_by": {"sort_order": "asc"}}},
    )
    return _invoice_to_dict(inv) if inv else None


def get_invoice(invoice_id: str, org_id: str) -> dict[str, Any] | None:
    return _get_invoice(invoice_id, org_id)


def _get_tolerances(db: Any, org_id: str) -> tuple[float, float]:
    settings = db.systemsettings.find_unique(where={"orgId": org_id})
    rate_tol = settings.rateTolerance if settings else 0
    qty_tol = settings.qtyTolerance if settings else 0
    return (rate_tol, qty_tol)


def _perform_three_way_match(db: Any, invoice_id: str, org_id: str) -> str:
    """Run 3-way matching and return the overall match status."""
    inv = db.purchaseinvoice.find_first(
        where={"id": invoice_id, "orgId": org_id}, include={"items": True}
    )
    if not inv:
        return "UNMATCHED"
    rate_tol, qty_tol = _get_tolerances(db, org_id)
    po_items_map: dict[str, Any] = {}
    if inv.poId:
        po = db.purchaseorder.find_first(where={"id": inv.poId}, include={"items": True})
        if po:
            for pi in po.items:
                po_items_map[pi.id] = pi
    gr_items_map: dict[str, Any] = {}
    if inv.grId:
        gr = db.goodsreceipt.find_first(where={"id": inv.grId}, include={"items": True})
        if gr:
            for gi in gr.items:
                gr_items_map[gi.id] = gi
    has_qty_mismatch = False
    has_rate_mismatch = False
    for item in inv.items:
        ordered_qty = 0.0
        received_qty = 0.0
        po_unit_price = 0.0
        if item.poItemId and item.poItemId in po_items_map:
            po_item = po_items_map[item.poItemId]
            ordered_qty = po_item.quantity
            po_unit_price = po_item.unitPrice
        if item.grItemId and item.grItemId in gr_items_map:
            gr_item = gr_items_map[item.grItemId]
            received_qty = gr_item.acceptedQty
        qty_ok = True
        if ordered_qty > 0:
            qty_diff = abs(
                item.invoicedQty
                - min(ordered_qty, received_qty if received_qty > 0 else ordered_qty)
            )
            allowed = ordered_qty * (qty_tol / 100) if qty_tol else 0
            if qty_diff > allowed:
                qty_ok = False
        rate_ok = True
        if po_unit_price > 0:
            rate_diff = abs(item.unitPrice - po_unit_price)
            allowed_rate = po_unit_price * (rate_tol / 100) if rate_tol else 0
            if rate_diff > allowed_rate:
                rate_ok = False
        if not qty_ok:
            has_qty_mismatch = True
        if not rate_ok:
            has_rate_mismatch = True
        db.purchaseinvoiceitem.update(
            where={"id": item.id},
            data={
                "orderedQty": ordered_qty,
                "receivedQty": received_qty,
                "qtyMatch": qty_ok,
                "rateMatch": rate_ok,
            },
        )
    if has_qty_mismatch and has_rate_mismatch:
        return "BOTH_MISMATCH"
    elif has_qty_mismatch:
        return "QTY_MISMATCH"
    elif has_rate_mismatch:
        return "RATE_MISMATCH"
    return "MATCHED"


def _create_invoice(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    po = db.purchaseorder.find_first(
        where={"id": data["po_id"], "orgId": org_id}, include={"items": True}
    )
    if not po:
        raise ValueError("Purchase order not found")
    invoice_number = _generate_invoice_number(db, org_id)
    items_data = data.pop("items", [])
    subtotal = sum((i["unit_price"] * i["invoiced_qty"] for i in items_data))
    tax = data.get("tax_amount", 0)
    total = subtotal + tax
    create_data: dict[str, Any] = {
        "invoiceNumber": invoice_number,
        "supplierInvoiceRef": data.get("supplier_invoice_ref"),
        "subtotal": subtotal,
        "taxAmount": tax,
        "totalAmount": total,
        "currency": data.get("currency", "USD"),
        "paymentTerms": data.get("payment_terms"),
        "notes": data.get("notes"),
        "orgId": org_id,
        "createdById": user_id,
        "poId": data["po_id"],
        "grId": data.get("gr_id"),
        "supplierId": po.supplierId,
    }
    if data.get("due_date"):
        create_data["dueDate"] = datetime.fromisoformat(data["due_date"])
    inv = db.purchaseinvoice.create(data=create_data)
    for idx, item in enumerate(items_data):
        tp = item["unit_price"] * item["invoiced_qty"]
        db.purchaseinvoiceitem.create(
            data={
                "invoiceId": inv.id,
                "poItemId": item.get("po_item_id"),
                "grItemId": item.get("gr_item_id"),
                "description": item["description"],
                "invoicedQty": item["invoiced_qty"],
                "unitPrice": item["unit_price"],
                "totalPrice": tp,
                "sortOrder": idx,
            }
        )
    return _get_invoice(inv.id, org_id)


def create_invoice(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    result = _create_invoice(org_id, user_id, data)
    log_action("CREATE", "purchase_invoice", result["id"], new_data=result)
    return result


VALID_INVOICE_TRANSITIONS: dict[str, dict[str, Any]] = {
    "submit": {"from": ["DRAFT"], "to": "auto"},
    "approve": {"from": ["MATCHED", "MISMATCHED"], "to": "APPROVED"},
    "pay": {"from": ["APPROVED"], "to": "PAID"},
    "cancel": {"from": ["DRAFT"], "to": "CANCELLED"},
}


def _transition_invoice(
    invoice_id: str, org_id: str, user_id: str, action: str, notes: str | None
) -> dict[str, Any] | None:
    db = get_repository()
    inv = db.purchaseinvoice.find_first(where={"id": invoice_id, "orgId": org_id})
    if not inv:
        return None
    transition = VALID_INVOICE_TRANSITIONS.get(action)
    if not transition or inv.status not in transition["from"]:
        return None
    update_data: dict[str, Any] = {}
    if action == "submit":
        match_status = _perform_three_way_match(db, invoice_id, org_id)
        new_status = "MATCHED" if match_status == "MATCHED" else "MISMATCHED"
        update_data["status"] = new_status
        update_data["matchStatus"] = match_status
    elif action == "approve":
        update_data["status"] = "APPROVED"
        update_data["approvedById"] = user_id
        update_data["approvedAt"] = datetime.now(timezone.utc)
    elif action == "pay":
        update_data["status"] = "PAID"
        update_data["paidAt"] = datetime.now(timezone.utc)
    elif action == "cancel":
        update_data["status"] = "CANCELLED"
    if notes:
        update_data["notes"] = notes
    db.purchaseinvoice.update(where={"id": invoice_id}, data=update_data)
    return _get_invoice(invoice_id, org_id)


def transition_invoice(
    invoice_id: str, org_id: str, user_id: str, action: str, notes: str | None = None
) -> dict[str, Any] | None:
    result = _transition_invoice(invoice_id, org_id, user_id, action, notes)
    if result:
        log_action(
            "STATUS_CHANGE",
            "purchase_invoice",
            invoice_id,
            new_data={"action": action, "status": result["status"]},
        )
    return result
