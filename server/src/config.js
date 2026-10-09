// Carga y centraliza la configuracion desde variables de entorno.
require('dotenv').config();

function required(name, fallback) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return v;
}

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  // Carpeta del build del frontend a servir por el propio Node (opcional).
  // Si no se define, el backend solo expone la API.
  frontendDir: process.env.FRONTEND_DIR || null,

  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'creating',
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev_secret_no_usar_en_produccion'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  uploads: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxWidth: parseInt(process.env.IMAGE_MAX_WIDTH || '1000', 10),
    quality: parseInt(process.env.IMAGE_QUALITY || '78', 10),
    maxUploadMb: parseInt(process.env.MAX_UPLOAD_MB || '10', 10),
  },
};
