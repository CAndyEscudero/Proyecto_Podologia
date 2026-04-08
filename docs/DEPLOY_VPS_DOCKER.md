# Deploy en VPS con Docker

## Objetivo

Dejar el proyecto listo para subirse a un VPS Linux usando Docker Compose, MySQL y Caddy.

La arquitectura recomendada para esta v1 es:

- `mysql` para base de datos
- `backend` para la API Express
- `web` con Caddy para:
  - servir el frontend
  - hacer reverse proxy a `/api`
  - manejar HTTPS
  - emitir certificados on-demand para subdominios de plataforma y dominios custom ya configurados

## Archivos agregados para deploy

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/Caddyfile`
- `docker-compose.prod.yml`
- `.env.vps.example`

## Concepto importante

En produccion:

- el frontend y el backend comparten dominio/host
- el frontend hace requests a `/api`
- Caddy recibe todo
- Caddy manda `/api/*` al backend
- Caddy sirve el frontend para el resto

## DNS minimo de la plataforma

Suponiendo que tu dominio de plataforma sea `tuapp.com` y la IP del VPS sea `203.0.113.10`:

### Registros que tenes que crear

- `A @ -> 203.0.113.10`
- `A *.tuapp.com -> 203.0.113.10`
- `A domains.tuapp.com -> 203.0.113.10`

### Para que sirve cada uno

- `@` sirve para el host tecnico de la plataforma
- `*.tuapp.com` sirve para los subdominios de tenants
- `domains.tuapp.com` sirve como target CNAME para dominios custom tipo `turnos.cliente.com`

## Dominio custom de un cliente

### Si el cliente usa subdominio

Ejemplo:

- `turnos.cliente.com`

Debe crear:

- `CNAME turnos.cliente.com -> domains.tuapp.com`

### Si el cliente usa dominio raiz

Ejemplo:

- `cliente.com`

Debe crear:

- `A cliente.com -> 203.0.113.10`

## Variables de entorno

Copiá el archivo de ejemplo:

```bash
cp .env.vps.example .env
```

Y completá:

- credenciales de MySQL
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PLATFORM_APEX_DOMAIN`
- `PLATFORM_DOMAIN_CNAME_TARGET`
- `PLATFORM_DOMAIN_A_RECORDS`
- `CADDY_ON_DEMAND_ASK_SECRET`
- `ACME_EMAIL`
- `MERCADO_PAGO_OAUTH_CLIENT_ID`
- `MERCADO_PAGO_OAUTH_CLIENT_SECRET`
- `MERCADO_PAGO_OAUTH_REDIRECT_URI`
- `MERCADO_PAGO_PLATFORM_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `PLATFORM_EMAIL_FROM`

## Que hace Caddy en este proyecto

### 1. HTTPS

Caddy usa certificados on-demand.

Eso significa:

- si entra un host permitido por el backend
- Caddy intenta emitir el certificado automaticamente

### 2. Endpoint de autorizacion

El backend expone:

- `GET /internal/platform/tls-allow`

Ese endpoint:

- permite el dominio tecnico de plataforma
- permite hostnames que ya existan en `TenantDomain`
- rechaza cualquier dominio no configurado

Eso evita emitir certificados para hosts random que no pertenezcan a la plataforma.

## Primer deploy en el VPS

## 1. Entrar al VPS

```bash
ssh root@IP_DEL_VPS
```

## 2. Instalar Docker y Compose plugin

En Ubuntu:

```bash
apt update
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker
```

## 3. Subir el repo

Opcion A:

```bash
git clone TU_REPO
cd proyecto-podologia
```

Opcion B:

subirlo por `scp` o por tu cliente Git.

## 4. Crear el .env real

```bash
cp .env.vps.example .env
nano .env
```

## 5. Levantar el stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## 6. Ver logs si algo falla

```bash
docker compose -f docker-compose.prod.yml logs -f
```

## 7. Seed inicial

Solo la primera vez, si queres crear el tenant/admin inicial:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run prisma:seed
```

## Validaciones iniciales

### Backend

```bash
docker compose -f docker-compose.prod.yml exec backend npm run tenant:inspect -- --slug pies-sanos-venado
```

### Health

Abrí:

- `https://tuapp.com/health`

### Tenant base

Abrí:

- `https://pies-sanos-venado.tuapp.com`

## Flujo para dominio custom

1. crear o editar el tenant
2. cargar el dominio custom en el panel
3. apuntar DNS del cliente
4. esperar propagacion
5. correr verificacion desde el panel
6. poner el dominio como principal

## Seguridad minima del VPS

No expongas:

- MySQL
- Adminer
- backend por puerto 4000

En produccion deberian quedar abiertos solo:

- `22` SSH
- `80` HTTP
- `443` HTTPS

## Lo que este deploy deja resuelto

- app lista para VPS Linux
- frontend servido por Caddy
- backend privado dentro de la red Docker
- MySQL privado dentro de la red Docker
- HTTPS on-demand con control desde backend
- base lista para subdominios y dominios custom

## Lo que NO reemplaza

Esto no reemplaza:

- backups automaticos
- monitoreo externo
- panel interno de plataforma
- CI/CD

Es una base de deploy seria para arrancar, no una plataforma DevOps enterprise.
