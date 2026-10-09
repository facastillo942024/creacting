# CreactingCinema 🎬

Plataforma web de **casting de actores y talento**. Los actores crean su perfil con todas sus características físicas y habilidades y suben fotos; los directores y productores buscan y filtran talento por cualquier combinación de atributos.

> App React (frontend) + API Node/Express (backend) + MySQL/MariaDB.

---

## Capacidades

- **Actores**: registro, perfil con datos físicos (género, estatura, peso, colores de cabello/ojos/piel, mano dominante...) y un catálogo flexible de características (idiomas, deportes, instrumentos, condiciones como sordo/mudo/discapacidad, etc.), más una galería de fotos.
- **Directores / Productores**: búsqueda avanzada combinando filtros fijos y del catálogo, resultados paginados, y vista de perfil con galería navegable (lightbox).
- **Roles**: `actor`, `director`, `admin`, con rutas protegidas y control de acceso por rol.

## Arquitectura

```
┌─────────────┐      HTTP/JSON       ┌──────────────────┐      SQL       ┌──────────────┐
│  Frontend   │ ───────────────────> │   API Express    │ ─────────────> │   MySQL /    │
│  React SPA  │ <─────────────────── │   (Node.js)      │ <───────────── │   MariaDB    │
└─────────────┘                      └──────────────────┘                └──────────────┘
                                       │  fotos en disco (sharp -> webp)
                                       └──> /uploads
```

- **Autenticación**: JWT (token en `localStorage`) + bcrypt para contraseñas.
- **Fotos**: se guardan en disco comprimidas a WebP con `sharp`; en la BBDD solo la ruta.
- **Modelo de datos híbrido**: columnas fijas para lo estable + catálogo EAV flexible para rasgos que crecen sin tocar el esquema.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React 18, React Router 6, React-Bootstrap + Bootstrap 5, MUI (solo iconos) |
| Backend | Node.js, Express, mysql2, JWT, bcryptjs, Multer, Sharp |
| Base de datos | MySQL 8 / MariaDB (utf8mb4) |
| Despliegue | PM2 (proceso), opcionalmente Nginx |

## Estructura del repositorio

```
creacting/
├── src/                      Frontend React
│   ├── api/client.js         Cliente HTTP (token, errores)
│   ├── auth/                 AuthProvider (JWT) + useAuth
│   ├── routes/               AppRoute + ProtectedRoute (por rol)
│   ├── components/           NavBar, CampoCaracteristica, GaleriaFotos
│   └── pages/                auth/, actor/, director/
├── public/                   Estáticos del frontend
├── server/                   Backend Node/Express
│   ├── src/                  app, config, db, controllers, routes, services, middleware
│   ├── db/                   schema.sql + seed.sql
│   ├── scripts/              run-sql, seed-usuarios-demo, e2e-test
│   └── deploy/               Guías y plantillas de despliegue
├── deploy-update.sh          Actualiza el despliegue (build + subida + restart)
└── README.md
```

---

## Puesta en marcha local

Necesitas Node.js LTS y un MySQL/MariaDB (p. ej. XAMPP).

### 1. Backend

```bash
cd server
cp .env.example .env       # edita credenciales de BBDD y JWT_SECRET
npm install
npm run db:setup           # crea tablas + catálogo de características
npm start                  # API en http://localhost:5000
```

### 2. Frontend

```bash
# en la raíz del proyecto
cp .env.example .env        # REACT_APP_API_URL=http://localhost:5000
npm install
npm start                   # http://localhost:3000
```

### 3. Usuarios de prueba (opcional)

```bash
cd server
node scripts/seed-usuarios-demo.js
```
Crea `actor@demo.com`, `director@demo.com`, `admin@demo.com` — contraseña `demo1234`.

---

## Variables de entorno

**Frontend** (`.env` en la raíz):

| Variable | Descripción |
|----------|-------------|
| `REACT_APP_API_URL` | URL base de la API (sin slash final) |

**Backend** (`server/.env`, ver `server/.env.example`):

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto de la API |
| `CORS_ORIGIN` | Origen(es) permitido(s), separados por coma |
| `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME` | Conexión MySQL |
| `JWT_SECRET` | Cadena larga y aleatoria (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | Expiración del token (ej. `7d`) |
| `UPLOAD_DIR` | Carpeta de fotos |
| `IMAGE_MAX_WIDTH` / `IMAGE_QUALITY` / `MAX_UPLOAD_MB` | Ajustes de imagen |
| `FRONTEND_DIR` | (Opcional) carpeta del build para que Node sirva el frontend |

> **Nunca** se suben archivos `.env` al repositorio. Usa los `.env.example` como plantilla.

---

## API (resumen)

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | público | Registra actor o director |
| POST | `/api/auth/login` | público | Devuelve `{ token, usuario }` |
| GET | `/api/auth/me` | token | Usuario autenticado |
| GET | `/api/catalogo/caracteristicas` | público | Catálogo (para formularios/filtros) |
| GET/PUT | `/api/actores/me` | actor | Mi perfil |
| PUT | `/api/actores/me/caracteristicas` | actor | Guardar características |
| POST/DELETE | `/api/actores/me/fotos[/:id]` | actor | Subir / borrar fotos |
| GET | `/api/actores/:id` | director/admin | Ver perfil completo |
| POST | `/api/busqueda/actores` | director/admin | Búsqueda con filtros |

Documentación detallada y colección Postman en [`server/deploy/`](server/deploy) y [`server/README.md`](server/README.md).

---

## Despliegue

Guía completa paso a paso: [`server/deploy/GUIA-DESPLIEGUE.md`](server/deploy/GUIA-DESPLIEGUE.md).

Para **actualizar** un despliegue existente (build + subida + restart) desde tu PC con Git Bash/WSL:

```bash
./deploy-update.sh            # backend + frontend
./deploy-update.sh --frontend # solo frontend
./deploy-update.sh --backend  # solo backend
```

Ajusta las variables de la cabecera del script (servidor, URL pública, rutas) según tu entorno.

---

## Pruebas

```bash
cd server
node scripts/e2e-test.js      # recorre registro, perfil, foto, búsqueda (requiere API corriendo)
```

## Notas

- `multer` está en 1.x (deprecado); se recomienda migrar a 2.x antes de abrir al público.
- Para una URL sin puerto y HTTPS se necesita un dominio apuntando al servidor + Nginx/Certbot.
