from flask import Blueprint
from flask_jwt_extended import get_jwt, jwt_required
from app.models import get_repository
from app.core.response import success_response

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/v1/dashboard")


def _get_summary(org_id: str) -> dict:
    db = get_repository()
    pr_counts = {}
    for status in ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"]:
        pr_counts[status] = db.purchaserequisition.count(where={"orgId": org_id, "status": status})
    po_counts = {}
    for status in [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "SENT",
        "ACKNOWLEDGED",
        "COMPLETED",
        "CANCELLED",
    ]:
        po_counts[status] = db.purchaseorder.count(where={"orgId": org_id, "status": status})
    gr_counts = {}
    for status in ["DRAFT", "SUBMITTED", "INSPECTING", "ACCEPTED", "REJECTED", "CANCELLED"]:
        gr_counts[status] = db.goodsreceipt.count(where={"orgId": org_id, "status": status})
    inv_counts = {}
    for status in ["DRAFT", "SUBMITTED", "MATCHED", "MISMATCHED", "APPROVED", "PAID", "CANCELLED"]:
        inv_counts[status] = db.purchaseinvoice.count(where={"orgId": org_id, "status": status})
    paid_invoices = db.purchaseinvoice.find_many(where={"orgId": org_id, "status": "PAID"})
    total_spend = sum((i.totalAmount for i in paid_invoices))
    active_pos = db.purchaseorder.count(
        where={"orgId": org_id, "status": {"in": ["APPROVED", "SENT", "ACKNOWLEDGED"]}}
    )
    pending_approvals = (
        pr_counts.get("SUBMITTED", 0)
        + pr_counts.get("UNDER_REVIEW", 0)
        + po_counts.get("PENDING_APPROVAL", 0)
        + inv_counts.get("MATCHED", 0)
        + inv_counts.get("MISMATCHED", 0)
    )
    active_contracts = db.contract.count(where={"orgId": org_id, "status": "ACTIVE"})
    budgets = db.budget.find_many(where={"orgId": org_id, "isActive": True})
    total_budget = sum((b.totalAmount for b in budgets))
    total_budget_spent = sum((b.spentAmount + b.committedAmount for b in budgets))
    budget_utilization = total_budget_spent / total_budget * 100 if total_budget > 0 else 0
    return {
        "totalSpend": total_spend,
        "activePos": active_pos,
        "pendingApprovals": pending_approvals,
        "activeContracts": active_contracts,
        "budgetUtilization": round(budget_utilization, 1),
        "prCounts": pr_counts,
        "poCounts": po_counts,
        "grCounts": gr_counts,
        "invoiceCounts": inv_counts,
    }


@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
def get_summary():
    claims = get_jwt()
    org_id = claims.get("org_id")
    result = _get_summary(org_id)
    return success_response(result)


def _get_pipeline(org_id: str) -> dict:
    db = get_repository()
    total_prs = db.purchaserequisition.count(where={"orgId": org_id})
    total_rfqs = db.rfq.count(where={"orgId": org_id})
    total_pos = db.purchaseorder.count(where={"orgId": org_id})
    total_grs = db.goodsreceipt.count(where={"orgId": org_id})
    total_invs = db.purchaseinvoice.count(where={"orgId": org_id})
    return {
        "pipeline": [
            {"stage": "Purchase Requisitions", "count": total_prs},
            {"stage": "RFQs", "count": total_rfqs},
            {"stage": "Purchase Orders", "count": total_pos},
            {"stage": "Goods Receipts", "count": total_grs},
            {"stage": "Invoices", "count": total_invs},
        ]
    }


@dashboard_bp.route("/pipeline", methods=["GET"])
@jwt_required()
def get_pipeline():
    claims = get_jwt()
    org_id = claims.get("org_id")
    result = _get_pipeline(org_id)
    return success_response(result)
