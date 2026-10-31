from pydantic import BaseModel, EmailStr


class OrgSettingsUpdateSchema(BaseModel):
    name: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    system_name: str | None = None
    default_language: str | None = None


class SmtpSettingsSchema(BaseModel):
    smtp_host: str
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str | None = None
    email_from_name: str
    email_from_address: EmailStr


class SessionSettingsSchema(BaseModel):
    max_concurrent_sessions: int
