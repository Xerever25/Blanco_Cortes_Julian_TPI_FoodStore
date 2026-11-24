from collections.abc import Callable
from types import TracebackType

from sqlmodel import Session

from app.core.database import session_factory as default_session_factory


class UnitOfWork:
    """Unidad de trabajo: una sesión y una transacción por bloque `with`.

    - `__enter__` abre la sesión y crea los repositorios que la comparten.
    - `__exit__` hace commit si el bloque terminó bien, rollback si lanzó una excepción,
      y siempre cierra la sesión. Es el único lugar donde se confirma una transacción.
    """

    session: Session

    def __init__(self, session_factory: Callable[[], Session] = default_session_factory) -> None:
        self._session_factory = session_factory

    def _init_repositories(self) -> None:
        """Los Unit of Work de cada módulo la redefinen para exponer sus repositorios."""

    def __enter__(self) -> "UnitOfWork":
        self.session = self._session_factory()
        self._init_repositories()
        return self

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type is None:
                self.session.commit()
            else:
                self.session.rollback()
        except BaseException:
            self.session.rollback()
            raise
        finally:
            self.session.close()
