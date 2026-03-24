# Pruebas locales de Mercado Pago

## Estado actual

La app ya tiene:

- reserva pendiente con sena del 50%
- creacion de preferencia en backend
- redireccion a Checkout Pro
- ruta de retorno en frontend
- webhook backend para actualizar el turno

Para probar de punta a punta en local todavia hacen falta dos cosas:

1. credenciales de prueba cargadas en `backend/.env`
2. una URL publica HTTPS para que Mercado Pago pueda llegar al backend local

## Variables que tenes que completar

En `backend/.env`:

```env
APP_BASE_URL=http://localhost:5173
API_BASE_URL=https://tu-tunel-publico.ngrok-free.dev
MP_ACCESS_TOKEN=TEST-...
MP_PUBLIC_KEY=TEST-...
MP_WEBHOOK_SECRET=
MP_SUCCESS_URL=https://tu-tunel-publico.ngrok-free.dev/api/payments/return/success
MP_PENDING_URL=https://tu-tunel-publico.ngrok-free.dev/api/payments/return/pending
MP_FAILURE_URL=https://tu-tunel-publico.ngrok-free.dev/api/payments/return/failure
```

En `frontend/.env`:

```env
VITE_MP_PUBLIC_KEY=TEST-...
```

## Flujo de prueba recomendado

1. Levantar Docker, backend y frontend.
2. Exponer el backend con un tunel HTTPS.
3. Reemplazar `API_BASE_URL` por la URL publica del tunel.
4. Reiniciar backend.
5. Crear una reserva desde `/reservas`.
6. Completar el pago de prueba en Mercado Pago.
7. Verificar:
   - retorno del navegador a `/reservas/resultado`
   - webhook recibido en backend
   - turno actualizado en base de datos
   - admin mostrando pago pendiente o aprobado

## Tunel local

Podes usar cualquiera de estas opciones:

- `ngrok http 4000`
- `cloudflared tunnel --url http://localhost:4000`

Cuando tengas la URL publica, por ejemplo:

```env
API_BASE_URL=https://abcd-1234.ngrok-free.app
```

el webhook efectivo queda en:

```text
https://abcd-1234.ngrok-free.app/api/payments/webhook

Las `back_urls` tambien pueden salir por ese mismo backend publico y redirigir despues al frontend local:

```text
https://abcd-1234.ngrok-free.app/api/payments/return/success
https://abcd-1234.ngrok-free.app/api/payments/return/pending
https://abcd-1234.ngrok-free.app/api/payments/return/failure
```
```

## Verificacion minima

Despues de pagar, el turno deberia pasar idealmente a:

- `status = CONFIRMED`
- `paymentStatus = APPROVED`

Si el pago queda pendiente:

- `status = PENDING`
- `paymentStatus = PENDING`

## Bloqueos conocidos

- sin `MP_ACCESS_TOKEN` no se puede crear la preferencia
- sin tunel publico Mercado Pago no puede llamar al webhook local
- en Windows, Prisma a veces falla con `schema-engine EPERM`, pero la migracion ya fue aplicada
