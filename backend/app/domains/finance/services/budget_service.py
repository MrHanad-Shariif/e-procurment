from typing import Any
from app.models import get_repository
from app.domains.administration.services.audit_service import log_action


def _budget_to_dict(b: Any) -> dict[str, Any]:
    return {
        "id": b.id,
        "name": b.name,
        "costCenter": b.costCenter,
        "fiscalYear": b.fiscalYear,
        "period": b.period,
        "totalAmount": b.totalAmount,
        "spentAmount": b.spentAmount,
        "committedAmount": b.committedAmount,
        "availableAmount": b.totalAmount - b.spentAmount - b.committedAmount,
        "controlOnPr": b.controlOnPr,
        "controlOnPo": b.controlOnPo,
        "isActive": b.isActive,
        "orgId": b.orgId,
        "createdById": b.createdById,
        "createdAt": b.createdAt.isoformat(),
        "updatedAt": b.updatedAt.isoformat(),
    }


def _list_budgets(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    search: str | None = None,
    fiscal_year: int | None = None,
    active_only: bool = False,
) -> dict[str, Any]:
    db = get_repository()
    where: dict[str, Any] = {"orgId": org_id}
    if search:
        where["OR"] = [
            {"name": {"contains": search, "mode": "insensitive"}},
            {"costCenter": {"contains": search, "mode": "insensitive"}},
        ]
    if fiscal_year:
        where["fiscalYear"] = fiscal_year
    if active_only:
        where["isActive"] = True
    total = db.budget.count(where=where)
    budgets = db.budget.find_many(
        where=where, skip=(page - 1) * per_page, take=per_page, order={"createdAt": "desc"}
    )
    return {
        "items": [_budget_to_dict(b) for b in budgets],
        "meta": {
            "page": page,
            "perPage": per_page,
            "total": total,
            "totalPages": (total + per_page - 1) // per_page,
        },
    }


def list_budgets(
    org_id: str,
    page: int = 1,
    per_page: int = 20,
    search: str | None = None,
    fiscal_year: int | None = None,
    active_only: bool = False,
) -> dict[str, Any]:
    return _list_budgets(org_id, page, per_page, search, fiscal_year, active_only)


def _get_budget(budget_id: str, org_id: str) -> dict[str, Any] | None:
    db = get_repository()
    b = db.budget.find_first(where={"id": budget_id, "orgId": org_id})
    return _budget_to_dict(b) if b else None


def get_budget(budget_id: str, org_id: str) -> dict[str, Any] | None:
    return _get_budget(budget_id, org_id)


def _create_budget(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_repository()
    valid_periods = {"MONTHLY", "QUARTERLY", "YEARLY"}
    valid_actions = {"WARN", "STOP", "IGNORE"}
    period = data.get("period", "YEARLY")
    if period not in valid_periods:
        raise ValueError(f"Invalid period. Must be one of: {', '.join(valid_periods)}")
    control_pr = data.get("control_on_pr", "WARN")
    control_po = data.get("control_on_po", "WARN")
    if control_pr not in valid_actions or control_po not in valid_actions:
        raise ValueError(f"Invalid control action. Must be one of: {', '.join(valid_actions)}")
    b = db.budget.create(
        data={
            "name": data["name"],
            "costCenter": data["cost_center"],
            "fiscalYear": data["fiscal_year"],
            "period": period,
            "totalAmount": data["total_amount"],
            "controlOnPr": control_pr,
            "controlOnPo": control_po,
            "orgId": org_id,
            "createdById": user_id,
        }
    )
    return _budget_to_dict(b)


def create_budget(org_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
    result = _create_budget(org_id, user_id, data)
    log_action("CREATE", "budget", result["id"], new_data=result)
    return result


def _update_budget(budget_id: str, org_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_repository()
    b = db.budget.find_first(where={"id": budget_id, "orgId": org_id})
    if not b:
        return None
    update_data: dict[str, Any] = {}
    if data.get("name") is not None:
        update_data["name"] = data["name"]
    if data.get("total_amount") is not None:
        update_data["totalAmount"] = data["total_amount"]
    if data.get("control_on_pr") is not None:
        update_data["controlOnPr"] = data["control_on_pr"]
    if data.get("control_on_po") is not None:
        update_data["controlOnPo"] = data["control_on_po"]
    if data.get("is_active") is not None:
        update_data["isActive"] = data["is_active"]
    if not update_data:
        return _budget_to_dict(b)
    db.budget.update(where={"id": budget_id}, data=update_data)
    return _get_budget(budget_id, org_id)


def update_budget(budget_id: str, org_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    result = _update_budget(budget_id, org_id, data)
    if result:
        log_action("UPDATE", "budget", budget_id, new_data=result)
    return result


def _check_budget(org_id: str, cost_center: str, amount: float, stage: str) -> dict[str, Any]:
    """Check budget availability. Returns {allowed, warning, budget}."""
    db = get_repository()
    from datetime import datetime

    current_year = datetime.now().year
    b = db.budget.find_first(
        where={
            "orgId": org_id,
            "costCenter": cost_center,
            "fiscalYear": current_year,
            "isActive": True,
        }
    )
    if not b:
        return {"allowed": True, "warning": None, "budget": None}
    available = b.totalAmount - b.spentAmount - b.committedAmount
    control = b.controlOnPr if stage == "pr" else b.controlOnPo
    if control == "IGNORE":
        return {"allowed": True, "warning": None, "budget": _budget_to_dict(b)}
    if amount > available:
        if control == "STOP":
            return {
                "allowed": False,
                "warning": f"Budget exceeded. Available: {available:.2f}, Requested: {amount:.2f}",
                "budget": _budget_to_dict(b),
            }
        return {
            "allowed": True,
            "warning": f"Budget will be exceeded. Available: {available:.2f}, Requested: {amount:.2f}",
            "budget": _budget_to_dict(b),
        }
    return {"allowed": True, "warning": None, "budget": _budget_to_dict(b)}


def check_budget(org_id: str, cost_center: str, amount: float, stage: str) -> dict[str, Any]:
    return _check_budget(org_id, cost_center, amount, stage)


def _adjust_committed(org_id: str, cost_center: str, amount: float) -> None:
    db = get_repository()
    from datetime import datetime

    current_year = datetime.now().year
    b = db.budget.find_first(
        where={
            "orgId": org_id,
            "costCenter": cost_center,
            "fiscalYear": current_year,
            "isActive": True,
        }
    )
    if b:
        db.budget.update(where={"id": b.id}, data={"committedAmount": b.committedAmount + amount})


def adjust_committed(org_id: str, cost_center: str, amount: float) -> None:
    _adjust_committed(org_id, cost_center, amount)


def _move_committed_to_spent(org_id: str, cost_center: str, amount: float) -> None:
    db = get_repository()
    from datetime import datetime

    current_year = datetime.now().year
    b = db.budget.find_first(
        where={
            "orgId": org_id,
            "costCenter": cost_center,
            "fiscalYear": current_year,
            "isActive": True,
        }
    )
    if b:
        new_committed = max(0, b.committedAmount - amount)
        db.budget.update(
            where={"id": b.id},
            data={"committedAmount": new_committed, "spentAmount": b.spentAmount + amount},
        )


def move_committed_to_spent(org_id: str, cost_center: str, amount: float) -> None:
    _move_committed_to_spent(org_id, cost_center, amount)
