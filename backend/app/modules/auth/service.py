from fastapi import HTTPException, status

from app.core.security import create_access_token, verify_password
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class AuthService:
    """Registro y login. Usa el modelo Usuario (se admite HTTPException desde este Service)."""

    def __init__(self, uow: UsuarioUnitOfWork | None = None) -> None:
        self.uow = uow or UsuarioUnitOfWork()

    def register(self, data: UserCreate) -> UserPublic:
        return UsuarioService(self.uow).registrar(data)

    def login(self, username: str, password: str) -> str:
        """Valida las credenciales y devuelve el JWT. 401 si son incorrectas, 400 si la cuenta está desactivada."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise HTTPException(
                    status.HTTP_401_UNAUTHORIZED,
                    "Usuario o contraseña incorrectos",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            if usuario.disabled:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cuenta de usuario desactivada")
            return create_access_token(str(usuario.id))
