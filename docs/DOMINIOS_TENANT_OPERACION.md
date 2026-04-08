# Operacion de Dominios por Tenant

## Objetivo

Definir como se conectan, validan y operan los dominios de cada negocio dentro del SaaS.

La meta de v1 es simple:

- cada tenant nace con un subdominio de plataforma
- el frente publico puede moverse a un dominio custom
- el admin sigue entrando por el dominio de plataforma
- el dominio custom no queda activo hasta validar DNS

## Estrategia de v1

### Publico

- URL base garantizada: `slug.PLATFORM_APEX_DOMAIN`
- Si el tenant configura un dominio custom y queda `ACTIVE`, ese dominio puede quedar como principal del frente publico
- Si el dominio custom queda como principal, el sitio publico redirige desde el subdominio de plataforma al dominio principal

### Admin

- El panel admin se opera solo desde el subdominio de plataforma
- Aunque exista dominio custom activo, el admin no se expone ahi en v1
- Ejemplo:
  - publico: `turnos.peluquerialuna.com`
  - admin: `peluqueria-luna.tuapp.com/admin/login`

## Flujo tecnico de conexion

### 1. Alta del tenant

- se crea el tenant
- se genera el slug
- se crea el subdominio de plataforma
- ese subdominio queda como fallback tecnico y admin host

### 2. Carga del dominio custom

Desde el panel del tenant:

- se guarda un solo dominio custom publico por tenant en v1
- si ya habia otro dominio custom, se reemplaza
- el dominio se guarda inicialmente en estado `PENDING`

## DNS esperado

### Dominio raiz

Si el negocio quiere usar un dominio raiz como:

- `tunegocio.com`
- `tunegocio.com.ar`

la plataforma espera registros `A` hacia las IPs definidas en `PLATFORM_DOMAIN_A_RECORDS`.

### Subdominio custom

Si el negocio quiere usar un subdominio como:

- `turnos.tunegocio.com`
- `reservas.tunegocio.com.ar`

la plataforma espera un `CNAME` hacia `PLATFORM_DOMAIN_CNAME_TARGET`.

## Verificacion

- El panel permite correr una verificacion de DNS
- Si el DNS coincide con lo esperado, el dominio pasa a `ACTIVE`
- Si el DNS no coincide, el dominio pasa a `FAILED`
- Un dominio `ACTIVE` ya puede quedar como principal del frente publico

## SSL

- La aplicacion valida DNS, pero no emite certificados por si sola
- La emision y renovacion del certificado queda a cargo de la infraestructura de despliegue
- En la app esto se refleja como estrategia `managed`

## Cambio de dominio principal

- Solo un dominio `ACTIVE` puede quedar como principal
- En v1 puede ser:
  - el subdominio de plataforma
  - el dominio custom del tenant
- Cambiar el dominio principal afecta:
  - la URL publica principal
  - retornos publicos de pagos
  - links publicos incluidos en emails

No afecta el host de admin, que sigue en dominio de plataforma.

## Politica comercial recomendada

### Quien compra el dominio

Recomendacion principal:

- el dominio debe quedar a nombre del cliente
- la plataforma puede asistir en la compra o configuracion
- si se bonifica el primer anio, igual conviene que la titularidad sea del cliente

Motivo:

- evita dependencia comercial innecesaria
- evita conflictos al renovar o migrar
- protege al cliente y tambien al producto

### Si la plataforma lo "regala"

Si comercialmente queres ofrecer el dominio bonificado:

- aclara por escrito si incluye solo alta inicial o tambien renovacion
- aclara desde que fecha corre la renovacion
- aclara quien paga la renovacion futura
- aclara que el dominio puede quedar suspendido si no se renueva

## Checklist operativo por tenant

Antes de anunciar una URL publica propia:

- el dominio custom esta cargado
- el DNS apunta a la plataforma
- la verificacion dio `ACTIVE`
- el dominio correcto quedo como principal
- el panel admin sigue accesible por el subdominio de plataforma
- el flujo publico abre desde la URL final esperada
- el retorno de pagos vuelve al dominio publico correcto

## Decision vigente

En v1:

- publico puede usar dominio custom
- admin no usa dominio custom
- el subdominio de plataforma nunca desaparece como fallback operativo
