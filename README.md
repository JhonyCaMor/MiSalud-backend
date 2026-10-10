# MiSalud Backend

API para la cadena de droguerías **MiSalud** — NestJS + TypeScript + TypeORM + PostgreSQL.

## Requisitos

- Node.js 20+ (probado con Node 24)
- PostgreSQL 16 (instalado y corriendo como servicio)
- Visual Studio Code
- Postman (para pruebas)

## Ubicación del proyecto

```
C:\Users\DELL\MiSalud\misalud-backend
```

## Estructura de carpetas

```
misalud-backend/
├── docs/
│   └── postman/
│       └── MiSalud.postman_collection.json   # Colección para importar en Postman
├── src/
│   ├── config/
│   │   ├── configuration.ts                  # Variables de entorno tipadas
│   │   └── typeorm-cli.config.ts             # DataSource para seed/migraciones
│   ├── common/
│   │   ├── decorators/                       # @Roles, @Public, @CurrentUser
│   │   ├── enums/role.enum.ts                # super_admin | supervisor | vendedor
│   │   ├── guards/                           # JwtAuthGuard + RolesGuard (globales)
│   │   ├── interfaces/                       # Payload JWT y usuario autenticado
│   │   └── utils/scope.util.ts               # Reglas de alcance por rol
│   ├── database/
│   │   └── seed.ts                           # Ciudades + 10 sucursales + usuarios demo
│   ├── modules/
│   │   ├── auth/        # login JWT, /me, cambio de contraseña
│   │   ├── users/       # CRUD con límites por rol
│   │   ├── branches/    # sucursales con alcance por rol
│   │   └── cities/      # ciudades (gestión solo super_admin)
│   ├── app.module.ts                          # Guards globales + TypeORM
│   └── main.ts                                # Swagger + ValidationPipe + prefijo /api
├── .env / .env.example
├── tsconfig.seed.json
└── package.json
```

## Puesta en marcha

```bash
# 1. Configurar variables de entorno (ajusta la contraseña de PostgreSQL)
copy .env.example .env

# 2. Crear la base de datos (una sola vez)
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE misalud"

# 3. Crear esquema e insertar datos iniciales
npm run seed

# 4. Arrancar en modo desarrollo (watch)
npm run start:dev

# URL: http://localhost:3001/api
# Swagger: http://localhost:3001/api/docs
```

> El puerto es **3001** (el 3000 está ocupado por otra app). Cámbialo en `.env` → `PORT`.

## Comandos útiles

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Arranque con recarga automática |
| `npm run build` | Compilar a `dist/` |
| `npm run lint` | ESLint con autofix |
| `npm run seed` | Crear ciudades, sucursales y usuarios demo (idempotente) |
| `npm run typeorm -- migration:generate src/database/migrations/X` | Generar migraciones |
| `npm test` | Tests unitarios (Jest) |

## Roles y límites de acceso

| Acción | super_admin | supervisor | vendedor |
|---|---|---|---|
| Listar ciudades | Todas (6) | Solo su ciudad | 403 |
| Crear/editar/eliminar ciudades | ✔ | 403 | 403 |
| Listar sucursales | Todas (10) | Solo de su ciudad | Solo su sucursal |
| Crear/editar/eliminar sucursales | ✔ | 403 | 403 |
| Listar usuarios | Todos | Solo vendedores de su ciudad | 403 |
| Crear super_admin / supervisor | ✔ | 403 | 403 |
| Crear vendedor | En cualquier sucursal | Solo en sucursales de su ciudad | 403 |
| Editar/eliminar vendedor | Cualquiera | Solo de su ciudad | 403 |
| Resetear contraseñas | Cualquiera | Solo vendedores de su ciudad | 403 |
| Ver su perfil (`/auth/me`) | ✔ | ✔ | ✔ |
| Cambiar su propia contraseña | ✔ | ✔ | ✔ |

**Reglas de asignación** (validadas al crear usuarios):

- `super_admin` → sin ciudad ni sucursal asignada.
- `supervisor` → **requiere `cityId`**; su alcance son todas las sucursales de esa ciudad.
- `vendedor` → **requiere `branchId`**; su alcance es únicamente esa sucursal.

**Política de contraseña:** mínimo 8 caracteres, al menos 1 mayúscula y 1 número.

## Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/health` | público |
| POST | `/api/auth/login` | público |
| GET | `/api/auth/me` | autenticado |
| PATCH | `/api/auth/password` | autenticado (su propia contraseña) |
| GET | `/api/cities` | super_admin, supervisor |
| POST/PATCH/DELETE | `/api/cities` | super_admin |
| GET | `/api/branches` | todos (filtrado por rol) |
| GET | `/api/branches/:id` | todos (verifica alcance) |
| GET | `/api/branches/:id/vendedores` | super_admin, supervisor |
| POST/PATCH/DELETE | `/api/branches` | super_admin |
| GET | `/api/users` | super_admin, supervisor |
| POST | `/api/users` | super_admin, supervisor |
| PATCH/DELETE | `/api/users/:id` | super_admin, supervisor |
| PATCH | `/api/users/:id/password` | super_admin, supervisor |

## Datos iniciales (seed)

**6 ciudades / 10 sucursales:**

| Ciudad | Sucursales |
|---|---|
| Cali | MiSalud Cali Centro, MiSalud Cali Norte |
| Palmira | MiSalud Palmira Centro, MiSalud Palmira Norte |
| Candelaria | MiSalud Candelaria |
| Yumbo | MiSalud Yumbo Centro, MiSalud Yumbo Industrial, MiSalud Yumbo Sur |
| Guacarí | MiSalud Guacarí |
| Buga | MiSalud Buga Centro |

**Usuarios de prueba:**

| Email | Contraseña | Rol |
|---|---|---|
| superadmin@misalud.com | Admin123! | super_admin |
| supervisor.cali@misalud.com | Supervisor123! | supervisor (Cali) |
| supervisor.palmira@misalud.com | Supervisor123! | supervisor (Palmira) |
| vendedor.cali@misalud.com | Vendedor123! | vendedor (Cali Centro) |
| vendedor.palmira@misalud.com | Vendedor123! | vendedor (Palmira Centro) |

## Pruebas con Postman

1. Abre Postman → **Import** → selecciona `docs/postman/MiSalud.postman_collection.json`.
2. La variable `baseUrl` ya apunta a `http://localhost:3001/api`.
3. Ejecuta primero los requests **Login** (carpeta 1): guardan los tokens automáticamente en variables de colección (`token_admin`, `token_supervisor`, `token_vendedor`).
4. Los demás requests usan el token correspondiente; los que prueban límites están marcados con `(403)` en el nombre.

También puedes usar la UI interactiva en `http://localhost:3001/api/docs` (Swagger).

## Variables de entorno (`.env`)

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | 3001 |
| `DB_HOST` / `DB_PORT` | PostgreSQL | localhost / 5432 |
| `DB_USER` / `DB_PASSWORD` | Credenciales | postgres / postgres |
| `DB_NAME` | Base de datos | misalud |
| `JWT_SECRET` | Secreto para firmar tokens | dev-secret... |
| `JWT_EXPIRES_IN` | Vigencia del token | 8h |

> **Producción:** cambia `JWT_SECRET`, la contraseña de BD y desactiva `synchronize: true` en `app.module.ts` usando migraciones (`npm run typeorm`).
