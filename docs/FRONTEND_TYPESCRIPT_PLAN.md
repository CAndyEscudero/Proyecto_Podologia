# Plan de orden y migracion del frontend a TypeScript

## Objetivo

Ordenar el frontend actual para que:

- sea mas facil trabajar en paralelo entre dos personas
- tenga contratos de datos claros entre API, pantallas y componentes
- reduzca errores de props, payloads y estados
- mantenga Tailwind ordenado sin dispersar estilos por todo el repo

La recomendacion es migrar **solo el frontend primero** y hacerlo de forma **gradual**, no con un cambio gigante.

## Estado actual del frontend

Hoy el frontend esta organizado asi:

- `app/`: config simple
- `components/`: componentes de UI y bloques de negocio
- `data/`: contenido estatico
- `hooks/`: hooks compartidos
- `layouts/`: layouts publico/admin
- `lib/`: cliente HTTP
- `pages/`: pantallas
- `routes/`: router
- `services/`: llamadas a API
- `utils/`: helpers simples

Puntos fuertes actuales:

- la separacion por responsabilidades ya existe
- los dominios del producto estan bastante claros
- Tailwind ya esta centralizado parcialmente en `index.css`

Problemas actuales para escalar:

- no hay tipos compartidos para `Appointment`, `Service`, `Client`, `BusinessSettings`, etc.
- `adminApi.js` y `publicApi.js` devuelven datos sin contrato tipado
- varios componentes grandes concentran UI, estado y transformaciones
- `index.css` mezcla base global, layout helpers y componentes visuales
- el router, los layouts y los servicios aun no exponen interfaces reutilizables

## Estructura objetivo recomendada

La propuesta es pasar de una estructura solo por capas a una estructura mixta:

- `shared/` para piezas reutilizables
- `features/` para dominios del producto
- `pages/` para composicion final de pantallas

```text
frontend/src/
  app/
    providers/
      AppProviders.tsx
    router/
      index.tsx
    config/
      env.ts
      site-config.ts
    types/
      env.d.ts

  shared/
    api/
      http.ts
      api-error.ts
    ui/
      button/
        Button.tsx
      section-heading/
        SectionHeading.tsx
    hooks/
      useAuthGuard.tsx
    utils/
      auth.ts
      whatsapp.ts
      date.ts
      format.ts
    types/
      common.ts
      api.ts

  features/
    booking/
      api/
        booking.api.ts
      components/
        BookingCalendar.tsx
        BookingForm.tsx
      hooks/
        useBookingAvailability.ts
      types/
        booking.types.ts
      utils/
        booking-formatters.ts

    admin/
      appointments/
        api/
          appointments.api.ts
        components/
          AppointmentsManager.tsx
          AppointmentsTable.tsx
          AdminSummary.tsx
        types/
          appointments.types.ts

      availability/
        api/
          availability.api.ts
        components/
          AvailabilityManager.tsx
        types/
          availability.types.ts

      services/
        api/
          services.api.ts
        components/
          ServicesManager.tsx
        types/
          services.types.ts

      business-settings/
        api/
          business-settings.api.ts
        components/
          BusinessSettingsPanel.tsx
        types/
          business-settings.types.ts

      navigation/
        components/
          AdminSidebar.tsx
        types/
          navigation.types.ts

    home/
      components/
        AboutSection.tsx
        BenefitsSection.tsx
        ContactSection.tsx
        FaqSection.tsx
        HeroSection.tsx
        ServicesSection.tsx
        TestimonialsSection.tsx
      data/
        home-content.ts
      types/
        home.types.ts

  layouts/
    AdminLayout.tsx
    PublicLayout.tsx

  pages/
    admin/
      AdminDashboardPage.tsx
      AdminLoginPage.tsx
    public/
      BookingPage.tsx
      HomePage.tsx

  styles/
    index.css
    tokens.css
    base.css
    components.css
    utilities.css

  main.tsx
```

## Mapeo desde la estructura actual

### Config y bootstrap

- `main.jsx` -> `main.tsx`
- `routes/router.jsx` -> `app/router/index.tsx`
- `app/siteConfig.js` -> `app/config/site-config.ts`

### Shared

- `lib/http.js` -> `shared/api/http.ts`
- `utils/auth.js` -> `shared/utils/auth.ts`
- `utils/whatsapp.js` -> `shared/utils/whatsapp.ts`
- `hooks/useAuthGuard.jsx` -> `shared/hooks/useAuthGuard.tsx`
- `components/ui/Button.jsx` -> `shared/ui/button/Button.tsx`
- `components/ui/SectionHeading.jsx` -> `shared/ui/section-heading/SectionHeading.tsx`

### Features

- `components/booking/*` -> `features/booking/components/*`
- `services/publicApi.js` -> `features/booking/api/booking.api.ts`

- `components/admin/AppointmentsManager.jsx` -> `features/admin/appointments/components/AppointmentsManager.tsx`
- `components/admin/AppointmentsTable.jsx` -> `features/admin/appointments/components/AppointmentsTable.tsx`
- `components/admin/AdminSummary.jsx` -> `features/admin/appointments/components/AdminSummary.tsx`
- `components/admin/AvailabilityManager.jsx` -> `features/admin/availability/components/AvailabilityManager.tsx`
- `components/admin/ServicesManager.jsx` -> `features/admin/services/components/ServicesManager.tsx`
- `components/admin/BusinessSettingsPanel.jsx` -> `features/admin/business-settings/components/BusinessSettingsPanel.tsx`
- `components/admin/AdminSidebar.jsx` -> `features/admin/navigation/components/AdminSidebar.tsx`
- `services/adminApi.js` -> repartirlo entre APIs de cada feature

- `components/home/*` -> `features/home/components/*`
- `data/homeContent.js` -> `features/home/data/home-content.ts`

### Pages y layouts

- `pages/admin/*` -> `pages/admin/*`
- `pages/public/*` -> `pages/public/*`
- `layouts/*` -> `layouts/*`

## Tipos base que conviene crear primero

La migracion del frontend va a ser mucho mas sana si antes de tocar componentes creamos estos tipos:

### Dominio

```ts
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "CANCELED" | "COMPLETED";

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  notes: string | null;
}

export interface Service {
  id: number;
  name: string;
  slug: string;
  description: string;
  durationMin: number;
  priceCents: number | null;
  isActive: boolean;
}

export interface Appointment {
  id: number;
  clientId: number;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  source: string;
  client: Client;
  service: Service;
}

export interface AvailabilityRule {
  id: number;
  dayOfWeek: number;
  type: "WORKING_HOURS" | "BREAK";
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface BlockedDate {
  id: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface BusinessSettings {
  id: number;
  businessName: string;
  contactEmail: string | null;
  phone: string | null;
  address: string | null;
  appointmentGapMin: number;
  bookingWindowDays: number;
  timezone: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  isActive: boolean;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}
```

### Payloads

Estos tipos deben existir separados de las entidades:

- `LoginPayload`
- `CreateAppointmentPayload`
- `UpdateAppointmentPayload`
- `RescheduleAppointmentPayload`
- `CreateServicePayload`
- `UpdateServicePayload`
- `CreateAvailabilityRulePayload`
- `CreateBlockedDatePayload`
- `UpdateBusinessSettingsPayload`

### Responses

Conviene tipar tambien respuestas que hoy estan implicitas:

- `LoginResponse`
- `MeResponse`
- `CreateAppointmentResponse`
- `AvailableSlotsResponse`

## Orden recomendado de migracion

### Etapa 1: infraestructura minima

1. Agregar TypeScript al frontend.
2. Crear `tsconfig.json`.
3. Renombrar `main.jsx` a `main.tsx`.
4. Tipar `vite-env.d.ts` o `env.d.ts`.
5. Cambiar `tailwind.config.js` para aceptar `ts` y `tsx` en `content`.

Objetivo: que el frontend compile con TS sin migrar aun toda la app.

### Etapa 2: capa shared

Migrar primero lo mas estable y de bajo riesgo:

- `shared/api/http.ts`
- `shared/utils/auth.ts`
- `shared/utils/whatsapp.ts`
- `shared/ui/button/Button.tsx`
- `shared/ui/section-heading/SectionHeading.tsx`
- `app/config/site-config.ts`

Objetivo: crear base tipada y reutilizable.

### Etapa 3: tipos de dominio

Crear:

- `features/admin/appointments/types/appointments.types.ts`
- `features/admin/services/types/services.types.ts`
- `features/admin/availability/types/availability.types.ts`
- `features/admin/business-settings/types/business-settings.types.ts`
- `features/booking/types/booking.types.ts`
- `shared/types/api.ts`

Objetivo: dejar de usar objetos anonimos en componentes y servicios.

### Etapa 4: APIs

Separar y tipar servicios:

- `features/booking/api/booking.api.ts`
- `features/admin/appointments/api/appointments.api.ts`
- `features/admin/services/api/services.api.ts`
- `features/admin/availability/api/availability.api.ts`
- `features/admin/business-settings/api/business-settings.api.ts`
- `features/admin/auth/api/auth.api.ts`

Objetivo: que cada feature conozca sus propios contratos.

### Etapa 5: router, layouts y pages

Migrar:

- `app/router/index.tsx`
- `layouts/AdminLayout.tsx`
- `layouts/PublicLayout.tsx`
- `pages/public/*`
- `pages/admin/*`

Objetivo: consolidar composicion general de la app.

### Etapa 6: componentes por feature

Orden sugerido:

1. `home`
2. `booking`
3. `admin` componentes simples
4. `AppointmentsManager` y `AdminDashboardPage` al final

Motivo: `AppointmentsManager` y `AdminDashboardPage` concentran mucha logica y son los mas costosos.

## Estructura de estilos recomendada

Hoy `index.css` centraliza todo. Para crecer mejor con Tailwind conviene partirlo asi:

```text
frontend/src/styles/
  index.css
  tokens.css
  base.css
  components.css
  utilities.css
```

### `tokens.css`

Solo variables de diseño:

- radios
- sombras
- colores de marca en CSS variables
- alturas y paddings repetidos

### `base.css`

Solo reglas globales:

- `html`
- `body`
- `#root`
- tipografia base
- fondos base de la app

### `components.css`

Solo clases reutilizables y declarativas:

- `.card-surface`
- `.field-input`
- `.container-shell`
- `.admin-shell-container`
- `.section-title`
- `.section-copy`

### `utilities.css`

Solo helpers muy concretos y pocos:

- overlays
- badges puntuales
- patterns repetidos si aparecen en mas de 3 lugares

### `index.css`

Debe quedar como punto de entrada:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import "./tokens.css";
@import "./base.css";
@import "./components.css";
@import "./utilities.css";
```

## Convenciones recomendadas

### Archivos

- componentes: `PascalCase.tsx`
- hooks: `useX.ts`
- tipos: `feature.types.ts`
- APIs: `feature.api.ts`
- utilidades: `camelCase.ts`

### Tipado

- evitar `any`
- preferir `unknown` si algo llega externo y validar
- tipar props de todos los componentes exportados
- tipar respuestas de Axios
- no mezclar tipos de entidad con payloads de formularios

### Formularios

Con `react-hook-form` + `zod`:

- el schema vive junto al formulario
- el tipo se infiere desde Zod cuando convenga
- los payloads enviados al backend se mapean explicitamente

## Riesgos y puntos delicados

### 1. `AdminDashboardPage.jsx`

Es el archivo mas cargado de estado y logica. No conviene arrancar por ahi.

### 2. `services/adminApi.js`

Hoy mezcla auth, turnos, servicios, disponibilidad y negocio. Conviene partirlo antes o durante la migracion.

### 3. `BookingForm.jsx`

Tiene bastante estado y varios pasos. Se puede migrar, pero despues de tipar primero `Service`, `AvailabilitySlot` y payloads.

### 4. `index.css`

No esta mal, pero si seguimos agregando clases reutilizables ahi sin separar, se va a volver una bolsa de estilos.

## Rama recomendada para hacer esto

Crear una rama especifica:

```bash
git checkout main
git pull origin main
git checkout -b chore/frontend-typescript-foundation
git push -u origin chore/frontend-typescript-foundation
```

## Primer alcance sugerido para el primer PR o primer bloque de trabajo

No migrar todo de una. El primer bloque deberia ser:

1. agregar TypeScript al frontend
2. crear `tsconfig.json`
3. migrar `main`, `router`, `site-config`, `http`, `auth`, `whatsapp`
4. crear carpeta `shared/types`
5. mover estilos a `styles/`
6. ajustar `tailwind.config.js` para `ts` y `tsx`

Si ese bloque queda estable, recien despues seguir con:

1. `home`
2. `booking`
3. `admin`

## Criterio de exito

Vamos bien si al final de la primera etapa:

- el frontend sigue compilando
- la app sigue levantando con Vite
- el router y layouts ya estan en TS
- la capa shared ya no usa objetos sin contrato
- el CSS global ya esta separado en `styles/`
- la base esta lista para migrar features sin caos
