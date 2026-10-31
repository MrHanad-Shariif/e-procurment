from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.sourcing.schemas.rfq import (
    AwardSupplierSchema,
    CreateRfqSchema,
    InviteSupplierSchema,
    RfqActionSchema,
)
from app.domains.sourcing.services.rfq_service import (
    award_supplier,
    create_rfq,
    get_rfq,
    invite_suppliers,
    list_rfqs,
    submit_bid,
    transition_rfq,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

rfq_bp = Blueprint("rfq", __name__, url_prefix="/api/v1/rfq")


@rfq_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("rfq.view", "rfq.view_all")
def list_rfqs_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search")
    result = list_rfqs(org_id, page, per_page, status, search)
    return success_response(result["items"], meta=result["meta"])


@rfq_bp.route("/<rfq_id>", methods=["GET"])
@jwt_required()
@require_permissions("rfq.view", "rfq.view_all")
def get_rfq_route(rfq_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    rfq = get_rfq(rfq_id, org_id)
    if not rfq:
        return error_response("RFQ not found", 404)
    return success_response(rfq)


@rfq_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("rfq.create")
@validate_json(CreateRfqSchema)
def create_rfq_route(body: CreateRfqSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    data = body.model_dump()
    rfq = create_rfq(org_id, user_id, data)
    return success_response(rfq, status=201)


@rfq_bp.route("/<rfq_id>/action", methods=["POST"])
@jwt_required()
@require_permissions("rfq.create", "rfq.approve")
@validate_json(RfqActionSchema)
def action_rfq_route(rfq_id: str, body: RfqActionSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")

    valid_actions = {"publish", "close", "cancel"}
    if body.action not in valid_actions:
        return error_response(f"Invalid action. Must be one of: {', '.join(valid_actions)}", 400)

    rfq = transition_rfq(rfq_id, org_id, body.action)
    if not rfq:
        return error_response("Invalid state transition or RFQ not found", 400)
    return success_response(rfq)


@rfq_bp.route("/<rfq_id>/invite", methods=["POST"])
@jwt_required()
@require_permissions("rfq.edit")
@validate_json(InviteSupplierSchema)
def invite_suppliers_route(rfq_id: str, body: InviteSupplierSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    result = invite_suppliers(rfq_id, org_id, body.supplier_ids)
    if not result:
        return error_response("RFQ not found or not in draft/published status", 400)
    return success_response(result)


@rfq_bp.route("/<rfq_id>/suppliers/<rfq_supplier_id>/bids", methods=["POST"])
@jwt_required()
@require_permissions("rfq.edit")
def submit_bid_route(rfq_id: str, rfq_supplier_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    bids = request.get_json()
    if not isinstance(bids, list):
        return error_response("Request body must be an array of bids", 400)
    result = submit_bid(rfq_id, org_id, rfq_supplier_id, bids)
    if not result:
        return error_response("RFQ not published or supplier not found", 400)
    return success_response(result)


@rfq_bp.route("/<rfq_id>/award", methods=["POST"])
@jwt_required()
@require_permissions("rfq.approve")
@validate_json(AwardSupplierSchema)
def award_supplier_route(rfq_id: str, body: AwardSupplierSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    result = award_supplier(rfq_id, org_id, body.supplier_id)
    if not result:
        return error_response("RFQ not closed or supplier not found", 400)
    return success_response(result)
