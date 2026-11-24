"""Carga datos iniciales. Es idempotente: se puede ejecutar varias veces sin duplicar nada.

    python -m app.db.seed
"""

from sqlmodel import select

from app.core.database import create_all_tables, session_factory
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

ADMIN = {"username": "admin", "full_name": "Administrador", "email": "admin@foodstore.com", "password": "Admin1234!"}

CATEGORIAS = {
    "Hamburguesas": "Hamburguesas artesanales con papas",
    "Pizzas": "Pizzas a la piedra",
    "Bebidas": "Gaseosas, aguas y jugos",
    "Postres": "Dulces para cerrar la comida",
}

# (categoría, nombre, descripción, precio, stock)
PRODUCTOS = [
    ("Hamburguesas", "Hamburguesa Clásica", "Carne, lechuga, tomate y cheddar", 8500.0, 30),
    ("Hamburguesas", "Hamburguesa Doble", "Doble carne, panceta y salsa de la casa", 11200.0, 25),
    ("Hamburguesas", "Hamburguesa Veggie", "Medallón de garbanzos y vegetales grillados", 8900.0, 20),
    ("Pizzas", "Pizza Muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9500.0, 20),
    ("Pizzas", "Pizza Napolitana", "Muzzarella, tomate fresco y ajo", 10500.0, 15),
    ("Bebidas", "Gaseosa Cola 500 ml", "Bien fría", 2500.0, 60),
    ("Bebidas", "Agua Mineral 500 ml", "Sin gas", 1800.0, 80),
    ("Postres", "Flan con Dulce de Leche", "Casero, con crema", 4200.0, 18),
    ("Postres", "Brownie con Helado", "Chocolate intenso y helado de crema", 5600.0, 12),
]


def run() -> None:
    create_all_tables()
    with session_factory() as session:
        if not session.exec(select(Usuario).where(Usuario.username == ADMIN["username"])).first():
            session.add(
                Usuario(
                    username=ADMIN["username"],
                    full_name=ADMIN["full_name"],
                    email=ADMIN["email"],
                    hashed_password=hash_password(ADMIN["password"]),
                    role="admin",
                )
            )

        categorias: dict[str, Categoria] = {}
        for nombre, descripcion in CATEGORIAS.items():
            categoria = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
            if categoria is None:
                categoria = Categoria(nombre=nombre, descripcion=descripcion)
                session.add(categoria)
            categorias[nombre] = categoria
        session.flush()  # asigna los ids de las categorías nuevas

        for categoria_nombre, nombre, descripcion, precio, stock in PRODUCTOS:
            categoria = categorias[categoria_nombre]
            existe = session.exec(
                select(Producto).where(Producto.nombre == nombre, Producto.categoria_id == categoria.id)
            ).first()
            if existe is None:
                session.add(
                    Producto(
                        categoria_id=categoria.id,  # type: ignore[arg-type]
                        nombre=nombre,
                        descripcion=descripcion,
                        precio_base=precio,
                        stock=stock,
                    )
                )
        session.commit()
    print("Seed listo: usuario admin (admin / Admin1234!), categorías y productos cargados.")


if __name__ == "__main__":
    run()
