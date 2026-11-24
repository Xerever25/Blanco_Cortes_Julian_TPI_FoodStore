# Food Store — Trabajo Práctico Integrador (Programación 4, UTN)

Sistema de pedidos de comida: catálogo público, carrito, checkout, seguimiento de pedidos y panel de administración.

- **Backend:** FastAPI + SQLModel + PostgreSQL (SQLite opcional en desarrollo), arquitectura por capas `Router → Service → UnitOfWork → Repository → Model`.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind 4, TanStack Query / Form / Table, Zustand y Axios.

- **Repositorio:** `<COMPLETAR: URL del repositorio de GitHub>`
- **Video de presentación:** `<COMPLETAR: link al video>`
- **Autor:** Julián Blanco Cortés

## Requisitos

- Python 3.11+
- Node.js 20+ y [pnpm](https://pnpm.io/)
- PostgreSQL 14+ (o SQLite para desarrollo rápido)

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # y editar los valores
python -m app.db.seed              # crea tablas + datos iniciales
uvicorn app.main:app --reload --port 8000
```

Documentación interactiva: http://localhost:8000/docs

### Variables de entorno (`backend/.env`)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | `postgresql+psycopg2://usuario:clave@localhost:5432/foodstore` o `sqlite:///./foodstore.db` |
| `SECRET_KEY` | Clave para firmar el JWT (mínimo 32 caracteres) |
| `ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Duración del token |
| `FRONTEND_ORIGIN` | Origen permitido por CORS (`http://localhost:5173`) |
| `COOKIE_SECURE` | `true` solo si se sirve por HTTPS |

Para PostgreSQL crear antes la base: `createdb foodstore`.

### Usuario administrador inicial

El seed crea `admin` / `Admin1234!` (cambiar la contraseña fuera de desarrollo), 4 categorías y 9 productos.

### Tests

```bash
pip install -r requirements-dev.txt
pytest
```

## Frontend

```bash
cd frontend
pnpm install
cp .env.example .env               # VITE_API_URL=http://localhost:8000/api/v1
pnpm dev                           # http://localhost:5173
pnpm build                         # build de producción
```

## Decisiones de diseño

- **Autenticación:** JWT en cookie `HttpOnly` (`access_token`); el frontend nunca ve el token. Axios usa `withCredentials` y un interceptor 401 limpia la sesión.
- **Roles:** `admin` y `cliente`; control en backend (`require_role`) y en el frontend (`ProtectedRoute`).
- **Unit of Work:** cada operación de servicio abre una transacción única con commit/rollback; crear o cancelar un pedido es atómico.
- **Pedidos:** `DetallePedido` copia nombre y precio del producto; el stock se bloquea con `SELECT … FOR UPDATE` procesando los ítems ordenados por `producto_id`. Estados: `PENDIENTE → EN_PREPARACION → ENTREGADO`; se puede cancelar desde `PENDIENTE` o `EN_PREPARACION` (restituye stock).
- **Bajas lógicas** en categorías, productos y usuarios.
- **Estado del cliente:** carrito en Zustand (persistido), datos del servidor con TanStack Query.

## Estructura

```
backend/app/{core,modules/{auth,usuarios,categorias,productos,pedidos},db}
frontend/src/{features,shared,store,routes}
```
