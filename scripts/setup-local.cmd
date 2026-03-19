@echo off
cd /d "%~dp0\.."
cmd /c npm run db:up
cd /d "%~dp0\..\backend"
cmd /c npm run prisma:generate
cmd /c npx prisma migrate dev --name init
cmd /c npm run prisma:seed
echo.
echo Entorno listo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:4000
echo Adminer: http://localhost:8080
echo Login admin: revisar ADMIN_EMAIL y ADMIN_PASSWORD en backend/.env
