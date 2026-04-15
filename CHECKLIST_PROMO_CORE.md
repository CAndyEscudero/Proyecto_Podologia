# Checklist maestro — Promo + Core

> Objetivo: dejar una base SaaS PROFESIONAL, escalable y coherente, pero con una estrategia comercial realista para esta etapa.
>
> En esta fase inicial NO vamos a abrir alta online pública. La venta será asistida, local por local.
>
> Convenciones de trabajo:
>
> - **Promo** = landing comercial / sitio de marketing
> - **Core** = proyecto SaaS multi-tenant actual
> - **Demo** = tenant demo público para ventas y pruebas
> - **Alta manual** = el equipo crea el tenant y el owner desde el flujo interno actual

---

## 1. Visión objetivo

### Arquitectura recomendada

- `resergo.com.ar` → **Promo**
- `www.resergo.com.ar` → **Promo**
- `demo.resergo.com.ar` → **Demo**
- `app.resergo.com.ar` → acceso técnico/plataforma si hace falta
- `*.resergo.com.ar` → tenants reales de **Core**
- `domains.resergo.com.ar` → target técnico para custom domains

### Principio rector

- **Promo vende y capta leads**
- **Demo deja probar el producto**
- **Core provisiona y gobierna tenants, accesos y operación**
- **El alta comercial la hace el equipo, no el usuario final**
- **El root domain NO debe modelarse como tenant**

---

## 2. Estado actual verificado

### Core ya tiene

- [x] multi-tenant por dominio/subdominio
- [x] auth admin por tenant
- [x] onboarding interno de tenant
- [x] soporte de dominios custom
- [x] pagos de reservas / señas con Mercado Pago
- [x] deploy productivo funcionando

### Core NO necesita todavía para esta etapa

- [ ] alta self-service pública
- [ ] checkout mensual público
- [ ] provisioning automático por billing
- [ ] gating automático por suscripción
- [ ] signup directo desde la landing

### Esto sí queda para una etapa futura

- [ ] modelo completo de suscripción SaaS automatizada
- [ ] trial público autoservicio
- [ ] webhook de provisioning end-to-end
- [ ] suspensión automática por falta de pago

---

## 3. Decisiones de arquitectura cerradas

- [x] `Promo` = marketing + pricing + demo + contacto
- [x] `Core` = tenants + producto + onboarding interno + operación
- [x] La demo será pública/comercial
- [x] El alta de clientes será manual por el equipo
- [x] No habrá creación de usuario online por ahora
- [x] La estrategia comercial inicial es ir local por local
- [ ] Reservar slugs técnicos:
  - [ ] `www`
  - [ ] `app`
  - [ ] `demo`
  - [ ] `domains`
  - [ ] `admin`
  - [ ] otros que se definan

### Mejor opción

- **Recomendada**: usar Promo para vender y captar interés, y resolver el alta real desde el flujo interno ya existente.
- **No recomendada**: abrir self-service antes de validar el circuito comercial y operativo.

---

## 4. Fase 1 — Dominios y routing

### Objetivo

Separar root domain comercial de los tenants reales.

### Checklist

- [ ] Configurar DNS final:
  - [ ] `@` → Promo
  - [ ] `www` → Promo
  - [ ] `demo` → Core
  - [ ] `app` → Core o Promo/Core según diseño final
  - [ ] `*` → Core
  - [ ] `domains` → Core
- [ ] Definir si Promo vive:
  - [ ] en la misma VPS
  - [ ] en otro hosting
- [ ] Ajustar Caddy/reverse proxy por hostname
- [ ] Evitar que `resergo.com.ar` pase por resolución de tenant
- [ ] Mantener `*.resergo.com.ar` como tenants
- [ ] Mantener `domains.resergo.com.ar` como target de custom domains

### Mejor opción

- **Recomendada**: una sola VPS con Caddy frontal por hostname.
- **Alternativa**: Promo separado en otro hosting (Vercel/otro). También sirve, pero agrega piezas.

---

## 5. Fase 2 — Deploy de Promo

### Objetivo

Levantar la landing comercial sin romper Core.

### Checklist

- [ ] Crear `docker-compose.prod.yml` para Promo si hace falta separarlo del Core
- [ ] Definir serving de Promo:
  - [ ] Caddy
  - [ ] nginx
  - [ ] static server simple
- [ ] Publicar Promo en:
  - [ ] `resergo.com.ar`
  - [ ] `www.resergo.com.ar`
- [ ] Confirmar páginas mínimas:
  - [ ] Home
  - [ ] Pricing
  - [ ] Demo
  - [ ] Contacto
  - [ ] Términos
  - [ ] Privacidad
- [ ] Confirmar CTAs:
  - [ ] “Probar demo”
  - [ ] “Hablar por WhatsApp”
  - [ ] “Solicitar implementación”
  - [ ] “Agendar una llamada”
- [ ] Eliminar o esconder CTA de “Crear cuenta”

### Mejor opción

- **Recomendada**: deploy estático simple primero.
- **No recomendada**: sobrecargar Promo con lógica de negocio que debería vivir en Core.

---

## 6. Fase 3 — Demo comercial

### Objetivo

Que el cliente pruebe el producto antes de comprar.

### Checklist

- [ ] Confirmar subdominio demo:
  - [ ] `demo.resergo.com.ar`
  - [ ] otro, si se decide distinto
- [ ] Elegir tipo de demo:
  - [ ] pública navegable
  - [ ] admin demo read-only
  - [ ] editable con reset periódico
- [ ] Separar Demo de tenants reales
- [ ] Armar contenido demo:
  - [ ] servicios
  - [ ] branding
  - [ ] agenda
  - [ ] textos
- [ ] Definir estrategia de reset:
  - [ ] cron
  - [ ] seed re-ejecutable
  - [ ] manual

### Mejor opción

- **Recomendada**: demo pública + admin demo con reset periódico.

---

## 7. Fase 4 — Flujo comercial asistido

### Objetivo

Que Promo genere conversaciones comerciales, no cuentas automáticas.

### Checklist

- [ ] Definir CTA principal de conversión:
  - [ ] WhatsApp
  - [ ] formulario
  - [ ] agenda de llamada
- [ ] Definir datos mínimos del lead:
  - [ ] nombre del local
  - [ ] rubro/especialidad
  - [ ] ciudad/zona
  - [ ] teléfono
  - [ ] email
- [ ] Definir proceso comercial:
  1. [ ] cliente entra a Promo
  2. [ ] prueba demo
  3. [ ] deja contacto / escribe por WhatsApp
  4. [ ] ustedes califican el lead
  5. [ ] acuerdan plan/implementación
  6. [ ] ustedes crean tenant manualmente
  7. [ ] envían acceso al owner
- [ ] Definir dónde se registran leads:
  - [ ] email
  - [ ] Google Sheets
  - [ ] CRM
  - [ ] panel interno futuro
- [ ] Preparar mensajes comerciales base

### Mejor opción

- **Recomendada**: empezar con WhatsApp + formulario simple.
- **No recomendada**: construir un CRM complejo antes de validar el volumen real.

---

## 8. Fase 5 — Onboarding manual operable

### Objetivo

Estandarizar el alta manual para que sea rápida, repetible y sin errores.

### Base ya existente en Core

- Ya hay servicio de onboarding interno de tenant.
- La prioridad NO es exponer un flujo público, sino ordenar el flujo asistido.

### Checklist

- [ ] Definir checklist interno de alta:
  - [ ] nombre comercial
  - [ ] slug/subdominio
  - [ ] email owner
  - [ ] teléfono
  - [ ] branding inicial
  - [ ] servicios iniciales
- [ ] Validar:
  - [ ] email único
  - [ ] slug único
  - [ ] slug reservado
  - [ ] custom domain opcional
- [ ] Crear owner inicial
- [ ] Crear tenant con configuración base correcta
- [ ] Preparar mensaje de entrega de acceso
- [ ] Definir tiempo objetivo de alta manual
- [ ] Documentar runbook interno del onboarding

### Mejor opción

- **Recomendada**: convertir el onboarding interno actual en un proceso comercial prolijo y repetible.

---

## 9. Fase 6 — Billing asistido (sin checkout público)

### Objetivo

Cobrar sin meter todavía un autoservicio de suscripción.

### Opciones

#### Opción A — Mercado Pago asistido

- **Pros**
  - mejor fit para Argentina
  - coherente con el stack actual
  - permite cobrar sin abrir checkout público completo
- **Contras**
  - más trabajo operativo manual

#### Opción B — Facturación/manual offline al inicio

- **Pros**
  - máxima simplicidad inicial
  - ideal para validar ventas reales
- **Contras**
  - menos escalable
  - más seguimiento manual

### Checklist

- [ ] Definir cómo se cobra en esta etapa:
  - [ ] link de pago manual
  - [ ] transferencia
  - [ ] suscripción asistida
- [ ] Definir cuándo se cobra:
  - [ ] antes del alta
  - [ ] al entregar acceso
  - [ ] luego de demo/reunión
- [ ] Definir política comercial mínima:
  - [ ] precio mensual
  - [ ] setup inicial sí/no
  - [ ] permanencia sí/no
  - [ ] prueba asistida sí/no
- [ ] Documentar quién ejecuta el cobro y cómo se registra

### Mejor opción

- **Recomendada**: si el foco es Argentina, arrancar con Mercado Pago asistido o cobro manual simple.
- **No recomendada**: construir checkout self-service sin necesidad comercial inmediata.

---

## 10. Fase 7 — Dominios custom

### Objetivo

Completar la promesa de marca blanca / dominio propio sin bloquear la salida comercial.

### Checklist

- [ ] Mantener `domains.resergo.com.ar`
- [ ] Mejorar UX de conexión de dominio
- [ ] Mostrar instrucciones DNS al cliente
- [ ] Verificación automática/manual
- [ ] Emisión SSL
- [ ] Primary domain
- [ ] Redirecciones desde subdominio original si aplica

### Mejor opción

- **Recomendada**: dejarlo operativo, pero no bloquear el lanzamiento inicial por esto.

---

## 11. Fase 8 — Comercial / conversión

### Objetivo

Que Promo venda, no solo se vea linda.

### Checklist

- [ ] Pricing claro
- [ ] CTA a demo
- [ ] CTA a contacto
- [ ] comparación de planes
- [ ] preguntas frecuentes
- [ ] prueba social
- [ ] explicación simple del onboarding asistido
- [ ] mensajes comerciales:
  - [ ] bienvenida al lead
  - [ ] seguimiento post-demo
  - [ ] propuesta / cierre
  - [ ] entrega de acceso

### Mejor opción

- **Recomendada**: empezar con 1 o 2 planes máximo y una propuesta de valor MUY clara.

---

## 12. Fase 9 — Seguridad, operación y legal

### Objetivo

No lanzar una app linda pero floja.

### Checklist

- [ ] backups de DB
- [ ] rotación de secretos
- [ ] logs centralizados
- [ ] healthchecks
- [ ] rate limit login
- [ ] rate limit contacto/demo si aplica
- [ ] reset de password
- [ ] dominio de email transaccional real
- [ ] monitoreo frontend/backend
- [ ] restore probado
- [ ] validación SSL en varios navegadores
- [ ] jobs revisados
- [ ] términos
- [ ] privacidad
- [ ] política comercial / cancelación

---

## 13. Backlog diferido (NO ahora)

### Automatizaciones que quedan para v2+

- [ ] alta self-service pública
- [ ] checkout mensual público
- [ ] webhook con provisioning automático
- [ ] trial autoservicio
- [ ] gating automático por suscripción
- [ ] suspensión automática por falta de pago
- [ ] dunning / reintentos automáticos
- [ ] upgrade/downgrade self-service

### Criterio para habilitar esto

- [ ] ya existe volumen comercial repetible
- [ ] el onboarding manual ya está aceitado
- [ ] el pricing ya fue validado con clientes reales
- [ ] el proceso de soporte inicial ya está claro

---

## 14. Release plan sugerido

### v1.2 — base comercial asistida

- [ ] separar Promo y Core por hostname
- [ ] deployar Promo en root domain
- [ ] dejar Demo estable
- [ ] habilitar contacto comercial claro
- [ ] ordenar flujo de leads
- [ ] documentar onboarding manual
- [ ] definir cobro asistido inicial
- [ ] entregar accesos de forma prolija
- [ ] legal mínimo publicado

### v2 — automatización comercial

- [ ] signup público
- [ ] checkout mensual self-service
- [ ] webhook + provisioning automático
- [ ] gating automático por suscripción
- [ ] emails transaccionales automatizados
- [ ] analytics comercial
- [ ] soporte in-app

---

## 15. Checklist final de salida a producción

- [ ] `Promo` funcionando en `resergo.com.ar`
- [ ] `Demo` funcionando
- [ ] CTA de contacto funcionando
- [ ] WhatsApp/formulario funcionando
- [ ] flujo comercial asistido definido
- [ ] onboarding manual documentado
- [ ] alta manual de tenant funcionando
- [ ] login owner funcionando
- [ ] entrega de acceso funcionando
- [ ] pricing visible y claro
- [ ] legal mínimo publicado
- [ ] smoke test end-to-end real

---

## 16. Tareas concretas por prioridad

> Esta sección baja el checklist estratégico a ejecución real. La idea es poder avanzar por bloques, con entregables claros y sin mezclar marketing, demo y automatización innecesaria.

### Bloque A — Separación técnica Promo vs Core (P0)

- [x] **T1. Reservar slugs técnicos faltantes de plataforma**
  - Agregar `demo` y `domains` a los slugs reservados.
  - Archivo a revisar: `backend/src/modules/tenants/tenant-provisioning.service.js`
  - Resultado esperado: ningún tenant nuevo puede nacer con esos slugs.

- [x] **T2. Cerrar la estrategia técnica de implementación de Promo**
  - Promo separada validada en `promo/landing-turnos` como app propia Vite + React + TypeScript.
  - Justificación técnica verificada: el `frontend/` actual depende de `PublicTenantProvider` y del sitio público tenantizado.
  - Archivos revisados: `promo/landing-turnos/package.json`, `promo/landing-turnos/src/`, `frontend/src/features/public/tenant/PublicTenantProvider.tsx`, `frontend/src/pages/public/HomePage.tsx`
- [ ] **T3. Diseñar el routing productivo por hostname**
  - `resergo.com.ar` y `www` → Promo
  - `demo.resergo.com.ar` → Demo
  - `*.resergo.com.ar` → Core tenants
  - `domains.resergo.com.ar` → Core custom domains
  - Archivos a revisar: `docker-compose.prod.yml`, `frontend/Caddyfile`, Caddy/reverse proxy de la VPS
  - Resultado esperado: diagrama o tabla final de routing lista para implementar.

- [ ] **T4. Evitar que el root domain pase por resolución de tenant**
  - Validar el punto donde hoy corre tenant resolution.
  - Archivos a revisar: `backend/src/app.js`, `backend/src/middleware/resolve-tenant.js`
  - Resultado esperado: entrar a `resergo.com.ar` no debe disparar `TENANT_DOMAIN_NOT_FOUND`.

### Bloque B — Promo comercial lista para vender (P1)

- [x] **T5. Convertir la landing actual en promo SaaS de Resergo**
  - Reescribir propuesta de valor para software de reservas/gestión.
  - Base reutilizable: `index.html`, `style.css`, `app.js`, `img/`
  - Resultado esperado: hero, beneficios, pricing, demo y contacto orientados a SaaS.

- [x] **T6. Reemplazar CTAs de reserva por CTAs comerciales**
  - CTAs objetivo:
    - `Probar demo`
    - `Hablar por WhatsApp`
    - `Solicitar implementación`
    - `Agendar una llamada`
  - Resultado esperado: no debe quedar CTA de signup ni flujo de alta pública.

- [ ] **T7. Definir pricing visible y simple**
  - Máximo 1 o 2 planes.
  - Incluir qué incluye la implementación inicial.
  - Resultado esperado: pricing claro, sin ambigüedad comercial.

- [x] **T8. Publicar acceso claro a la demo**
  - Botón visible hacia `demo.resergo.com.ar`.
  - Resultado esperado: el usuario entiende que puede probar antes de hablar con ustedes.

- [x] **T9. Publicar legales mínimos**
  - Términos
  - Privacidad
  - Política comercial/cancelación si aplica
  - Resultado esperado: la promo no sale sin mínimos legales visibles.

- [ ] **T10. Conectar la promo con un canal real de conversión**
  - **Recomendada**: WhatsApp + formulario simple
  - Resultado esperado: todo CTA comercial llega a un canal que alguien del equipo atiende.

### Bloque C — Demo comercial operable (P1)

- [ ] **T11. Confirmar o crear el tenant demo usando onboarding interno**
  - Base técnica existente: onboarding interno de tenant.
  - Archivo a revisar: `backend/src/modules/tenants/tenant-onboarding.service.js`
  - Resultado esperado: `demo.resergo.com.ar` queda asociado a un tenant controlado por ustedes.

- [ ] **T12. Cargar contenido demo coherente**
  - Servicios
  - Branding
  - Agenda
  - Textos
  - Resultado esperado: la demo parece un negocio real y entendible en menos de 2 minutos.

- [ ] **T13. Definir si la demo será read-only o editable con reset**
  - **Recomendada**: pública navegable + admin demo con reset periódico.
  - Resultado esperado: decisión operativa cerrada.

- [ ] **T14. Implementar estrategia de reset de demo**
  - Opciones:
    - seed re-ejecutable
    - cron
    - reseteo manual inicial
  - Resultado esperado: la demo no se degrada con el uso comercial.

### Bloque D — Flujo comercial asistido (P2)

- [ ] **T15. Definir el canal oficial de ingreso de leads**
  - Opciones:
    - WhatsApp
    - formulario
    - agenda de llamada
  - Resultado esperado: un único flujo principal, no cinco caminos improvisados.

- [ ] **T16. Definir dónde se registran los leads**
  - **Recomendada para arrancar**: Google Sheets o CRM liviano
  - Resultado esperado: cada consulta queda registrada con estado y próximo paso.

- [ ] **T17. Documentar el runbook de alta manual**
  - Datos mínimos:
    - nombre comercial
    - slug
    - email owner
    - teléfono
    - branding base
    - servicios iniciales
  - Base técnica existente: `backend/src/modules/tenants/tenant-onboarding.service.js`
  - Resultado esperado: cualquier alta manual se hace igual, sin depender de memoria humana.

- [ ] **T18. Preparar mensaje estándar de entrega de acceso**
  - Incluir URL del admin
  - usuario/email owner
  - pasos iniciales
  - canal de soporte
  - Resultado esperado: entrega prolija y repetible.

- [ ] **T19. Definir la cobranza asistida inicial**
  - Opciones:
    - link manual de Mercado Pago
    - transferencia
    - cobro asistido luego de demo/reunión
  - Resultado esperado: política simple y ejecutable sin construir checkout público.

### Bloque E — Cierre de salida comercial (P3)

- [ ] **T20. Ejecutar smoke test de hostnames**
  - Verificar:
    - root → Promo
    - `www` → Promo
    - `demo` → Demo
    - tenant real → Core
  - Resultado esperado: el routing comercial queda validado.

- [ ] **T21. Ejecutar smoke test del flujo comercial completo**
  - Recorrido mínimo:
    1. entra a Promo
    2. hace click en Demo
    3. vuelve y contacta por CTA
    4. ustedes registran lead
    5. crean tenant manualmente
    6. envían acceso
  - Resultado esperado: el circuito comercial asistido funciona de punta a punta.

- [ ] **T22. Revisar publicación mínima antes de salir**
  - pricing visible
  - CTA funcional
  - demo funcional
  - legales visibles
  - onboarding manual documentado
  - Resultado esperado: salida prolija, sin huecos obvios.

### Orden recomendado de ejecución

1. **T1 → T4**: separar técnicamente Promo de Core
2. **T5 → T10**: dejar Promo lista para vender
3. **T11 → T14**: dejar Demo estable
4. **T15 → T19**: ordenar operación comercial asistida
5. **T20 → T22**: validar salida real

### Lo que NO hacemos ahora

- signup público
- checkout self-service
- provisioning automático por webhook
- gating automático por suscripción
- trial autoservicio

Porque NO suma valor en esta etapa comercial. Primero hay que vender bien, demoear bien y dar altas manuales sin fricción. Después automatizamos.


