// Controlador del catalogo de caracteristicas (para poblar formularios y buscador).
const { query } = require('../db');

// GET /api/catalogo/caracteristicas
// Devuelve las caracteristicas activas con sus opciones anidadas.
async function listarCaracteristicas(req, res) {
  const soloBuscables = req.query.buscables === '1';

  const caracteristicas = await query(
    `SELECT id, clave, etiqueta, grupo, tipo_dato, unidad, buscable, orden
     FROM caracteristicas
     WHERE activo = 1 ${soloBuscables ? 'AND buscable = 1' : ''}
     ORDER BY orden, etiqueta`
  );

  if (caracteristicas.length === 0) {
    return res.json({ caracteristicas: [] });
  }

  const ids = caracteristicas.map((c) => c.id);
  const placeholders = ids.map(() => '?').join(',');
  const opciones = await query(
    `SELECT id, caracteristica_id, valor, orden
     FROM caracteristica_opciones
     WHERE caracteristica_id IN (${placeholders})
     ORDER BY orden, valor`,
    ids
  );

  // Agrupar opciones por caracteristica
  const porCaracteristica = new Map();
  for (const op of opciones) {
    if (!porCaracteristica.has(op.caracteristica_id)) {
      porCaracteristica.set(op.caracteristica_id, []);
    }
    porCaracteristica.get(op.caracteristica_id).push({ id: op.id, valor: op.valor });
  }

  const resultado = caracteristicas.map((c) => ({
    ...c,
    opciones: porCaracteristica.get(c.id) || [],
  }));

  return res.json({ caracteristicas: resultado });
}

module.exports = { listarCaracteristicas };
