from pydantic import BaseModel, EmailStr


class CreateUserSchema(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role_ids: list[str]
    preferred_language: str = "EN"


class UpdateUserSchema(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    preferred_language: str | None = None


class AssignRolesSchema(BaseModel):
    role_ids: list[str]
