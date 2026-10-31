import json
import pytest
from app.domains.evaluation.services.ai_service import evaluate_evidence


def provider(monkeypatch, results):
    monkeypatch.setenv("AI_PROVIDER", "groq")
    monkeypatch.setenv("AI_MODEL", "test-model")
    monkeypatch.setenv("AI_API_KEY", "not-a-real-key")

    class Response:
        def raise_for_status(self):
            pass

        def json(self):
            return {"choices": [{"message": {"content": json.dumps({"results": results})}}]}

    monkeypatch.setattr("app.domains.evaluation.services.ai_service.requests.post", lambda *args, **kwargs: Response())


def test_unverifiable_evidence_is_rejected(monkeypatch):
    provider(
        monkeypatch, [{"criterionId": "license", "verdict": "met", "evidence": "Invented license"}]
    )
    with pytest.raises(ValueError, match="verified"):
        evaluate_evidence([{"id": "license"}], "No license supplied")


def test_positive_result_requires_a_quote(monkeypatch):
    provider(monkeypatch, [{"criterionId": "license", "verdict": "met", "evidence": ""}])
    with pytest.raises(ValueError, match="verifiable evidence"):
        evaluate_evidence([{"id": "license"}], "No license supplied")


def test_verified_suggestion_keeps_provider_metadata(monkeypatch):
    provider(monkeypatch, [{"criterionId": "license", "verdict": "met", "evidence": "License ABC"}])
    result = evaluate_evidence([{"id": "license"}], "License ABC is attached")
    assert result["provider"] == "groq"
    assert result["promptVersion"] == "evidence-v1"
    assert result["results"][0]["evidence"] == "License ABC"
