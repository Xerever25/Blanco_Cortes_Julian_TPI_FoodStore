from sqlalchemy.exc import IntegrityError

from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    """404: la categoría no existe o está dada de baja."""


class NombreDuplicado(Exception):
    """409: ya existe una categoría con ese nombre."""


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork | None = None) -> None:
        self.uow = uow or CategoriaUnitOfWork()

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._activa(uow, categoria_id))

    def crear(self, data: CategoriaCreate) -> CategoriaRead:
        try:
            with self.uow as uow:
                if uow.categorias.get_by_nombre(data.nombre):
                    raise NombreDuplicado(data.nombre)
                categoria = uow.categorias.add(Categoria(nombre=data.nombre, descripcion=data.descripcion))
                return CategoriaRead.model_validate(categoria)
        except IntegrityError:  # carrera entre dos altas simultáneas con el mismo nombre
            raise NombreDuplicado(data.nombre)

    def actualizar(self, categoria_id: int, data: CategoriaUpdate) -> CategoriaRead:
        cambios = data.model_dump(exclude_unset=True)
        try:
            with self.uow as uow:
                categoria = self._activa(uow, categoria_id)
                nuevo = cambios.get("nombre")
                if nuevo is not None and nuevo != categoria.nombre:
                    if uow.categorias.get_by_nombre(nuevo):
                        raise NombreDuplicado(nuevo)
                for campo, valor in cambios.items():
                    if campo == "nombre" and valor is None:
                        continue  # el nombre es obligatorio: un null se ignora
                    setattr(categoria, campo, valor)
                uow.categorias.add(categoria)
                return CategoriaRead.model_validate(categoria)
        except IntegrityError:
            raise NombreDuplicado(cambios.get("nombre", ""))

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica: activo = false. No libera el nombre ni toca los productos de la categoría."""
        with self.uow as uow:
            categoria = self._activa(uow, categoria_id)
            categoria.activo = False
            uow.categorias.add(categoria)

    @staticmethod
    def _activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(categoria_id)
        return categoria
