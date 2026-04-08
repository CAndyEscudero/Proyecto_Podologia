# Contrato del Producto - SaaS v1

## Objetivo

Fijar el contrato funcional y comercial de la primera version vendible del SaaS.

Este documento define:

- para quien se construye la v1
- que problema resuelve
- que incluye la v1
- que no incluye la v1
- que decisiones de producto tomamos como baseline para poder avanzar con la arquitectura multi-tenant

Este documento se toma como baseline operativa del proyecto hasta que decidamos cambiarlo de forma explicita.

## Tesis del producto

Vamos a construir un SaaS multi-tenant para negocios que trabajan con agenda por turnos y necesitan:

- mostrar servicios
- ofrecer reserva online
- cobrar una sena
- operar una agenda simple desde un panel

La plataforma debe permitir vender el mismo producto a muchos negocios, con una sola base, un solo backend y aislamiento real por tenant.

## Cliente ideal de la v1

Cliente ideal:

- negocio pequeno o mediano
- trabaja por turnos
- tiene una sola agenda operativa en la primera etapa
- necesita ordenar reservas y reducir idas y vueltas por WhatsApp
- acepta cobrar una sena para confirmar reservas

Tipos de negocio ideales para v1:

- podologia
- unas
- peluqueria chica
- barberia
- estetica con agenda simple

Cliente que no es ideal para v1:

- negocio con multiples profesionales y agendas cruzadas
- negocio con multiples sucursales
- operacion enterprise
- negocio que necesita facturacion compleja o integraciones corporativas desde el dia 1

## Vertical de producto en la v1

La v1 no va a ser una app exclusiva para un solo rubro.

La definicion correcta es:

SaaS para negocios de servicios por turno con una agenda simple por tenant.

Eso nos permite vender a:

- podologia
- unas
- peluquerias chicas
- barberias
- estetica

sin reescribir el producto por rubro.

## Tipo de frente publico

Decision tomada para la v1:

El frente publico sera semi-personalizable por tenant, no completamente libre.

Esto significa:

- misma estructura base para todos
- branding por tenant
- nombre del negocio por tenant
- datos de contacto por tenant
- servicios por tenant
- textos cortos editables por tenant

Esto no significa:

- constructor libre de paginas
- landing completamente distinta por tenant
- editor visual tipo no-code

Motivo:

- mantiene velocidad de implementacion
- mantiene coherencia visual
- evita convertir la v1 en un constructor de sitios

## Politica de sena

Decision base:

- la v1 va a cobrar sena online
- la sena por defecto sera del 50%
- la sena debe ser configurable por tenant en v1

Regla recomendada:

- guardar porcentaje de sena en configuracion del tenant
- usar 50% como default si el tenant no cambia nada

Motivo:

- distintos rubros pueden preferir porcentajes distintos
- es una diferencia comercial importante entre tenants
- en SaaS multi-tenant conviene mover eso a configuracion y no dejarlo hardcodeado

## Politica de cancelacion y reprogramacion

Decision base:

- la v1 debe tener politica visible de cancelacion y reprogramacion
- la operacion concreta la resuelve el admin desde el panel
- la v1 no incluye aun autoservicio del paciente para reprogramar desde un link

Propuesta funcional:

- el tenant define un texto corto de politica
- ese texto se muestra en el booking y/o comprobante
- el admin puede cancelar o reprogramar desde el panel

## Turnos manuales sin pago

Decision tomada:

- el admin puede crear turnos manuales sin pago

Motivo:

- muchos negocios siguen recibiendo reservas por telefono, mostrador o WhatsApp
- bloquear eso haria que la app no encaje con la operacion real

## Que ve el paciente despues del pago

Decision base:

Despues del pago, el paciente debe ver una confirmacion clara y entendible.

La v1 debe mostrar:

- estado del pago
- codigo o identificador de reserva
- servicio reservado
- fecha y horario
- monto total
- monto de sena
- datos de contacto del negocio
- mensaje claro de que hacer si el pago queda pendiente o rechazado

La v1 tambien deberia enviar email transaccional con ese resumen.

## Agenda de la v1

Decision tomada:

- una agenda por tenant
- una sola linea operativa de disponibilidad por tenant
- sin profesionales separados en la primera version

Motivo:

- simplifica mucho el paso a multi-tenant
- reduce el alcance de la primera salida
- sigue siendo vendible para muchos negocios chicos

## Dominios por tenant

Decision base:

- cada tenant tendra un subdominio automatico de la plataforma
- cada tenant podra configurar un dominio custom publico
- el admin inicialmente puede vivir en el dominio de plataforma

Ejemplo:

- `peluqueria-luna.tuapp.com`
- `turnos.peluquerialuna.com`

## Integraciones minimas obligatorias para v1

La v1 no deberia salir sin esto:

- pagos con Mercado Pago
- email transaccional

No es obligatorio para v1:

- WhatsApp API real
- Google Calendar
- facturacion externa

## Lo que entra en la v1

- multi-tenant real
- subdominio por tenant
- dominio custom publico por tenant
- reserva online sin cuenta
- panel admin por tenant
- servicios por tenant
- disponibilidad por tenant
- turnos por tenant
- sena configurable por tenant
- pagos por tenant
- branding basico por tenant
- email transaccional
- onboarding interno de nuevos tenants

## Lo que no entra en la v1

- multiples profesionales por tenant
- multiples sucursales
- constructor libre de landing
- marketplace
- app mobile nativa
- historia clinica
- facturacion electronica
- CRM complejo

## Criterio de producto para cobrar mensual piloto

Tiene sentido cobrar mensual piloto cuando:

- podes crear un tenant sin tocar codigo
- el tenant tiene subdominio funcional
- el tenant puede usar dominio custom publico
- el aislamiento entre tenants esta validado
- el booking funciona por tenant
- el panel funciona por tenant
- la configuracion de pagos y branding es por tenant

## Criterio de producto para cobrar mensual de forma estable

Tiene sentido cobrar mensual a escala cuando ademas existe:

- onboarding razonablemente rapido
- billing del SaaS
- soporte tecnico de dominios
- observabilidad
- testing multi-tenant suficiente

## Resumen ejecutivo

La v1 del producto queda definida asi:

Un SaaS multi-tenant para negocios de servicios por turno, con una agenda simple por tenant, reserva online sin cuenta, sena configurable, panel admin, subdominio automatico y dominio custom publico opcional.

