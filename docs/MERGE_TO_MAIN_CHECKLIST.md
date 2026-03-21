# Checklist para Migrar `chore/frontend-typescript-foundation` a `main`

## Objetivo

Cerrar los cambios pendientes de la rama actual, validarlos, commitearlos en bloques prolijos y mergearlos a `main` sin arrastrar basura ni mezclar trabajo incompleto.

## Paso 1 - Revision inicial

- [x] Confirmar rama actual.
- [x] Revisar `git status`.
- [x] Separar cambios pendientes por bloque funcional.
- [x] Confirmar que no queden archivos borrados por accidente.

## Paso 2 - Validacion tecnica

- [x] Correr `tsc --noEmit` en `frontend`.
- [x] Correr `vite build` en `frontend`.
- [ ] Validar al menos el flujo publico tocado:
  - [ ] boton de servicio en home
  - [ ] preseleccion de servicio en booking
  - [ ] hash scroll en layout publico
- [ ] Validar el cambio de dashboard:
  - [ ] drag and drop del resumen admin

## Paso 3 - Orden de commits

- [ ] Commit de documentacion y limpieza:
  - [ ] actualizar `docs/CHECKLIST.md`
  - [ ] eliminar `docs/FRONTEND_TYPESCRIPT_CHECKLIST.md`
  - [ ] agregar este checklist de merge
- [ ] Commit de mejoras publicas:
  - [ ] `ServicesSection.tsx`
  - [ ] `BookingForm.tsx`
  - [ ] `PublicLayout.tsx`
- [ ] Commit de mejora admin:
  - [ ] `AdminSummary.tsx`

## Paso 4 - Rama feature

- [ ] Verificar `git status` limpio.
- [ ] Push de la rama `chore/frontend-typescript-foundation`.

## Paso 5 - Merge a `main`

- [ ] Cambiar a `main`.
- [ ] Hacer `git pull origin main`.
- [ ] Mergear `chore/frontend-typescript-foundation`.
- [ ] Resolver conflictos si aparecen.
- [ ] Verificar `git status` limpio.
- [ ] Push de `main`.

## Paso 6 - Cierre

- [ ] Confirmar que `main` quede estable.
- [ ] Actualizar checklist general si hiciera falta.
- [ ] Definir siguiente bloque de trabajo despues del merge.
