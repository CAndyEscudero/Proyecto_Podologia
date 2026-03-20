# Proyecto Podologia - Checklist de Continuidad

## Estado actual

- La landing original sigue en la raiz como referencia visual.
- La nueva app fullstack vive en `frontend/` y `backend/`.
- El backend ya tiene modulos para auth, servicios, disponibilidad, turnos, clientes, usuarios y configuracion del negocio.
- El frontend ya tiene sitio publico, flujo de reservas, login admin y dashboard operativo.
- Hay scripts de setup local, arranque y pruebas e2e en `scripts/`.
- Gran parte de esta migracion aun no esta committeada en Git.

## Lo ultimo que hicimos

- Cerramos el panel admin responsive.
- Mejoramos la gestion de turnos desde el dashboard:
  - alta manual
  - edicion
  - cambio de estado
  - reprogramacion
  - eliminacion
- Dejamos gestion admin para:
  - servicios
  - reglas de disponibilidad
  - fechas bloqueadas
  - configuracion del negocio
- Sumamos scripts e2e para validar booking y operaciones admin.
- Afinamos el e2e de booking para que:
  - use `BASE_URL` y `API_URL` configurables
  - descubra por API una combinacion realmente reservable
  - use selectores estables en la UI del booking

## Ultima validacion ejecutada

- Fecha: `2026-03-19`
- Booking e2e: OK en dos corridas consecutivas
- Dashboard admin e2e: OK
- Validacion limpia adicional: OK
  - Docker activo
  - `mysql` y `adminer` arriba por `docker compose`
  - `prisma generate`: OK
  - `prisma migrate`: OK, schema en sync
  - `prisma seed`: OK
  - backend relanzado y respondiendo en `:4000`
  - booking e2e sobre entorno fresco: OK
  - dashboard admin e2e sobre entorno fresco: OK
- Mejora adicional validada: OK
  - dashboard con filtros por rango, estado, servicio y cliente
  - resumen superior con metricas reales del conjunto filtrado
  - dashboard e2e adaptado al flujo nuevo
  - booking e2e de regresion despues de cambios admin

## Checklist de continuidad

### Infra y entorno

- [ ] Confirmar que Docker Desktop este corriendo.
- [ ] Levantar MySQL y Adminer con `npm run db:up`.
- [ ] Verificar que Prisma genere cliente y migre sin errores.
- [ ] Confirmar que `frontend/.env` y `backend/.env` sigan correctos.
- [ ] Limpiar logs viejos si molestan la lectura (`frontend.log`, `backend.log`).

### Backend

- [x] Auth con JWT.
- [x] CRUD base de servicios.
- [x] Motor de disponibilidad.
- [x] Reserva de turnos.
- [x] Configuracion del negocio.
- [x] Validacion automatizada de casos borde de disponibilidad (slot ocupado + bloqueo parcial).
- [x] Validacion automatizada de reprogramacion (slot ocupado + slot bloqueado + slot valido).
- [x] Revisar casos limite de disponibilidad y solapamientos.
- [ ] Agregar tests automatizados de API si queremos mas seguridad antes de seguir escalando.
- [ ] Definir logging/auditoria basica para operaciones admin.
- [ ] Preparar modelo de reservas con seña y pago online.
- [ ] Integrar backend de Mercado Pago para generar pagos y confirmar reservas.
- [ ] Definir expiracion/liberacion de reservas no abonadas.

### Frontend publico

- [x] Home publica.
- [x] Ruta `/reservas`.
- [x] Flujo base de reserva online.
- [ ] Validar UX mobile completa del booking.
- [ ] Revisar textos finales, estados vacios y mensajes de error.
- [ ] Decidir si falta migrar mas contenido visual desde la landing original.
- [ ] Agregar boton `Reservar turno` con cobro del 50% del servicio.
- [ ] Mostrar resumen economico: total, seña y saldo pendiente.
- [ ] Resolver retorno de Mercado Pago para pago aprobado, pendiente o rechazado.

### Panel admin

- [x] Login.
- [x] Dashboard base.
- [x] Gestion de turnos.
- [x] Gestion de servicios.
- [x] Gestion de disponibilidad.
- [x] Configuracion del negocio.
- [x] Mejorar metricas reales del dashboard.
- [x] Agregar filtros mas avanzados para agenda y pacientes.
- [ ] Definir si hace falta gestion de clientes separada en UI.
- [ ] Mostrar estado de pago/seña en cada turno.

### Calidad y cierre tecnico

- [x] Scripts e2e de booking.
- [x] Scripts e2e de dashboard admin.
- [x] Scripts e2e de servicios/disponibilidad.
- [x] Scripts e2e de turnos admin.
- [x] Scripts e2e de business settings.
- [x] Script tecnico para validar edge cases de disponibilidad (`scripts/test-availability-edge-cases.js`).
- [x] Script tecnico para validar guardrails de disponibilidad (`scripts/test-availability-guardrails.js`).
- [x] Script tecnico para validar edge cases de reprogramacion (`scripts/test-reschedule-edge-cases.js`).
- [x] Reejecutar validaciones end-to-end con el entorno levantado.
- [ ] Revisar `.gitignore` para no versionar `node_modules`, `dist` y logs.
- [ ] Committear la nueva base fullstack en bloques ordenados.
- [ ] Agregar pruebas del flujo de reserva con pago y webhook.

## Implementacion nueva prioritaria: Mercado Pago para confirmar reservas

Objetivo: que la reserva quede confirmada solo si el paciente paga una seña del 50%, evitando perder turnos.

### Alcance funcional

- [ ] Mantener el flujo actual de seleccion de servicio, fecha y horario.
- [ ] En el ultimo paso mostrar precio total, seña del 50% y saldo restante.
- [ ] Reemplazar el cierre actual por un boton `Reservar turno`.
- [ ] Crear una preferencia/link de pago en Mercado Pago por el 50% del servicio.
- [ ] Confirmar el turno recien cuando Mercado Pago informe pago aprobado.
- [ ] Si el pago no se aprueba, no bloquear el horario indefinidamente.

### Backend y datos

- [ ] Agregar credenciales y URLs necesarias en `.env`.
- [ ] Crear modulo de pagos o integracion Mercado Pago.
- [ ] Recibir y validar webhook/notificacion de pago.
- [ ] Extender la base para guardar:
  - precio total
  - monto de seña
  - estado de pago
  - referencia externa de Mercado Pago
  - vencimiento o timeout de reserva pendiente
- [ ] Ajustar estados del turno para contemplar reserva pendiente de pago y confirmada por cobro.

### Frontend y operacion

- [ ] Mostrar mensajes claros de reserva confirmada, pendiente o fallida.
- [ ] Permitir al admin ver si un turno esta pendiente de pago, señado o confirmado.
- [ ] Definir como se cobra y registra el 50% restante.

## Orden recomendado para retomar

1. Levantar entorno y verificar que todo siga funcionando.
2. Reejecutar pruebas e2e clave.
3. Corregir cualquier regresion encontrada.
4. Cerrar higiene del repo (`.gitignore`, commits, artefactos generados).
5. Implementar reserva con seña del 50% por Mercado Pago.
6. Recien despues seguir con nuevas features.

## Siguiente implementacion recomendada

La mejor siguiente inversion es cerrar la reserva confirmada con seña online, pero apoyada sobre la base tecnica que ya validamos:

1. Confirmar flujo completo de reserva y admin con pruebas.
2. Ajustar casos borde de disponibilidad y reprogramacion.
3. Cerrar higiene del repo y dejar la base lista para iterar.
4. Implementar Mercado Pago para cobrar el 50% al reservar.
5. Evaluar despues notificaciones por WhatsApp o email.

## Validaciones sugeridas al volver

### Minimo indispensable

- [ ] Login admin.
- [ ] Reserva publica completa.
- [ ] Alta manual de turno.
- [ ] Cambio de estado de turno.
- [ ] Reprogramacion.
- [ ] Alta/edicion/baja de servicio.
- [ ] Alta/baja de regla de disponibilidad.
- [ ] Alta/baja de fecha bloqueada.
- [ ] Guardado de configuracion del negocio.

### Antes de seguir escalando features

- [ ] Revisar que no se puedan reservar horarios ya ocupados.
- [ ] Revisar fechas bloqueadas parciales y totales.
- [ ] Revisar que los cambios del admin impacten en el booking publico.
- [ ] Confirmar persistencia real en base de datos.
- [ ] Confirmar que el repo quede listo para commit sin basura generada.
- [ ] Validar reserva con pago aprobado.
- [ ] Validar que un pago pendiente o rechazado no deje un turno confirmado.
