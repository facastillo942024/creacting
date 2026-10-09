#!/usr/bin/env bash
# =====================================================================
#  Script de despliegue de CreactingCinema en el servidor Linux.
#  Ejecutar DENTRO de la carpeta server/ del proyecto ya clonado.
#
#  Uso:   bash deploy/deploy.sh
#
#  Que hace:
#    1. Instala dependencias de produccion del backend
#    2. (Opcional) Ejecuta el setup de base de datos si pasas --db
#    3. Arranca/recarga la API con PM2
#
#  Requisitos previos en el servidor: node, npm, pm2, mysql, y un .env valido.
# =====================================================================
set -euo pipefail

echo "==> CreactingCinema :: despliegue backend"

# 1. Verificar .env
if [ ! -f ".env" ]; then
  echo "ERROR: falta el archivo .env en $(pwd). Copialo de .env.example y editalo."
  exit 1
fi

# 2. Dependencias de produccion
echo "==> Instalando dependencias (produccion)..."
npm install --omit=dev

# 3. Setup de base de datos (solo si se pide con --db)
if [ "${1:-}" = "--db" ]; then
  echo "==> Ejecutando schema + seed de base de datos..."
  npm run db:setup
else
  echo "==> (Saltando setup de BD. Usa 'bash deploy/deploy.sh --db' la primera vez.)"
fi

# 4. Carpeta de logs para PM2
mkdir -p logs uploads

# 5. Arrancar o recargar con PM2
if pm2 describe creacting-api > /dev/null 2>&1; then
  echo "==> Recargando proceso existente (sin downtime)..."
  pm2 reload ecosystem.config.js
else
  echo "==> Arrancando proceso por primera vez..."
  pm2 start ecosystem.config.js
fi

pm2 save
echo "==> Listo. Estado:"
pm2 status creacting-api
