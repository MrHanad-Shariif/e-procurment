from flask import g, request
from ipaddress import ip_address
from flask_jwt_extended import verify_jwt_in_request, get_jwt
from app.models import get_repository
from app.core.response import error_response

SKIP_TENANT_PREFIXES = (
    "/api/v1/health",
    "/api/v1/auth/login",
    "/api/v1/auth/signup",
    "/api/v1/org/",
)


def _resolve_org(slug: str):
    db = get_repository()
    return db.organization.find_unique(where={"slug": slug})


def resolve_tenant():
    """Resolve the current organization from the request.

    Priority: X-Org-Slug header > subdomain > JWT org_id claim.
    Skips resolution for health check, login, and public org endpoints.
    """
    g.pop("_jwt_extended_jwt", None)
    if any((request.path.startswith(prefix) for prefix in SKIP_TENANT_PREFIXES)):
        g.current_org = None
        g.org_slug = None
        return
    org_slug = request.headers.get("X-Org-Slug")
    if not org_slug:
        host = request.host.split(":")[0]
        parts = host.split(".")
        try:
            ip_address(host)
            is_ip = True
        except ValueError:
            is_ip = False
        if not is_ip and len(parts) > 2:
            org_slug = parts[0]
    if not org_slug:
        g.current_org = None
        g.org_slug = None
        return
    g.org_slug = org_slug
    try:
        org = _resolve_org(org_slug)
    except Exception:
        org = None
    if not org or not org.isActive:
        g.current_org = None
        return error_response("Organization not found or inactive", 404)
    g.current_org = org
    if request.headers.get("Authorization"):
        verify_jwt_in_request(optional=True, verify_type=False)
        if get_jwt().get("org_id") != org.id:
            return error_response("Workspace does not match authenticated organization", 403)
