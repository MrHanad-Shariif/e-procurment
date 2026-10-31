from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.finance.schemas.budget import CreateBudgetSchema, UpdateBudgetSchema
from app.domains.finance.services.budget_service import (
    check_budget,
    create_budget,
    get_budget,
    list_budgets,
    update_budget,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

budget_bp = Blueprint("budgets", __name__, url_prefix="/api/v1/budgets")


@budget_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("budget.view")
def list_budgets_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    search = request.args.get("search")
    fiscal_year = request.args.get("fiscalYear", type=int)
    active_only = request.args.get("activeOnly", "false").lower() == "true"
    result = list_budgets(org_id, page, per_page, search, fiscal_year, active_only)
    return success_response(result["items"], meta=result["meta"])


@budget_bp.route("/<budget_id>", methods=["GET"])
@jwt_required()
@require_permissions("budget.view")
def get_budget_route(budget_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    b = get_budget(budget_id, org_id)
    if not b:
        return error_response("Budget not found", 404)
    return success_response(b)


@budget_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("budget.create")
@validate_json(CreateBudgetSchema)
def create_budget_route(body: CreateBudgetSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    try:
        b = create_budget(org_id, user_id, body.model_dump())
    except ValueError as e:
        return error_response(str(e), 400)
    return success_response(b, status=201)


@budget_bp.route("/<budget_id>", methods=["PATCH"])
@jwt_required()
@require_permissions("budget.manage")
@validate_json(UpdateBudgetSchema)
def update_budget_route(budget_id: str, body: UpdateBudgetSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    b = update_budget(budget_id, org_id, data)
    if not b:
        return error_response("Budget not found", 404)
    return success_response(b)


@budget_bp.route("/check", methods=["POST"])
@jwt_required()
@require_permissions("budget.view")
def check_budget_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    data = request.get_json()
    if not data or not data.get("cost_center") or not data.get("amount"):
        return error_response("cost_center and amount are required", 400)
    result = check_budget(
        org_id, data["cost_center"], float(data["amount"]), data.get("stage", "po")
    )
    return success_response(result)
