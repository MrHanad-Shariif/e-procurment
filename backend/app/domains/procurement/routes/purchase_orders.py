from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.procurement.schemas.purchase_order import CreatePoSchema, PoActionSchema
from app.domains.procurement.services.po_service import create_po, get_po, list_pos, transition_po
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

po_bp = Blueprint("purchase_orders", __name__, url_prefix="/api/v1/purchase-orders")


@po_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("purchase_order.view", "purchase_order.view_all")
def list_pos_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search")
    result = list_pos(org_id, page, per_page, status, search)
    return success_response(result["items"], meta=result["meta"])


@po_bp.route("/<po_id>", methods=["GET"])
@jwt_required()
@require_permissions("purchase_order.view", "purchase_order.view_all")
def get_po_route(po_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    po = get_po(po_id, org_id)
    if not po:
        return error_response("Purchase order not found", 404)
    return success_response(po)


@po_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("purchase_order.create")
@validate_json(CreatePoSchema)
def create_po_route(body: CreatePoSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    data = body.model_dump()
    po = create_po(org_id, user_id, data)
    return success_response(po, status=201)


@po_bp.route("/<po_id>/action", methods=["POST"])
@jwt_required()
@require_permissions("purchase_order.create", "purchase_order.approve")
@validate_json(PoActionSchema)
def action_po_route(po_id: str, body: PoActionSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()

    valid_actions = {"submit", "approve", "send", "acknowledge", "complete", "cancel"}
    if body.action not in valid_actions:
        return error_response(f"Invalid action. Must be one of: {', '.join(valid_actions)}", 400)

    po = transition_po(po_id, org_id, user_id, body.action, body.notes)
    if not po:
        return error_response("Invalid state transition or PO not found", 400)
    return success_response(po)
