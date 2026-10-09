// Controlador del perfil de actor: ver/editar perfil, caracteristicas y fotos.
const { query, withTransaction } = require('../db');
const { procesarYGuardar, eliminarArchivo } = require('../services/uploadService');

// Columnas fijas editables del perfil de actor.
const CAMPOS_ACTOR = [
  'nombre_artistico', 'genero', 'fecha_nacimiento', 'pais', 'ciudad',
  'estatura_cm', 'peso_kg', 'color_cabello', 'color_ojos', 'color_piel',
  'mano_dominante', 'biografia', 'reel_url', 'disponible',
];

// Obtiene el actor asociado al usuario autenticado.
async function obtenerActorDeUsuario(usuarioId) {
  const filas = await query('SELECT * FROM actores WHERE usuario_id = :usuarioId', { usuarioId });
  return filas[0] || null;
}

// Arma el perfil completo (columnas + caracteristicas + fotos) por id de actor.
async function armarPerfilCompleto(actorId) {
  const filas = await query(
    `SELECT a.*, u.nombre, u.email, u.telefono
     FROM actores a JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.id = :actorId`,
    { actorId }
  );
  const actor = filas[0];
  if (!actor) return null;

  const caracteristicas = await query(
    `SELECT ac.caracteristica_id, c.clave, c.etiqueta, c.tipo_dato,
            ac.opcion_id, co.valor AS opcion_valor,
            ac.valor_texto, ac.valor_numero, ac.valor_booleano
     FROM actor_caracteristicas ac
     JOIN caracteristicas c ON c.id = ac.caracteristica_id
     LEFT JOIN caracteristica_opciones co ON co.id = ac.opcion_id
     WHERE ac.actor_id = :actorId
     ORDER BY c.orden`,
    { actorId }
  );

  const fotos = await query(
    'SELECT id, ruta, ancho, alto, orden FROM actor_fotos WHERE actor_id = :actorId ORDER BY orden, id',
    { actorId }
  );

  return { ...actor, caracteristicas, fotos };
}

// GET /api/actores/me  (rol actor)
async function miPerfil(req, res) {
  const actor = await obtenerActorDeUsuario(req.user.id);
  if (!actor) return res.status(404).json({ error: 'Perfil de actor no encontrado' });
  const perfil = await armarPerfilCompleto(actor.id);
  return res.json({ actor: perfil });
}

// GET /api/actores/:id  (publico para directores/admin)
async function verPerfil(req, res) {
  const perfil = await armarPerfilCompleto(req.params.id);
  if (!perfil) return res.status(404).json({ error: 'Actor no encontrado' });
  return res.json({ actor: perfil });
}

// PUT /api/actores/me  (rol actor) - actualiza columnas fijas
async function actualizarPerfil(req, res) {
  const actor = await obtenerActorDeUsuario(req.user.id);
  if (!actor) return res.status(404).json({ error: 'Perfil de actor no encontrado' });

  const sets = [];
  const params = { actorId: actor.id };
  for (const campo of CAMPOS_ACTOR) {
    if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
      sets.push(`${campo} = :${campo}`);
      params[campo] = req.body[campo] === '' ? null : req.body[campo];
    }
  }
  if (sets.length === 0) {
    return res.status(400).json({ error: 'No se enviaron campos para actualizar' });
  }

  await query(`UPDATE actores SET ${sets.join(', ')} WHERE id = :actorId`, params);
  const perfil = await armarPerfilCompleto(actor.id);
  return res.json({ actor: perfil });
}

// PUT /api/actores/me/caracteristicas  (rol actor)
// Reemplaza el set de caracteristicas del actor.
// Body: { caracteristicas: [ { clave, valor } | { clave, opciones:[valorOpcion,...] } ] }
async function guardarCaracteristicas(req, res) {
  const actor = await obtenerActorDeUsuario(req.user.id);
  if (!actor) return res.status(404).json({ error: 'Perfil de actor no encontrado' });

  const entradas = Array.isArray(req.body.caracteristicas) ? req.body.caracteristicas : [];

  // Catalogo indexado por clave, con opciones por valor.
  const cat = await query('SELECT id, clave, tipo_dato FROM caracteristicas WHERE activo = 1');
  const catPorClave = new Map(cat.map((c) => [c.clave, c]));

  const opcionesFilas = await query(
    'SELECT id, caracteristica_id, valor FROM caracteristica_opciones'
  );
  // Map: caracteristica_id -> Map(valor -> opcion_id)
  const opcionesPorCarac = new Map();
  for (const op of opcionesFilas) {
    if (!opcionesPorCarac.has(op.caracteristica_id)) {
      opcionesPorCarac.set(op.caracteristica_id, new Map());
    }
    opcionesPorCarac.get(op.caracteristica_id).set(op.valor, op.id);
  }

  await withTransaction(async (conn) => {
    // Borra las caracteristicas actuales y reinserta.
    await conn.execute('DELETE FROM actor_caracteristicas WHERE actor_id = :actorId', {
      actorId: actor.id,
    });

    for (const entrada of entradas) {
      const def = catPorClave.get(entrada.clave);
      if (!def) continue; // clave desconocida, se ignora

      if (def.tipo_dato === 'multi') {
        const opciones = Array.isArray(entrada.opciones) ? entrada.opciones : [];
        for (const valorOp of opciones) {
          const opId = opcionesPorCarac.get(def.id)?.get(valorOp);
          if (!opId) continue;
          await conn.execute(
            `INSERT INTO actor_caracteristicas (actor_id, caracteristica_id, opcion_id)
             VALUES (:actorId, :cid, :opId)`,
            { actorId: actor.id, cid: def.id, opId }
          );
        }
      } else if (def.tipo_dato === 'opcion') {
        const opId = opcionesPorCarac.get(def.id)?.get(entrada.valor);
        if (!opId) continue;
        await conn.execute(
          `INSERT INTO actor_caracteristicas (actor_id, caracteristica_id, opcion_id)
           VALUES (:actorId, :cid, :opId)`,
          { actorId: actor.id, cid: def.id, opId }
        );
      } else if (def.tipo_dato === 'boolean') {
        await conn.execute(
          `INSERT INTO actor_caracteristicas (actor_id, caracteristica_id, valor_booleano)
           VALUES (:actorId, :cid, :val)`,
          { actorId: actor.id, cid: def.id, val: entrada.valor ? 1 : 0 }
        );
      } else if (def.tipo_dato === 'numero') {
        const num = Number(entrada.valor);
        if (Number.isNaN(num)) continue;
        await conn.execute(
          `INSERT INTO actor_caracteristicas (actor_id, caracteristica_id, valor_numero)
           VALUES (:actorId, :cid, :val)`,
          { actorId: actor.id, cid: def.id, val: num }
        );
      } else {
        // texto
        if (entrada.valor == null || entrada.valor === '') continue;
        await conn.execute(
          `INSERT INTO actor_caracteristicas (actor_id, caracteristica_id, valor_texto)
           VALUES (:actorId, :cid, :val)`,
          { actorId: actor.id, cid: def.id, val: String(entrada.valor).slice(0, 255) }
        );
      }
    }
  });

  const perfil = await armarPerfilCompleto(actor.id);
  return res.json({ actor: perfil });
}

// POST /api/actores/me/fotos  (rol actor) - multipart, campo "foto"
async function subirFoto(req, res) {
  const actor = await obtenerActorDeUsuario(req.user.id);
  if (!actor) return res.status(404).json({ error: 'Perfil de actor no encontrado' });
  if (!req.file) return res.status(400).json({ error: 'No se envio ninguna imagen' });

  const meta = await procesarYGuardar(req.file.buffer);

  // Siguiente orden
  const filas = await query(
    'SELECT COALESCE(MAX(orden), -1) + 1 AS siguiente FROM actor_fotos WHERE actor_id = :actorId',
    { actorId: actor.id }
  );
  const orden = filas[0].siguiente;

  const insert = await query(
    `INSERT INTO actor_fotos (actor_id, ruta, ancho, alto, peso_bytes, orden)
     VALUES (:actorId, :ruta, :ancho, :alto, :peso, :orden)`,
    {
      actorId: actor.id,
      ruta: meta.ruta,
      ancho: meta.ancho,
      alto: meta.alto,
      peso: meta.peso_bytes,
      orden,
    }
  );

  const fotoId = insert.insertId;

  // Si no tiene foto principal, esta pasa a serlo.
  if (!actor.foto_principal_id) {
    await query('UPDATE actores SET foto_principal_id = :fid WHERE id = :actorId', {
      fid: fotoId,
      actorId: actor.id,
    });
  }

  return res.status(201).json({
    foto: { id: fotoId, ...meta, orden },
  });
}

// DELETE /api/actores/me/fotos/:fotoId  (rol actor)
async function eliminarFoto(req, res) {
  const actor = await obtenerActorDeUsuario(req.user.id);
  if (!actor) return res.status(404).json({ error: 'Perfil de actor no encontrado' });

  const filas = await query(
    'SELECT id, ruta FROM actor_fotos WHERE id = :fotoId AND actor_id = :actorId',
    { fotoId: req.params.fotoId, actorId: actor.id }
  );
  const foto = filas[0];
  if (!foto) return res.status(404).json({ error: 'Foto no encontrada' });

  await query('DELETE FROM actor_fotos WHERE id = :id', { id: foto.id });
  eliminarArchivo(foto.ruta);

  return res.json({ ok: true });
}

// PUT /api/actores/me/foto-principal/:fotoId  (rol actor)
async function marcarFotoPrincipal(req, res) {
  const actor = await obtenerActorDeUsuario(req.user.id);
  if (!actor) return res.status(404).json({ error: 'Perfil de actor no encontrado' });

  const filas = await query(
    'SELECT id FROM actor_fotos WHERE id = :fotoId AND actor_id = :actorId',
    { fotoId: req.params.fotoId, actorId: actor.id }
  );
  if (filas.length === 0) return res.status(404).json({ error: 'Foto no encontrada' });

  await query('UPDATE actores SET foto_principal_id = :fid WHERE id = :actorId', {
    fid: req.params.fotoId,
    actorId: actor.id,
  });
  return res.json({ ok: true });
}

module.exports = {
  miPerfil,
  verPerfil,
  actualizarPerfil,
  guardarCaracteristicas,
  subirFoto,
  eliminarFoto,
  marcarFotoPrincipal,
};
