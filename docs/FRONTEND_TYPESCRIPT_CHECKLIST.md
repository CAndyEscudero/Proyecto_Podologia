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
- [ ] Hacer `push -u` de la rama antes de arrancar.

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

- [ ] Crear `frontend/src/styles/`.
- [ ] Crear `frontend/src/styles/index.css`.
- [ ] Crear `frontend/src/styles/tokens.css`.
- [ ] Crear `frontend/src/styles/base.css`.
- [ ] Crear `frontend/src/styles/components.css`.
- [ ] Crear `frontend/src/styles/utilities.css`.

### Reubicacion de estilos actuales

- [ ] Mover reglas globales desde `frontend/src/index.css` a `base.css`.
- [ ] Mover clases reutilizables (`.card-surface`, `.field-input`, etc.) a `components.css`.
- [ ] Mover variables o tokens visuales a `tokens.css`.
- [ ] Dejar `styles/index.css` como punto de entrada de Tailwind.
- [ ] Actualizar el import en `main.tsx`.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Comparar visualmente home.
- [ ] Comparar visualmente booking.
- [ ] Comparar visualmente admin login.

## Etapa 3 - Shared y config

### Config

- [ ] Migrar `frontend/src/app/siteConfig.js` a `frontend/src/app/config/site-config.ts`.
- [ ] Crear `frontend/src/app/config/env.ts` si hace falta centralizar variables.

### Shared API y utils

- [ ] Migrar `frontend/src/lib/http.js` a `frontend/src/shared/api/http.ts`.
- [ ] Migrar `frontend/src/utils/auth.js` a `frontend/src/shared/utils/auth.ts`.
- [ ] Migrar `frontend/src/utils/whatsapp.js` a `frontend/src/shared/utils/whatsapp.ts`.
- [ ] Migrar `frontend/src/hooks/useAuthGuard.jsx` a `frontend/src/shared/hooks/useAuthGuard.tsx`.

### Shared UI

- [ ] Migrar `frontend/src/components/ui/Button.jsx` a `frontend/src/shared/ui/button/Button.tsx`.
- [ ] Migrar `frontend/src/components/ui/SectionHeading.jsx` a `frontend/src/shared/ui/section-heading/SectionHeading.tsx`.
- [ ] Tipar props de los componentes shared exportados.

### Tipos base compartidos

- [ ] Crear `frontend/src/shared/types/common.ts`.
- [ ] Crear `frontend/src/shared/types/api.ts`.
- [ ] Crear tipos para respuestas simples de auth y errores comunes.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Verificar login admin.
- [ ] Verificar navegación pública.
- [ ] Verificar que el token sigue guardándose y limpiándose bien.

## Etapa 4 - Router, layouts y shell de la app

### Router

- [ ] Migrar `frontend/src/routes/router.jsx` a `frontend/src/app/router/index.tsx`.
- [ ] Tipar navegación protegida y rutas públicas.

### Layouts

- [ ] Migrar `frontend/src/layouts/PublicLayout.jsx` a `frontend/src/layouts/PublicLayout.tsx`.
- [ ] Migrar `frontend/src/layouts/AdminLayout.jsx` a `frontend/src/layouts/AdminLayout.tsx`.
- [ ] Tipar props y estados simples de layout.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Verificar home.
- [ ] Verificar reservas.
- [ ] Verificar admin login.
- [ ] Verificar admin dashboard con sesión iniciada.

## Etapa 5 - Tipos de dominio

### Tipos funcionales

- [ ] Crear tipo `AppointmentStatus`.
- [ ] Crear tipo `Client`.
- [ ] Crear tipo `Service`.
- [ ] Crear tipo `Appointment`.
- [ ] Crear tipo `AvailabilitySlot`.
- [ ] Crear tipo `AvailabilityRule`.
- [ ] Crear tipo `BlockedDate`.
- [ ] Crear tipo `BusinessSettings`.
- [ ] Crear tipo `User`.

### Payloads

- [ ] Crear `LoginPayload`.
- [ ] Crear `CreateAppointmentPayload`.
- [ ] Crear `UpdateAppointmentPayload`.
- [ ] Crear `RescheduleAppointmentPayload`.
- [ ] Crear `CreateServicePayload`.
- [ ] Crear `UpdateServicePayload`.
- [ ] Crear `CreateAvailabilityRulePayload`.
- [ ] Crear `CreateBlockedDatePayload`.
- [ ] Crear `UpdateBusinessSettingsPayload`.

### Responses

- [ ] Crear `LoginResponse`.
- [ ] Crear `MeResponse`.
- [ ] Crear `CreateAppointmentResponse`.
- [ ] Crear `AvailableSlotsResponse`.

## Etapa 6 - APIs por feature

### Booking

- [ ] Crear `frontend/src/features/booking/api/booking.api.ts`.
- [ ] Migrar llamadas públicas de servicios.
- [ ] Migrar llamadas públicas de disponibilidad.
- [ ] Migrar creación pública de turnos.

### Admin auth

- [ ] Crear `frontend/src/features/admin/auth/api/auth.api.ts`.
- [ ] Mover `login` y `getMe`.

### Admin appointments

- [ ] Crear `frontend/src/features/admin/appointments/api/appointments.api.ts`.
- [ ] Mover `getAppointments`.
- [ ] Mover `createAppointment`.
- [ ] Mover `updateAppointment`.
- [ ] Mover `deleteAppointment`.
- [ ] Mover `updateAppointmentStatus`.
- [ ] Mover `rescheduleAppointment`.

### Admin services

- [ ] Crear `frontend/src/features/admin/services/api/services.api.ts`.
- [ ] Mover `getServices`.
- [ ] Mover `createService`.
- [ ] Mover `updateService`.
- [ ] Mover `deleteService`.

### Admin availability

- [ ] Crear `frontend/src/features/admin/availability/api/availability.api.ts`.
- [ ] Mover `getAvailableSlots`.
- [ ] Mover `getAvailabilityRules`.
- [ ] Mover `createAvailabilityRule`.
- [ ] Mover `updateAvailabilityRule`.
- [ ] Mover `deleteAvailabilityRule`.
- [ ] Mover `getBlockedDates`.
- [ ] Mover `createBlockedDate`.
- [ ] Mover `deleteBlockedDate`.

### Admin business settings

- [ ] Crear `frontend/src/features/admin/business-settings/api/business-settings.api.ts`.
- [ ] Mover `getBusinessSettings`.
- [ ] Mover `updateBusinessSettings`.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Verificar login admin.
- [ ] Verificar carga del dashboard.
- [ ] Verificar carga de booking.

## Etapa 7 - Home

### Tipos y data

- [ ] Crear `frontend/src/features/home/types/home.types.ts`.
- [ ] Migrar `frontend/src/data/homeContent.js` a `frontend/src/features/home/data/home-content.ts`.

### Componentes

- [ ] Migrar `AboutSection`.
- [ ] Migrar `BenefitsSection`.
- [ ] Migrar `ContactSection`.
- [ ] Migrar `FaqSection`.
- [ ] Migrar `HeroSection`.
- [ ] Migrar `ServicesSection`.
- [ ] Migrar `TestimonialsSection`.

### Pantalla

- [ ] Migrar `frontend/src/pages/public/HomePage.jsx` a `.tsx`.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Revisar home completa en desktop.
- [ ] Revisar home completa en mobile.

## Etapa 8 - Booking

### Tipos y helpers

- [ ] Crear `frontend/src/features/booking/types/booking.types.ts`.
- [ ] Crear `frontend/src/features/booking/utils/booking-formatters.ts` si hace falta.
- [ ] Crear `frontend/src/features/booking/hooks/useBookingAvailability.ts` si conviene extraer lógica.

### Componentes

- [ ] Migrar `BookingCalendar.jsx` a `.tsx`.
- [ ] Migrar `BookingForm.jsx` a `.tsx`.
- [ ] Tipar estados, props y respuestas API del flujo.

### Pantalla

- [ ] Migrar `frontend/src/pages/public/BookingPage.jsx` a `.tsx`.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
- [ ] Verificar flujo completo de reserva.
- [ ] Verificar servicio -> fecha -> horario -> datos.
- [ ] Verificar errores de disponibilidad.
- [ ] Verificar sugerencia de próxima fecha.

## Etapa 9 - Admin simple

### Navegacion y resumen

- [ ] Migrar `AdminSidebar.jsx` a `.tsx`.
- [ ] Migrar `AdminSummary.jsx` a `.tsx`.

### Servicios

- [ ] Migrar `ServicesManager.jsx` a `.tsx`.

### Disponibilidad

- [ ] Migrar `AvailabilityManager.jsx` a `.tsx`.

### Business settings

- [ ] Migrar `BusinessSettingsPanel.jsx` a `.tsx`.

### Validacion de cierre

- [ ] `npm --prefix frontend run build`
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
