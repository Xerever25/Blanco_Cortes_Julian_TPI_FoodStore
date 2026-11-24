from collections.abc import Callable

from fastapi import Cookie, Depends, HTTPException, status

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import UsuarioRepository

COOKIE_NAME = "access_token"


def get_current_user(access_token: str | None = Cookie(default=None)) -> Usuario:
    """Lee el JWT de la cookie HttpOnly, valida firma y expiración y carga el usuario. 401 si falla."""
    no_autenticado = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado o sesión vencida",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not access_token:
        raise no_autenticado
    payload = decode_access_token(access_token)
    if payload is None or not str(payload.get("sub", "")).isdigit():
        raise no_autenticado
    with session_factory() as session:  # solo lectura: no hay nada que confirmar
        usuario = UsuarioRepository(session).get_by_id(int(payload["sub"]))
    if usuario is None:
        raise no_autenticado
    return usuario


def get_current_active_user(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    """Rechaza a los usuarios dados de baja lógica (`disabled`)."""
    if usuario.disabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta de usuario desactivada")
    return usuario


def require_role(roles: list[str]) -> Callable[[Usuario], Usuario]:
    """Dependencia que exige que el usuario tenga alguno de los roles indicados. 403 si no."""

    def checker(usuario: Usuario = Depends(get_current_active_user)) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tenés permisos para esta acción")
        return usuario

    return checker
