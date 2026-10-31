from pydantic import BaseModel, Field


class CreateContractSchema(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    description: str | None = None
    supplier_id: str
    start_date: str
    end_date: str
    total_value: float = Field(gt=0)
    currency: str = Field(default="USD", max_length=3)
    terms_and_conditions: str | None = None
    renewal_terms: str | None = None


class ContractActionSchema(BaseModel):
    action: str
    notes: str | None = None


class CreateAmendmentSchema(BaseModel):
    description: str = Field(min_length=1)
    old_value: float | None = None
    new_value: float | None = None
    effective_date: str
