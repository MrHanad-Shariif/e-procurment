"""Request-scoped SQLAlchemy persistence for the combined application."""

from app.models.repository import Repository


def get_repository() -> Repository:
    return Repository()
