from flask import Flask, jsonify

from app.config import config_by_name
from app.extensions import babel, cors, jwt, limiter, db, migrate


def create_app(config_name: str | None = None) -> Flask:
    if config_name is None:
        import os

        config_name = os.getenv("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    from app.models import entities
    from app.models import tendering

    @app.after_request
    def finish_transaction(response):
        if response.status_code < 400:
            db.session.commit()
        else:
            db.session.rollback()
        return response

    @app.teardown_request
    def rollback_failed_request(error):
        if error is not None:
            db.session.rollback()

    from app.cli import register_commands

    register_commands(app)

    cors.init_app(app)
    jwt.init_app(app)
    babel.init_app(app)
    limiter.init_app(app)

    from app.api.health import health_bp
    from app.domains.identity.routes.auth import auth_bp
    from app.domains.administration.routes.settings import settings_bp
    from app.domains.administration.routes.public import public_bp
    from app.domains.administration.routes.users import users_bp
    from app.domains.administration.routes.roles import roles_bp
    from app.domains.administration.routes.audit import audit_bp
    from app.domains.sourcing.routes.suppliers import suppliers_bp
    from app.domains.procurement.routes.purchase_requisitions import pr_bp
    from app.domains.sourcing.routes.rfq import rfq_bp
    from app.domains.procurement.routes.purchase_orders import po_bp
    from app.domains.procurement.routes.goods_receipts import gr_bp
    from app.domains.procurement.routes.purchase_invoices import invoice_bp
    from app.domains.finance.routes.budgets import budget_bp
    from app.domains.finance.routes.contracts import contract_bp
    from app.domains.administration.routes.dashboard import dashboard_bp
    from app.domains.administration.routes.notifications import notification_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(settings_bp)
    app.register_blueprint(public_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(roles_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(pr_bp)
    app.register_blueprint(rfq_bp)
    app.register_blueprint(po_bp)
    app.register_blueprint(gr_bp)
    app.register_blueprint(invoice_bp)
    app.register_blueprint(budget_bp)
    app.register_blueprint(contract_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(notification_bp)

    from app.domains.sourcing.routes.tendering import tendering_bp

    app.register_blueprint(tendering_bp)

    from app.core.tenant import resolve_tenant

    app.before_request(resolve_tenant)

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"data": None, "error": str(e), "meta": None}), 400

    @app.errorhandler(ValueError)
    def invalid_value(error):
        return jsonify({"data": None, "error": str(error), "meta": None}), 422

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"data": None, "error": "Not found", "meta": None}), 404

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return jsonify({"data": None, "error": "Rate limit exceeded", "meta": None}), 429

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"data": None, "error": "Internal server error", "meta": None}), 500

    return app
