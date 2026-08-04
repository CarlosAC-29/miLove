# MiLove Backend

Backend Node.js + TypeScript con PostgreSQL (Supabase) siguiendo Modular Clean Architecture.
El manejo de autenticación y usuarios se delega a **Supabase Auth**; la app guarda el perfil en `profiles`.

## Requisitos

- Node.js 20+
- npm

## Estructura

```text
src/
├── app/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── couples/
│   ├── finance/
│   └── recommendations/
├── shared/
├── infrastructure/
├── config/
└── database/
```

## Variables de entorno

Copiar `.env.example` a `.env` y configurar:

- `PORT`
- `CORS_ORIGIN` (uno o varios orígenes separados por coma)
- `DATABASE_URL` (Supabase Postgres)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (para generar sugerencias con Gemini)
- `GEMINI_MODEL` (opcional, por defecto `gemini-2.5-flash`)

## Inicio rápido

```bash
npm install
npm run db:init
npm run dev
```

Servidor local: `http://localhost:4000`
Swagger UI local: `http://localhost:4000/api/docs`

## Swagger (OpenAPI)

- UI interactiva: `GET /api/docs`
- Especificación JSON: `GET /api/docs/openapi.json`

## Scripts

- `npm run dev` iniciar en desarrollo
- `npm run dev:local` iniciar en desarrollo con nodemon
- `npm run build` compilar TS
- `npm run start` ejecutar build
- `npm run db:init` ejecutar migraciones pendientes
- `npm run db:migrate` ejecutar migraciones pendientes
- `npm run db:migrate:down` revertir la última migración aplicada

## Migraciones

Las migraciones viven en `src/database/migrations`:

- `*.up.sql` aplica cambios
- `*.down.sql` revierte cambios

Comandos:

```bash
npm run db:init
npm run db:migrate
npm run db:migrate:down
```

- `db:init` aplica migraciones pendientes
- `db:migrate` aplica migraciones pendientes
- `db:migrate:down` revierte solo la última migración aplicada
- `supabase db push` Enviar cambios de supabase

Migración inicial incluida:

- `0001_initial_schema.up.sql`
- `0001_initial_schema.down.sql`
- `0002_supabase_auth.up.sql`
- `0002_supabase_auth.down.sql`

## Endpoints (prefijo `/api`)

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/session`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/oauth/google`
- `POST /auth/oauth/apple`

### Users
- `GET /users/me`

### Couples
- `GET /couples`
- `POST /couples`
- `POST /couples/:coupleId/members`

### Finance
- `GET /finance/transactions?context=personal|household`
- `POST /finance/transactions`
- `PATCH /finance/transactions/:id`
- `DELETE /finance/transactions/:id`
- `GET /finance/summary?context=personal|household`
- `GET /finance/budgets?context=personal|household`
- `POST /finance/budgets`
- `GET /finance/goals?context=personal|household`
- `POST /finance/goals`
- `GET /finance/household`
- `PATCH /finance/household/contributions/:memberId`
- `GET /finance/insights?context=personal|household`

### Recommendations
- `GET /recommendations/context`
- `PUT /recommendations/context`
- `POST /recommendations/suggestions/generate`
- `GET /recommendations/suggestions?status=all|accepted|pending`
- `POST /recommendations/suggestions/accept`
- `GET /recommendations/ai`

### Docs
- `GET /docs`
- `GET /docs/openapi.json`
