from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import UserPublic
from app.modules.usuarios.service import UsuarioService

router = APIRouter(prefix="/admin/usuarios", tags=["Usuarios (admin)"])


def get_usuario_service() -> UsuarioService:
    return UsuarioService()


@router.get("", response_model=list[UserPublic], summary="Listar usuarios")
def listar(
    _: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_usuario_service),
):
    return service.listar()


@router.post("/{usuario_id}/activar", response_model=UserPublic, summary="Activar usuario (alta lógica)")
def activar(
    usuario_id: int,
    _: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_usuario_service),
):
    return service.activar(usuario_id)


@router.post("/{usuario_id}/desactivar", response_model=UserPublic, summary="Desactivar usuario (baja lógica)")
def desactivar(
    usuario_id: int,
    admin: Usuario = Depends(require_role(["admin"])),
    service: UsuarioService = Depends(get_usuario_service),
):
    return service.desactivar(usuario_id, actor_id=admin.id)  # type: ignore[arg-type]
