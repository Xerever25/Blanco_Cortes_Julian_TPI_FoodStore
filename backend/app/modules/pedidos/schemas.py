from typing import Annotated, Literal

from pydantic import Field as PField
from pydantic import StringConstraints
from sqlmodel import Field, SQLModel

from app.core.types import UTCDatetime

EstadoPedido = Literal["PENDIENTE", "EN_PREPARACION", "ENTREGADO", "CANCELADO"]
FormaPago = Literal["EFECTIVO", "TRANSFERENCIA"]
Direccion = Annotated[str, StringConstraints(strip_whitespace=True, min_length=5, max_length=200)]


class ItemPedidoCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)


class PedidoCreate(SQLModel):
    items: Annotated[list[ItemPedidoCreate], PField(min_length=1)]
    forma_pago: FormaPago
    direccion_entrega: Direccion
    notas: str | None = None


class DetallePedidoRead(SQLModel):
    producto_id: int
    nombre_producto: str
    precio_unitario: float
    cantidad: int
    subtotal: float


class PedidoRead(SQLModel):
    id: int
    usuario_id: int
    estado: str
    forma_pago: str
    direccion_entrega: str
    notas: str | None = None
    total: float
    created_at: UTCDatetime
    updated_at: UTCDatetime
    items: list[DetallePedidoRead]


class PedidosPaginados(SQLModel):
    total: int
    items: list[PedidoRead]


class CambioEstado(SQLModel):
    estado: EstadoPedido


class ResumenPedidos(SQLModel):
    pendientes: int
    en_preparacion: int
    entregados: int
    cancelados: int
    pedidos_hoy: int
    ingresos_entregados: float
