#!/usr/bin/env bash
# Setup del backend de CreactingCinema en el servidor.
# Genera .env de produccion, instala dependencias y monta la BD.
#
# Variables requeridas (exportar antes de ejecutar):
#   DB_PASSWORD   contraseña del usuario MySQL 'creacting'
#   PUBLIC_URL    URL publica (ej. http://TU_IP:8080)  [opcional, default localhost:8080]
#
# Uso:
#   DB_PASSWORD='...' PUBLIC_URL='http://TU_IP:8080' bash deploy/setup-remoto.sh
set -euo pipefail

cd /opt/creacting

: "${DB_PASSWORD:?Falta DB_PASSWORD (contraseña del usuario MySQL creacting)}"
PUBLIC_URL="${PUBLIC_URL:-http://localhost:8080}"

# 1. Generar .env de produccion
JWT=$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')
cat > .env <<EOF
PORT=8080
CORS_ORIGIN=$PUBLIC_URL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=creacting
DB_PASSWORD=$DB_PASSWORD
DB_NAME=creating
JWT_SECRET=$JWT
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
IMAGE_MAX_WIDTH=1000
IMAGE_QUALITY=78
MAX_UPLOAD_MB=10
FRONTEND_DIR=/var/www/creacting
EOF
echo "== .env creado =="
grep -vE 'JWT_SECRET|DB_PASSWORD' .env
echo "JWT_SECRET y DB_PASSWORD definidos (ocultos)"

# 2. Carpetas necesarias
mkdir -p uploads logs

# 3. Dependencias de produccion
echo "== Instalando dependencias (produccion) =="
npm install --omit=dev --no-audit --no-fund

# 4. Montar schema + seed
echo "== Montando base de datos (schema + seed) =="
npm run db:setup

echo "== SETUP COMPLETO =="
