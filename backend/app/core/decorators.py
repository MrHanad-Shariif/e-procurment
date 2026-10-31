from functools import wraps
from typing import Any, Callable

from flask import request
from flask_jwt_extended import get_jwt
from pydantic import ValidationError

from app.core.response import error_response


def require_role(*roles: str) -> Callable:
    """Restrict access to users with one of the specified roles."""

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            claims = get_jwt()
            user_role = claims.get("role")
            if user_role not in roles:
                return error_response("Insufficient permissions", 403)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def require_permissions(*permissions: str) -> Callable:
    """Restrict access to users with at least one of the specified permissions."""

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            claims = get_jwt()
            user_permissions = claims.get("permissions", [])
            if not any(p in user_permissions for p in permissions):
                return error_response("Insufficient permissions", 403)
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def validate_json(schema: type) -> Callable:
    """Validate request JSON body against a Pydantic model."""

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            json_data = request.get_json(silent=True)
            if json_data is None:
                return error_response("Request body must be valid JSON", 400)
            try:
                body = schema(**json_data)
            except ValidationError as e:
                return error_response(
                    f"Validation error: {e.errors(include_input=False, include_url=False)}", 422
                )
            except Exception as e:
                return error_response(f"Validation error: {e}", 422)
            kwargs["body"] = body
            return fn(*args, **kwargs)

        return wrapper

    return decorator
