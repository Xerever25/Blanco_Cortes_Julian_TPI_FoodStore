from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.base_repository import BaseRepository
from app.modules.productos.models import Producto


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session: Session) -> None:
        super().__init__(session, Producto)

    def get_by_id(self, id: int, for_update: bool = False) -> Producto | None:  # type: ignore[override]
        """Con `for_update` bloquea la fila (PostgreSQL) para que dos pedidos no descuenten el mismo stock."""
        if not for_update:
            return self.session.get(Producto, id)
        return self.session.exec(select(Producto).where(Producto.id == id).with_for_update()).first()

    def search(
        self,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
        skip: int = 0,
        limit: int = 20,
    ) -> tuple[list[Producto], int]:
        """Productos activos filtrados y paginados. Devuelve (items, total)."""
        condiciones = [col(Producto.activo).is_(True)]
        if search:
            condiciones.append(col(Producto.nombre).ilike(f"%{search.strip()}%"))
        if categoria_id is not None:
            condiciones.append(Producto.categoria_id == categoria_id)
        if disponible is not None:
            condiciones.append(Producto.disponible == disponible)

        total = self.session.exec(select(func.count()).select_from(Producto).where(*condiciones)).one()
        items = self.session.exec(
            select(Producto)
            .where(*condiciones)
            .options(selectinload(Producto.categoria))  # type: ignore[arg-type]
            .order_by(Producto.nombre, Producto.id)
            .offset(skip)
            .limit(limit)
        ).all()
        return list(items), total
