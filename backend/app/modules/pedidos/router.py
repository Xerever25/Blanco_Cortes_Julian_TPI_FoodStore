from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.deps import get_current_active_user, require_role
from app.modules.pedidos.schemas import (
    CambioEstado,
    EstadoPedido,
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.service import (
    PedidoAjeno,
    PedidoNoEncontrado,
    PedidoService,
    ProductoNoEncontrado,
    ReglaDeNegocio,
)
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


def get_pedido_service() -> PedidoService:
    return PedidoService()


def _no_encontrado() -> HTTPException:
    return HTTPException(status.HTTP_404_NOT_FOUND, "Pedido no encontrado")


def _ajeno() -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, "El pedido pertenece a otro usuario")


@router.post("", response_model=PedidoRead, status_code=status.HTTP_201_CREATED, summary="Crear pedido desde el carrito")
def crear(
    data: PedidoCreate,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
):
    try:
        return service.crear(data, usuario.id)  # type: ignore[arg-type]
    except ProductoNoEncontrado:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")
    except ReglaDeNegocio as e:  # StockInsuficiente, ProductoNoDisponible, ProductoRepetido
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.get("", response_model=PedidosPaginados, summary="Listar pedidos (propios o, si es admin, todos)")
def listar(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    estado: EstadoPedido | None = None,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
):
    return service.listar(usuario, skip, limit, estado)


# Se declara antes de /{pedido_id} para que "resumen" no se interprete como un id.
@router.get("/resumen", response_model=ResumenPedidos, summary="Indicadores del panel (admin)")
def resumen(
    _: Usuario = Depends(require_role(["admin"])),
    service: PedidoService = Depends(get_pedido_service),
):
    return service.resumen()


@router.get("/{pedido_id}", response_model=PedidoRead, summary="Detalle de un pedido (dueño o admin)")
def obtener(
    pedido_id: int,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
):
    try:
        return service.obtener(pedido_id, usuario)
    except PedidoNoEncontrado:
        raise _no_encontrado()
    except PedidoAjeno:
        raise _ajeno()


@router.patch("/{pedido_id}/estado", response_model=PedidoRead, summary="Avanzar o cancelar un pedido (admin)")
def cambiar_estado(
    pedido_id: int,
    data: CambioEstado,
    _: Usuario = Depends(require_role(["admin"])),
    service: PedidoService = Depends(get_pedido_service),
):
    try:
        return service.cambiar_estado(pedido_id, data.estado)
    except PedidoNoEncontrado:
        raise _no_encontrado()
    except ReglaDeNegocio as e:  # TransicionInvalida
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))


@router.patch("/{pedido_id}/cancelar", response_model=PedidoRead, summary="Cancelar un pedido propio en PENDIENTE")
def cancelar(
    pedido_id: int,
    usuario: Usuario = Depends(get_current_active_user),
    service: PedidoService = Depends(get_pedido_service),
):
    try:
        return service.cancelar(pedido_id, usuario)
    except PedidoNoEncontrado:
        raise _no_encontrado()
    except PedidoAjeno:
        raise _ajeno()
    except ReglaDeNegocio as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
