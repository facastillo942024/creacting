// Middlewares de autenticacion (JWT) y autorizacion por rol.
const jwt = require('jsonwebtoken');
const config = require('../config');

// Verifica el token Bearer y adjunta el payload en req.user.
function verifyToken(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = payload; // { id, rol, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

// Restringe el acceso a uno o varios roles.
// Uso: requireRole('director'), requireRole('actor', 'admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tienes permiso para esta accion' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
