# Observabilidad y Operacion - SaaS Multi-Tenant

## Objetivo

Tener una base minima de observabilidad para operar muchos tenants sin entrar a ciegas cuando algo falla.

La idea de esta etapa no es montar un stack enterprise.
La idea es poder responder rapido estas preguntas:

- que request fallo
- en que tenant paso
- con que dominio entro
- si fue backend o frontend
- si el problema estuvo en pagos, dominios, onboarding o jobs

## 1. Logging backend

### Que se implemento

- logger estructurado JSON en `backend/src/observability/logger.js`
- `requestId` por request en `backend/src/middleware/request-context.js`
- logging automatico de request/response en `backend/src/middleware/request-logger.js`
- logging centralizado de errores HTTP en `backend/src/middleware/error-handler.js`

### Campos claves

Los logs importantes incluyen, cuando aplica:

- `requestId`
- `tenantId`
- `hostname`
- `requestedHostname`
- `domainType`
- `userId`
- `method`
- `path`
- `statusCode`
- `durationMs`

### Variables de entorno

- `LOG_LEVEL=debug|info|warn|error`
- `FRONTEND_ERROR_LOGGING_ENABLED=true|false`

## 2. Monitoreo de errores frontend

### Que se implemento

- reporter global en `frontend/src/shared/observability/frontend-error-reporter.tsx`
- captura:
  - `window.error`
  - `unhandledrejection`
- endpoint backend:
  - `POST /api/observability/frontend-errors`

### Como funciona

- el frontend manda el error con `x-tenant-host`
- backend resuelve el tenant por host
- el evento queda logueado como `frontend.error.reported`

### Nota operativa

Si no queres recibir ese ruido temporalmente:

- backend: `FRONTEND_ERROR_LOGGING_ENABLED=false`
- frontend: `VITE_FRONTEND_ERROR_LOGGING_ENABLED=false`

## 3. Eventos operativos cubiertos

### Resolucion de tenant / dominio

El middleware `resolve-tenant` ya registra:

- host no resoluble
- dominio no encontrado
- dominio inactivo
- tenant inactivo
- excepciones inesperadas

### Pagos / webhooks

`payments.audit` deja trazabilidad para:

- webhook recibido
- webhook ignorado
- webhook duplicado
- webhook procesado
- reservas expiradas
- creacion de preferencia

Importante: el controller de webhook ahora inyecta `tenantId` en el contexto del request para que el `request-logger` y el `error-handler` tambien queden correlacionados por tenant.

### Onboarding

`tenant_onboarding.audit` registra:

- inicio de alta
- alta completada
- error del CLI de onboarding

### Dominios custom

`tenant_domains.audit` registra:

- alta/reemplazo de dominio custom
- verificacion DNS
- cambio de dominio principal

## 4. Herramientas internas de soporte

### 4.1 Alta de tenant

Script:

- `npm run tenant:onboard -- --input backend/scripts/tenant-onboarding.example.json`
- `npm run tenant:onboard -- --input backend/scripts/tenant-onboarding.example.json --dry-run`

Sirve para:

- alta operativa interna
- revisar payload antes de tocar DB

### 4.2 Inspeccion de tenant

Script:

- `npm run tenant:inspect -- --slug pies-sanos-venado`
- `npm run tenant:inspect -- --hostname turnos.cliente.com`
- `npm run tenant:inspect -- --email owner@cliente.com`

Devuelve:

- datos del tenant
- dominios y dominio principal
- estrategia SSL
- resumen de settings
- estado de integraciones
- usuarios
- contadores de datos

### 4.3 Jobs manuales

Script:

- `npm run jobs:run-once`

Sirve para:

- probar ejecucion manual
- destrabar diagnostico de reminders/expiraciones

## 5. Playbook de soporte rapido

### Caso A - Un negocio dice “mi dominio no anda”

1. correr `tenant:inspect` por `--slug` o `--hostname`
2. revisar:
   - `domains.primaryDomain`
   - `domains.customDomain.status`
   - `domains.platformDomain`
3. buscar logs:
   - `tenant.resolve.failed`
   - `tenant_domains.audit`

### Caso B - Un negocio dice “no me entran pagos”

1. correr `tenant:inspect`
2. revisar en `settings.integrations`:
   - `mercadoPagoEnabled`
   - `mercadoPagoConfigured`
3. buscar logs:
   - `payments.audit`
   - `http.error`
   - `http.request.failed`

### Caso C - Un negocio dice “no llegan mails”

1. revisar `transactionalEmailEnabled`
2. revisar `transactionalEmailConfigured`
3. buscar:
   - `emails.audit`
   - `frontend.error.reported` si el problema fue UX
   - `jobs.audit` si el mail dependia de un reminder

### Caso D - Fallo el alta de un tenant

1. reintentar con `--dry-run`
2. corregir input JSON
3. revisar logs:
   - `tenant.onboarding.cli.failed`
   - `tenant_onboarding.audit`

## 6. Limites actuales de esta fase

Todavia no hay:

- panel interno de observabilidad
- integracion con Sentry/Datadog/New Relic
- dashboards historicos
- alertas automaticas
- panel `SUPER_ADMIN`

Esta fase deja una base seria para operar, pero no reemplaza una plataforma completa de monitoreo.
