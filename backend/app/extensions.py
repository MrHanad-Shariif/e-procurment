from flask import jsonify
from flask_babel import Babel
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

cors = CORS()
jwt = JWTManager()
babel = Babel()
limiter = Limiter(key_func=get_remote_address)
db = SQLAlchemy(session_options={"expire_on_commit": False})
migrate = Migrate(compare_type=True)


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"data": None, "error": "Token has expired", "meta": None}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"data": None, "error": "Invalid token", "meta": None}), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({"data": None, "error": "Authorization token is required", "meta": None}), 401


@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_payload):
    return jsonify({"data": None, "error": "Token has been revoked", "meta": None}), 401
