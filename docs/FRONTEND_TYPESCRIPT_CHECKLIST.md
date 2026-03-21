# Checklist de Migracion del Frontend a TypeScript

## Objetivo

Migrar el frontend a TypeScript de forma gradual, manteniendo la app funcional, compilando en cada etapa y sin mezclar una refactor grande con cambios de negocio innecesarios.

## Reglas de trabajo

- [ ] Trabajar esta migracion en una rama dedicada.
- [ ] No mezclar Mercado Pago, WhatsApp ni cambios grandes de UX en esta rama.
- [ ] Mantener commits chicos por etapa.
- [ ] Verificar `npm --prefix frontend run build` al cierre de cada bloque importante.
- [ ] No avanzar a una etapa nueva si la anterior no queda estable.

## Rama recomendada

- [x] Crear rama `chore/frontend-typescript-foundation`.
- [x] Hacer `push -u` de la rama antes de arrancar.

## Etapa 0 - Preparacion

### Inventario y base actual

- [ ] Confirmar que `frontend/` levanta correctamente antes de tocar nada.
- [x] Confirmar que `npm --prefix frontend run build` pasa en la base actual.
- [ ] Confirmar que `tailwind.config.js` y `vite.config.js` estan sanos.
- [ ] Confirmar que no hay cambios pendientes no relacionados antes de arrancar.

### Definiciones previas

- [ ] Acordar estructura objetivo: `app`, `shared`, `features`, `pages`, `layouts`, `styles`.
- [ ] Acordar convenciones de nombres: `.ts`, `.tsx`, `PascalCase`, `camelCase`.
- [ ] Acordar que evitamos `any` salvo caso excepcional y documentado.

## Etapa 1 - Fundacion TypeScript

### Tooling

- [x] Instalar `typescript` en `frontend`.
- [x] Instalar tipos base necesarios (`@types/react`, `@types/react-dom`).
- [x] Crear `tsconfig.json`.
- [x] Crear `vite-env.d.ts` o `env.d.ts`.
- [x] Ajustar `tailwind.config.js` para incluir `ts` y `tsx` en `content`.

### Bootstrap minimo

- [x] Migrar `frontend/src/main.jsx` a `frontend/src/main.tsx`.
- [ ] Confirmar que Vite sigue levantando.
- [x] Confirmar que el build sigue pasando.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Verificar que la home abre correctamente.
- [ ] Verificar que `/reservas` abre correctamente.
- [ ] Verificar que `/admin/login` abre correctamente.

## Etapa 2 - Orden de estilos y Tailwind

### Nueva estructura de estilos

- [x] Crear `frontend/src/styles/`.
- [x] Crear `frontend/src/styles/index.css`.
- [x] Crear `frontend/src/styles/tokens.css`.
- [x] Crear `frontend/src/styles/base.css`.
- [x] Crear `frontend/src/styles/components.css`.
- [x] Crear `frontend/src/styles/utilities.css`.

### Reubicacion de estilos actuales

- [x] Mover reglas globales desde `frontend/src/index.css` a `base.css`.
- [x] Mover clases reutilizables (`.card-surface`, `.field-input`, etc.) a `components.css`.
- [x] Mover variables o tokens visuales a `tokens.css`.
- [x] Dejar `styles/index.css` como punto de entrada de Tailwind.
- [x] Actualizar el import en `main.tsx`.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Comparar visualmente home.
- [ ] Comparar visualmente booking.
- [ ] Comparar visualmente admin login.

## Etapa 3 - Shared y config

### Config

- [x] Migrar `frontend/src/app/siteConfig.js` a `frontend/src/app/config/site-config.ts`.
- [x] Crear `frontend/src/app/config/env.ts` si hace falta centralizar variables.

### Shared API y utils

- [x] Migrar `frontend/src/lib/http.js` a `frontend/src/shared/api/http.ts`.
- [x] Migrar `frontend/src/utils/auth.js` a `frontend/src/shared/utils/auth.ts`.
- [x] Migrar `frontend/src/utils/whatsapp.js` a `frontend/src/shared/utils/whatsapp.ts`.
- [x] Migrar `frontend/src/hooks/useAuthGuard.jsx` a `frontend/src/shared/hooks/useAuthGuard.tsx`.

### Shared UI

- [x] Migrar `frontend/src/components/ui/Button.jsx` a `frontend/src/shared/ui/button/Button.tsx`.
- [x] Migrar `frontend/src/components/ui/SectionHeading.jsx` a `frontend/src/shared/ui/section-heading/SectionHeading.tsx`.
- [x] Tipar props de los componentes shared exportados.

### Tipos base compartidos

- [x] Crear `frontend/src/shared/types/common.ts`.
- [x] Crear `frontend/src/shared/types/api.ts`.
- [x] Crear tipos para respuestas simples de auth y errores comunes.

### Validacion de cierre

- [x] `npm --prefix frontend run build`
- [ ] Verificar login admin.
- [ ] Verificar navegación pública.
- [ ] Verificar que el token sigue guardándose y limpiándose bien.

## Etapa 4 - Router, layouts y shell de la app

### Router

- [x] Migrar `frontend/src/routes/router.jsx` a `frontend/src/app/router/index.tsx`.
- [x] Tipar navegación protegida y rutas públicas.

### Layouts

- [x] Migrar `frontend/src/layouts/PublicLayout.jsx` a `frontend/src/layouts/PublicLayout.tsx`.
- [x] Migrar `frontend/src/layouts/AdminLayout.jsx` a `frontend/src/layouts/AdminLayout.tsx`.
- [x] Tipar props y estados simples de layout.

### Validacion de cierre

- [x] `npm --prefix frontend run build`
- [ ] Verificar home.
- [ ] Verificar reservas.
- [ ] Verificar admin login.
- [ ] Verificar admin dashboard con sesión iniciada.

## Etapa 5 - Tipos de dominio

### Tipos funcionales

- [x] Crear tipo `AppointmentStatus`.
- [x] Crear tipo `Client`.
- [x] Crear tipo `Service`.
- [x] Crear tipo `Appointment`.
- [x] Crear tipo `AvailabilitySlot`.
- [x] Crear tipo `AvailabilityRule`.
- [x] Crear tipo `BlockedDate`.
- [x] Crear tipo `BusinessSettings`.
- [x] Crear tipo `User`.

### Payloads

- [x] Crear `LoginPayload`.
- [x] Crear `CreateAppointmentPayload`.
- [x] Crear `UpdateAppointmentPayload`.
- [x] Crear `RescheduleAppointmentPayload`.
- [x] Crear `CreateServicePayload`.
- [x] Crear `UpdateServicePayload`.
- [x] Crear `CreateAvailabilityRulePayload`.
- [x] Crear `CreateBlockedDatePayload`.
- [x] Crear `UpdateBusinessSettingsPayload`.

### Responses

- [x] Crear `LoginResponse`.
- [x] Crear `MeResponse`.
- [x] Crear `CreateAppointmentResponse`.
- [x] Crear `AvailableSlotsResponse`.

## Etapa 6 - APIs por feature

### Booking

- [x] Crear `frontend/src/features/booking/api/booking.api.ts`.
- [x] Migrar llamadas públicas de servicios.
- [x] Migrar llamadas públicas de disponibilidad.
- [x] Migrar creación pública de turnos.

### Admin auth

- [x] Crear `frontend/src/features/admin/auth/api/auth.api.ts`.
- [x] Mover `login` y `getMe`.

### Admin appointments

- [x] Crear `frontend/src/features/admin/appointments/api/appointments.api.ts`.
- [x] Mover `getAppointments`.
- [x] Mover `createAppointment`.
- [x] Mover `updateAppointment`.
- [x] Mover `deleteAppointment`.
- [x] Mover `updateAppointmentStatus`.
- [x] Mover `rescheduleAppointment`.

### Admin services

- [x] Crear `frontend/src/features/admin/services/api/services.api.ts`.
- [x] Mover `getServices`.
- [x] Mover `createService`.
- [x] Mover `updateService`.
- [x] Mover `deleteService`.

### Admin availability

- [x] Crear `frontend/src/features/admin/availability/api/availability.api.ts`.
- [x] Mover `getAvailableSlots`.
- [x] Mover `getAvailabilityRules`.
- [x] Mover `createAvailabilityRule`.
- [x] Mover `updateAvailabilityRule`.
- [x] Mover `deleteAvailabilityRule`.
- [x] Mover `getBlockedDates`.
- [x] Mover `createBlockedDate`.
- [x] Mover `deleteBlockedDate`.

### Admin business settings

- [x] Crear `frontend/src/features/admin/business-settings/api/business-settings.api.ts`.
- [x] Mover `getBusinessSettings`.
- [x] Mover `updateBusinessSettings`.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Verificar login admin.
- [ ] Verificar carga del dashboard.
- [ ] Verificar carga de booking.

## Etapa 7 - Home

### Tipos y data

- [x] Crear `frontend/src/features/home/types/home.types.ts`.
- [x] Migrar `frontend/src/data/homeContent.js` a `frontend/src/features/home/data/home-content.ts`.

### Componentes

- [x] Migrar `AboutSection`.
- [x] Migrar `BenefitsSection`.
- [x] Migrar `ContactSection`.
- [x] Migrar `FaqSection`.
- [x] Migrar `HeroSection`.
- [x] Migrar `ServicesSection`.
- [x] Migrar `TestimonialsSection`.

### Pantalla

- [x] Migrar `frontend/src/pages/public/HomePage.jsx` a `.tsx`.

### Validacion de cierre

- [x] `npm --prefix frontend run build`
- [ ] Revisar home completa en desktop.
- [ ] Revisar home completa en mobile.

## Etapa 8 - Booking

### Tipos y helpers

- [x] Crear `frontend/src/features/booking/types/booking.types.ts`.
- [x] Crear `frontend/src/features/booking/utils/booking-formatters.ts` si hace falta.
- [x] Crear `frontend/src/features/booking/hooks/useBookingAvailability.ts` si conviene extraer lógica.

### Componentes

- [x] Migrar `BookingCalendar.jsx` a `.tsx`.
- [x] Migrar `BookingForm.jsx` a `.tsx`.
- [x] Tipar estados, props y respuestas API del flujo.

### Pantalla

- [x] Migrar `frontend/src/pages/public/BookingPage.jsx` a `.tsx`.

### Validacion de cierre

- [x] `npm --prefix frontend run build`
- [ ] Verificar flujo completo de reserva.
- [ ] Verificar servicio -> fecha -> horario -> datos.
- [ ] Verificar errores de disponibilidad.
- [ ] Verificar sugerencia de próxima fecha.

## Etapa 9 - Admin simple

### Navegacion y resumen

- [x] Migrar `AdminSidebar.jsx` a `.tsx`.
- [x] Migrar `AdminSummary.jsx` a `.tsx`.

### Servicios

- [x] Migrar `ServicesManager.jsx` a `.tsx`.

### Disponibilidad

- [x] Migrar `AvailabilityManager.jsx` a `.tsx`.

### Business settings

- [x] Migrar `BusinessSettingsPanel.jsx` a `.tsx`.

### Validacion de cierre

- [x] `npm --prefix frontend run build`
- [ ] Verificar gestión de servicios.
- [ ] Verificar gestión de reglas.
- [ ] Verificar bloqueos.
- [ ] Verificar configuración del negocio.

## Etapa 10 - Admin complejo

### Turnos

- [ ] Migrar `AppointmentsTable.jsx` a `.tsx`.
- [ ] Migrar `AppointmentsManager.jsx` a `.tsx`.
- [ ] Reducir tipos inline y objetos anónimos.

### Dashboard

- [ ] Migrar `frontend/src/pages/admin/AdminDashboardPage.jsx` a `.tsx`.
- [ ] Tipar filtros, estados y handlers.
- [ ] Evaluar extraer hooks o helpers si el archivo sigue muy cargado.

### Login

- [ ] Migrar `frontend/src/pages/admin/AdminLoginPage.jsx` a `.tsx`.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Verificar login admin.
- [ ] Verificar dashboard.
- [ ] Verificar alta manual de turno.
- [ ] Verificar edición.
- [ ] Verificar reprogramación.
- [ ] Verificar eliminación.
- [ ] Verificar filtros por rango, estado, servicio y cliente.

## Etapa 11 - Limpieza final

### Limpieza de estructura vieja

- [ ] Eliminar imports viejos ya reemplazados.
- [ ] Eliminar archivos `.js` y `.jsx` migrados que ya no se usen.
- [ ] Eliminar carpetas viejas si quedaron duplicadas.
- [ ] Revisar rutas relativas y aliases si hiciera falta.

### Calidad

- [ ] Buscar usos de `any`.
- [ ] Buscar imports rotos.
- [ ] Buscar archivos sin tipo de props exportadas.
- [ ] Revisar warnings de compilación.

### Validacion final

- [ ] `npm --prefix frontend run build`
- [ ] Levantar la app y hacer smoke test general.
- [ ] Confirmar que booking funciona.
- [ ] Confirmar que admin funciona.
- [ ] Confirmar que Tailwind quedó ordenado en `styles/`.

## Checklist de verificacion rapida por cada PR o bloque

- [ ] `git status` limpio antes de cerrar.
- [ ] Build del frontend OK.
- [ ] Sin imports rotos.
- [ ] Sin cambios mezclados de negocio fuera del alcance.
- [ ] Sin archivos basura (`dist`, logs, etc.).
- [ ] Commit con mensaje claro.

## Orden recomendado real de trabajo

1. Etapa 1
2. Etapa 2
3. Etapa 3
4. Etapa 4
5. Etapa 5
6. Etapa 6
7. Etapa 7
8. Etapa 8
9. Etapa 9
10. Etapa 10
11. Etapa 11

## Criterio para pausar o replanificar

- [ ] Si una etapa rompe build y cuesta aislarla, dividirla en sub-etapas mas chicas.
- [ ] Si una feature activa entra en conflicto con la migracion, congelar esa zona y seguir con otra.
- [ ] Si `AdminDashboardPage` queda demasiado grande, extraer hooks/helpers antes de seguir tipando en bruto.
