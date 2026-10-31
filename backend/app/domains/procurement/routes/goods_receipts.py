from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.procurement.schemas.goods_receipt import CreateGrSchema, GrActionSchema
from app.domains.procurement.services.gr_service import (
    create_gr,
    get_gr,
    get_po_remaining_quantities,
    list_grs,
    transition_gr,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

gr_bp = Blueprint("goods_receipts", __name__, url_prefix="/api/v1/goods-receipts")


@gr_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("goods_receipt.view", "goods_receipt.view_all")
def list_grs_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search")
    result = list_grs(org_id, page, per_page, status, search)
    return success_response(result["items"], meta=result["meta"])


@gr_bp.route("/<gr_id>", methods=["GET"])
@jwt_required()
@require_permissions("goods_receipt.view", "goods_receipt.view_all")
def get_gr_route(gr_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    gr = get_gr(gr_id, org_id)
    if not gr:
        return error_response("Goods receipt not found", 404)
    return success_response(gr)


@gr_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("goods_receipt.create")
@validate_json(CreateGrSchema)
def create_gr_route(body: CreateGrSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    data = body.model_dump()
    try:
        gr = create_gr(org_id, user_id, data)
    except ValueError as e:
        return error_response(str(e), 400)
    return success_response(gr, status=201)


@gr_bp.route("/<gr_id>/action", methods=["POST"])
@jwt_required()
@require_permissions("goods_receipt.create", "goods_receipt.accept", "goods_receipt.inspect")
@validate_json(GrActionSchema)
def action_gr_route(gr_id: str, body: GrActionSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()

    valid_actions = {"submit", "inspect", "accept", "reject", "cancel"}
    if body.action not in valid_actions:
        return error_response(f"Invalid action. Must be one of: {', '.join(valid_actions)}", 400)

    gr = transition_gr(gr_id, org_id, user_id, body.action, body.notes)
    if not gr:
        return error_response("Invalid state transition or goods receipt not found", 400)
    return success_response(gr)


@gr_bp.route("/po-remaining/<po_id>", methods=["GET"])
@jwt_required()
@require_permissions("goods_receipt.create", "goods_receipt.view")
def po_remaining_route(po_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    remaining = get_po_remaining_quantities(po_id, org_id)
    return success_response(remaining)
