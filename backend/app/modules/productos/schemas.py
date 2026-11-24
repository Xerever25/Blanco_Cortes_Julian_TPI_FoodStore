from typing import Annotated

from pydantic import StringConstraints, model_validator
from sqlmodel import Field, SQLModel

from app.modules.categorias.schemas import CategoriaRead

Nombre = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]


class ProductoCreate(SQLModel):
    categoria_id: int
    nombre: Nombre
    descripcion: str | None = None
    precio_base: float = Field(ge=0)
    imagen_url: str | None = None
    stock: int = Field(default=0, ge=0)
    disponible: bool = True


class ProductoUpdate(SQLModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    categoria_id: int | None = None
    nombre: Nombre | None = None
    descripcion: str | None = None
    precio_base: float | None = Field(default=None, ge=0)
    imagen_url: str | None = None
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None


class ProductoStockUpdate(SQLModel):
    stock: int | None = Field(default=None, ge=0)
    disponible: bool | None = None

    @model_validator(mode="after")
    def _al_menos_uno(self) -> "ProductoStockUpdate":
        if self.stock is None and self.disponible is None:
            raise ValueError("Se debe enviar stock, disponible o ambos")
        return self


class ProductoRead(SQLModel):
    id: int
    categoria_id: int
    nombre: str
    descripcion: str | None = None
    precio_base: float
    imagen_url: str | None = None
    stock: int
    disponible: bool
    activo: bool
    categoria: CategoriaRead


class ProductosPaginados(SQLModel):
    total: int
    items: list[ProductoRead]
