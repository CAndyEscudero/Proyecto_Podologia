# Fase 11 - Calidad y Seguridad

## Objetivo de este bloque

Empezar a validar de forma automatizada los puntos de seguridad que mas pueden romper un SaaS multi-tenant:

- tenant correcto por host
- bloqueo de acceso cruzado entre negocios
- admin solo en subdominio de plataforma
- CORS coherente con dominios locales y productivos
- webhooks de pagos atados al `tenantId` correcto

## Lo que se implemento

### 1. Setup de tests backend sin dependencias nuevas

Se uso el runner nativo de Node:

- `backend/package.json`
- comando: `npm test`

Importante:

- se corre con `--test-isolation=none` porque en este entorno el modo por procesos daba `spawn EPERM`

### 2. Tests agregados

- `backend/tests/cors-config.test.js`
  - valida origins permitidos
  - valida `localhost`, `127.0.0.1` y `*.localhost`
  - valida rechazo de origins no permitidos

- `backend/tests/resolve-tenant.test.js`
  - resuelve tenant activo por host
  - devuelve 404 si el dominio no existe
  - usa fallback local en desarrollo
  - bloquea tenant inactivo
  - acepta dominio custom activo

- `backend/tests/auth-middleware.test.js`
  - permite acceso cuando token, usuario y tenant coinciden
  - bloquea acceso cruzado entre tenants
  - bloquea admin fuera del subdominio de plataforma

- `backend/tests/payments-security.test.js`
  - valida firma correcta de webhook de Mercado Pago
  - rechaza firma invalida

- `backend/tests/payments-controller.test.js`
  - verifica que el webhook procese usando el `tenantId` recibido en el callback

- `backend/tests/services-clients-isolation.test.js`
  - valida aislamiento por tenant en `services`
  - valida aislamiento por tenant en `clients`

- `backend/tests/appointments-booking.test.js`
  - valida que el booking simple use el `tenantId` correcto
  - valida que la reserva con pago use config, cliente, appointment, email y pago dentro del tenant correcto

## Refactor chico hecho para testear mejor

Se extrajo la logica de CORS a:

- `backend/src/middleware/cors-config.js`

Esto permite probar reglas de dominios sin levantar Express entero.

## Cobertura real lograda en esta etapa

### Seguridad

- acceso cruzado entre tenants: cubierto
- JWT + tenant en admin: cubierto
- admin fuera de host de plataforma: cubierto
- CORS y dominios: cubierto
- webhook de pagos por tenant: cubierto

### Testing

- resolucion de tenant por host: cubierto
- login multi-tenant: cubierto a nivel middleware/auth
- aislamiento de datos en services/clients: cubierto
- booking por tenant: cubierto
- pagos por tenant: cubierto en webhook controller + firma
- dominio custom: cubierto en tenant resolution

## Lo que todavia falta

- tests mas amplios de dominio custom end-to-end
- pruebas integradas contra DB real

## Comando de verificacion

Desde `backend/`:

- `npm test`
