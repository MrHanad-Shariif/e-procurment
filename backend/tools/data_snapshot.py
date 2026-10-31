"""Print schema version and table counts without exposing business records."""
import json

from sqlalchemy import func, select, text

from app import create_app
from app.extensions import db


def main() -> None:
    app = create_app()
    with app.app_context():
        counts = {
            table.name: db.session.scalar(select(func.count()).select_from(table))
            for table in db.metadata.sorted_tables
        }
        version = db.session.scalar(text("SELECT version_num FROM alembic_version"))
        print(json.dumps({"migration": version, "counts": counts}, sort_keys=True))


if __name__ == "__main__":
    main()
