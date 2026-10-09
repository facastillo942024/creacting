// Rutas de busqueda de actores (solo director/admin).
const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { verifyToken, requireRole } = require('../middleware/auth');
const { buscarActores } = require('../controllers/busquedaController');

const router = express.Router();

router.post(
  '/actores',
  verifyToken,
  requireRole('director', 'admin'),
  asyncHandler(buscarActores)
);

module.exports = router;
