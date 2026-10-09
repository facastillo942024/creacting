// Pool de conexiones MySQL/MariaDB y helpers de consulta.
const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  namedPlaceholders: true,
});

// Ejecuta una consulta y devuelve las filas.
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Ejecuta trabajo dentro de una transaccion. `fn` recibe una conexion.
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, query, withTransaction };
