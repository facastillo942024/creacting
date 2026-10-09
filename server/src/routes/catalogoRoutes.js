// Rutas del catalogo de caracteristicas (publico: sirve para formularios y buscador).
const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { listarCaracteristicas } = require('../controllers/catalogoController');

const router = express.Router();

router.get('/caracteristicas', asyncHandler(listarCaracteristicas));

module.exports = router;
