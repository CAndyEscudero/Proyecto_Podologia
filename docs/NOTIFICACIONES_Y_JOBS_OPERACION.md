# Notificaciones y Jobs

## Objetivo

Operar notificaciones y tareas programadas del SaaS sin depender de acciones manuales del usuario final.

## Notificaciones cubiertas en v1

- reserva pendiente de pago
- pago aprobado
- pago rechazado
- turno reprogramado
- turno cancelado
- recordatorio de turno confirmado

## Canal actual

En v1 el canal automatico real es email transaccional.

Condiciones para que un tenant envie emails:

- `transactionalEmailEnabled = true`
- proveedor global configurado
- paciente con email cargado

## Jobs activos

### 1. Expiracion de reservas pendientes

- corre en background
- procesa tenant por tenant
- vence reservas `PENDING` con `paymentExpiresAt < now`
- deja el turno en `status = CANCELED` y `paymentStatus = EXPIRED`

### 2. Recordatorios

- corre en background
- procesa tenant por tenant
- busca turnos `CONFIRMED`
- usa `reminderDueAt` persistido en la base
- evita duplicados con:
  - `reminderProcessedAt`
  - `reminderSentAt`
  - `reminderSendAttempts`
  - `reminderLastAttemptAt`

## Reintentos

Los reminders tienen reintentos controlados:

- maximo configurable por `APPOINTMENT_REMINDER_MAX_ATTEMPTS`
- espera minima configurable por `APPOINTMENT_REMINDER_RETRY_DELAY_MINUTES`

Si el reminder ya no tiene sentido porque el turno ya empezo:

- se cierra sin envio
- queda `reminderProcessedAt`
- se registra el error `appointment_already_started`

## Variables de entorno relevantes

- `JOBS_ENABLED`
- `PENDING_RESERVATIONS_JOB_INTERVAL_MS`
- `APPOINTMENT_REMINDER_JOB_INTERVAL_MS`
- `APPOINTMENT_REMINDER_LEAD_MINUTES`
- `APPOINTMENT_REMINDER_RETRY_DELAY_MINUTES`
- `APPOINTMENT_REMINDER_MAX_ATTEMPTS`

## Comandos utiles

Desde `backend/`:

```bash
npm run jobs:run-once
```

Solo expiraciones:

```bash
npm run jobs:run-once -- expirations
```

Solo reminders:

```bash
npm run jobs:run-once -- reminders
```

## Notas operativas

- los jobs arrancan junto con `src/server.js`
- si `JOBS_ENABLED=false`, no se levantan
- el reminder se recalcula cuando un turno confirmado cambia de fecha/hora o pasa a otro estado
- si un turno deja de estar `CONFIRMED`, el estado del reminder se resetea
