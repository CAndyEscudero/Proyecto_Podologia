# Checklist Maestro - SaaS Multi-Tenant

## Objetivo

Transformar la app actual en un SaaS multi-tenant vendible a muchos negocios desde una sola plataforma.

El objetivo no es solo "que funcione".
El objetivo es que:

- muchos negocios usen la misma plataforma
- no se mezclen datos entre negocios
- cada negocio tenga su propia configuracion
- cada negocio pueda tener su propia URL o dominio
- el alta de un nuevo cliente no requiera clonar el proyecto
- el producto llegue a una version por la que tenga sentido cobrar mensualmente

## Contexto actual

La base existente ya resuelve bastante de un negocio unico:

- frontend publico
- booking online
- panel admin
- servicios
- disponibilidad
- turnos
- pagos con sena

Lo que no existe todavia y pasa a ser obligatorio:

- tenant real
- aislamiento de datos por tenant
- auth con contexto de tenant
- configuracion por tenant
- integraciones por tenant
- dominios por tenant
- onboarding de tenants
- billing del SaaS

## Decisiones base confirmadas

Estas decisiones son la base del roadmap.

- [x] El producto va a ser un SaaS multi-tenant
- [x] Va a haber un backend compartido
- [x] Va a haber una base de datos compartida
- [x] El aislamiento se va a hacer con `tenantId`
- [x] Cada negocio sera un `tenant`
- [x] Cada tenant podra tener un subdominio propio de la plataforma
- [x] Cada tenant podra tener un dominio custom para su frente publico
- [x] La v1 no va a prometer multi-profesional complejo
- [x] La v1 va a manejar una agenda por tenant
- [x] La v1 va a cobrar sena online
- [x] El producto tiene que llegar a una etapa cobrable mensualmente

## Objetivo comercial de la v1

La v1 vendible deberia permitir:

- dar de alta un negocio nuevo en la plataforma
- configurarle marca, servicios, horarios y pagos
- darle una URL publica propia
- permitir reservas online con sena
- permitir operacion de agenda desde su panel
- evitar totalmente que vea datos de otros negocios

## Lo que no entra en la v1

Para no desviar foco, esto no deberia ser prioridad de primera salida:

- multiples profesionales con agenda independiente
- multiples sucursales
- marketplace
- historia clinica
- facturacion electronica
- app mobile nativa
- integraciones empresariales complejas

## Arquitectura recomendada

### Modelo recomendado

- [x] Crear entidad `Tenant`
- [x] Crear entidad `TenantDomain`
- [x] Agregar `tenantId` a todas las entidades de negocio
- [x] Resolver tenant por `Host`
- [ ] Filtrar todas las consultas del backend por `tenantId`
- [x] Hacer unicas compuestas por tenant todas las claves que hoy son globales

### Estructura conceptual recomendada

- `Tenant`
- `TenantDomain`
- `TenantMembership` o equivalente si mas adelante un usuario puede pertenecer a mas de un tenant
- `BusinessSettings` por tenant
- `Services` por tenant
- `Clients` por tenant
- `Appointments` por tenant
- `AvailabilityRules` por tenant
- `BlockedDates` por tenant
- `PaymentConfig` o integraciones por tenant

### Decision de v1

- [x] Una agenda por tenant
- [x] Un set de reglas horarias por tenant
- [x] Sin profesional individual en la primera version

## Fase 0 - Contrato del producto

Antes de tocar el schema, hay que cerrar estas definiciones:

Documento base:

- [x] Contrato de producto creado en [docs/SAAS_V1_CONTRATO_PRODUCTO.md](/c:/Users/Emula/Desktop/proyecto%20podologia/docs/SAAS_V1_CONTRATO_PRODUCTO.md)

- [x] Definir cliente ideal de v1
- [x] Definir si la v1 apunta a podologas, unas, peluquerias o "servicios por turno" en general
- [x] Definir si el frente publico sera generico o personalizable por tenant
- [x] Definir politica de sena por defecto
- [x] Definir si la sena sera configurable por tenant en v1
- [x] Definir politica de cancelacion y reprogramacion
- [x] Definir si el admin puede cargar turnos manuales sin pago
- [x] Definir que ve el paciente despues del pago

## Fase 1 - Modelo de datos multi-tenant

Este es el primer bloque tecnico real.

### 1.1 Tenant

- [x] Crear modelo `Tenant`
- [x] Agregar `slug` unico
- [x] Agregar `name`
- [x] Agregar `status`
- [x] Agregar `businessType`
- [x] Agregar timestamps

### 1.2 TenantDomain

- [x] Crear modelo `TenantDomain`
- [x] Guardar `hostname`
- [x] Guardar `tenantId`
- [x] Guardar `isPrimary`
- [x] Guardar `type`
- [x] Guardar `status`
- [x] Guardar `verifiedAt`

### 1.3 Tablas de negocio

- [x] Agregar `tenantId` a `User`
- [x] Agregar `tenantId` a `Client`
- [x] Agregar `tenantId` a `Service`
- [x] Agregar `tenantId` a `Appointment`
- [x] Agregar `tenantId` a `AvailabilityRule`
- [x] Agregar `tenantId` a `BlockedDate`
- [x] Agregar `tenantId` a `BusinessSettings`

### 1.4 Restricciones e indices

- [x] Revisar `slug` de servicios para que sea unico por tenant
- [x] Revisar emails de usuarios para definir si son unicos globales o por tenant
- [x] Revisar referencias de pago para evitar choques entre tenants
- [x] Crear indices por `tenantId`
- [x] Crear claves compuestas donde haga falta

Decision tomada en esta fase:
`User.email` sigue siendo globalmente unico en v1 mientras cada usuario pertenezca a un solo tenant.

### 1.5 Migraciones

- [x] Disenar migracion sin romper datos actuales
- [x] Definir tenant inicial para los datos existentes
- [x] Ajustar seed a modelo multi-tenant

## Fase 2 - Resolucion de tenant y auth

### 2.1 Resolucion por dominio

- [x] Crear middleware que lea `Host`
- [x] Buscar el host en `TenantDomain`
- [x] Cargar `req.tenant`
- [x] Rechazar requests si el dominio no corresponde a un tenant activo

### 2.2 Auth multi-tenant

- [x] Incluir `tenantId` en el contexto de auth
- [x] Validar que el usuario autenticado pertenece al tenant resuelto
- [x] Evitar cualquier acceso cruzado entre tenant del token y tenant del dominio
- [x] Revisar `me`, login y permisos con tenant

### 2.3 Roles

- [x] Mantener `OWNER`, `ADMIN`, `STAFF`
- [x] Asegurar que los roles operen solo dentro de su tenant
- [x] Evaluar si hace falta `SUPER_ADMIN` interno para operar la plataforma

Decision tomada en esta fase:
No se agrega `SUPER_ADMIN` todavia. Si aparece despues, debe ser un rol interno de plataforma y no mezclarse con usuarios de tenant.

## Fase 3 - Backend multi-tenant por modulo

### 3.1 Services

- [x] Filtrar listado publico por tenant
- [x] Filtrar CRUD admin por tenant
- [x] Crear y editar servicios dentro del tenant activo

### 3.2 Availability

- [x] Filtrar reglas por tenant
- [x] Filtrar bloqueos por tenant
- [x] Calcular slots solo con datos del tenant activo

### 3.3 Clients

- [x] Crear clientes dentro del tenant activo
- [x] Buscar duplicados solo dentro del tenant correcto
- [x] Listar clientes solo del tenant correcto

### 3.4 Appointments

- [x] Crear turnos con `tenantId`
- [x] Listar turnos por tenant
- [x] Reprogramar y cancelar solo dentro del tenant
- [x] Asegurar que disponibilidad y turno pertenezcan al mismo tenant

### 3.5 Business settings

- [x] Tener una configuracion de negocio por tenant
- [x] Soportar branding y datos del negocio por tenant
- [x] Soportar timezone por tenant

## Fase 4 - Pagos e integraciones por tenant

### 4.1 Mercado Pago

- [x] Sacar configuracion global unica
- [x] Definir configuracion por tenant
- [x] Resolver credenciales del tenant al crear preferencia
- [x] Resolver credenciales del tenant al procesar webhook
- [x] Validar que cada pago impacte solo en el tenant correcto
- [x] Agregar onboarding autoservicio con boton `Conectar con Mercado Pago`
- [x] Persistir conexion OAuth por tenant con `refresh_token`
- [x] Redirigir callback al panel admin del tenant correcto
- [x] Mantener fallback manual solo como compatibilidad interna

### 4.2 Email transaccional

- [x] Elegir proveedor
- [x] Definir si la cuenta sera central de la plataforma o configurable por tenant
- [x] Disenar plantillas con branding del tenant

Decision tomada en esta fase:
`Resend` como proveedor central de la plataforma en v1.
Cada tenant define si habilita emails, el nombre visible del remitente y el `reply-to`.

### 4.3 Futuro

- [x] Dejar preparada estructura para WhatsApp por tenant

Decision tomada en esta fase:
La v1 usa `wa.me` por tenant, no la API oficial de Meta.
Se deja lista la configuracion por negocio y un endpoint publico seguro para consumirla en la Fase 5.

## Fase 5 - Frontend multi-tenant

### 5.1 Publico

- [x] Resolver tenant por host en la carga inicial
- [x] Mostrar branding, nombre y datos del negocio del tenant
- [x] Mostrar solo servicios del tenant
- [x] Reservar solo en el tenant correcto

### 5.2 Admin

- [x] Login dentro del tenant correcto
- [x] Panel admin aislado por tenant
- [x] Branding admin por tenant si suma valor
- [x] Evitar persistencias viejas de `localStorage` que crucen tenants

### 5.3 UX

- [x] Mensajes claros si el dominio no esta conectado
- [x] Mensajes claros si el tenant esta suspendido

## Fase 6 - Dominios y URLs por tenant

### 6.1 Subdominios de plataforma

- [x] Definir formato base:
  - `tenant.tuapp.com`
- [x] Generar subdominio al crear tenant
- [x] Validar colisiones de slug

Decision tomada en esta fase:
El formato base pasa a ser `slug.PLATFORM_APEX_DOMAIN`.
En desarrollo local, si `PLATFORM_APEX_DOMAIN` no se redefine, se usa `localhost`.

### 6.2 Dominios custom

- [x] Permitir un dominio publico principal por tenant
- [x] Guardarlo en `TenantDomain`
- [x] Validar DNS
- [x] Activar SSL
- [x] Definir cambio de dominio principal

Decision tomada en esta fase:
La app valida DNS y administra el dominio principal por tenant.
La activacion real del certificado SSL queda delegada a la infraestructura de despliegue y se expone en el panel como estrategia `managed`.

### 6.3 Estrategia v1 recomendada

- [x] Publico en dominio custom si el tenant lo configura
- [x] Admin inicialmente en dominio de plataforma
- [x] Resolver si mas adelante admin tambien soporta dominio custom

Decision tomada en esta fase:
En v1 el dominio custom es solo para el frente publico.
El panel admin queda bloqueado fuera del subdominio de plataforma.
El soporte de admin sobre dominio custom se posterga para una etapa futura.

### 6.4 Operacion

- [x] Documentar flujo tecnico de conexion de dominio
- [x] Documentar si el dominio lo compra el cliente o la plataforma
- [x] Definir politica de renovacion si vos lo bonificas o lo "regalas"

Documento operativo:

- [x] [docs/DOMINIOS_TENANT_OPERACION.md](/c:/Users/Emula/Desktop/proyecto%20podologia/docs/DOMINIOS_TENANT_OPERACION.md)

## Fase 7 - Onboarding de tenants

### 7.1 Alta interna

- [x] Crear flujo para alta de tenant
- [x] Crear owner inicial
- [x] Crear subdominio por defecto
- [x] Crear `BusinessSettings` iniciales
- [x] Crear servicios demo o plantilla opcional

Documento operativo:

- [x] [docs/TENANT_ONBOARDING_OPERACION.md](/c:/Users/Emula/Desktop/proyecto%20podologia/docs/TENANT_ONBOARDING_OPERACION.md)

### 7.2 Configuracion inicial

- [x] Nombre comercial
- [x] Rubro
- [x] Telefono
- [x] Direccion
- [x] Horarios
- [x] Servicios
- [x] Mercado Pago
- [x] Email
- [x] Dominio custom

Decision tomada en esta fase:
La v1 resuelve onboarding interno con script + JSON validado.
No hay panel `SUPER_ADMIN` todavia; el alta de tenants se hace desde operacion interna sin tocar codigo.

### 7.3 Estado del tenant

- [x] `PENDING`
- [x] `ACTIVE`
- [x] `SUSPENDED`
- [x] `CANCELLED`

## Fase 8 - Billing del SaaS

No conviene implementarlo primero, pero si antes de cobrar mensual a escala.

### 8.1 Modelo comercial

- [ ] Definir mensual vs anual
- [ ] Definir si hay setup fee
- [ ] Definir prueba gratis o no
- [ ] Definir que pasa si no paga

### 8.2 Datos de billing

- [ ] Crear modelo de suscripcion
- [ ] Crear estado de suscripcion por tenant
- [ ] Crear plan por tenant
- [ ] Crear fechas de renovacion

### 8.3 Reglas de acceso

- [ ] Definir si un tenant impago se bloquea completo o se degrada
- [ ] Definir si el booking publico sigue activo o no

## Fase 9 - Notificaciones y jobs

### 9.1 Notificaciones

- [x] Reserva pendiente
- [x] Pago aprobado
- [x] Pago rechazado
- [x] Turno reprogramado
- [x] Turno cancelado

Decision tomada en esta fase:
La v1 resuelve notificaciones automaticas por email.
WhatsApp sigue como canal manual por `wa.me` y no participa en los jobs.

### 9.2 Jobs

- [x] Expiracion real de reservas pendientes
- [x] Recordatorios
- [x] Reintentos de notificacion si aplica

Documento operativo:

- [x] [docs/NOTIFICACIONES_Y_JOBS_OPERACION.md](/c:/Users/Emula/Desktop/proyecto%20podologia/docs/NOTIFICACIONES_Y_JOBS_OPERACION.md)

### 9.3 Multi-tenant

- [x] Todos los jobs deben correr con contexto de tenant
- [x] Ningun job puede mezclar datos entre tenants

## Fase 10 - Observabilidad y operacion

### 10.1 Logs

- [x] Agregar logs estructurados
- [x] Incluir `tenantId` en logs importantes
- [x] Incluir `domain` o `hostname` cuando sirva

### 10.2 Monitoreo

- [x] Errores backend
- [x] Errores frontend
- [x] Fallos de webhook
- [x] Fallos de onboarding
- [x] Fallos de resolucion de dominio

### 10.3 Soporte

- [x] Definir herramientas minimas para localizar un tenant
- [x] Definir soporte interno de dominios
- [x] Definir soporte interno de pagos

Documento operativo:

- [x] [docs/OBSERVABILIDAD_Y_OPERACION.md](/c:/Users/Emula/Desktop/proyecto%20podologia/docs/OBSERVABILIDAD_Y_OPERACION.md)

## Fase 11 - Calidad y seguridad

### 11.1 Seguridad

- [x] Probar acceso cruzado entre tenants
- [x] Revisar cookies, JWT y sesiones con contexto de tenant
- [x] Revisar CORS y dominios
- [x] Revisar webhooks por tenant

### 11.2 Testing

- [x] Tests de resolucion de tenant por host
- [x] Tests de aislamiento de datos
- [x] Tests de login multi-tenant
- [x] Tests de booking por tenant
- [x] Tests de pagos por tenant
- [x] Tests de dominio custom

Documento operativo:

- [x] [docs/CALIDAD_Y_SEGURIDAD_FASE_11.md](/c:/Users/Emula/Desktop/proyecto%20podologia/docs/CALIDAD_Y_SEGURIDAD_FASE_11.md)

## Fase 12 - Go-live del SaaS

Documento operativo:

- [x] [docs/GO_LIVE_FASE_12.md](/c:/Users/Emula/Desktop/proyecto%20podologia/docs/GO_LIVE_FASE_12.md)

### 12.1 Minimo para cobrar mensual piloto

- [x] Tenant se crea sin tocar codigo
- [x] Subdominio funciona
- [ ] Dominio custom publico funciona
- [x] Aislamiento de datos validado
- [x] Booking por tenant validado
- [x] Pago por tenant validado
- [x] Admin por tenant validado
- [x] Logs minimos activos

### 12.2 Minimo para cobrar mensual a escala

- [x] Onboarding razonablemente rapido
- [ ] Billing del SaaS
- [ ] Jobs funcionando
- [x] Soporte de dominios claro
- [ ] Observabilidad estable
- [ ] Testing suficiente para cambios frecuentes

## Orden recomendado de implementacion

Este es el orden que recomiendo para no romper la base actual ni perder meses:

### Bloque A - Fundacion SaaS

- [x] Fase 0
- [x] Fase 1
- [x] Fase 2

### Bloque B - Core funcional multi-tenant

- [x] Fase 3
- [x] Fase 4
- [x] Fase 5

### Bloque C - Producto vendible

- [x] Fase 6
- [x] Fase 7
- [x] Fase 9
- [x] Fase 10
- [x] Fase 11

### Bloque D - Cobro mensual escalable

- [ ] Fase 8
- [ ] Fase 12

## Primer bloque tecnico recomendado

Si empezamos ya a construir el SaaS, el primer bloque real deberia ser este:

- [x] disenar el schema multi-tenant exacto
- [x] agregar `Tenant`
- [x] agregar `TenantDomain`
- [x] agregar `tenantId` a tablas de negocio
- [x] definir claves unicas por tenant
- [x] definir como se resuelve el tenant por `Host`

## Criterio de avance

No pasar al siguiente bloque si no esta cerrado el anterior.

Especialmente:

- no tocar dominios custom antes de tener tenant real
- no tocar billing antes de tener onboarding de tenant
- no cobrar mensual seriamente antes de poder dar de alta un negocio sin tocar codigo
