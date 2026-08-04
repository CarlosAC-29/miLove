# MiLove Frontend

Frontend PWA de MiLove construido con React + TypeScript + Vite + TanStack Router.

## Requisitos

- Node.js 20+
- npm

## Variables de entorno

Copiar `.env.example` a `.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api
VITE_USE_MOCKS=false
VITE_API_TIMEOUT_MS=15000
```

## Scripts

- `npm run dev` iniciar frontend en desarrollo (`http://localhost:5173`)
- `npm run build` compilar producción
- `npm run preview` previsualizar build
- `npm run lint` lint del proyecto

## Integración con backend

El frontend consume el backend vía `src/services/api/client.ts` y usa:

- `Authorization: Bearer <accessToken>` automático.
- Endpoints bajo `VITE_API_BASE_URL`.
- Flujo auth: login/register/logout/session/refresh.

## Estructura principal

```text
src/
├── app/
├── pages/
├── widgets/
├── features/
├── entities/
├── services/
└── shared/
```
