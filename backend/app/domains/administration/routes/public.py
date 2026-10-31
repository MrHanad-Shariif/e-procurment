from flask import Blueprint
from app.models import get_repository
from app.core.response import error_response, success_response

public_bp = Blueprint("public", __name__, url_prefix="/api/v1/org")


def _get_public_org(slug: str):
    db = get_repository()
    return db.organization.find_unique(where={"slug": slug})


@public_bp.route("/<slug>", methods=["GET"])
def get_org_public(slug: str):
    org = _get_public_org(slug)
    if not org or not org.isActive:
        return error_response("Organization not found", 404)
    return success_response(
        {
            "name": org.name,
            "slug": org.slug,
            "logoUrl": org.logoUrl,
            "primaryColor": org.primaryColor,
            "secondaryColor": org.secondaryColor,
            "systemName": org.systemName,
            "defaultLanguage": org.defaultLanguage,
        }
    )
