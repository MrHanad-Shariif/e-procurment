from pydantic import BaseModel


class CreateRoleSchema(BaseModel):
    name: str
    slug: str
    description: str | None = None
    permission_ids: list[str] = []


class UpdateRoleSchema(BaseModel):
    name: str | None = None
    description: str | None = None


class SetPermissionsSchema(BaseModel):
    permission_ids: list[str]
