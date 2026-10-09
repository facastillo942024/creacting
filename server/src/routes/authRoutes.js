// Rutas de autenticacion.
const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const { verifyToken } = require('../middleware/auth');
const { register, login, me } = require('../controllers/authController');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/me', verifyToken, asyncHandler(me));

module.exports = router;
