from app.modules.categorias.service import CategoriaNoEncontrada  # noqa: F401  (se reexporta para el router)
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception):
    """404: el producto no existe o está dado de baja."""


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork | None = None) -> None:
        self.uow = uow or ProductoUnitOfWork()

    def listar(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        categoria_id: int | None = None,
        disponible: bool | None = None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            items, total = uow.productos.search(search, categoria_id, disponible, skip, limit)
            return ProductosPaginados(total=total, items=[ProductoRead.model_validate(p) for p in items])

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(self._activo(uow, producto_id))

    def crear(self, data: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._categoria_activa(uow, data.categoria_id)
            producto = uow.productos.add(Producto(**data.model_dump()))
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, data: ProductoUpdate) -> ProductoRead:
        cambios = data.model_dump(exclude_unset=True)
        with self.uow as uow:
            producto = self._activo(uow, producto_id)
            if cambios.get("categoria_id") is not None:
                self._categoria_activa(uow, cambios["categoria_id"])
            for campo, valor in cambios.items():
                if valor is None and campo in {"categoria_id", "nombre", "precio_base", "stock", "disponible"}:
                    continue  # campos obligatorios: un null se ignora
                setattr(producto, campo, valor)
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def cambiar_stock(self, producto_id: int, data: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._activo(uow, producto_id)
            if data.stock is not None:
                producto.stock = data.stock
            if data.disponible is not None:
                producto.disponible = data.disponible
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def eliminar(self, producto_id: int) -> None:
        """Baja lógica: activo = false."""
        with self.uow as uow:
            producto = self._activo(uow, producto_id)
            producto.activo = False
            uow.productos.add(producto)

    @staticmethod
    def _activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_by_id(producto_id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado(producto_id)
        return producto

    @staticmethod
    def _categoria_activa(uow: ProductoUnitOfWork, categoria_id: int) -> None:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(categoria_id)
