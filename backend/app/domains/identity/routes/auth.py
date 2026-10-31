from flask import Blueprint, request
from flask_jwt_extended import (
    get_jwt,
    get_jwt_identity,
    jwt_required,
)

from app.extensions import limiter
from app.domains.identity.services.auth_service import (
    authenticate_user,
    create_session,
    create_user,
    generate_tokens,
    get_user_permissions_sync,
    get_user_profile,
    revoke_session,
    verify_refresh_token,
)
from app.core.decorators import require_permissions, validate_json
from app.core.response import error_response, success_response
from app.domains.identity.schemas.auth import LoginSchema, LogoutSchema, RegisterSchema, SignupSchema
from app.domains.identity.services.organization_service import create_workspace

auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")


@auth_bp.route("/signup", methods=["POST"])
@limiter.limit("10/minute;30/hour")
@validate_json(SignupSchema)
def signup(body: SignupSchema):
    try:
        result = create_workspace(body.model_dump())
    except ValueError as error:
        return error_response(str(error), 409)
    user = result["user"]
    tokens = generate_tokens(user["id"], user["orgId"], user["permissions"])
    create_session(
        user["id"],
        tokens["refreshToken"],
        request.remote_addr,
        request.headers.get("User-Agent"),
        user["orgId"],
    )
    return success_response({**tokens, **result}, status=201)


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5/minute")
@validate_json(LoginSchema)
def login(body: LoginSchema):
    user = authenticate_user(body.email, body.password, body.org_slug)
    if not user:
        return error_response("Invalid email, password, or organization", 401)

    tokens = generate_tokens(user["id"], user["orgId"], user["permissions"])

    create_session(
        user_id=user["id"],
        refresh_token=tokens["refreshToken"],
        ip_address=request.remote_addr,
        user_agent=request.headers.get("User-Agent"),
        org_id=user["orgId"],
    )

    return success_response(
        {
            "accessToken": tokens["accessToken"],
            "refreshToken": tokens["refreshToken"],
            "user": user,
        }
    )


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("10/minute")
@jwt_required()
@require_permissions("user.create")
@validate_json(RegisterSchema)
def register(body: RegisterSchema):
    claims = get_jwt()
    org_id = claims.get("org_id")

    try:
        user = create_user(
            email=body.email,
            password=body.password,
            first_name=body.first_name,
            last_name=body.last_name,
            role_ids=body.role_ids,
            org_id=org_id,
            preferred_language=body.preferred_language,
        )
    except ValueError as e:
        return error_response(str(e), 409)

    return success_response(user, status=201)


@auth_bp.route("/refresh", methods=["POST"])
@limiter.limit("20/minute")
@jwt_required(refresh=True)
def refresh():
    raw_token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not verify_refresh_token(raw_token):
        return error_response("Invalid or expired refresh token", 401)

    user_id = get_jwt_identity()
    claims = get_jwt()
    org_id = claims.get("org_id")

    permissions = get_user_permissions_sync(user_id)
    tokens = generate_tokens(user_id, org_id, permissions)

    return success_response({"accessToken": tokens["accessToken"]})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = get_user_profile(user_id)
    if not user:
        return error_response("User not found", 404)
    return success_response(user)


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
@validate_json(LogoutSchema)
def logout(body: LogoutSchema):
    revoke_session(body.refreshToken, get_jwt_identity())
    return success_response({"message": "Logged out successfully"})
