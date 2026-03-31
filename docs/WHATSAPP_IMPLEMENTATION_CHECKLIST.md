# Checklist de Implementacion - WhatsApp

## Objetivo

Definir e implementar una capa de comunicacion por WhatsApp para el sistema de turnos, priorizando utilidad operativa real, bajo riesgo tecnico y buena trazabilidad.

La meta no es solo "abrir WhatsApp", sino cubrir necesidades concretas del negocio:

- confirmar reservas
- recordar turnos
- facilitar contacto rapido ante dudas o cambios
- reducir ausencias y friccion administrativa

## Estado actual del proyecto

Hoy el proyecto ya tiene una base minima de WhatsApp en frontend:

- `VITE_WHATSAPP_NUMBER` en `frontend/.env.example`
- helper `buildWhatsAppUrl(...)` en `frontend/src/shared/utils/whatsapp.ts`
- boton flotante `WhatsAppFloat`
- CTAs publicos para consultas desde home y booking

Eso significa que hoy existe **WhatsApp como canal de contacto manual**, pero no existe todavia:

- integracion backend de envio
- recordatorios automaticos
- estados de envio
- logs o auditoria
- plantillas de mensajes
- acciones WhatsApp desde admin

## Tres opciones de implementacion

### Opcion 1. Click-to-chat publico y manual

Consiste en usar solo links `wa.me` con mensajes prearmados.

Ejemplos:

- "Hola, quiero reservar un turno"
- "Hola, quiero consultar el precio de este servicio"
- "Hola, tengo una duda sobre mi reserva"

**Ventajas**

- muy rapida de implementar
- sin costo de API
- sin backend extra
- sin aprobaciones de Meta

**Limites**

- no envia mensajes automaticamente
- depende de que el usuario tenga WhatsApp
- no sirve para recordatorios reales ni mensajes transaccionales
- no deja trazabilidad en el sistema

**Conclusión**

Ya esta parcialmente hecha. Sirve como capa de soporte, pero no alcanza como feature principal de esta rama si queremos valor operativo real.

### Opcion 2. WhatsApp asistido desde admin

Consiste en generar links de WhatsApp personalizados desde el panel admin para acciones operativas.

Ejemplos:

- enviar confirmacion manual
- enviar recordatorio manual
- enviar mensaje por pago pendiente
- contactar paciente desde la fila del turno

El sistema no envia mensajes solo; prepara el texto y abre WhatsApp Web o la app con el mensaje listo.

**Ventajas**

- mucho mas util que el link publico
- baja complejidad tecnica
- no requiere API oficial todavia
- gran impacto operativo para recepcion

**Limites**

- sigue siendo manual
- depende del operador
- no hay entrega automatica ni estados de envio reales

**Conclusión**

Es una muy buena fase 1 si queremos valor rapido sin meternos todavia en Meta Cloud API.

### Opcion 3. WhatsApp transaccional real con API

Consiste en integrar una API de envio, idealmente:

- Meta WhatsApp Cloud API
- o un proveedor como Twilio, 360dialog, etc.

Esto permite:

- recordatorios automaticos
- confirmaciones de reserva
- mensajes por pago aprobado o pendiente
- estados de entrega
- logs y trazabilidad

**Ventajas**

- mucho mas profesional
- automatiza de verdad
- escala mejor
- se integra bien con reservas y Mercado Pago

**Limites**

- mayor complejidad tecnica
- requiere credenciales, aprobaciones y configuracion externa
- necesita plantillas y cuidado con reglas de Meta
- conviene sumar logs, reintentos y control de errores

**Conclusión**

Es la opcion mas potente y la mejor a largo plazo, pero no es la que yo empezaria primero si queremos cerrar la rama con buen ritmo y bajo riesgo.

## Recomendacion de implementacion

Mi recomendacion profesional para esta rama es:

1. implementar **Opcion 2** como base real operativa
2. dejar la arquitectura preparada para escalar despues a **Opcion 3**
3. mantener **Opcion 1** como soporte publico y fallback

Eso da:

- valor rapido para recepcion
- cambios de bajo riesgo
- buena UX/admin
- una base clara para automatizar despues

## Alcance recomendado para esta rama

### Fase 1. WhatsApp operativo desde admin

Objetivo: que el equipo pueda contactar pacientes desde el panel sin copiar/pegar datos.

#### Funcionalidad

- [ ] agregar accion "WhatsApp" en cada turno del admin
- [ ] abrir WhatsApp con mensaje contextual segun el turno
- [ ] soportar al menos estos mensajes:
  - [ ] confirmacion de turno
  - [ ] recordatorio de turno
  - [ ] mensaje por pago pendiente
  - [ ] mensaje libre desde admin
- [ ] incluir datos utiles del turno:
  - [ ] nombre del paciente
  - [ ] servicio
  - [ ] fecha
  - [ ] horario
  - [ ] estado de pago si aplica

#### UX admin

- [ ] agregar boton o menu contextual de WhatsApp en `AppointmentsTable`
- [ ] agregar acciones rapidas dentro de `AppointmentsManager`
- [ ] mostrar tooltip y labels claros
- [ ] mantenerlo compacto para no saturar la tabla

#### Arquitectura

- [ ] crear helpers de armado de mensajes en frontend o shared
- [ ] definir tipos para plantillas de mensajes
- [ ] mantener separada la capa de:
  - [ ] build del texto
  - [ ] apertura del link
- [ ] no mezclar logica de render con logica de mensaje

### Fase 2. WhatsApp contextual en booking y post-pago

Objetivo: que el paciente tenga canales utiles segun el momento del flujo.

#### Frontend publico

- [ ] CTA de WhatsApp contextual cuando:
  - [ ] un servicio no tiene precio
  - [ ] no hay turnos disponibles
  - [ ] el pago queda pendiente
  - [ ] el pago falla
- [ ] personalizar mensaje segun contexto
- [ ] evitar mensajes genericos repetidos

#### Pantallas clave

- [ ] `BookingForm`
- [ ] `BookingPaymentResultPage`
- [ ] seccion de contacto/home si hace falta ajustar el tono

### Fase 3. Preparacion para automatizacion real

Objetivo: dejar lista la base para migrar despues a API real sin rehacer todo.

#### Backend

- [ ] crear modulo `backend/src/modules/notifications` o `whatsapp`
- [ ] definir interfaz de proveedor de mensajes
- [ ] definir payload comun de mensaje transaccional
- [ ] preparar logs de intentos de envio
- [ ] guardar metadatos minimos si luego sumamos API real

#### Datos sugeridos

- [ ] evaluar tabla o estructura para `notification_logs`
- [ ] guardar:
  - [ ] canal
  - [ ] tipo de mensaje
  - [ ] appointmentId
  - [ ] destinatario
  - [ ] estado
  - [ ] fecha de intento
  - [ ] error si fallo

## Checklist detallado de implementacion

## 1. Discovery y definiciones

- [ ] confirmar objetivo exacto de esta rama:
  - [ ] solo links manuales desde admin
  - [ ] o dejar ya preparado backend para futuras automatizaciones
- [ ] definir catalogo inicial de mensajes
- [ ] definir tono del negocio
- [ ] definir si el numero de WhatsApp del negocio sera uno solo o configurable por negocio

## 2. Configuracion y entorno

- [ ] revisar `VITE_WHATSAPP_NUMBER`
- [ ] decidir si hace falta mover parte de la configuracion a backend
- [ ] documentar `.env.example` si agregamos nuevas variables

## 3. Helpers y templates

- [ ] crear archivo de templates de WhatsApp
- [ ] crear funciones por caso:
  - [ ] `buildBookingConfirmationMessage`
  - [ ] `buildBookingReminderMessage`
  - [ ] `buildPendingPaymentMessage`
  - [ ] `buildManualQuoteMessage`
- [ ] asegurar que los mensajes usen datos reales del turno
- [ ] evitar texto tecnico interno

## 4. Integracion en admin

- [ ] agregar accion de WhatsApp a la tabla de turnos
- [ ] permitir seleccionar tipo de mensaje
- [ ] abrir el link con el mensaje ya armado
- [ ] mostrar feedback claro si falta telefono

## 5. Integracion en booking y pagos

- [ ] usar CTA contextual si:
  - [ ] no hay precio
  - [ ] no hay disponibilidad
  - [ ] pago pendiente
  - [ ] pago rechazado
- [ ] revisar que el copy sea consistente con Mercado Pago

## 6. UX/UI

- [ ] usar iconografia clara de WhatsApp
- [ ] no saturar la tabla admin con botones
- [ ] priorizar menu contextual donde haga falta
- [ ] revisar mobile y desktop

## 7. Testing

- [ ] testear armado de links y mensajes
- [ ] testear casos sin telefono
- [ ] testear textos segun estado del turno
- [ ] testear CTA publico en booking
- [ ] revisar que no se rompa admin ni reservas

## 8. Cierre de fase

- [ ] actualizar checklist
- [ ] documentar mensajes disponibles
- [ ] dejar commit ordenado
- [ ] push de la rama

## Orden recomendado de trabajo

1. helpers y templates de mensajes
2. accion WhatsApp en admin turnos
3. CTA contextuales en booking/pago
4. pruebas manuales y tecnicas
5. preparar base para futura automatizacion

## Resultado esperado de esta rama

Al cerrar esta rama deberiamos tener:

- WhatsApp util de verdad en el panel admin
- mensajes contextuales bien armados
- booking y post-pago con fallback claro a WhatsApp
- una base prolija para pasar despues a notificaciones automaticas si hace falta

## Que necesitaremos si despues queremos automatizacion real

Si mas adelante decidimos pasar a API real, vamos a necesitar:

- cuenta de Meta Business o proveedor equivalente
- credenciales de API
- plantillas aprobadas si aplica
- webhook propio para estados
- modulo backend de notificaciones
- logs y trazabilidad

Eso no hace falta para la primera fase recomendada.
