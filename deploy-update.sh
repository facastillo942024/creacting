#!/usr/bin/env bash
# =====================================================================
#  deploy-update.sh — Actualiza CreactingCinema ya desplegado.
#
#  Ejecuta desde tu PC (Git Bash, WSL o Linux/Mac) en la raiz del proyecto.
#  Hace: build del frontend + subida de backend y frontend + restart PM2.
#
#  Uso:
#    ./deploy-update.sh                 # actualiza backend + frontend
#    ./deploy-update.sh --frontend      # solo frontend
#    ./deploy-update.sh --backend       # solo backend
#
#  Requisitos: ssh y scp configurados con clave al servidor (sin password),
#              node/npm y tar en tu PC.
# =====================================================================
set -euo pipefail

# ---- Configuracion (ajusta si cambian) ----
SERVER="root@194.195.215.247"
API_URL="http://194.195.215.247:8080"   # URL publica (se embebe en el build)
REMOTE_BACKEND="/opt/creacting"
REMOTE_FRONTEND="/var/www/creacting"
PM2_APP="creacting-api"

MODE="${1:-all}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> CreactingCinema :: actualizacion ($MODE)"

# ---------- BACKEND ----------
if [ "$MODE" = "all" ] || [ "$MODE" = "--backend" ]; then
  echo "==> Empaquetando backend (sin node_modules/.env/uploads/logs)..."
  tar -czf "$TMP/server.tgz" -C server \
    --exclude=node_modules --exclude=.env --exclude=uploads \
    --exclude=logs --exclude='*.log' .

  echo "==> Subiendo y desplegando backend..."
  scp "$TMP/server.tgz" "$SERVER:/tmp/server.tgz"
  ssh "$SERVER" "tar -xzf /tmp/server.tgz -C $REMOTE_BACKEND && rm -f /tmp/server.tgz && cd $REMOTE_BACKEND && npm install --omit=dev --no-audit --no-fund"
fi

# ---------- FRONTEND ----------
if [ "$MODE" = "all" ] || [ "$MODE" = "--frontend" ]; then
  echo "==> Compilando frontend (API_URL=$API_URL)..."
  REACT_APP_API_URL="$API_URL" CI=false npm run build

  echo "==> Subiendo frontend..."
  tar -czf "$TMP/build.tgz" -C build .
  scp "$TMP/build.tgz" "$SERVER:/tmp/build.tgz"
  ssh "$SERVER" "rm -rf $REMOTE_FRONTEND/* && tar -xzf /tmp/build.tgz -C $REMOTE_FRONTEND && rm -f /tmp/build.tgz && chown -R www-data:www-data $REMOTE_FRONTEND"
fi

# ---------- RESTART ----------
echo "==> Reiniciando API con PM2..."
ssh "$SERVER" "pm2 restart $PM2_APP --update-env && sleep 2 && curl -s http://127.0.0.1:8080/api/health && echo"

echo "==> Actualizacion COMPLETA. App en: $API_URL"
