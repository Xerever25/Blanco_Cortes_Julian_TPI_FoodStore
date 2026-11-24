from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from app.core.types import utcnow

if TYPE_CHECKING:
    from app.modules.productos.models import Producto
    from app.modules.usuarios.models import Usuario


class Pedido(SQLModel, table=True):
    """Un pedido no se borra: se cancela. `total` queda fijo desde la creación (RN-05)."""

    id: int | None = Field(default=None, primary_key=True)
    usuario_id: int = Field(foreign_key="usuario.id")
    estado: str = Field(default="PENDIENTE")
    forma_pago: str
    direccion_entrega: str
    notas: str | None = None
    total: float = Field(default=0)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    usuario: "Usuario" = Relationship(back_populates="pedidos")
    items: list["DetallePedido"] = Relationship(back_populates="pedido")


class DetallePedido(SQLModel, table=True):
    """Línea inmutable: copia el nombre y el precio del producto al momento de la compra."""

    id: int | None = Field(default=None, primary_key=True)
    pedido_id: int = Field(foreign_key="pedido.id")
    producto_id: int = Field(foreign_key="producto.id")
    cantidad: int
    nombre_producto: str
    precio_unitario: float
    subtotal: float

    pedido: "Pedido" = Relationship(back_populates="items")
    producto: "Producto" = Relationship(back_populates="detalles")
