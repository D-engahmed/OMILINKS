"""Auth schemas: login, register."""

from pydantic import BaseModel, EmailStr

from app.domains.tenants.models.enums import TenantType


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    company_name: str
    slug: str
    email: EmailStr
    password: str
    type: TenantType = TenantType.INDIVIDUAL
