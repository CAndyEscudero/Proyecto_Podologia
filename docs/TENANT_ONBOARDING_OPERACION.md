# Onboarding Interno de Tenants

## Objetivo

Dar de alta un nuevo negocio sin tocar codigo, usando un archivo JSON y un script interno.

Este flujo crea en una sola corrida:

- tenant
- owner inicial
- subdominio de plataforma
- business settings iniciales
- servicios iniciales
- horarios iniciales
- dominio custom opcional en estado `PENDING`

## Comando

Desde `backend/`:

```bash
npm run tenant:onboard -- --input scripts/tenant-onboarding.example.json
```

Para validar sin escribir en base:

```bash
npm run tenant:onboard -- --input scripts/tenant-onboarding.example.json --dry-run
```

En `dry-run` se valida estructura, normalizacion y payload final.
Las colisiones reales de slug, email y dominio se validan en la corrida real contra la base.

## Archivo de ejemplo

Usar como base:

- [backend/scripts/tenant-onboarding.example.json](/c:/Users/Emula/Desktop/proyecto%20podologia/backend/scripts/tenant-onboarding.example.json)

## Que se puede configurar en el JSON

### Tenant

- `name`
- `requestedSlug`
- `businessType`
- `status`

### Owner inicial

- `fullName`
- `email`
- `password`

### Business settings

- nombre comercial
- email
- telefono
- direccion
- timezone
- ventana de reserva
- gap entre turnos
- porcentaje de seña
- email transaccional
- WhatsApp
- Mercado Pago

### Servicios

Tres modos:

- `template`
- `custom`
- `none`

Plantillas disponibles:

- `GENERIC_BASIC`
- `PODOLOGY_BASIC`
- `HAIR_BASIC`
- `NAILS_BASIC`

### Horarios

Tres modos:

- `template`
- `custom`
- `none`

Plantillas disponibles:

- `WEEKDAYS_9_TO_18`
- `WEEKDAYS_10_TO_19`
- `TUESDAY_TO_SATURDAY_10_TO_19`

### Dominio custom

- `domains.customDomain`

Si se informa, queda creado como `PENDING`.
Despues hay que verificar DNS desde el panel y, si corresponde, pasarlo a dominio principal.

## Estados de tenant soportados

- `PENDING`
- `ACTIVE`
- `SUSPENDED`
- `CANCELLED`

Recomendacion:

- usar `ACTIVE` si el tenant ya puede operar
- usar `PENDING` si todavia se esta configurando o esperando aprobacion

## Resultado esperado

El script devuelve un resumen con:

- tenant creado
- owner creado
- hostname admin
- dominio custom si se cargo
- cantidad de servicios creados
- cantidad de reglas horarias creadas

## Notas operativas

- el email del owner sigue siendo unico global en v1
- el dominio custom no desplaza automaticamente al subdominio de plataforma
- el dominio custom arranca en `PENDING`
- el admin sigue entrando por el subdominio de plataforma
