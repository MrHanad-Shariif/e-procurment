from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    org_slug: str


class LogoutSchema(BaseModel):
    refreshToken: str


class SignupSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")

    organization_name: str = Field(min_length=2, max_length=120)
    org_slug: str = Field(min_length=3, max_length=48, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=10, max_length=72)
    preferred_language: str = Field(default="EN", pattern=r"^(EN|AR|FR)$")

    @field_validator("organization_name", "first_name", "last_name", mode="before")
    @classmethod
    def trim_name(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def check_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must not exceed 72 UTF-8 bytes")
        return value


class RegisterSchema(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role_ids: list[str]
    preferred_language: str = "EN"
