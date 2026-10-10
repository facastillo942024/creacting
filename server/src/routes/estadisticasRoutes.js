// Rutas de estadisticas (dashboard). Requiere estar autenticado.
const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { verifyToken } = require('../middleware/auth');
const { obtenerEstadisticas } = require('../controllers/estadisticasController');

const router = express.Router();

router.get('/', verifyToken, asyncHandler(obtenerEstadisticas));

module.exports = router;
