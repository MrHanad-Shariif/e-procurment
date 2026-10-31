from datetime import datetime, timezone
from typing import Any
from app.models import get_repository
from app.domains.administration.services.audit_service import log_action


def _contract_to_dict(c: Any) -> dict[str, Any]:
    result: dict[str, Any] = {
        "id": c.id,
        "contractNumber": c.contractNumber,
        "title": c.title,
        "description": c.description,
        "status": c.status,
        "startDate": c.startDate.isoformat(),
        "endDate": c.endDate.isoformat(),
        "totalValue": c.totalValue,
        "currency": c.currency,
        "termsAndConditions": c.termsAndConditions,
        "renewalTerms": c.renewalTerms,
        "supplierId": c.supplierId,
        "orgId": c.orgId,
        "createdById": c.createdById,
        "approvedById": c.approvedById,
        "approvedAt": c.approvedAt.isoformat() if c.approvedAt else None,
        "createdAt": c.createdAt.isoformat(),
        "updatedAt": c.updatedAt.isoformat(),
    }
    if hasattr(c, "amendments") and c.amendments is not None:
        result["amendments"] = [
            {
                "id": a.id,
                "amendmentNumber": a.amendmentNumber,
                "description": a.description,
                "oldValue": a.oldValue,
                "newValue": a.newValue,
                "effectiveDate": a.effectiveDate.isoformat(),
                "createdById": a.createdById,
                "createdAt": a.createdAt.isoformat(),
            }
            for a in c.amendments
        ]
    else:
        result["amendments"] = []
    if hasattr(c, "supplier") and c.supplier:
        result["supplier"] = {"id": c.supplier.id, "name": c.supplier.name}
    return result


def _generate_contract_number(db: Any, org_id: str) -> str:
    count = db.contract.count(where={"orgId": org_id})
    return f"CON-{count + 1:05d}"


def _list_contracts(
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
            {"contractNumber": {"contains": search, "mode": "insensitive"}},
            {"title": {"contains": search, "mode": "insensitive"}},
        ]
    total = db.contract.count(where=where)
    contracts = db.contract.find_many(
        where=where,
        skip=(page - 1) * per_page,
        take=per_page,
        order={"createdAt": "desc"},
        include={"supplier": True},
    )
    return {
        "items": [_contract_to_dict(c) for c in contracts],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_contracts(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    status: str | None = None,
    search: str | None = None,
) -> dict[str, Any]:
    return _list_contracts(org_id, page, per_page, status, search)


def _get_contract(contract_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    c = db.contract.find_first(
        where={"id": contract_id, "orgId": org_id},
        include={"amendments": {"order_by": {"amendment_number": "desc"}}, "supplier": True},
    )
    return _contract_to_dict(c) if c else None


def get_contract(contract_id: str, org_id: str) -> dict[str, Any] | None:
    return _get_contract(contract_id, org_id)


def _create_contract(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    supplier = db.supplier.find_first(where={"id": data["supplier_id"], "orgId": org_id})
    if not supplier:
        raise ValueError("Supplier not found")
    contract_number = _generate_contract_number(db, org_id)
    c = db.contract.create(
        data={
            "contractNumber": contract_number,
            "title": data["title"],
            "description": data.get("description"),
            "startDate": datetime.fromisoformat(data["start_date"]),
            "endDate": datetime.fromisoformat(data["end_date"]),
            "totalValue": data["total_value"],
            "currency": data.get("currency", "USD"),
            "termsAndConditions": data.get("terms_and_conditions"),
            "renewalTerms": data.get("renewal_terms"),
            "supplierId": data["supplier_id"],
            "orgId": org_id,
            "createdById": user_id,
        }
    )
    return _get_contract(c.id, org_id)


def create_contract(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    result = _create_contract(org_id, user_id, data)
    log_action("CREATE", "contract", result["id"], new_data=result)
    return result


VALID_CONTRACT_TRANSITIONS: dict[str, dict[str, Any]] = {
    "activate": {"from": ["DRAFT"], "to": "ACTIVE"},
    "terminate": {"from": ["ACTIVE"], "to": "TERMINATED"},
    "expire": {"from": ["ACTIVE"], "to": "EXPIRED"},
    "renew": {"from": ["ACTIVE", "EXPIRED"], "to": "RENEWED"},
}


def _transition_contract(
    contract_id: str, org_id: str, user_id: str, action: str
) -> dict[str, Any] | None:
    db = get_repository()
    c = db.contract.find_first(where={"id": contract_id, "orgId": org_id})
    if not c:
        return None
    transition = VALID_CONTRACT_TRANSITIONS.get(action)
    if not transition or c.status not in transition["from"]:
        return None
    update_data: dict[str, Any] = {"status": transition["to"]}
    if action == "activate":
        update_data["approvedById"] = user_id
        update_data["approvedAt"] = datetime.now(timezone.utc)
    db.contract.update(where={"id": contract_id}, data=update_data)
    return _get_contract(contract_id, org_id)


def transition_contract(
    contract_id: str, org_id: str, user_id: str, action: str
) -> dict[str, Any] | None:
    result = _transition_contract(contract_id, org_id, user_id, action)
    if result:
        log_action(
            "STATUS_CHANGE",
            "contract",
            contract_id,
            new_data={"action": action, "status": result["status"]},
        )
    return result


def _add_amendment(
    contract_id: str, org_id: str, user_id: str, data: dict[str, Any]
) -> dict[str, Any] | None:
    db = get_repository()
    c = db.contract.find_first(where={"id": contract_id, "orgId": org_id})
    if not c or c.status != "ACTIVE":
        return None
    count = db.contractamendment.count(where={"contractId": contract_id})
    db.contractamendment.create(
        data={
            "contractId": contract_id,
            "amendmentNumber": count + 1,
            "description": data["description"],
            "oldValue": data.get("old_value"),
            "newValue": data.get("new_value"),
            "effectiveDate": datetime.fromisoformat(data["effective_date"]),
            "createdById": user_id,
        }
    )
    if data.get("new_value") is not None:
        db.contract.update(where={"id": contract_id}, data={"totalValue": data["new_value"]})
    return _get_contract(contract_id, org_id)


def add_amendment(
    contract_id: str, org_id: str, user_id: str, data: dict[str, Any]
) -> dict[str, Any] | None:
    result = _add_amendment(contract_id, org_id, user_id, data)
    if result:
        log_action("CREATE", "contract_amendment", contract_id, new_data=data)
    return result
