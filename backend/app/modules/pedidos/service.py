from app.core.types import utcnow
from app.modules.pedidos.models import DetallePedido, Pedido
from app.modules.pedidos.schemas import PedidoCreate, PedidoRead, PedidosPaginados, ResumenPedidos
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado  # noqa: F401  (se reexporta para el router)
from app.modules.usuarios.models import Usuario


# --- Excepciones de dominio (el Router las traduce a códigos HTTP) -------------------------
class PedidoNoEncontrado(Exception):
    """404"""


class PedidoAjeno(Exception):
    """403: el pedido pertenece a otro usuario."""


class ReglaDeNegocio(Exception):
    """400: base de las reglas de negocio incumplidas."""


class StockInsuficiente(ReglaDeNegocio):
    pass


class ProductoNoDisponible(ReglaDeNegocio):
    pass


class ProductoRepetido(ReglaDeNegocio):
    pass


class TransicionInvalida(ReglaDeNegocio):
    pass


# --- Máquina de estados (RN-02) ----------------------------------------------------------
TRANSICIONES: dict[str, set[str]] = {
    "PENDIENTE": {"EN_PREPARACION", "CANCELADO"},
    "EN_PREPARACION": {"ENTREGADO", "CANCELADO"},
    "ENTREGADO": set(),  # terminal
    "CANCELADO": set(),  # terminal
}


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork | None = None) -> None:
        self.uow = uow or PedidoUnitOfWork()

    # RN-01 ------------------------------------------------------------------------------
    def crear(self, data: PedidoCreate, usuario_id: int) -> PedidoRead:
        """Crea el pedido completo o no crea nada: validaciones, descuento de stock y líneas en una transacción."""
        ids = [item.producto_id for item in data.items]
        if len(ids) != len(set(ids)):
            raise ProductoRepetido("No puede haber productos repetidos en el pedido")

        with self.uow as uow:
            pedido = uow.pedidos.add(
                Pedido(
                    usuario_id=usuario_id,
                    estado="PENDIENTE",
                    forma_pago=data.forma_pago,
                    direccion_entrega=data.direccion_entrega,
                    notas=data.notas,
                    total=0,
                )
            )
            total = 0.0
            # Se recorren ordenados por id para tomar los bloqueos de fila siempre en el mismo orden.
            for item in sorted(data.items, key=lambda i: i.producto_id):
                producto = uow.productos.get_by_id(item.producto_id, for_update=True)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(item.producto_id)
                if not producto.disponible:
                    raise ProductoNoDisponible(f"El producto '{producto.nombre}' no está disponible")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente para '{producto.nombre}': hay {producto.stock} y se pidieron {item.cantidad}"
                    )
                producto.stock -= item.cantidad
                uow.productos.add(producto)
                subtotal = round(producto.precio_base * item.cantidad, 2)
                uow.pedidos.add_detalle(
                    DetallePedido(
                        pedido_id=pedido.id,  # type: ignore[arg-type]
                        producto_id=producto.id,  # type: ignore[arg-type]
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,  # copia: el pedido no cambia si el producto cambia
                        precio_unitario=producto.precio_base,
                        subtotal=subtotal,
                    )
                )
                total += subtotal
            pedido.total = round(total, 2)
            uow.pedidos.add(pedido)
            uow.pedidos.refresh_items(pedido)
            return PedidoRead.model_validate(pedido)

    # Consultas ----------------------------------------------------------------------------
    def listar(self, usuario: Usuario, skip: int = 0, limit: int = 20, estado: str | None = None) -> PedidosPaginados:
        """El admin ve todos los pedidos; el cliente solo los suyos (RN-04)."""
        with self.uow as uow:
            if usuario.role == "admin":
                items, total = uow.pedidos.list_all(estado, skip, limit)
            else:
                items, total = uow.pedidos.list_by_usuario(usuario.id, estado, skip, limit)  # type: ignore[arg-type]
            return PedidosPaginados(total=total, items=[PedidoRead.model_validate(p) for p in items])

    def obtener(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno(pedido_id)
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            por_estado = uow.pedidos.count_by_estado()
            hoy = utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            return ResumenPedidos(
                pendientes=por_estado.get("PENDIENTE", 0),
                en_preparacion=por_estado.get("EN_PREPARACION", 0),
                entregados=por_estado.get("ENTREGADO", 0),
                cancelados=por_estado.get("CANCELADO", 0),
                pedidos_hoy=uow.pedidos.count_desde(hoy),
                ingresos_entregados=uow.pedidos.sum_total_por_estado("ENTREGADO"),
            )

    # RN-02 y RN-03: cambios de estado ------------------------------------------------------
    def cambiar_estado(self, pedido_id: int, nuevo_estado: str) -> PedidoRead:
        """El admin avanza o cancela. La transición se valida antes de modificar el pedido."""
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            self._transicionar(uow, pedido, nuevo_estado)
            return PedidoRead.model_validate(pedido)

    def cancelar(self, pedido_id: int, usuario: Usuario) -> PedidoRead:
        """El dueño cancela su pedido solo si sigue en PENDIENTE (RN-04)."""
        with self.uow as uow:
            pedido = self._get(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno(pedido_id)
            if pedido.estado != "PENDIENTE":
                raise TransicionInvalida("Solo se puede cancelar un pedido en estado PENDIENTE")
            self._transicionar(uow, pedido, "CANCELADO")
            return PedidoRead.model_validate(pedido)

    # Internos -----------------------------------------------------------------------------
    @staticmethod
    def _get(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(pedido_id)
        return pedido

    @staticmethod
    def _transicionar(uow: PedidoUnitOfWork, pedido: Pedido, nuevo_estado: str) -> None:
        if nuevo_estado not in TRANSICIONES.get(pedido.estado, set()):
            raise TransicionInvalida(f"Transición inválida: {pedido.estado} → {nuevo_estado}")
        if nuevo_estado == "CANCELADO":
            # RN-03: restituir el stock de cada línea en la misma transacción que cambia el estado.
            for detalle in pedido.items:
                producto = uow.productos.get_by_id(detalle.producto_id, for_update=True)
                if producto is not None:
                    producto.stock += detalle.cantidad
                    uow.productos.add(producto)
        pedido.estado = nuevo_estado
        pedido.updated_at = utcnow()
        uow.pedidos.add(pedido)
