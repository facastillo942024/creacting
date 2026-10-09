// Servicio de subida de imagenes: recibe en memoria (multer) y comprime a WebP (sharp).
// En disco solo queda el archivo comprimido; en BBDD guardamos la ruta.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const config = require('../config');

const uploadDir = path.resolve(__dirname, '..', '..', config.uploads.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Guardamos en memoria para poder procesar con sharp antes de escribir a disco.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxUploadMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp|jpg)$/.test(file.mimetype)) {
      return cb(null, true);
    }
    const err = new Error('Formato de imagen no soportado (usa JPG, PNG o WebP)');
    err.status = 400;
    err.publicMessage = err.message;
    cb(err);
  },
});

// Procesa un buffer de imagen: redimensiona, convierte a WebP y lo guarda.
// Devuelve { ruta, ancho, alto, peso_bytes }.
async function procesarYGuardar(buffer) {
  const nombre = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`;
  const destino = path.join(uploadDir, nombre);

  const salida = await sharp(buffer)
    .rotate() // respeta orientacion EXIF
    .resize({ width: config.uploads.maxWidth, withoutEnlargement: true })
    .webp({ quality: config.uploads.quality })
    .toFile(destino);

  return {
    ruta: `/uploads/${nombre}`, // ruta publica servida por express.static
    ancho: salida.width,
    alto: salida.height,
    peso_bytes: salida.size,
  };
}

// Elimina un archivo fisico a partir de su ruta publica (/uploads/xxx.webp).
function eliminarArchivo(rutaPublica) {
  if (!rutaPublica) return;
  const nombre = path.basename(rutaPublica);
  const archivo = path.join(uploadDir, nombre);
  fs.promises.unlink(archivo).catch(() => {
    /* si no existe, lo ignoramos */
  });
}

module.exports = { upload, procesarYGuardar, eliminarArchivo };
