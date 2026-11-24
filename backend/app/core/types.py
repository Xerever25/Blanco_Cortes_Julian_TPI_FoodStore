from datetime import datetime, timezone
from typing import Annotated

from pydantic import AfterValidator


def utcnow() -> datetime:
    """Fecha y hora actuales en UTC, con zona horaria (SQLModel exige fechas con zona al guardar)."""
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


# Las fechas se guardan en UTC; en la respuesta JSON salen con zona horaria explícita
# para que el navegador las muestre en la hora local del usuario.
UTCDatetime = Annotated[datetime, AfterValidator(_as_utc)]
