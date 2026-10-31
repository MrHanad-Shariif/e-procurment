from typing import Any

from flask import jsonify


def success_response(
    data: Any = None, meta: dict[str, Any] | None = None, status: int = 200
) -> tuple:
    return jsonify({"data": data, "error": None, "meta": meta}), status


def error_response(
    message: str, status: int = 400, errors: list[dict[str, Any]] | None = None
) -> tuple:
    return jsonify({"data": None, "error": message, "meta": errors}), status
