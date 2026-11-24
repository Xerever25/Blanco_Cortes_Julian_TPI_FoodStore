from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.core.deps import require_role
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.service import CategoriaNoEncontrada, ProductoNoEncontrado, ProductoService
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/productos", tags=["Productos"])
solo_admin = require_role(["admin"])


def get_producto_service() -> ProductoService:
    return ProductoService()


def _producto_no_encontrado() -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")


def _categoria_no_encontrada() -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, "Categoría no encontrada")


@router.get("", response_model=ProductosPaginados, summary="Listar productos activos (paginado)")
def listar(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, description="Texto a buscar en el nombre (sin distinguir mayúsculas)"),
    categoria_id: int | None = None,
    disponible: bool | None = None,
    service: ProductoService = Depends(get_producto_service),
):
    return service.listar(skip, limit, search, categoria_id, disponible)


@router.get("/{producto_id}", response_model=ProductoRead, summary="Detalle de un producto")
def obtener(producto_id: int, service: ProductoService = Depends(get_producto_service)):
    try:
        return service.obtener(producto_id)
    except ProductoNoEncontrado:
        raise _producto_no_encontrado()


@router.post("", response_model=ProductoRead, status_code=status.HTTP_201_CREATED, summary="Crear producto")
def crear(
    data: ProductoCreate,
    _: Usuario = Depends(solo_admin),
    service: ProductoService = Depends(get_producto_service),
):
    try:
        return service.crear(data)
    except CategoriaNoEncontrada:
        raise _categoria_no_encontrada()


@router.put("/{producto_id}", response_model=ProductoRead, summary="Actualizar producto (parcial)")
def actualizar(
    producto_id: int,
    data: ProductoUpdate,
    _: Usuario = Depends(solo_admin),
    service: ProductoService = Depends(get_producto_service),
):
    try:
        return service.actualizar(producto_id, data)
    except ProductoNoEncontrado:
        raise _producto_no_encontrado()
    except CategoriaNoEncontrada:
        raise _categoria_no_encontrada()


@router.patch("/{producto_id}/stock", response_model=ProductoRead, summary="Cambiar stock y disponibilidad")
def cambiar_stock(
    producto_id: int,
    data: ProductoStockUpdate,
    _: Usuario = Depends(solo_admin),
    service: ProductoService = Depends(get_producto_service),
):
    try:
        return service.cambiar_stock(producto_id, data)
    except ProductoNoEncontrado:
        raise _producto_no_encontrado()


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Baja lógica de un producto")
def eliminar(
    producto_id: int,
    _: Usuario = Depends(solo_admin),
    service: ProductoService = Depends(get_producto_service),
):
    try:
        service.eliminar(producto_id)
    except ProductoNoEncontrado:
        raise _producto_no_encontrado()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
