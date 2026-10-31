"""Durable PostgreSQL evaluation queue. Provider keys stay in this process."""

import argparse
import time
from sqlalchemy import select
from app import create_app
from app.extensions import db
from app.models.tendering import EvaluationRun, Tender
from app.domains.evaluation.services.ai_service import evaluate_evidence
from app.domains.sourcing.services.tendering_service import extract_document


def process_one():
    run = db.session.scalar(
        select(EvaluationRun)
        .where(EvaluationRun.status == "queued")
        .order_by(EvaluationRun.created_at)
        .with_for_update(skip_locked=True)
        .limit(1)
    )
    if not run:
        db.session.rollback()
        return False
    run.status = "running"
    db.session.commit()
    try:
        tender = db.session.scalar(
            select(Tender).where(Tender.id == run.tender_id, Tender.org_id == run.org_id)
        )
        if not tender:
            raise ValueError("Tender is unavailable")
        criteria = [
            {
                "id": item.id,
                "requirement": item.requirement_name,
                "mandatory": item.is_mandatory,
                "points": item.points,
            }
            for item in tender.requirements
        ]
        suggestions = []
        for proposal in tender.proposals:
            if proposal.org_id != run.org_id:
                raise ValueError("Proposal organization mismatch")
            suggestions.append(
                {
                    "proposalId": proposal.id,
                    **evaluate_evidence(criteria, extract_document(proposal.pdf_path)),
                }
            )
        run.result = {"proposals": suggestions}
        run.status = "awaiting_review"
        tender.screening_status = "awaiting_review"
        # Suggested assessments never change approved scores, awards or orders.
        db.session.commit()
    except Exception as error:
        db.session.rollback()
        run = db.session.get(EvaluationRun, run.id)
        run.status = "failed"
        # Do not persist raw provider exceptions that might contain request credentials.
        run.error = f"Evaluation failed ({type(error).__name__}); review worker logs/configuration and retry."
        tender = db.session.get(Tender, run.tender_id)
        if tender:
            tender.screening_status = "failed"
        db.session.commit()
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    arguments = parser.parse_args()
    app = create_app()
    with app.app_context():
        while True:
            worked = process_one()
            if arguments.once:
                break
            if not worked:
                time.sleep(3)
            db.session.remove()
