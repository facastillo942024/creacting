// Ejecuta un archivo .sql contra el servidor MySQL/MariaDB.
// Uso: node scripts/run-sql.js db/schema.sql
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const rel = process.argv[2];
  if (!rel) {
    console.error('Uso: node scripts/run-sql.js <archivo.sql>');
    process.exit(1);
  }
  const file = path.resolve(__dirname, '..', rel);
  if (!fs.existsSync(file)) {
    console.error(`No existe el archivo: ${file}`);
    process.exit(1);
  }
  const sql = fs.readFileSync(file, 'utf8');

  // No preseleccionamos database: schema.sql la crea con CREATE DATABASE.
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
    charset: 'utf8mb4',
  });

  try {
    console.log(`Ejecutando ${rel} ...`);
    await conn.query(sql);
    console.log('OK');
  } catch (err) {
    console.error('Error ejecutando SQL:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
