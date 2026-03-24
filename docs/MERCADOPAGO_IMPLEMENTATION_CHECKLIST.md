# Checklist de Implementacion - Mercado Pago

## Objetivo

Implementar reserva con sena del 50% usando Mercado Pago, de forma segura, progresiva y sin romper la logica actual de turnos y disponibilidad.

## 1. Preparacion y criterios

- [x] Confirmar regla de negocio exacta:
  - [x] la sena sera el 50% del `priceCents`
  - [x] definir que pasa si un servicio no tiene precio
  - [x] definir si el turno queda pendiente hasta webhook aprobado
- [x] Confirmar experiencia esperada:
  - [x] el usuario elige servicio, fecha y horario
  - [x] completa datos
  - [x] ve total, sena y saldo
  - [x] hace click en `Reservar turno`
  - [x] va a Mercado Pago
  - [x] vuelve con resultado
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
- [x] Calcular total y sena
- [x] Crear reserva/turno en estado pendiente
- [x] Crear preferencia de Mercado Pago
- [x] Devolver URL o `init_point`
- [x] Definir expiracion de reserva pendiente

## 7. Frontend publico

- [x] Ajustar `BookingForm.tsx`
- [x] En el ultimo paso mostrar:
  - [x] precio total
  - [x] sena 50%
  - [x] saldo pendiente
- [x] Cambiar CTA final por:
  - [x] `Reservar turno`
- [x] Llamar al endpoint nuevo del backend
- [x] Redirigir a Mercado Pago
- [x] Crear manejo de retorno:
  - [x] pago aprobado
  - [x] pago pendiente
  - [x] pago rechazado
- [x] Mostrar mensajes claros y no ambiguos

## 8. Admin

- [ ] Mostrar campos o badges nuevos en turnos:
  - [ ] estado de pago
  - [ ] sena
  - [ ] total
  - [ ] referencia de pago si sirve
- [ ] Permitir distinguir visualmente:
  - [ ] pendiente de pago
  - [ ] senado
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
- [x] Guardar `paymentExpiresAt`
- [ ] Definir como se libera el horario si no se paga
- [ ] Implementar una primera estrategia simple de vencimiento

## 11. Seguridad

- [ ] Validar webhook correctamente
- [x] No confiar en parametros del frontend para marcar pago aprobado
- [x] Reconsultar estado del pago desde backend
- [x] No exponer access token
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
- [x] Crear tipos y contratos de pago
- [x] Crear modulo backend de pagos
- [x] Crear endpoint de reserva con pago
- [x] Crear webhook y confirmacion backend
- [x] Ajustar booking UI
- [x] Ajustar retorno de pago
- [ ] Ajustar admin
- [ ] Probar casos borde
- [ ] Recien despues pulir textos y UX

## 14. Primer bloque para arrancar

- [x] Agregar campos de pago al schema
- [x] Crear enums y estados
- [ ] Crear migracion Prisma
- [x] Crear estructura `modules/payments`
- [x] Agregar variables de entorno example
- [x] Crear contratos TypeScript de pago en frontend

## 15. Criterios de implementacion

- [x] Separar estado de turno y estado de pago
- [x] Mantener la logica sensible en backend
- [x] No romper el flujo actual hasta tener el nuevo funcionando
- [x] Iterar por capas
- [ ] Dejar trazabilidad para admin
- [ ] Facilitar testeo y futuras integraciones
