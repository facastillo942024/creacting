// Controlador de busqueda de actores con filtros dinamicos (rol director/admin).
//
// Body (POST /api/busqueda/actores):
// {
//   "texto": "juan",                       // busca en nombre / nombre_artistico
//   "genero": "masculino",
//   "pais": "Colombia",
//   "estatura_min": 170, "estatura_max": 190,
//   "peso_min": 60, "peso_max": 90,
//   "color_ojos": "verde",
//   "disponible": true,
//   "caracteristicas": [                    // filtros del catalogo flexible
//     { "clave": "idiomas", "opciones": ["Inglés","Español"] },  // multi/opcion
//     { "clave": "sordo", "valor": true },                        // boolean
//     { "clave": "talla_calzado", "min": 40, "max": 44 }          // numero
//   ],
//   "page": 1, "pageSize": 20
// }
const { query } = require('../db');

// Rangos numericos permitidos sobre columnas fijas.
const RANGOS_FIJOS = {
  estatura: 'estatura_cm',
  peso: 'peso_kg',
};

async function buscarActores(req, res) {
  const b = req.body || {};
  const where = [];
  const params = {};
  // joins para caracteristicas: cada filtro de catalogo agrega un EXISTS independiente
  // (asi combinamos varios criterios en AND sin duplicar filas).

  // --- Columnas fijas ---
  if (b.genero) {
    where.push('a.genero = :genero');
    params.genero = b.genero;
  }
  if (b.pais) {
    where.push('a.pais = :pais');
    params.pais = b.pais;
  }
  if (b.ciudad) {
    where.push('a.ciudad LIKE :ciudad');
    params.ciudad = `%${b.ciudad}%`;
  }
  if (b.color_ojos) {
    where.push('a.color_ojos = :color_ojos');
    params.color_ojos = b.color_ojos;
  }
  if (b.color_cabello) {
    where.push('a.color_cabello = :color_cabello');
    params.color_cabello = b.color_cabello;
  }
  if (b.color_piel) {
    where.push('a.color_piel = :color_piel');
    params.color_piel = b.color_piel;
  }
  if (b.mano_dominante) {
    where.push('a.mano_dominante = :mano_dominante');
    params.mano_dominante = b.mano_dominante;
  }
  if (typeof b.disponible === 'boolean') {
    where.push('a.disponible = :disponible');
    params.disponible = b.disponible ? 1 : 0;
  }
  if (b.texto) {
    where.push('(a.nombre_artistico LIKE :texto OR u.nombre LIKE :texto)');
    params.texto = `%${b.texto}%`;
  }

  // Rangos numericos sobre columnas fijas
  for (const [clave, columna] of Object.entries(RANGOS_FIJOS)) {
    const min = b[`${clave}_min`];
    const max = b[`${clave}_max`];
    if (min != null && !Number.isNaN(Number(min))) {
      where.push(`a.${columna} >= :${clave}_min`);
      params[`${clave}_min`] = Number(min);
    }
    if (max != null && !Number.isNaN(Number(max))) {
      where.push(`a.${columna} <= :${clave}_max`);
      params[`${clave}_max`] = Number(max);
    }
  }

  // --- Caracteristicas del catalogo flexible ---
  const filtrosCarac = Array.isArray(b.caracteristicas) ? b.caracteristicas : [];
  if (filtrosCarac.length > 0) {
    // Resolver claves -> definicion
    const cat = await query('SELECT id, clave, tipo_dato FROM caracteristicas WHERE activo = 1');
    const catPorClave = new Map(cat.map((c) => [c.clave, c]));

    let i = 0;
    for (const f of filtrosCarac) {
      const def = catPorClave.get(f.clave);
      if (!def) continue;
      i += 1;
      const p = `c${i}`; // prefijo unico de parametros

      if (def.tipo_dato === 'multi' || def.tipo_dato === 'opcion') {
        const opciones = Array.isArray(f.opciones)
          ? f.opciones
          : f.valor != null
          ? [f.valor]
          : [];
        if (opciones.length === 0) continue;
        const names = opciones.map((_, k) => `:${p}_v${k}`);
        opciones.forEach((val, k) => {
          params[`${p}_v${k}`] = val;
        });
        params[`${p}_cid`] = def.id;
        where.push(
          `EXISTS (
             SELECT 1 FROM actor_caracteristicas ac
             JOIN caracteristica_opciones co ON co.id = ac.opcion_id
             WHERE ac.actor_id = a.id AND ac.caracteristica_id = :${p}_cid
               AND co.valor IN (${names.join(',')})
           )`
        );
      } else if (def.tipo_dato === 'boolean') {
        params[`${p}_cid`] = def.id;
        params[`${p}_val`] = f.valor ? 1 : 0;
        where.push(
          `EXISTS (
             SELECT 1 FROM actor_caracteristicas ac
             WHERE ac.actor_id = a.id AND ac.caracteristica_id = :${p}_cid
               AND ac.valor_booleano = :${p}_val
           )`
        );
      } else if (def.tipo_dato === 'numero') {
        const cond = ['ac.actor_id = a.id', `ac.caracteristica_id = :${p}_cid`];
        params[`${p}_cid`] = def.id;
        if (f.min != null && !Number.isNaN(Number(f.min))) {
          cond.push(`ac.valor_numero >= :${p}_min`);
          params[`${p}_min`] = Number(f.min);
        }
        if (f.max != null && !Number.isNaN(Number(f.max))) {
          cond.push(`ac.valor_numero <= :${p}_max`);
          params[`${p}_max`] = Number(f.max);
        }
        if (f.valor != null && f.min == null && f.max == null) {
          cond.push(`ac.valor_numero = :${p}_eq`);
          params[`${p}_eq`] = Number(f.valor);
        }
        where.push(`EXISTS (SELECT 1 FROM actor_caracteristicas ac WHERE ${cond.join(' AND ')})`);
      } else {
        // texto: coincidencia parcial
        if (f.valor == null || f.valor === '') continue;
        params[`${p}_cid`] = def.id;
        params[`${p}_txt`] = `%${f.valor}%`;
        where.push(
          `EXISTS (
             SELECT 1 FROM actor_caracteristicas ac
             WHERE ac.actor_id = a.id AND ac.caracteristica_id = :${p}_cid
               AND ac.valor_texto LIKE :${p}_txt
           )`
        );
      }
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // Paginacion
  const page = Math.max(1, parseInt(b.page || 1, 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(b.pageSize || 20, 10)));
  const offset = (page - 1) * pageSize;

  // Total
  const totalRows = await query(
    `SELECT COUNT(*) AS total
     FROM actores a JOIN usuarios u ON u.id = a.usuario_id
     ${whereSql}`,
    params
  );
  const total = totalRows[0].total;

  // Resultados (LIMIT/OFFSET interpolados como enteros ya validados)
  const filas = await query(
    `SELECT a.id, a.nombre_artistico, u.nombre, a.genero, a.pais, a.ciudad,
            a.estatura_cm, a.peso_kg, a.color_ojos, a.color_cabello, a.disponible,
            f.ruta AS foto_principal
     FROM actores a
     JOIN usuarios u ON u.id = a.usuario_id
     LEFT JOIN actor_fotos f ON f.id = a.foto_principal_id
     ${whereSql}
     ORDER BY a.actualizado_en DESC
     LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );

  return res.json({
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    actores: filas,
  });
}

module.exports = { buscarActores };
