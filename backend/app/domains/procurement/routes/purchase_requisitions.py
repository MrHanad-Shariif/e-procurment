from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.procurement.schemas.purchase_requisition import CreatePrSchema, PrActionSchema, UpdatePrSchema
from app.domains.procurement.services.pr_service import (
    create_pr,
    delete_pr,
    get_pr,
    list_prs,
    transition_pr,
    update_pr,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

pr_bp = Blueprint("purchase_requisitions", __name__, url_prefix="/api/v1/purchase-requisitions")


@pr_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("purchase_request.view", "purchase_request.view_all")
def list_prs_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    permissions = claims.get("permissions", [])
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search")
    result = list_prs(org_id, user_id, permissions, page, per_page, status, search)
    return success_response(result["items"], meta=result["meta"])


@pr_bp.route("/<pr_id>", methods=["GET"])
@jwt_required()
@require_permissions("purchase_request.view", "purchase_request.view_all")
def get_pr_route(pr_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    pr = get_pr(pr_id, org_id)
    if not pr:
        return error_response("Purchase requisition not found", 404)
    return success_response(pr)


@pr_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("purchase_request.create")
@validate_json(CreatePrSchema)
def create_pr_route(body: CreatePrSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    data = body.model_dump()
    pr = create_pr(org_id, user_id, data)
    return success_response(pr, status=201)


@pr_bp.route("/<pr_id>", methods=["PATCH"])
@jwt_required()
@require_permissions("purchase_request.edit")
@validate_json(UpdatePrSchema)
def update_pr_route(pr_id: str, body: UpdatePrSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    data = body.model_dump(exclude_none=True)
    pr = update_pr(pr_id, org_id, data)
    if not pr:
        return error_response("Not found or not editable (must be DRAFT status)", 400)
    return success_response(pr)


@pr_bp.route("/<pr_id>/action", methods=["POST"])
@jwt_required()
@require_permissions(
    "purchase_request.create", "purchase_request.approve", "purchase_request.reject"
)
@validate_json(PrActionSchema)
def action_pr_route(pr_id: str, body: PrActionSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()

    valid_actions = {"submit", "review", "approve", "reject", "cancel", "revise"}
    if body.action not in valid_actions:
        return error_response(f"Invalid action. Must be one of: {', '.join(valid_actions)}", 400)

    pr = transition_pr(pr_id, org_id, user_id, body.action, body.notes)
    if not pr:
        return error_response("Invalid state transition or PR not found", 400)
    return success_response(pr)


@pr_bp.route("/<pr_id>", methods=["DELETE"])
@jwt_required()
@require_permissions("purchase_request.delete")
def delete_pr_route(pr_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    success, message = delete_pr(pr_id, org_id)
    if not success:
        return error_response(message, 400)
    return success_response({"message": message})
