# MiLove Monorepo (Frontend + Backend)

Este directorio contiene ambas aplicaciones:

- `app-frontend` → PWA React/Vite
- `app-backend` → API Node.js/Express + PostgreSQL (Supabase)

## Estructura

```text
miLove/
├── app-frontend/
└── app-backend/
```

## Levantar todo en local

1. Backend

```bash
cd app-backend
npm install
npm run db:init
npm run dev
```

2. Frontend (en otra terminal)

```bash
cd app-frontend
npm install
npm run dev
```

## Puertos por defecto

- Backend: `http://localhost:4000`
- Frontend: `http://localhost:5173`

## Variables clave

- Frontend: `app-frontend/.env`
  - `VITE_API_BASE_URL=http://localhost:4000/api`
  - `VITE_USE_MOCKS=false`
- Backend: `app-backend/.env`
  - `DATABASE_URL=...`
  - `JWT_SECRET=...`
  - `JWT_REFRESH_SECRET=...`
  - `CORS_ORIGIN=http://localhost:5173`
