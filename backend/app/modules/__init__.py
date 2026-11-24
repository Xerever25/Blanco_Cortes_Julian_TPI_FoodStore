# Importar los cuatro módulos con tablas registra los 5 modelos en SQLModel.metadata
# y permite resolver las relaciones declaradas con nombres (strings).
from app.modules.categorias.models import Categoria  # noqa: F401
from app.modules.pedidos.models import DetallePedido, Pedido  # noqa: F401
from app.modules.productos.models import Producto  # noqa: F401
from app.modules.usuarios.models import Usuario  # noqa: F401
