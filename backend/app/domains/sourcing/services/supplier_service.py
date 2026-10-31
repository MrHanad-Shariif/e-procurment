from typing import Any
from app.models import get_repository
from app.domains.administration.services.audit_service import log_action


def _supplier_to_dict(s: Any) -> dict[str, Any]:
    return {
        "id": s.id,
        "name": s.name,
        "email": s.email,
        "phone": s.phone,
        "address": s.address,
        "city": s.city,
        "country": s.country,
        "taxId": s.taxId,
        "category": s.category,
        "website": s.website,
        "contactName": s.contactName,
        "status": s.status,
        "rating": s.rating,
        "notes": s.notes,
        "createdById": s.createdById,
        "approvedById": s.approvedById,
        "createdAt": s.createdAt.isoformat(),
        "updatedAt": s.updatedAt.isoformat(),
    }


def _list_suppliers(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    search: str | None = None,
    status: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    db = get_repository()
    where: dict[str, Any] = {"orgId": org_id}
    if status:
        where["status"] = status
    if category:
        where["category"] = category
    if search:
        where["OR"] = [
            {"name": {"contains": search, "mode": "insensitive"}},
            {"email": {"contains": search, "mode": "insensitive"}},
            {"contactName": {"contains": search, "mode": "insensitive"}},
        ]
    total = db.supplier.count(where=where)
    suppliers = db.supplier.find_many(
        where=where, skip=(page - 1) * per_page, take=per_page, order={"createdAt": "desc"}
    )
    return {
        "items": [_supplier_to_dict(s) for s in suppliers],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_suppliers(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    search: str | None = None,
    status: str | None = None,
    category: str | None = None,
) -> dict[str, Any]:
    return _list_suppliers(org_id, page, per_page, search, status, category)


def _get_supplier(supplier_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    s = db.supplier.find_first(where={"id": supplier_id, "orgId": org_id})
    return _supplier_to_dict(s) if s else None


def get_supplier(supplier_id: str, org_id: str) -> dict[str, Any] | None:
    return _get_supplier(supplier_id, org_id)


def _create_supplier(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    field_map = {
        "name": "name",
        "email": "email",
        "phone": "phone",
        "address": "address",
        "city": "city",
        "country": "country",
        "tax_id": "taxId",
        "category": "category",
        "website": "website",
        "contact_name": "contactName",
        "notes": "notes",
    }
    create_data: dict[str, Any] = {"orgId": org_id, "createdById": user_id}
    for py_key, prisma_key in field_map.items():
        if py_key in data and data[py_key] is not None:
            create_data[prisma_key] = data[py_key]
    s = db.supplier.create(data=create_data)
    return _supplier_to_dict(s)


def create_supplier(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    result = _create_supplier(org_id, user_id, data)
    log_action("CREATE", "supplier", result["id"], new_data=result)
    return result


def _update_supplier(supplier_id: str, org_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_repository()
    existing = db.supplier.find_first(where={"id": supplier_id, "orgId": org_id})
    if not existing:
        return None
    field_map = {
        "name": "name",
        "email": "email",
        "phone": "phone",
        "address": "address",
        "city": "city",
        "country": "country",
        "tax_id": "taxId",
        "category": "category",
        "website": "website",
        "contact_name": "contactName",
        "notes": "notes",
    }
    update_data: dict[str, Any] = {}
    for py_key, prisma_key in field_map.items():
        if py_key in data and data[py_key] is not None:
            update_data[prisma_key] = data[py_key]
    s = db.supplier.update(where={"id": supplier_id}, data=update_data)
    return _supplier_to_dict(s)


def update_supplier(supplier_id: str, org_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    result = _update_supplier(supplier_id, org_id, data)
    if result:
        log_action("UPDATE", "supplier", supplier_id, new_data=result)
    return result


def _update_supplier_status(
    supplier_id: str, org_id: str, user_id: str, new_status: str
) -> dict[str, Any] | None:
    db = get_repository()
    existing = db.supplier.find_first(where={"id": supplier_id, "orgId": org_id})
    if not existing:
        return None
    update_data: dict[str, Any] = {"status": new_status}
    if new_status == "APPROVED":
        update_data["approvedById"] = user_id
    s = db.supplier.update(where={"id": supplier_id}, data=update_data)
    return _supplier_to_dict(s)


def update_supplier_status(
    supplier_id: str, org_id: str, user_id: str, new_status: str
) -> dict[str, Any] | None:
    result = _update_supplier_status(supplier_id, org_id, user_id, new_status)
    if result:
        log_action("STATUS_CHANGE", "supplier", supplier_id, new_data={"status": new_status})
    return result


def _delete_supplier(supplier_id: str, org_id: str) -> tuple[bool, str]:
    db = get_repository()
    existing = db.supplier.find_first(where={"id": supplier_id, "orgId": org_id})
    if not existing:
        return (False, "Supplier not found")
    po_count = db.purchaseorder.count(where={"supplierId": supplier_id})
    if po_count > 0:
        return (False, f"Cannot delete supplier with {po_count} purchase orders")
    db.supplier.delete(where={"id": supplier_id})
    return (True, "Supplier deleted")


def delete_supplier(supplier_id: str, org_id: str) -> tuple[bool, str]:
    success, msg = _delete_supplier(supplier_id, org_id)
    if success:
        log_action("DELETE", "supplier", supplier_id)
    return (success, msg)
