// Crea (o reusa) usuarios de prueba con credenciales fijas y faciles de recordar.
// Uso:  node scripts/seed-usuarios-demo.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const DEMO = [
  { email: 'actor@demo.com',    password: 'demo1234', nombre: 'Ana Actriz',    rol: 'actor' },
  { email: 'director@demo.com', password: 'demo1234', nombre: 'Diego Director', rol: 'director' },
  { email: 'admin@demo.com',    password: 'demo1234', nombre: 'Admin Demo',     rol: 'admin' },
];

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'creating',
  });

  for (const u of DEMO) {
    const hash = await bcrypt.hash(u.password, 10);
    const [rows] = await c.execute('SELECT id FROM usuarios WHERE email = ?', [u.email]);
    let usuarioId;
    if (rows.length) {
      usuarioId = rows[0].id;
      await c.execute('UPDATE usuarios SET password_hash=?, nombre=?, rol=?, activo=1 WHERE id=?', [
        hash, u.nombre, u.rol, usuarioId,
      ]);
      console.log(`actualizado  [${u.rol}] ${u.email}`);
    } else {
      const [r] = await c.execute(
        'INSERT INTO usuarios (email, password_hash, rol, nombre) VALUES (?,?,?,?)',
        [u.email, hash, u.rol, u.nombre]
      );
      usuarioId = r.insertId;
      console.log(`creado       [${u.rol}] ${u.email}`);
    }
    // Si es actor, asegurar fila de perfil
    if (u.rol === 'actor') {
      const [a] = await c.execute('SELECT id FROM actores WHERE usuario_id = ?', [usuarioId]);
      if (!a.length) {
        await c.execute('INSERT INTO actores (usuario_id) VALUES (?)', [usuarioId]);
      }
    }
  }

  console.log('\nUsuarios demo listos (password para todos: demo1234):');
  DEMO.forEach((u) => console.log(`  ${u.email}  ->  ${u.rol}`));
  await c.end();
})().catch((e) => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
