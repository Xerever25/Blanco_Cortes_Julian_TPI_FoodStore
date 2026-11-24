from fastapi.testclient import TestClient

from app.main import app
from tests.conftest import login

API = "/api/v1"


def productos(c, **params):
    return c.get(f"{API}/productos", params=params).json()


def un_producto(c, nombre="Hamburguesa Clásica"):
    return next(p for p in productos(c, limit=100)["items"] if p["nombre"] == nombre)


def pedido_body(items, **extra):
    base = {"items": items, "forma_pago": "EFECTIVO", "direccion_entrega": "Calle Falsa 123"}
    return {**base, **extra}


# ---------------- Auth y usuarios ----------------
def test_registro_login_cookie_y_me(client):
    body = {"username": "luis", "full_name": "Luis", "email": "luis@correo.com", "password": "clave1234"}
    r = client.post(f"{API}/auth/register", json=body)
    assert r.status_code == 201
    assert r.json()["role"] == "user" and "hashed_password" not in r.json() and "password" not in r.json()

    assert client.post(f"{API}/auth/register", json=body).status_code == 409
    assert client.post(f"{API}/auth/register", json={**body, "username": "otro"}).status_code == 409  # email repetido
    assert client.post(f"{API}/auth/register", json={**body, "username": "x2", "email": "x2@c.com", "password": "corta"}).status_code == 422

    r = login(client, "luis", "clave1234")
    assert r.status_code == 200 and r.json() == {"message": "Login exitoso"}  # el cuerpo no trae el token
    set_cookie = r.headers["set-cookie"].lower()
    assert "access_token=" in set_cookie and "httponly" in set_cookie
    assert client.get(f"{API}/auth/me").json()["username"] == "luis"

    r = client.post(f"{API}/auth/logout")
    assert r.status_code == 200 and 'access_token=""' in r.headers["set-cookie"]
    client.cookies.clear()
    assert client.get(f"{API}/auth/me").status_code == 401


def test_credenciales_incorrectas_y_cuenta_desactivada(client, admin):
    assert login(TestClient(app), "admin", "mala").status_code == 401
    assert login(TestClient(app), "nadie", "x").status_code == 401

    with TestClient(app) as c:
        c.post(f"{API}/auth/register", json={"username": "bob", "full_name": "Bob", "email": "bob@c.com", "password": "clave1234"})
        assert login(c, "bob", "clave1234").status_code == 200
        bob_id = c.get(f"{API}/auth/me").json()["id"]

        assert admin.post(f"{API}/admin/usuarios/{bob_id}/desactivar").json()["disabled"] is True
        r = c.get(f"{API}/auth/me")  # sesión previa de un usuario desactivado
        assert r.status_code == 400 and r.json()["detail"] == "Cuenta de usuario desactivada"
        c2 = TestClient(app)
        r = login(c2, "bob", "clave1234")
        assert r.status_code == 400 and r.json()["detail"] == "Cuenta de usuario desactivada"

        assert admin.post(f"{API}/admin/usuarios/{bob_id}/activar").json()["disabled"] is False
        assert admin.post(f"{API}/admin/usuarios/{bob_id}/activar").status_code == 200  # idempotente
        assert c.get(f"{API}/auth/me").status_code == 200


def test_gestion_de_usuarios_y_permisos(admin, cliente_app):
    assert cliente_app.get(f"{API}/admin/usuarios").status_code == 403
    assert TestClient(app).get(f"{API}/admin/usuarios").status_code == 401
    lista = admin.get(f"{API}/admin/usuarios").json()
    assert {u["username"] for u in lista} == {"admin", "ana"}
    assert admin.post(f"{API}/admin/usuarios/9999/activar").status_code == 404
    assert admin.post(f"{API}/admin/usuarios/9999/desactivar").status_code == 404
    admin_id = next(u["id"] for u in lista if u["username"] == "admin")
    assert admin.post(f"{API}/admin/usuarios/{admin_id}/desactivar").status_code == 400  # no a sí mismo


# ---------------- Categorías ----------------
def test_categorias_crud_baja_logica_y_permisos(client, admin, cliente_app):
    assert len(client.get(f"{API}/categorias").json()) == 4  # lectura pública
    assert cliente_app.post(f"{API}/categorias", json={"nombre": "Ensaladas"}).status_code == 403
    assert TestClient(app).post(f"{API}/categorias", json={"nombre": "Ensaladas"}).status_code == 401

    r = admin.post(f"{API}/categorias", json={"nombre": "Ensaladas", "descripcion": "Frescas"})
    assert r.status_code == 201
    cid = r.json()["id"]
    assert admin.post(f"{API}/categorias", json={"nombre": "Ensaladas"}).status_code == 409
    assert admin.post(f"{API}/categorias", json={"nombre": "x"}).status_code == 422

    r = admin.put(f"{API}/categorias/{cid}", json={"descripcion": "Nueva"})  # parcial: conserva el nombre
    assert r.json()["nombre"] == "Ensaladas" and r.json()["descripcion"] == "Nueva"
    assert admin.put(f"{API}/categorias/{cid}", json={"nombre": "Pizzas"}).status_code == 409
    assert admin.put(f"{API}/categorias/9999", json={"descripcion": "x"}).status_code == 404

    assert admin.delete(f"{API}/categorias/{cid}").status_code == 204
    assert admin.get(f"{API}/categorias/{cid}").status_code == 404
    assert admin.put(f"{API}/categorias/{cid}", json={"descripcion": "x"}).status_code == 404
    assert admin.delete(f"{API}/categorias/{cid}").status_code == 404
    assert cid not in [c["id"] for c in admin.get(f"{API}/categorias").json()]
    assert admin.post(f"{API}/categorias", json={"nombre": "Ensaladas"}).status_code == 409  # la baja no libera el nombre


# ---------------- Productos ----------------
def test_productos_listado_filtros_y_paginacion(client):
    todo = productos(client, limit=100)
    assert todo["total"] == 9 and len(todo["items"]) == 9
    assert todo["items"][0]["categoria"]["nombre"]
    p = productos(client, skip=0, limit=4)
    assert p["total"] == 9 and len(p["items"]) == 4
    assert len(productos(client, skip=8, limit=4)["items"]) == 1
    assert [x["nombre"] for x in productos(client, search="HAMBURGUESA")["items"]].count("Hamburguesa Doble") == 1
    assert productos(client, search="hamburguesa")["total"] == 3
    cat = next(c for c in client.get(f"{API}/categorias").json() if c["nombre"] == "Bebidas")
    assert productos(client, categoria_id=cat["id"])["total"] == 2
    assert client.get(f"{API}/productos", params={"limit": 101}).status_code == 422
    assert client.get(f"{API}/productos", params={"skip": -1}).status_code == 422


def test_productos_admin_stock_y_baja(admin, cliente_app):
    cat = admin.get(f"{API}/categorias").json()[0]
    body = {"categoria_id": cat["id"], "nombre": "Nuevo", "precio_base": 100, "stock": 5}
    assert cliente_app.post(f"{API}/productos", json=body).status_code == 403
    assert admin.post(f"{API}/productos", json={**body, "precio_base": -1}).status_code == 422
    assert admin.post(f"{API}/productos", json={**body, "stock": -1}).status_code == 422
    assert admin.post(f"{API}/productos", json={**body, "categoria_id": 9999}).status_code == 404

    r = admin.post(f"{API}/productos", json=body)
    assert r.status_code == 201 and r.json()["disponible"] is True and r.json()["categoria"]["id"] == cat["id"]
    pid = r.json()["id"]

    r = admin.put(f"{API}/productos/{pid}", json={"precio_base": 150})  # parcial
    assert r.json()["precio_base"] == 150 and r.json()["nombre"] == "Nuevo" and r.json()["stock"] == 5
    assert admin.put(f"{API}/productos/{pid}", json={"categoria_id": 9999}).status_code == 404
    assert admin.put(f"{API}/productos/9999", json={"precio_base": 1}).status_code == 404

    r = admin.patch(f"{API}/productos/{pid}/stock", json={"stock": 0, "disponible": False})
    assert r.json()["stock"] == 0 and r.json()["disponible"] is False
    assert admin.patch(f"{API}/productos/{pid}/stock", json={"stock": -3}).status_code == 422
    assert cliente_app.patch(f"{API}/productos/{pid}/stock", json={"stock": 3}).status_code == 403

    assert admin.delete(f"{API}/productos/{pid}").status_code == 204
    assert admin.get(f"{API}/productos/{pid}").status_code == 404
    assert admin.patch(f"{API}/productos/{pid}/stock", json={"stock": 3}).status_code == 404
    assert pid not in [p["id"] for p in productos(admin, limit=100)["items"]]


def test_baja_de_categoria_no_oculta_sus_productos(admin):
    cat = next(c for c in admin.get(f"{API}/categorias").json() if c["nombre"] == "Postres")
    antes = productos(admin, categoria_id=cat["id"])["total"]
    admin.delete(f"{API}/categorias/{cat['id']}")
    assert productos(admin, categoria_id=cat["id"])["total"] == antes


# ---------------- Pedidos: RN-01 a RN-06 ----------------
def test_crear_pedido_descuenta_stock_y_copia_precio(admin, cliente_app):
    ham, gas = un_producto(admin), un_producto(admin, "Gaseosa Cola 500 ml")
    r = cliente_app.post(f"{API}/pedidos", json=pedido_body(
        [{"producto_id": ham["id"], "cantidad": 2}, {"producto_id": gas["id"], "cantidad": 3}], notas="Sin cebolla"))
    assert r.status_code == 201, r.text
    p = r.json()
    assert p["estado"] == "PENDIENTE" and p["notas"] == "Sin cebolla"
    assert p["total"] == 2 * ham["precio_base"] + 3 * gas["precio_base"]
    linea = next(i for i in p["items"] if i["producto_id"] == ham["id"])
    assert linea["nombre_producto"] == ham["nombre"] and linea["precio_unitario"] == ham["precio_base"]
    assert linea["subtotal"] == 2 * ham["precio_base"]
    assert un_producto(admin)["stock"] == ham["stock"] - 2
    assert un_producto(admin, "Gaseosa Cola 500 ml")["stock"] == gas["stock"] - 3

    # RN-05: cambiar el precio del producto no altera el pedido ya creado
    admin.put(f"{API}/productos/{ham['id']}", json={"precio_base": 99999, "nombre": "Renombrada"})
    again = cliente_app.get(f"{API}/pedidos/{p['id']}").json()
    assert again["total"] == p["total"] and again["items"] == p["items"]


def test_pedido_atomico_si_falla_no_se_persiste_nada(admin, cliente_app):
    ham = un_producto(admin)
    gas = un_producto(admin, "Gaseosa Cola 500 ml")
    r = cliente_app.post(f"{API}/pedidos", json=pedido_body(
        [{"producto_id": ham["id"], "cantidad": 1}, {"producto_id": gas["id"], "cantidad": gas["stock"] + 1}]))
    assert r.status_code == 400 and "Stock insuficiente" in r.json()["detail"]
    assert un_producto(admin)["stock"] == ham["stock"]  # el descuento del primer ítem se revirtió
    assert cliente_app.get(f"{API}/pedidos").json()["total"] == 0


def test_validaciones_de_pedido(admin, cliente_app):
    ham = un_producto(admin)
    ok = {"producto_id": ham["id"], "cantidad": 1}
    crear = lambda body: cliente_app.post(f"{API}/pedidos", json=body)  # noqa: E731
    assert crear(pedido_body([])).status_code == 422  # al menos un ítem
    assert crear(pedido_body([{**ok, "cantidad": 0}])).status_code == 422
    assert crear(pedido_body([ok], forma_pago="TARJETA")).status_code == 422  # RN-06
    assert crear(pedido_body([ok], direccion_entrega="abc")).status_code == 422
    assert crear(pedido_body([ok], direccion_entrega="x" * 201)).status_code == 422
    assert crear(pedido_body([ok, ok])).status_code == 400  # repetido
    assert crear(pedido_body([{"producto_id": 9999, "cantidad": 1}])).status_code == 404
    assert TestClient(app).post(f"{API}/pedidos", json=pedido_body([ok])).status_code == 401

    admin.patch(f"{API}/productos/{ham['id']}/stock", json={"disponible": False})
    r = crear(pedido_body([ok]))
    assert r.status_code == 400 and "no está disponible" in r.json()["detail"]
    admin.patch(f"{API}/productos/{ham['id']}/stock", json={"disponible": True})
    admin.delete(f"{API}/productos/{ham['id']}")
    assert crear(pedido_body([ok])).status_code == 404  # inactivo


def test_maquina_de_estados_y_restitucion_de_stock(admin, cliente_app):
    ham = un_producto(admin)
    pid = cliente_app.post(f"{API}/pedidos", json=pedido_body([{"producto_id": ham["id"], "cantidad": 4}])).json()["id"]
    cambiar = lambda estado: admin.patch(f"{API}/pedidos/{pid}/estado", json={"estado": estado})  # noqa: E731

    assert cambiar("ENTREGADO").status_code == 400  # PENDIENTE no salta a ENTREGADO
    assert cambiar("PENDIENTE").status_code == 400
    assert cambiar("INVENTADO").status_code == 422
    assert cambiar("EN_PREPARACION").json()["estado"] == "EN_PREPARACION"
    assert cliente_app.patch(f"{API}/pedidos/{pid}/estado", json={"estado": "ENTREGADO"}).status_code == 403
    assert cliente_app.patch(f"{API}/pedidos/{pid}/cancelar").status_code == 400  # ya no está PENDIENTE
    assert un_producto(admin)["stock"] == ham["stock"] - 4

    assert cambiar("CANCELADO").json()["estado"] == "CANCELADO"  # el admin cancela desde EN_PREPARACION
    assert un_producto(admin)["stock"] == ham["stock"]  # RN-03: restituido
    assert cambiar("EN_PREPARACION").status_code == 400  # estado terminal
    assert cambiar("CANCELADO").status_code == 400
    assert admin.patch(f"{API}/pedidos/9999/estado", json={"estado": "CANCELADO"}).status_code == 404


def test_cliente_cancela_su_pedido_pendiente(admin, cliente_app):
    ham = un_producto(admin)
    pid = cliente_app.post(f"{API}/pedidos", json=pedido_body([{"producto_id": ham["id"], "cantidad": 2}])).json()["id"]
    assert un_producto(admin)["stock"] == ham["stock"] - 2
    r = cliente_app.patch(f"{API}/pedidos/{pid}/cancelar")
    assert r.status_code == 200 and r.json()["estado"] == "CANCELADO"
    assert un_producto(admin)["stock"] == ham["stock"]
    assert cliente_app.patch(f"{API}/pedidos/{pid}/cancelar").status_code == 400  # ya cancelado
    assert cliente_app.patch(f"{API}/pedidos/9999/cancelar").status_code == 404


def test_permisos_por_dueno_y_rol(admin, cliente_app):
    ham = un_producto(admin)
    pid = cliente_app.post(f"{API}/pedidos", json=pedido_body([{"producto_id": ham["id"], "cantidad": 1}])).json()["id"]
    with TestClient(app) as otro:
        otro.post(f"{API}/auth/register", json={"username": "zoe", "full_name": "Zoe", "email": "zoe@c.com", "password": "clave1234"})
        login(otro, "zoe", "clave1234")
        assert otro.get(f"{API}/pedidos/{pid}").status_code == 403
        assert otro.patch(f"{API}/pedidos/{pid}/cancelar").status_code == 403
        assert otro.get(f"{API}/pedidos").json()["total"] == 0  # solo ve los propios
        assert otro.get(f"{API}/pedidos/resumen").status_code == 403
    assert admin.get(f"{API}/pedidos/{pid}").status_code == 200  # el admin ve todos
    assert admin.get(f"{API}/pedidos").json()["total"] == 1
    assert admin.get(f"{API}/pedidos", params={"estado": "CANCELADO"}).json()["total"] == 0
    assert admin.get(f"{API}/pedidos", params={"estado": "PENDIENTE"}).json()["total"] == 1
    assert admin.get(f"{API}/pedidos/9999").status_code == 404
    # RN-05: no hay endpoints de edición ni de borrado
    assert admin.delete(f"{API}/pedidos/{pid}").status_code == 405
    assert admin.put(f"{API}/pedidos/{pid}", json={}).status_code == 405


def test_resumen(admin, cliente_app):
    ham, gas = un_producto(admin), un_producto(admin, "Gaseosa Cola 500 ml")
    crear = lambda pid, cant: cliente_app.post(f"{API}/pedidos", json=pedido_body([{"producto_id": pid, "cantidad": cant}])).json()  # noqa: E731
    a, b, c, d = crear(ham["id"], 1), crear(gas["id"], 2), crear(ham["id"], 3), crear(gas["id"], 1)
    estado = lambda p, e: admin.patch(f"{API}/pedidos/{p['id']}/estado", json={"estado": e})  # noqa: E731
    estado(a, "EN_PREPARACION"); estado(a, "ENTREGADO")
    estado(b, "CANCELADO")
    estado(c, "EN_PREPARACION")
    r = admin.get(f"{API}/pedidos/resumen").json()
    assert r == {"pendientes": 1, "en_preparacion": 1, "entregados": 1, "cancelados": 1,
                 "pedidos_hoy": 4, "ingresos_entregados": a["total"]}
