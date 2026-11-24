from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.base_repository import BaseRepository
from app.modules.pedidos.models import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    """Consultas de pedidos. Sin reglas de negocio."""

    def __init__(self, session: Session) -> None:
        super().__init__(session, Pedido)

    def add_detalle(self, detalle: DetallePedido) -> DetallePedido:
        self.session.add(detalle)
        self.session.flush()
        return detalle

    def refresh_items(self, pedido: Pedido) -> None:
        """Recarga las líneas del pedido (después de insertarlas en esta misma transacción)."""
        self.session.refresh(pedido, ["items"])

    def _listar(self, condiciones: list, skip: int, limit: int) -> tuple[list[Pedido], int]:
        total = self.session.exec(select(func.count()).select_from(Pedido).where(*condiciones)).one()
        items = self.session.exec(
            select(Pedido)
            .where(*condiciones)
            .options(selectinload(Pedido.items))  # type: ignore[arg-type]
            .order_by(col(Pedido.created_at).desc(), col(Pedido.id).desc())
            .offset(skip)
            .limit(limit)
        ).all()
        return list(items), total

    def list_by_usuario(
        self, usuario_id: int, estado: str | None = None, skip: int = 0, limit: int = 20
    ) -> tuple[list[Pedido], int]:
        condiciones = [Pedido.usuario_id == usuario_id]
        if estado:
            condiciones.append(Pedido.estado == estado)
        return self._listar(condiciones, skip, limit)

    def list_all(self, estado: str | None = None, skip: int = 0, limit: int = 20) -> tuple[list[Pedido], int]:
        condiciones = [Pedido.estado == estado] if estado else []
        return self._listar(condiciones, skip, limit)

    def count_by_estado(self) -> dict[str, int]:
        filas = self.session.exec(select(Pedido.estado, func.count()).group_by(Pedido.estado)).all()
        return {estado: cantidad for estado, cantidad in filas}

    def count_desde(self, desde: datetime) -> int:
        return self.session.exec(select(func.count()).select_from(Pedido).where(Pedido.created_at >= desde)).one()

    def sum_total_por_estado(self, estado: str) -> float:
        total = self.session.exec(select(func.coalesce(func.sum(Pedido.total), 0)).where(Pedido.estado == estado)).one()
        return float(total)
