# Proyecto Podologia - Rebuild Fullstack

Esta version reorganiza el sitio actual en una base fullstack profesional con:

- `frontend/`: React + Vite + Tailwind + React Router.
- `backend/`: Express + Prisma + MySQL + JWT.
- `docs/ARCHITECTURE.md`: arquitectura, endpoints, esquema y roadmap.
- `docs/CHECKLIST.md`: estado actual, checklist de continuidad y proximos pasos recomendados.

## Variables de entorno

Copiar:

- `frontend/.env.example` -> `frontend/.env`
- `backend/.env.example` -> `backend/.env`

## Entorno local completo

### Servicios locales

- MySQL 8 por Docker en `localhost:3307`
- Adminer en `http://localhost:8080`
- Frontend Vite en `http://localhost:5173`
- Backend Express en `http://localhost:4000`

### Credenciales locales

- Base de datos: `podologia_app`
- Credenciales y secretos locales: definidos en `backend/.env`
- Archivo versionado de referencia: `backend/.env.example`

### Comandos

- Levantar DB: `npm run db:up`
- Generar Prisma client: `npm run prisma:generate`
- Migrar DB: `npm run prisma:migrate`
- Seed: `npm run prisma:seed`
- Frontend: `npm run dev:frontend`
- Backend: `npm run dev:backend`

## Pasos sugeridos

1. Abrir Docker Desktop.
2. Ejecutar `npm run db:up`.
3. Ejecutar `npm run prisma:generate`.
4. Ejecutar `npm run prisma:migrate`.
5. Ejecutar `npm run prisma:seed`.
6. Levantar backend y frontend.

## Nota

El sitio estatico original permanece en la raiz como referencia visual durante la migracion.
