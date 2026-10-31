from pydantic import BaseModel, EmailStr


class CreateSupplierSchema(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    tax_id: str | None = None
    category: str | None = None
    website: str | None = None
    contact_name: str | None = None
    notes: str | None = None


class UpdateSupplierSchema(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    tax_id: str | None = None
    category: str | None = None
    website: str | None = None
    contact_name: str | None = None
    notes: str | None = None


class UpdateSupplierStatusSchema(BaseModel):
    status: str
