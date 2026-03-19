$ErrorActionPreference = "Stop"

Write-Host "1. Levantando MySQL y Adminer con Docker..."
docker compose up -d mysql adminer

Write-Host "2. Generando cliente Prisma..."
Push-Location backend
npm run prisma:generate

Write-Host "3. Aplicando migraciones..."
npx prisma migrate dev --name init

Write-Host "4. Ejecutando seed..."
npm run prisma:seed
Pop-Location

Write-Host ""
Write-Host "Entorno listo."
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend: http://localhost:4000"
Write-Host "Adminer: http://localhost:8080"
Write-Host "Login admin: revisar ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env"
