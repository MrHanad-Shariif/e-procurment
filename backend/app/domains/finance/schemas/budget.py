from pydantic import BaseModel, Field


class CreateBudgetSchema(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    cost_center: str = Field(min_length=1, max_length=100)
    fiscal_year: int = Field(ge=2020, le=2100)
    period: str = Field(default="YEARLY")
    total_amount: float = Field(gt=0)
    control_on_pr: str = Field(default="WARN")
    control_on_po: str = Field(default="WARN")


class UpdateBudgetSchema(BaseModel):
    name: str | None = None
    total_amount: float | None = Field(default=None, gt=0)
    control_on_pr: str | None = None
    control_on_po: str | None = None
    is_active: bool | None = None
