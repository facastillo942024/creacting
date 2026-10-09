// Rutas del perfil de actor.
const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { verifyToken, requireRole } = require('../middleware/auth');
const { upload } = require('../services/uploadService');
const ctrl = require('../controllers/actorController');

const router = express.Router();

// --- Rutas del propio actor (rol actor) ---
router.get('/me', verifyToken, requireRole('actor'), asyncHandler(ctrl.miPerfil));
router.put('/me', verifyToken, requireRole('actor'), asyncHandler(ctrl.actualizarPerfil));
router.put(
  '/me/caracteristicas',
  verifyToken,
  requireRole('actor'),
  asyncHandler(ctrl.guardarCaracteristicas)
);
router.post(
  '/me/fotos',
  verifyToken,
  requireRole('actor'),
  upload.single('foto'),
  asyncHandler(ctrl.subirFoto)
);
router.delete(
  '/me/fotos/:fotoId',
  verifyToken,
  requireRole('actor'),
  asyncHandler(ctrl.eliminarFoto)
);
router.put(
  '/me/foto-principal/:fotoId',
  verifyToken,
  requireRole('actor'),
  asyncHandler(ctrl.marcarFotoPrincipal)
);

// --- Ver perfil publico (directores/admin) ---
router.get(
  '/:id',
  verifyToken,
  requireRole('director', 'admin'),
  asyncHandler(ctrl.verPerfil)
);

module.exports = router;
