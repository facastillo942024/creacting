// Controlador de autenticacion: registro y login.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, withTransaction } = require('../db');
const config = require('../config');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES_PERMITIDOS = ['actor', 'director']; // admin no se crea por registro publico

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, email: usuario.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

// POST /api/auth/register
async function register(req, res) {
  const { email, password, nombre, telefono, rol } = req.body || {};

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Email invalido' });
  }
  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' });
  }
  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }
  const rolFinal = ROLES_PERMITIDOS.includes(rol) ? rol : 'actor';

  // Email unico
  const existe = await query('SELECT id FROM usuarios WHERE email = :email', { email });
  if (existe.length > 0) {
    return res.status(409).json({ error: 'Ese email ya esta registrado' });
  }

  const passwordHash = await bcrypt.hash(String(password), 10);

  const usuario = await withTransaction(async (conn) => {
    const [result] = await conn.execute(
      `INSERT INTO usuarios (email, password_hash, rol, nombre, telefono)
       VALUES (:email, :hash, :rol, :nombre, :telefono)`,
      {
        email,
        hash: passwordHash,
        rol: rolFinal,
        nombre: String(nombre).trim(),
        telefono: telefono || null,
      }
    );
    const usuarioId = result.insertId;

    // Si es actor, creamos su perfil vacio asociado.
    if (rolFinal === 'actor') {
      await conn.execute(
        'INSERT INTO actores (usuario_id) VALUES (:usuarioId)',
        { usuarioId }
      );
    }

    return { id: usuarioId, email, rol: rolFinal, nombre: String(nombre).trim() };
  });

  const token = firmarToken(usuario);
  return res.status(201).json({ token, usuario });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contrasena son obligatorios' });
  }

  const filas = await query(
    'SELECT id, email, password_hash, rol, nombre, activo FROM usuarios WHERE email = :email',
    { email }
  );
  const usuario = filas[0];

  // Mensaje generico para no revelar si el email existe.
  if (!usuario || !usuario.activo) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const ok = await bcrypt.compare(String(password), usuario.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const publico = { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre };
  const token = firmarToken(publico);
  return res.json({ token, usuario: publico });
}

// GET /api/auth/me  (requiere token)
async function me(req, res) {
  const filas = await query(
    'SELECT id, email, rol, nombre, telefono, creado_en FROM usuarios WHERE id = :id',
    { id: req.user.id }
  );
  if (filas.length === 0) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }
  return res.json({ usuario: filas[0] });
}

module.exports = { register, login, me };
