from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

from app.core.security import hash_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserCreate, UserPublic
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


class UsuarioService:
    """Reglas de negocio de usuarios. Se admite lanzar HTTPException desde este Service."""

    def __init__(self, uow: UsuarioUnitOfWork | None = None) -> None:
        self.uow = uow or UsuarioUnitOfWork()

    def registrar(self, data: UserCreate) -> UserPublic:
        """Alta de un usuario con rol `user`. 409 si el username o el email ya existen."""
        try:
            with self.uow as uow:
                if uow.usuarios.get_by_username(data.username):
                    raise HTTPException(status.HTTP_409_CONFLICT, "El nombre de usuario ya existe")
                if uow.usuarios.get_by_email(data.email):
                    raise HTTPException(status.HTTP_409_CONFLICT, "El email ya está registrado")
                usuario = uow.usuarios.add(
                    Usuario(
                        username=data.username,
                        full_name=data.full_name,
                        email=data.email,
                        hashed_password=hash_password(data.password),
                        role="user",  # el registro público nunca crea administradores
                    )
                )
                return UserPublic.model_validate(usuario)
        except IntegrityError:  # dos registros simultáneos con el mismo username o email
            raise HTTPException(status.HTTP_409_CONFLICT, "El nombre de usuario o el email ya existen")

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.list_all()]

    def activar(self, usuario_id: int) -> UserPublic:
        """Alta lógica (disabled = false). Idempotente: responde 200 aunque ya estuviera activo."""
        return self._cambiar_estado(usuario_id, disabled=False)

    def desactivar(self, usuario_id: int, actor_id: int) -> UserPublic:
        """Baja lógica (disabled = true). Idempotente; el admin no puede desactivarse a sí mismo."""
        if usuario_id == actor_id:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "No podés desactivar tu propia cuenta")
        return self._cambiar_estado(usuario_id, disabled=True)

    def _cambiar_estado(self, usuario_id: int, disabled: bool) -> UserPublic:
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(usuario_id)
            if usuario is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Usuario no encontrado")
            usuario.disabled = disabled
            uow.usuarios.add(usuario)
            return UserPublic.model_validate(usuario)
