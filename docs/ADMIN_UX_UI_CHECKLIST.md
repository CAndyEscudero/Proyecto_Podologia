# Checklist de Mejora UX/UI - Panel Admin

## Objetivo

Mejorar el panel administrativo para que se sienta:

- mas limpio
- mas profesional
- mas facil de usar
- menos cargado visualmente
- mas cercano a un SaaS vendible

Sin tocar la logica de negocio ni romper flujos ya implementados.

## Diagnostico actual

El panel ya tiene una base funcional fuerte, pero todavia hay puntos que lo hacen sentir mas pesado de lo necesario:

- demasiados bloques visuales compiten entre si
- varios modulos tienen exceso de contexto o texto explicativo
- hay pantallas que se sienten mas "dashboard decorado" que "software operativo"
- algunos formularios y tablas podrian respirar mejor
- la navegacion aun puede verse mas simple, plana y estable
- la jerarquia visual puede ser mucho mas clara

## Referencia de direccion visual

La referencia tomada de productos como Planify no debe copiarse literal, pero si nos sirve para adoptar principios utiles:

- layout estable
- sidebar clara
- topbar minima
- contenido central aireado
- filtros compactos
- tablas muy limpias
- menos cards innecesarias
- menos texto explicativo
- mas enfoque en la tarea principal

## Principios de diseno para esta rama

- priorizar claridad operativa sobre decoracion
- usar una sola jerarquia fuerte por pantalla
- reducir sombras, bordes y gradientes donde no aporten
- menos "cards dentro de cards"
- una CTA principal por modulo
- acciones secundarias agrupadas
- mas espacio entre secciones y menos ruido

## Checklist recomendado

## 1. Shell general del admin

- [ ] Simplificar `AdminLayout`
- [ ] Reducir altura del header principal
- [ ] Hacer la topbar mas sobria y compacta
- [ ] Compactar el bloque de usuario / negocio
- [ ] Mejorar el ancho y ritmo del contenedor principal
- [ ] Revisar paddings globales para desktop y tablet

### Objetivo

Que el panel se sienta mas "app" y menos "landing interna".

## 2. Sidebar y navegacion

- [ ] Redisenar `AdminSidebar`
- [ ] Reducir peso visual de cada item
- [ ] Bajar cantidad de copy visible por item
- [ ] Hacer mas estable el estado activo
- [ ] Afinar badges para que no compitan con el label
- [ ] Mejorar consistencia entre items padres e hijos
- [ ] Revisar iconografia y espaciado

### Objetivo

Que navegar el admin sea mas rapido y menos ruidoso.

## 3. Jerarquia por pantalla

- [ ] Definir un patron comun para headers de seccion
- [ ] Unificar:
  - [ ] titulo
  - [ ] subtitulo
  - [ ] barra de acciones
  - [ ] contenido principal
- [ ] Sacar textos introductorios largos cuando no aporten
- [ ] Evitar repetir explicaciones en cada bloque

### Objetivo

Que todas las pantallas se parezcan entre si en estructura y sean predecibles.

## 4. Gestion de turnos

- [ ] Refinar `AppointmentsTable`
- [ ] Compactar aun mas filtros
- [ ] Limpiar visualmente timeline y tabla
- [ ] Reducir peso de contenedores internos
- [ ] Priorizar datos realmente operativos
- [ ] Mantener acciones fuertes pero ordenadas
- [ ] Revisar que estado/pago se lean de un golpe
- [ ] Afinar variantes visuales de badges

### Objetivo

Que turnos sea la pantalla mas potente del panel y tambien la mas clara.

## 5. Alta y edicion de turnos

- [ ] Revisar `AppointmentsManager`
- [ ] Mejorar el formulario para carga manual
- [ ] Reducir densidad visual del panel lateral o editor
- [ ] Separar mejor:
  - [ ] datos del paciente
  - [ ] datos del turno
  - [ ] acciones
- [ ] Hacer mas clara la diferencia entre crear, editar y reprogramar

### Objetivo

Que el staff pueda operar rapido sin sentirse dentro de un formulario pesado.

## 6. Servicios

- [ ] Redisenar `ServicesManager`
- [ ] Pasar de una experiencia muy tipo card/editor a una gestion mas limpia
- [ ] Mantener el editor, pero con menos protagonismo visual
- [ ] Mejorar la tabla/listado de servicios
- [ ] Afinar busqueda, estado y acciones
- [ ] Destacar duracion y precio sin recargar

### Objetivo

Que servicios se vea mas cerca de un panel profesional y menos de una maqueta cargada.

## 7. Disponibilidad

- [ ] Revisar `AvailabilityManager`
- [ ] Separar visualmente:
  - [ ] reglas semanales
  - [ ] pausas
  - [ ] fechas bloqueadas
- [ ] Reducir ruido en formularios
- [ ] Hacer mas clara la lectura del calendario operativo
- [ ] Mejorar la jerarquia de acciones

### Objetivo

Que disponibilidad sea entendible de un vistazo, aunque la logica sea compleja.

## 8. Configuracion del negocio

- [ ] Redisenar `BusinessSettingsPanel`
- [ ] Adoptar estructura por tabs internas o secciones bien marcadas
- [ ] Reducir textos explicativos largos
- [ ] Unificar campos y separadores
- [ ] Revisar spacing vertical del formulario
- [ ] Crear una experiencia mas parecida a "Configuracion" de producto SaaS

### Objetivo

Que sea una pantalla de configuracion elegante, ordenada y facil de mantener.

## 9. Dashboard y metricas

- [ ] Revisar `AdminSummary`
- [ ] Mantener metricas solo donde ayuden a decidir
- [ ] Evitar que KPIs compitan con la operacion diaria
- [ ] Hacer cards de resumen mas limpias y menos invasivas
- [ ] Definir si algunas metricas deberian vivir solo en una pantalla de ingresos

### Objetivo

Que el dashboard informe sin robar foco a la operacion.

## 10. Tablas del admin

- [ ] Unificar estilo de tablas en:
  - [ ] turnos
  - [ ] servicios
  - [ ] equipo
  - [ ] clientes
  - [ ] ingresos
- [ ] Usar un patron comun para:
  - [ ] encabezados
  - [ ] alturas de fila
  - [ ] badges
  - [ ] acciones
  - [ ] paginacion
- [ ] Reducir bordes y contenedores excesivos

### Objetivo

Que todas las tablas del sistema hablen el mismo lenguaje visual.

## 11. Formularios del admin

- [ ] Unificar estilo de labels, ayudas y errores
- [ ] Reducir altura o ruido de campos donde sea excesiva
- [ ] Hacer mas clara la CTA primaria
- [ ] Revisar estados deshabilitados, hover y focus
- [ ] Mejorar grillas de formularios largos

### Objetivo

Que completar o editar algo no se sienta pesado.

## 12. Empty states y estados sin datos

- [ ] Mejorar empty states en agenda
- [ ] Mejorar empty states en servicios
- [ ] Mejorar empty states en configuracion
- [ ] Agregar mensajes mas utiles y menos genicos
- [ ] Vincular cada empty state con una accion clara

### Objetivo

Que el sistema siga guiando incluso cuando no hay datos.

## 13. Acciones, menus y densidad operativa

- [ ] Revisar todos los botones visibles por pantalla
- [ ] Mover acciones secundarias a menus cuando convenga
- [ ] Dejar una sola accion primaria fuerte por contexto
- [ ] Normalizar uso de iconos
- [ ] Revisar textos de botones para que sean claros y cortos

### Objetivo

Reducir saturacion visual sin perder velocidad de trabajo.

## 14. Responsive admin

- [ ] Revisar sidebar mobile
- [ ] Revisar paddings y anchos en tablet
- [ ] Revisar tablas anchas
- [ ] Revisar formularios largos en viewport intermedio
- [ ] Priorizar desktop primero, pero sin romper tablet

### Objetivo

Que el admin funcione mejor en el uso real, no solo en desktop grande.

## 15. Sistema visual

- [ ] Definir mejor el set de superficies del admin
- [ ] Limitar cantidad de radios, sombras y fondos distintos
- [ ] Usar una escala de espaciado mas consistente
- [ ] Revisar color semantico de estados
- [ ] Revisar tipografia del panel para lectura funcional

### Objetivo

Que el panel se vea mas cohesivo como producto.

## Orden recomendado de implementacion

1. `AdminLayout`
2. `AdminSidebar`
3. `BusinessSettingsPanel`
4. `ServicesManager`
5. `AppointmentsTable`
6. `AppointmentsManager`
7. `AvailabilityManager`
8. `AdminSummary`
9. responsive final
10. pasada general de consistencia

## Resultado esperado

Al cerrar esta rama deberiamos tener un panel que:

- se vea mas premium
- tenga menos ruido visual
- sea mas facil de operar
- se perciba mas producto SaaS
- conserve toda la logica actual
- este mejor preparado para venderse
