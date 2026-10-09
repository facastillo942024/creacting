# Guía de despliegue · CreactingCinema en servidor Linux

Esta guía te lleva de cero a la app funcionando con HTTPS. Asume Ubuntu/Debian; adapta los comandos si usas otra distro.

Hay **dos escenarios** según el servidor:

### Escenario A — Nginx + dominio + HTTPS (servidor dedicado o puertos 80/443 libres)

```
Internet ──HTTPS──> Nginx ──/api/──> Node (PM2, puerto 5000) ──> MySQL/MariaDB
                      │
                      └──/──> build estático de React (frontend)
```

### Escenario B — Self-hosted por Node en un puerto propio (servidor compartido)

Si el servidor ya aloja **otros proyectos** que ocupan los puertos 80/443 (p. ej. Apache u otro Nginx), despliega CreactingCinema **aislado en su propio puerto** (ej. 8080), sirviendo frontend y API desde el mismo proceso Node. No se toca nada de lo existente.

```
Internet ──http://IP:8080──> Node/Express (PM2) ──> MySQL/MariaDB
                               │  sirve el build de React (FRONTEND_DIR)
                               │  expone /api  y  /uploads
```

Este es el método usado en el despliegue actual. Pasos: secciones 0–4 (igual), luego **sección B** al final (en lugar de 5–7 de Nginx). Clave: en `server/.env` define `PORT=8080` y `FRONTEND_DIR=/var/www/creacting`.

---

## 0. Requisitos en el servidor

Conéctate por SSH e instala lo necesario:

```bash
# Node.js LTS (via nvm, recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# cierra y reabre la terminal, luego:
nvm install --lts

# PM2 (gestor de procesos)
npm install -g pm2

# MariaDB (si no lo tienes) y Nginx
sudo apt update
sudo apt install -y mariadb-server nginx
sudo mysql_secure_installation   # define contraseña de root, etc.
```

---

## 1. Base de datos

Crea un usuario dedicado (no uses root para la app):

```bash
sudo mysql
```
```sql
CREATE DATABASE IF NOT EXISTS creating CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'creacting'@'localhost' IDENTIFIED BY 'PON_UNA_CONTRASENA_FUERTE';
GRANT ALL PRIVILEGES ON creating.* TO 'creacting'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 2. Subir el código

Sube **solo la carpeta `server/`** (o todo el repo). No subas `node_modules` ni `.env`.

```bash
# Opción A: git
cd /opt
git clone <tu-repo> creacting
cd creacting/server

# Opción B: scp desde tu PC (ejemplo)
# scp -r server usuario@servidor:/opt/creacting/
```

---

## 3. Configurar el backend (.env)

```bash
cd /opt/creacting/server
cp .env.example .env
nano .env
```

Ajusta como mínimo:

```
PORT=5000
CORS_ORIGIN=https://tudominio.com
DB_HOST=127.0.0.1
DB_USER=creacting
DB_PASSWORD=PON_UNA_CONTRASENA_FUERTE
DB_NAME=creating
JWT_SECRET=<genera-uno-largo:  openssl rand -hex 32 >
```

Genera un secreto seguro con:

```bash
openssl rand -hex 32
```

---

## 4. Desplegar el backend con PM2

La primera vez (incluye crear tablas + catálogo):

```bash
bash deploy/deploy.sh --db
```

Despliegues posteriores (sin tocar la BD):

```bash
bash deploy/deploy.sh
```

Haz que PM2 arranque solo al reiniciar el servidor:

```bash
pm2 startup        # copia y ejecuta el comando que imprime
pm2 save
```

Comprueba que responde localmente:

```bash
curl http://127.0.0.1:5000/api/health
# -> {"ok":true,"service":"creacting-server"}
```

---

## 5. Build del frontend y publicarlo

El build se genera **en tu PC** (o en el servidor si tiene el frontend). En tu PC, dentro de la carpeta del frontend:

```bash
# .env del frontend apuntando al dominio real
echo "REACT_APP_API_URL=https://tudominio.com" > .env
npm run build
```

Sube el contenido de `build/` al servidor:

```bash
# ejemplo con scp
scp -r build/* usuario@servidor:/var/www/creacting/
```

(En el servidor: `sudo mkdir -p /var/www/creacting` y dale permisos si hace falta.)

---

## 6. Configurar Nginx

```bash
sudo cp /opt/creacting/server/deploy/nginx.conf.example /etc/nginx/sites-available/creacting
sudo nano /etc/nginx/sites-available/creacting   # reemplaza tudominio.com y las rutas
sudo ln -s /etc/nginx/sites-available/creacting /etc/nginx/sites-enabled/
sudo nginx -t          # verifica sintaxis
sudo systemctl reload nginx
```

---

## 7. HTTPS con Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Certbot edita tu bloque de Nginx para añadir HTTPS y configura la renovación automática.

---

## 8. Verificación final

- `https://tudominio.com` carga el frontend.
- `https://tudominio.com/api/health` responde `{"ok":true}`.
- Registro → login → guardar perfil → subir foto → buscar, todo funciona.

---

## Operación diaria

```bash
pm2 status                 # ver procesos
pm2 logs creacting-api     # ver logs en vivo
pm2 reload creacting-api   # recargar tras un cambio (sin downtime)
pm2 restart creacting-api  # reinicio completo
```

Rotación de logs (recomendado):

```bash
pm2 install pm2-logrotate
```

---

## Notas de seguridad

- El backend NO debe exponerse directo a internet; solo Nginx habla con él (por eso escucha en `127.0.0.1`). Si tu firewall lo permite, cierra el puerto 5000 hacia afuera (`sudo ufw deny 5000`).
- Nunca subas `.env` al repositorio (ya está en `.gitignore`).
- `multer` está en 1.x (deprecado). Antes de exponer al público conviene migrar a `multer@2.x`.
- Respalda la carpeta `uploads/` y la base de datos periódicamente.

---

# Sección B — Despliegue self-hosted por Node (servidor compartido)

Usa esta sección **en lugar de las 5–7 de Nginx** cuando el servidor ya tiene otros proyectos en 80/443 y quieres aislar CreactingCinema en su propio puerto. Es el método del despliegue actual (puerto 8080).

## B.1 Base de datos (usuario dedicado)

```bash
# crear base y usuario propios (no toca otras bases)
cp /opt/creacting/deploy/crear-db.sql.example /tmp/crear-db.sql
nano /tmp/crear-db.sql     # pon una contraseña fuerte en IDENTIFIED BY
mysql -u root -p < /tmp/crear-db.sql
rm -f /tmp/crear-db.sql
```

## B.2 Subir el backend

Desde tu PC (Git Bash/WSL), en la raíz del proyecto:

```bash
tar -czf server.tgz -C server --exclude=node_modules --exclude=.env --exclude=uploads --exclude=logs .
scp server.tgz root@TU_IP:/tmp/
ssh root@TU_IP "mkdir -p /opt/creacting && tar -xzf /tmp/server.tgz -C /opt/creacting && rm /tmp/server.tgz"
```

## B.3 Configurar e instalar (en el servidor)

```bash
cd /opt/creacting
# genera .env (PORT=8080, FRONTEND_DIR, JWT aleatorio) e instala + monta BD
DB_PASSWORD='la_contraseña_del_usuario_creacting' PUBLIC_URL='http://TU_IP:8080' bash deploy/setup-remoto.sh
```

## B.4 Publicar el frontend

Desde tu PC: compila apuntando a la URL pública y sube el build.

```bash
REACT_APP_API_URL="http://TU_IP:8080" CI=false npm run build
tar -czf build.tgz -C build .
scp build.tgz root@TU_IP:/tmp/
ssh root@TU_IP "mkdir -p /var/www/creacting && tar -xzf /tmp/build.tgz -C /var/www/creacting && rm /tmp/build.tgz && chown -R www-data:www-data /var/www/creacting"
```

## B.5 Arrancar con PM2

```bash
ssh root@TU_IP "cd /opt/creacting && pm2 start ecosystem.config.js && pm2 save"
```

(Si PM2 ya tenía `startup` configurado por otro proyecto, no hace falta repetirlo.)

## B.6 Verificar

```bash
curl http://TU_IP:8080/api/health         # {"ok":true,...}
# y abre http://TU_IP:8080 en el navegador
```

## B.7 Actualizaciones futuras

Desde tu PC, usa el script de la raíz del proyecto:

```bash
./deploy-update.sh            # backend + frontend
./deploy-update.sh --frontend # solo frontend
./deploy-update.sh --backend  # solo backend
```

## Convivencia con otros proyectos (importante)

- CreactingCinema corre en **su propio puerto** y **su propio proceso PM2** (`creacting-api`); no toca Apache, otros sitios Nginx ni otras bases de datos.
- Usa un **usuario MySQL dedicado** con permisos solo sobre su base `creating`.
- Si el proveedor tiene firewall, abre el puerto elegido (ej. 8080) en su panel.
