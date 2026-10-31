from flask import Blueprint, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from app.domains.finance.schemas.contract import ContractActionSchema, CreateAmendmentSchema, CreateContractSchema
from app.domains.finance.services.contract_service import (
    add_amendment,
    create_contract,
    get_contract,
    list_contracts,
    transition_contract,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response

contract_bp = Blueprint("contracts", __name__, url_prefix="/api/v1/contracts")


@contract_bp.route("/", methods=["GET"])
@jwt_required()
@require_permissions("contract.view", "contract.view_all")
def list_contracts_route():
    claims = get_jwt()
    org_id = claims.get("org_id")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("perPage", 20, type=int)
    status = request.args.get("status")
    search = request.args.get("search")
    result = list_contracts(org_id, page, per_page, status, search)
    return success_response(result["items"], meta=result["meta"])


@contract_bp.route("/<contract_id>", methods=["GET"])
@jwt_required()
@require_permissions("contract.view", "contract.view_all")
def get_contract_route(contract_id: str):
    claims = get_jwt()
    org_id = claims.get("org_id")
    c = get_contract(contract_id, org_id)
    if not c:
        return error_response("Contract not found", 404)
    return success_response(c)


@contract_bp.route("/", methods=["POST"])
@jwt_required()
@require_permissions("contract.create")
@validate_json(CreateContractSchema)
def create_contract_route(body: CreateContractSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    try:
        c = create_contract(org_id, user_id, body.model_dump())
    except ValueError as e:
        return error_response(str(e), 400)
    return success_response(c, status=201)


@contract_bp.route("/<contract_id>/action", methods=["POST"])
@jwt_required()
@require_permissions("contract.approve", "contract.terminate")
@validate_json(ContractActionSchema)
def action_contract_route(contract_id: str, body: ContractActionSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()

    valid_actions = {"activate", "terminate", "expire", "renew"}
    if body.action not in valid_actions:
        return error_response(f"Invalid action. Must be one of: {', '.join(valid_actions)}", 400)

    c = transition_contract(contract_id, org_id, user_id, body.action)
    if not c:
        return error_response("Invalid state transition or contract not found", 400)
    return success_response(c)


@contract_bp.route("/<contract_id>/amendments", methods=["POST"])
@jwt_required()
@require_permissions("contract.edit")
@validate_json(CreateAmendmentSchema)
def add_amendment_route(contract_id: str, body: CreateAmendmentSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")
    user_id = get_jwt_identity()
    c = add_amendment(contract_id, org_id, user_id, body.model_dump())
    if not c:
        return error_response("Contract not found or not active", 400)
    return success_response(c, status=201)
