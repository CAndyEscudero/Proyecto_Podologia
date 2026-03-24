# Checklist de Implementacion - Mercado Pago

## Objetivo

Implementar reserva con seña del 50% usando Mercado Pago, de forma segura, progresiva y sin romper la logica actual de turnos y disponibilidad.

## 1. Preparacion y criterios

- [x] Confirmar regla de negocio exacta:
  - [x] la seña sera el 50% del `priceCents`
  - [x] definir que pasa si un servicio no tiene precio
  - [x] definir si el turno queda pendiente hasta webhook aprobado
- [ ] Confirmar experiencia esperada:
  - [ ] el usuario elige servicio, fecha y horario
  - [ ] completa datos
  - [ ] ve total, seña y saldo
  - [ ] hace click en `Reservar turno`
  - [ ] va a Mercado Pago
  - [ ] vuelve con resultado
- [x] Confirmar criterio de disponibilidad:
  - [x] no confirmar definitivamente el turno antes del pago aprobado
  - [x] definir si se crea una reserva temporal o un turno `PENDING_PAYMENT`

## 2. Variables de entorno

- [x] Agregar en `backend/.env.example`:
  - [x] `MP_ACCESS_TOKEN`
  - [x] `MP_PUBLIC_KEY` si hiciera falta en frontend
  - [x] `MP_WEBHOOK_SECRET` si implementamos validacion
  - [x] `MP_SUCCESS_URL`
  - [x] `MP_PENDING_URL`
  - [x] `MP_FAILURE_URL`
  - [x] `APP_BASE_URL`
  - [x] `API_BASE_URL`
- [x] Confirmar en `frontend/.env.example` si el frontend necesita:
  - [x] `VITE_MP_PUBLIC_KEY`
  - [x] `VITE_API_URL`

## 3. Modelo de datos

- [x] Extender `Appointment` o crear tabla relacionada de pagos
- [x] Agregar al menos estos campos:
  - [x] `priceCents`
  - [x] `depositCents`
  - [x] `paymentStatus`
  - [x] `paymentProvider`
  - [x] `paymentReference`
  - [x] `paymentPreferenceId`
  - [x] `paymentApprovedAt`
  - [x] `paymentExpiresAt`
- [x] Evaluar enum de pago:
  - [x] `PENDING`
  - [x] `APPROVED`
  - [x] `REJECTED`
  - [x] `EXPIRED`
  - [x] `CANCELLED`
- [x] Separar estado del turno de estado del pago
- [ ] Crear migracion Prisma
- [ ] Actualizar seed si hace falta

## 4. Diseno de estados

- [x] Definir estados del turno con pago
- [ ] Documentar transiciones validas
- [x] Mantener separados:
  - [x] `appointment.status`
  - [x] `paymentStatus`

## 5. Backend de integracion Mercado Pago

- [x] Crear modulo nuevo:
  - [x] `backend/src/modules/payments/`
- [x] Crear helper o cliente de integracion Mercado Pago
- [x] Implementar creacion de preferencia
- [x] Implementar metadata para relacionar pago con turno
- [x] Guardar `preferenceId` y referencia externa
- [x] Agregar endpoint nuevo de reserva con pago
- [x] Agregar webhook:
  - [x] `POST /api/payments/webhook`
- [x] Validar pago consultando API de Mercado Pago desde backend
- [x] Actualizar turno solo desde webhook validado
- [ ] Agregar logs minimos de auditoria

## 6. Flujo de reserva backend

- [x] Revisar `createAppointment` actual
- [x] Crear endpoint nuevo, separado del flujo viejo
- [x] Validar slot
- [x] Calcular total y seña
- [x] Crear reserva/turno en estado pendiente
- [x] Crear preferencia de Mercado Pago
- [x] Devolver URL o `init_point`
- [x] Definir expiracion de reserva pendiente

## 7. Frontend publico

- [ ] Ajustar `BookingForm.tsx`
- [ ] En el ultimo paso mostrar:
  - [ ] precio total
  - [ ] seña 50%
  - [ ] saldo pendiente
- [ ] Cambiar CTA final por:
  - [ ] `Reservar turno`
- [ ] Llamar al endpoint nuevo del backend
- [ ] Redirigir a Mercado Pago
- [ ] Crear manejo de retorno:
  - [ ] pago aprobado
  - [ ] pago pendiente
  - [ ] pago rechazado
- [ ] Mostrar mensajes claros y no ambiguos

## 8. Admin

- [ ] Mostrar campos o badges nuevos en turnos:
  - [ ] estado de pago
  - [ ] seña
  - [ ] total
  - [ ] referencia de pago si sirve
- [ ] Permitir distinguir visualmente:
  - [ ] pendiente de pago
  - [ ] señado
  - [ ] confirmado
- [ ] Ajustar filtros si hace falta

## 9. Tipos y contratos

- [x] Extender tipos frontend:
  - [x] `Appointment`
  - [x] responses de booking
  - [x] tipos de pago
- [x] Extender contratos backend/frontend
- [ ] Evitar `any` en todo lo nuevo

## 10. Expiracion y liberacion de reservas

- [ ] Definir cuanto dura una reserva pendiente
- [ ] Guardar `paymentExpiresAt`
- [ ] Definir como se libera el horario si no se paga
- [ ] Implementar una primera estrategia simple de vencimiento

## 11. Seguridad

- [ ] Validar webhook correctamente
- [ ] No confiar en parametros del frontend para marcar pago aprobado
- [ ] Reconsultar estado del pago desde backend
- [ ] No exponer access token
- [ ] Registrar eventos importantes

## 12. Testing

- [ ] Tests backend del flujo de reserva con pago
- [ ] Tests de webhook
- [ ] Tests de expiracion/vencimiento
- [ ] E2E o scripts que validen:
  - [ ] creacion de reserva pendiente
  - [ ] retorno aprobado
  - [ ] retorno pendiente
  - [ ] retorno rechazado
  - [ ] que un pago fallido no deje turno confirmado
- [ ] Revisar regresion de disponibilidad

## 13. Orden recomendado de implementacion

- [ ] Documentar reglas de negocio y estados
- [ ] Extender schema Prisma y migrar DB
- [ ] Crear tipos y contratos de pago
- [ ] Crear modulo backend de pagos
- [ ] Crear endpoint de reserva con pago
- [ ] Crear webhook y confirmacion backend
- [ ] Ajustar booking UI
- [ ] Ajustar retorno de pago
- [ ] Ajustar admin
- [ ] Probar casos borde
- [ ] Recién despues pulir textos y UX

## 14. Primer bloque para arrancar

- [x] Agregar campos de pago al schema
- [x] Crear enums y estados
- [ ] Crear migracion Prisma
- [x] Crear estructura `modules/payments`
- [x] Agregar variables de entorno example
- [x] Crear contratos TypeScript de pago en frontend

## 15. Criterios de implementacion

- [x] Separar estado de turno y estado de pago
- [ ] Mantener la logica sensible en backend
- [ ] No romper el flujo actual hasta tener el nuevo funcionando
- [ ] Iterar por capas
- [ ] Dejar trazabilidad para admin
- [ ] Facilitar testeo y futuras integraciones
