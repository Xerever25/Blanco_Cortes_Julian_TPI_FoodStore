from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.deps import require_role
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import CategoriaNoEncontrada, CategoriaService, NombreDuplicado
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/categorias", tags=["Categorías"])
solo_admin = require_role(["admin"])


def get_categoria_service() -> CategoriaService:
    return CategoriaService()


def _no_encontrada() -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, "Categoría no encontrada")


def _duplicada() -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, "Ya existe una categoría con ese nombre")


@router.get("", response_model=list[CategoriaRead], summary="Listar categorías activas")
def listar(service: CategoriaService = Depends(get_categoria_service)):
    return service.listar()


@router.get("/{categoria_id}", response_model=CategoriaRead, summary="Detalle de una categoría")
def obtener(categoria_id: int, service: CategoriaService = Depends(get_categoria_service)):
    try:
        return service.obtener(categoria_id)
    except CategoriaNoEncontrada:
        raise _no_encontrada()


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED, summary="Crear categoría")
def crear(
    data: CategoriaCreate,
    _: Usuario = Depends(solo_admin),
    service: CategoriaService = Depends(get_categoria_service),
):
    try:
        return service.crear(data)
    except NombreDuplicado:
        raise _duplicada()


@router.put("/{categoria_id}", response_model=CategoriaRead, summary="Actualizar categoría (parcial)")
def actualizar(
    categoria_id: int,
    data: CategoriaUpdate,
    _: Usuario = Depends(solo_admin),
    service: CategoriaService = Depends(get_categoria_service),
):
    try:
        return service.actualizar(categoria_id, data)
    except CategoriaNoEncontrada:
        raise _no_encontrada()
    except NombreDuplicado:
        raise _duplicada()


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Baja lógica de una categoría")
def eliminar(
    categoria_id: int,
    _: Usuario = Depends(solo_admin),
    service: CategoriaService = Depends(get_categoria_service),
):
    try:
        service.eliminar(categoria_id)
    except CategoriaNoEncontrada:
        raise _no_encontrada()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
