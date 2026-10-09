# CreactingCinema · Backend API

API REST en Node.js/Express para una plataforma de actores/talento.

- **Actores** se registran y completan su perfil (datos físicos, habilidades, condiciones, fotos).
- **Directores/Productores** buscan y filtran actores por cualquier combinación de características.
- **Admin** gestiona la plataforma.

## Stack

- Node.js + Express (API REST)
- MySQL / MariaDB (`mysql2`, pool con transacciones)
- JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) para auth
- Multer (subida) + Sharp (compresión a WebP) para fotos
- Modelo de datos **híbrido**: columnas fijas para lo estable + catálogo flexible (EAV) para rasgos que crecen sin tocar el esquema.

## Modelo de datos

| Tabla | Rol |
|-------|-----|
| `usuarios` | credenciales + rol (`actor`/`director`/`admin`) |
| `actores` | perfil de columnas fijas (género, estatura, peso, colores, etc.) |
| `actor_fotos` | fotos (solo la **ruta** en BBDD; el archivo vive en disco) |
| `caracteristicas` | catálogo: qué rasgos existen y de qué tipo |
| `caracteristica_opciones` | opciones para rasgos de tipo `opcion`/`multi` |
| `actor_caracteristicas` | valores de cada rasgo por actor (EAV) |

Tipos de característica: `texto`, `numero`, `boolean`, `opcion` (una), `multi` (varias).
Para agregar un rasgo nuevo (ej. "cicatrices visibles") basta con insertar una fila en `caracteristicas`; no se toca código ni esquema.

## Puesta en marcha

```bash
cd server
cp .env.example .env      # edita credenciales de BBDD y JWT_SECRET
npm install

# Crear tablas y poblar el catálogo de características
npm run db:setup          # = db:schema + db:seed

npm run dev               # desarrollo (node --watch)
# o
npm start
```

El servidor queda en `http://localhost:<PORT>` (por defecto 5000). Healthcheck: `GET /api/health`.

## Fotos: por qué disco y no base64

Las fotos se guardan **en disco comprimidas a WebP** (redimensionadas con Sharp), y en la BBDD solo queda la ruta. Guardar base64 en BBDD **no ahorra disco**: infla el tamaño ~33%, engorda backups y consume CPU/memoria en cada consulta. Con compresión, una foto de varios MB baja a ~150-300 KB. Si más adelante creces, esas rutas migran fácil a S3/R2 sin cambiar el modelo.

Ajustes en `.env`: `IMAGE_MAX_WIDTH`, `IMAGE_QUALITY`, `MAX_UPLOAD_MB`, `UPLOAD_DIR`.

## Endpoints

Todas las respuestas son JSON. Las rutas protegidas requieren `Authorization: Bearer <token>`.

### Auth
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/api/auth/register` | público | Registra `actor` o `director`. Devuelve `{ token, usuario }`. Al crear un actor se genera su perfil vacío. |
| POST | `/api/auth/login` | público | Devuelve `{ token, usuario }`. |
| GET | `/api/auth/me` | token | Datos del usuario autenticado. |

`register` body: `{ email, password, nombre, telefono?, rol? }` (`rol` = `actor` por defecto; `admin` no se crea por registro público).

### Catálogo
| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/catalogo/caracteristicas` | público | Lista características + opciones. `?buscables=1` filtra solo las que sirven de filtro. Úsalo para pintar formularios y el buscador. |

### Perfil de actor (rol `actor`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/actores/me` | Mi perfil completo (columnas + características + fotos). |
| PUT | `/api/actores/me` | Actualiza columnas fijas. |
| PUT | `/api/actores/me/caracteristicas` | Reemplaza el set de características. |
| POST | `/api/actores/me/fotos` | Sube una foto (`multipart/form-data`, campo `foto`). |
| DELETE | `/api/actores/me/fotos/:fotoId` | Borra una foto (archivo + registro). |
| PUT | `/api/actores/me/foto-principal/:fotoId` | Marca la foto principal. |

`PUT /me/caracteristicas` body:
```json
{
  "caracteristicas": [
    { "clave": "idiomas", "opciones": ["Español", "Inglés"] },
    { "clave": "sordo", "valor": true },
    { "clave": "talla_calzado", "valor": 42 },
    { "clave": "senas_particulares", "valor": "Cicatriz en la ceja izquierda" }
  ]
}
```

### Ver perfil (rol `director`/`admin`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/actores/:id` | Perfil completo de un actor. |

### Búsqueda (rol `director`/`admin`)
`POST /api/busqueda/actores` — filtros combinables (todos opcionales, se aplican en AND):

```json
{
  "texto": "juan",
  "genero": "masculino",
  "pais": "Colombia",
  "estatura_min": 170, "estatura_max": 190,
  "peso_min": 60, "peso_max": 90,
  "color_ojos": "verde",
  "disponible": true,
  "caracteristicas": [
    { "clave": "idiomas", "opciones": ["Inglés"] },
    { "clave": "sordo", "valor": true },
    { "clave": "talla_calzado", "min": 40, "max": 44 }
  ],
  "page": 1, "pageSize": 20
}
```
Respuesta: `{ total, page, pageSize, totalPages, actores: [...] }`.
Cada filtro de catálogo se traduce a un `EXISTS` independiente, de modo que los criterios se combinan sin duplicar filas.

## Despliegue en Linux (resumen)

1. Instala Node.js LTS y un MySQL/MariaDB accesible.
2. Clona el repo, `cd server`, crea `.env` de producción (`JWT_SECRET` largo y aleatorio, credenciales reales, `CORS_ORIGIN` con el dominio del frontend).
3. `npm install --omit=dev` y `npm run db:setup`.
4. Levanta con un gestor de procesos (PM2/systemd): `pm2 start src/server.js --name creacting-api`.
5. Pon Nginx delante con HTTPS (Let's Encrypt) y proxy_pass al puerto de Node. **No expongas HTTP plano** para login/subidas.
6. La carpeta `uploads/` debe tener permisos de escritura para el usuario del proceso y estar respaldada (o migrada a almacenamiento de objetos).

## Notas / pendientes

- **`multer` 1.x** está marcado como deprecado por vulnerabilidades; considerar subir a `multer@2.x` (misma API salvo detalles menores).
- Añadir rate limiting en `/api/auth/*` y validación con una librería (ej. `zod`/`express-validator`) antes de producción.
- El primer `admin` se crea manualmente en BBDD (o con un script), ya que el registro público solo permite `actor`/`director`.
