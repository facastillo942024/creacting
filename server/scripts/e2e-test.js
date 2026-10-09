// Prueba E2E local contra la API en ejecucion (http://localhost:5000).
// Registra un actor, completa su perfil, sube una foto, registra un director y busca.
const http = require('http');
const sharp = require('sharp');

const BASE = 'http://localhost:5000';

function req(method, path, { body, token, form } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    let payload;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (form) {
      // multipart/form-data manual con un solo campo "foto"
      const boundary = '----e2e' + Date.now();
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      const pre = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="foto"; filename="test.webp"\r\nContent-Type: image/webp\r\n\r\n`
      );
      const post = Buffer.from(`\r\n--${boundary}--\r\n`);
      payload = Buffer.concat([pre, form, post]);
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = Buffer.from(JSON.stringify(body));
    }
    const u = new URL(BASE + path);
    const r = http.request(
      { method, hostname: u.hostname, port: u.port, path: u.pathname + u.search, headers },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json = null;
          try { json = data ? JSON.parse(data) : null; } catch { json = data; }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

const ok = (c, msg) => console.log(`${c ? 'PASS' : 'FALLO'} - ${msg}`);
let fails = 0;
const check = (c, msg) => { if (!c) fails++; ok(c, msg); };

(async () => {
  const stamp = Date.now();
  const actorEmail = `actor_${stamp}@test.com`;
  const dirEmail = `dir_${stamp}@test.com`;

  // 1. Registro actor
  let r = await req('POST', '/api/auth/register', {
    body: { email: actorEmail, password: 'secreto123', nombre: 'Juan Prueba', rol: 'actor' },
  });
  check(r.status === 201 && r.json.token, 'registro de actor');
  const actorToken = r.json.token;

  // 2. Actualizar perfil (columnas fijas)
  r = await req('PUT', '/api/actores/me', {
    token: actorToken,
    body: {
      nombre_artistico: 'Juanito P.',
      genero: 'masculino',
      pais: 'Colombia',
      ciudad: 'Bogota',
      estatura_cm: 180,
      peso_kg: 75,
      color_ojos: 'cafe',
      color_cabello: 'negro',
      mano_dominante: 'diestro',
      disponible: 1,
    },
  });
  check(r.status === 200 && r.json.actor.estatura_cm === 180, 'actualizar perfil con atributos');

  // 3. Guardar caracteristicas (idiomas multi + sordo boolean)
  r = await req('PUT', '/api/actores/me/caracteristicas', {
    token: actorToken,
    body: {
      caracteristicas: [
        { clave: 'idiomas', opciones: ['Español', 'Inglés'] },
        { clave: 'sordo', valor: true },
        { clave: 'deportes', opciones: ['Natación'] },
      ],
    },
  });
  const tieneIdiomas = r.json.actor?.caracteristicas?.some((c) => c.clave === 'idiomas');
  check(r.status === 200 && tieneIdiomas, 'guardar caracteristicas (idiomas, sordo, deportes)');

  // 4. Subir una foto (generada con sharp)
  const img = await sharp({
    create: { width: 300, height: 400, channels: 3, background: { r: 100, g: 120, b: 160 } },
  }).jpeg().toBuffer();
  r = await req('POST', '/api/actores/me/fotos', { token: actorToken, form: img });
  check(r.status === 201 && r.json.foto?.ruta, 'subir foto (galeria)');

  // 5. Registro director
  r = await req('POST', '/api/auth/register', {
    body: { email: dirEmail, password: 'secreto123', nombre: 'Dir Prueba', rol: 'director' },
  });
  check(r.status === 201 && r.json.usuario.rol === 'director', 'registro de director');
  const dirToken = r.json.token;

  // 6. Busqueda: filtro fijo (estatura) + caracteristica (idiomas) + boolean (sordo)
  r = await req('POST', '/api/busqueda/actores', {
    token: dirToken,
    body: {
      estatura_min: 170,
      estatura_max: 190,
      caracteristicas: [
        { clave: 'idiomas', opciones: ['Inglés'] },
        { clave: 'sordo', valor: true },
      ],
    },
  });
  const encontrado = r.status === 200 && r.json.actores?.some((a) => a.nombre_artistico === 'Juanito P.');
  check(encontrado, 'busqueda por director con filtros combinados encuentra al actor');
  check(r.json.actores?.[0]?.foto_principal, 'resultado incluye foto principal (galeria en listado)');

  // 7. Director ve perfil completo
  const actorId = r.json.actores?.[0]?.id;
  r = await req('GET', `/api/actores/${actorId}`, { token: dirToken });
  check(r.status === 200 && r.json.actor.fotos?.length >= 1, 'director ve perfil completo con fotos');

  // 8. Un actor NO puede buscar (control de rol)
  r = await req('POST', '/api/busqueda/actores', { token: actorToken, body: {} });
  check(r.status === 403, 'actor NO puede usar la busqueda (403 por rol)');

  console.log(`\nResultado: ${fails === 0 ? 'TODAS LAS PRUEBAS PASARON' : fails + ' FALLO(S)'}`);
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error('ERROR E2E:', e.message); process.exit(1); });
