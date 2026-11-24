import os

# Base en memoria y clave de prueba: se fijan ANTES de importar la aplicación.
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "clave-de-pruebas-de-al-menos-32-caracteres-ok"

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from app.core.database import create_all_tables, engine
from app.db import seed
from app.main import app


@pytest.fixture(autouse=True)
def base_limpia():
    SQLModel.metadata.drop_all(engine)
    create_all_tables()
    seed.run()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def login(c: TestClient, username: str, password: str):
    return c.post("/api/v1/auth/token", data={"username": username, "password": password})


@pytest.fixture()
def admin(client):
    assert login(client, "admin", "Admin1234!").status_code == 200
    return client


@pytest.fixture()
def cliente_app():
    """Segundo cliente HTTP (cookies propias) para actuar como usuario común."""
    with TestClient(app) as c:
        r = c.post(
            "/api/v1/auth/register",
            json={"username": "ana", "full_name": "Ana Pérez", "email": "ana@correo.com", "password": "clave1234"},
        )
        assert r.status_code == 201
        assert login(c, "ana", "clave1234").status_code == 200
        yield c
