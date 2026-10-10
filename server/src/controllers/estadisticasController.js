// Controlador de estadisticas globales (dashboard).
// Consultas agregadas de solo lectura sobre las tablas existentes.
const { query } = require('../db');

// GET /api/estadisticas  (requiere token)
async function obtenerEstadisticas(req, res) {
  // --- Totales (tarjetas de resumen) ---
  const [totActores] = await query('SELECT COUNT(*) AS n FROM actores');
  const [totDisponibles] = await query('SELECT COUNT(*) AS n FROM actores WHERE disponible = 1');
  const [totDirectores] = await query(
    "SELECT COUNT(*) AS n FROM usuarios WHERE rol IN ('director','admin')"
  );
  const [totFotos] = await query('SELECT COUNT(*) AS n FROM actor_fotos');
  const [totConFoto] = await query(
    'SELECT COUNT(DISTINCT actor_id) AS n FROM actor_fotos'
  );

  // --- Distribucion por genero ---
  const porGenero = await query(
    `SELECT COALESCE(genero, 'sin especificar') AS etiqueta, COUNT(*) AS valor
     FROM actores GROUP BY genero ORDER BY valor DESC`
  );

  // --- Top paises ---
  const porPais = await query(
    `SELECT COALESCE(NULLIF(pais, ''), 'sin especificar') AS etiqueta, COUNT(*) AS valor
     FROM actores GROUP BY pais ORDER BY valor DESC LIMIT 5`
  );

  // --- Distribucion por rango de estatura (cm) ---
  const porEstatura = await query(
    `SELECT etiqueta, COUNT(*) AS valor FROM (
       SELECT CASE
         WHEN estatura_cm IS NULL THEN 'sin dato'
         WHEN estatura_cm < 160 THEN '< 160 cm'
         WHEN estatura_cm < 170 THEN '160-169 cm'
         WHEN estatura_cm < 180 THEN '170-179 cm'
         WHEN estatura_cm < 190 THEN '180-189 cm'
         ELSE '>= 190 cm'
       END AS etiqueta
       FROM actores
     ) t GROUP BY etiqueta ORDER BY valor DESC`
  );

  // --- Idiomas mas comunes (del catalogo flexible) ---
  const topIdiomas = await query(
    `SELECT co.valor AS etiqueta, COUNT(*) AS valor
     FROM actor_caracteristicas ac
     JOIN caracteristicas c ON c.id = ac.caracteristica_id AND c.clave = 'idiomas'
     JOIN caracteristica_opciones co ON co.id = ac.opcion_id
     GROUP BY co.valor ORDER BY valor DESC LIMIT 6`
  );

  // --- Habilidades/caracteristicas mas frecuentes (globales, agrupado por caracteristica) ---
  const topHabilidades = await query(
    `SELECT c.etiqueta AS etiqueta, COUNT(*) AS valor
     FROM actor_caracteristicas ac
     JOIN caracteristicas c ON c.id = ac.caracteristica_id
     WHERE c.tipo_dato IN ('multi','opcion','boolean')
     GROUP BY c.etiqueta ORDER BY valor DESC LIMIT 6`
  );

  // --- Actividad reciente: ultimos actores actualizados con nombre ---
  const recientes = await query(
    `SELECT a.id, COALESCE(NULLIF(a.nombre_artistico, ''), u.nombre) AS nombre,
            a.pais, a.genero, a.actualizado_en
     FROM actores a JOIN usuarios u ON u.id = a.usuario_id
     ORDER BY a.actualizado_en DESC LIMIT 5`
  );

  return res.json({
    totales: {
      actores: totActores.n,
      disponibles: totDisponibles.n,
      directores: totDirectores.n,
      fotos: totFotos.n,
      actoresConFoto: totConFoto.n,
    },
    porGenero,
    porPais,
    porEstatura,
    topIdiomas,
    topHabilidades,
    recientes,
  });
}

module.exports = { obtenerEstadisticas };
