from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    # SQLite (desarrollo local o tests). En memoria hay que compartir una única conexión.
    from sqlalchemy.pool import StaticPool

    _kwargs: dict = {"connect_args": {"check_same_thread": False}}
    if settings.DATABASE_URL in ("sqlite://", "sqlite:///:memory:"):
        _kwargs["poolclass"] = StaticPool
    engine = create_engine(settings.DATABASE_URL, **_kwargs)
else:
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)


def create_all_tables() -> None:
    """Crea las tablas que todavía no existen. Importar app.modules registra los 5 modelos."""
    import app.modules  # noqa: F401

    SQLModel.metadata.create_all(engine)


def session_factory() -> Session:
    """Crea una sesión nueva. `expire_on_commit=False` mantiene legibles los objetos tras el commit."""
    return Session(engine, expire_on_commit=False)
