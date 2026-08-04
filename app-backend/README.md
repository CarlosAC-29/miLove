# MiLove Backend

Backend Node.js + TypeScript con PostgreSQL (Supabase) siguiendo Modular Clean Architecture.

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
- `CORS_ORIGIN`
- `DATABASE_URL` (Supabase Postgres)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

## Inicio rápido

```bash
npm install
npm run db:init
npm run dev
```

Servidor local: `http://localhost:4000`

## Scripts

- `npm run dev` iniciar en desarrollo
- `npm run build` compilar TS
- `npm run start` ejecutar build
- `npm run db:init` aplicar `src/database/schema.sql`

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
- `GET /recommendations/ai`
