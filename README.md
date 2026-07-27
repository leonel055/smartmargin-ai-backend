# SmartMargin AI — Backend

API REST para el sistema de gestión de negocios SmartMargin AI. Express.js + Sequelize ORM + PostgreSQL.

**Repositorio del backend** · [Frontend (Angular 19)](https://github.com/leonel055/smartmargin-ai-frontend)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js |
| Framework | Express 5 |
| ORM | Sequelize |
| Base de datos | PostgreSQL |
| Auth | JWT + bcrypt |
| Pagos | MercadoPago |
| IA | Google Gemini API |
| Monitoreo | Sentry |
| Bot | Telegram (Reportero) |
| Docs | Swagger |

---

## Estructura

```
server.js                  # Entry point, CORS, rutas, middleware
src/
├── config/
│   └── database.js        # Conexión Sequelize + PostgreSQL
├── controllers/           # Lógica de negocio por módulo
├── middlewares/
│   ├── auditLog.js        # Registro de acciones (CREATE, UPDATE, DELETE, LOGIN)
│   ├── csrf.js            # Protección CSRF
│   └── security.js        # Headers de seguridad
├── models/                # Modelos Sequelize (Usuario, Sucursal, Producto, etc.)
├── routes/                # 17 módulos de rutas
├── services/              # Servicios externos (Gemini, Telegram, etc.)
├── validators/            # Validación de entrada
├── agents/                # Agentes IA (Reportero Telegram)
migrations/                # Migraciones de la DB
seeders/                   # Datos iniciales
tests/                     # Tests
```

---

## Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Login con JWT |
| POST | `/api/auth/register` | Registro (con código de invitación) |
| GET | `/api/sucursales` | Listar sucursales |
| GET | `/api/productos` | Listar productos |
| GET | `/api/inventario/:sucursalId` | Inventario por sucursal |
| POST | `/api/transacciones` | Crear venta/compra |
| GET | `/api/gastos` | Listar gastos |
| GET | `/api/auditoria` | Auditoría del sistema |
| GET | `/api/dolar/cotizacion` | Cotización del dólar (API externa) |
| POST | `/api/reportes/generar` | Generar reporte IA |

> Documentación Swagger disponible en `/api-docs` cuando el servidor está corriendo.

---

## Variables de entorno

Copiá `.env.example` como `.env` y completá los valores:

```bash
cp .env.example .env
```

Ver `.env.example` para la lista completa.

---

## Cómo ejecutar en local

```bash
git clone https://github.com/leonel055/smartmargin-ai-backend.git
cd smartmargin-ai-backend
npm install

# Crear DB PostgreSQL (nombre default: smartmargin)
# Ejecutar migraciones
npx sequelize-cli db:migrate

# (Opcional) Cargar datos de prueba
npx sequelize-cli db:seed:all

# Iniciar servidor
npm start
```

El servidor arranca en `http://localhost:3000`.

---

## Roles del sistema

| Rol | Jerarquía |
|-----|-----------|
| Dueño | 1 — Acceso total |
| Administrador | 2 — CRUD sucursales, ver todo |
| Gerente | 3 — CRUD productos, transacciones, gastos |
| Empleado Comercial | 4 — Ver productos, crear transacciones |
| Empleado Operativo | 5 — Ver productos, gastos |

---

## Despliegue (Render)

1. Crear cuenta en [render.com](https://render.com)
2. Nuevo **Web Service** → conectar repo `smartmargin-ai-backend`
3. Configurar env vars:
   - `DATABASE_URL` → URL de PostgreSQL (Render Database o externa)
   - `JWT_SECRET` → secreto para firmar tokens
   - `ALLOWED_ORIGINS` → URL de tu frontend
   - Demás variables según `.env.example`
4. Deploy automático al hacer push a `main`
