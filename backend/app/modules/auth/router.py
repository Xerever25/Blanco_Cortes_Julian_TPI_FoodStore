from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import COOKIE_NAME, get_current_active_user
from app.modules.auth.schemas import MessageResponse
from app.modules.auth.service import AuthService
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic

router = APIRouter(prefix="/auth", tags=["Auth"])

COOKIE_OPTIONS = {"httponly": True, "samesite": "lax", "secure": settings.COOKIE_SECURE, "path": "/"}


def get_auth_service() -> AuthService:
    return AuthService()


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED, summary="Registro público")
def register(data: UserCreate, service: AuthService = Depends(get_auth_service)):
    return service.register(data)


@router.post("/token", response_model=MessageResponse, summary="Login (formulario OAuth2)")
def login(
    response: Response,
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: AuthService = Depends(get_auth_service),
):
    """Entrega el JWT en la cookie HttpOnly `access_token`; el cuerpo NO incluye el token."""
    token = service.login(form.username, form.password)
    response.set_cookie(COOKIE_NAME, token, max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60, **COOKIE_OPTIONS)
    return MessageResponse(message="Login exitoso")


@router.post("/logout", response_model=MessageResponse, summary="Cerrar sesión")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, **COOKIE_OPTIONS)
    return MessageResponse(message="Sesión cerrada")


@router.get("/me", response_model=UserPublic, summary="Usuario autenticado")
def me(usuario: Usuario = Depends(get_current_active_user)):
    return UserPublic.model_validate(usuario)
