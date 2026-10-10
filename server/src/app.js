// Configuracion de la aplicacion Express (middlewares, rutas, errores).
const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');

const authRoutes = require('./routes/authRoutes');
const catalogoRoutes = require('./routes/catalogoRoutes');
const actorRoutes = require('./routes/actorRoutes');
const busquedaRoutes = require('./routes/busquedaRoutes');
const estadisticasRoutes = require('./routes/estadisticasRoutes');

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir fotos subidas de forma estatica.
app.use('/uploads', express.static(path.resolve(__dirname, '..', config.uploads.dir)));

// Healthcheck
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'creacting-server' }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/catalogo', catalogoRoutes);
app.use('/api/actores', actorRoutes);
app.use('/api/busqueda', busquedaRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

// 404 para rutas de API no encontradas
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// --- Frontend estatico (SPA) ---
// Si FRONTEND_DIR esta definido, Express sirve el build de React y hace
// fallback a index.html para el enrutado del lado del cliente.
if (config.frontendDir) {
  app.use(express.static(config.frontendDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(config.frontendDir, 'index.html'));
  });
}

// Manejador de errores central
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Archivo demasiado grande' });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.publicMessage || 'Error interno del servidor' });
});

module.exports = app;
