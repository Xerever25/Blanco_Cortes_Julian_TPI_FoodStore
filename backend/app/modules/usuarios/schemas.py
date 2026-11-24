from pydantic import EmailStr, Field
from sqlmodel import SQLModel

from app.core.types import UTCDatetime


class UserCreate(SQLModel):
    username: str = Field(min_length=3, max_length=50)
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)


class UserPublic(SQLModel):
    """Datos del usuario que salen por la API. Nunca incluye hashed_password."""

    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
    created_at: UTCDatetime
