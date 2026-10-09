-- ============================================================
--  CreactingCinema - Seed del catálogo de características
--  Puebla el catálogo flexible con rasgos y habilidades base.
--  Ejecutar DESPUÉS de schema.sql.
-- ============================================================

USE `creating`;

-- Limpieza idempotente del catálogo (no toca usuarios ni actores)
DELETE FROM `caracteristica_opciones`;
DELETE FROM `caracteristicas`;

-- ------------------------------------------------------------
-- Características tipo BOOLEAN (condiciones / rasgos sí-no)
-- ------------------------------------------------------------
INSERT INTO `caracteristicas` (`clave`, `etiqueta`, `grupo`, `tipo_dato`, `buscable`, `orden`) VALUES
('discapacidad',   'Tiene alguna discapacidad', 'Condiciones', 'boolean', 1, 10),
('sordo',          'Sordo',                     'Condiciones', 'boolean', 1, 11),
('mudo',           'Mudo',                      'Condiciones', 'boolean', 1, 12),
('ciego',          'Ciego',                     'Condiciones', 'boolean', 1, 13),
('usa_silla_ruedas','Usa silla de ruedas',      'Condiciones', 'boolean', 1, 14),
('tatuajes',       'Tiene tatuajes',            'Apariencia',  'boolean', 1, 15),
('piercings',      'Tiene piercings',           'Apariencia',  'boolean', 1, 16),
('barba',          'Usa barba',                 'Apariencia',  'boolean', 1, 17),
('licencia_conducir','Licencia de conducir',    'Habilidades', 'boolean', 1, 18);

-- ------------------------------------------------------------
-- Características tipo OPCIÓN (una sola opción)
-- ------------------------------------------------------------
INSERT INTO `caracteristicas` (`clave`, `etiqueta`, `grupo`, `tipo_dato`, `buscable`, `orden`) VALUES
('tipo_cuerpo',    'Tipo de cuerpo',            'Apariencia',  'opcion', 1, 20),
('etnia',          'Etnia / apariencia étnica', 'Apariencia',  'opcion', 1, 21),
('registro_vocal', 'Registro vocal',            'Habilidades', 'opcion', 1, 22);

-- ------------------------------------------------------------
-- Características tipo MULTI (varias opciones)
-- ------------------------------------------------------------
INSERT INTO `caracteristicas` (`clave`, `etiqueta`, `grupo`, `tipo_dato`, `buscable`, `orden`) VALUES
('idiomas',        'Idiomas que habla',         'Habilidades', 'multi', 1, 30),
('deportes',       'Deportes que practica',     'Habilidades', 'multi', 1, 31),
('instrumentos',   'Instrumentos que toca',     'Habilidades', 'multi', 1, 32),
('baile',          'Estilos de baile',          'Habilidades', 'multi', 1, 33),
('actuacion',      'Áreas de actuación',        'Experiencia', 'multi', 1, 34);

-- ------------------------------------------------------------
-- Características tipo TEXTO / NÚMERO
-- ------------------------------------------------------------
INSERT INTO `caracteristicas` (`clave`, `etiqueta`, `grupo`, `tipo_dato`, `unidad`, `buscable`, `orden`) VALUES
('talla_calzado',  'Talla de calzado',          'Apariencia',  'numero', 'EU', 1, 40),
('senas_particulares','Señas particulares',     'Apariencia',  'texto',  NULL, 0, 41);

-- ------------------------------------------------------------
-- OPCIONES para las características de tipo opcion / multi
-- ------------------------------------------------------------

-- tipo_cuerpo
INSERT INTO `caracteristica_opciones` (`caracteristica_id`, `valor`, `orden`)
SELECT id, v.valor, v.orden FROM `caracteristicas` c
JOIN (SELECT 'Delgado' valor,1 orden UNION SELECT 'Atlético',2 UNION SELECT 'Promedio',3
      UNION SELECT 'Robusto',4 UNION SELECT 'Musculoso',5) v
WHERE c.clave='tipo_cuerpo';

-- etnia
INSERT INTO `caracteristica_opciones` (`caracteristica_id`, `valor`, `orden`)
SELECT id, v.valor, v.orden FROM `caracteristicas` c
JOIN (SELECT 'Latino' valor,1 orden UNION SELECT 'Caucásico',2 UNION SELECT 'Afrodescendiente',3
      UNION SELECT 'Asiático',4 UNION SELECT 'Indígena',5 UNION SELECT 'Mestizo',6
      UNION SELECT 'Árabe',7 UNION SELECT 'Otro',8) v
WHERE c.clave='etnia';

-- registro_vocal
INSERT INTO `caracteristica_opciones` (`caracteristica_id`, `valor`, `orden`)
SELECT id, v.valor, v.orden FROM `caracteristicas` c
JOIN (SELECT 'Soprano' valor,1 orden UNION SELECT 'Mezzosoprano',2 UNION SELECT 'Contralto',3
      UNION SELECT 'Tenor',4 UNION SELECT 'Barítono',5 UNION SELECT 'Bajo',6) v
WHERE c.clave='registro_vocal';

-- idiomas
INSERT INTO `caracteristica_opciones` (`caracteristica_id`, `valor`, `orden`)
SELECT id, v.valor, v.orden FROM `caracteristicas` c
JOIN (SELECT 'Español' valor,1 orden UNION SELECT 'Inglés',2 UNION SELECT 'Portugués',3
      UNION SELECT 'Francés',4 UNION SELECT 'Italiano',5 UNION SELECT 'Alemán',6
      UNION SELECT 'Mandarín',7 UNION SELECT 'Otro',8) v
WHERE c.clave='idiomas';

-- deportes
INSERT INTO `caracteristica_opciones` (`caracteristica_id`, `valor`, `orden`)
SELECT id, v.valor, v.orden FROM `caracteristicas` c
JOIN (SELECT 'Fútbol' valor,1 orden UNION SELECT 'Natación',2 UNION SELECT 'Boxeo',3
      UNION SELECT 'Artes marciales',4 UNION SELECT 'Equitación',5 UNION SELECT 'Tenis',6
      UNION SELECT 'Ciclismo',7 UNION SELECT 'Gimnasia',8) v
WHERE c.clave='deportes';

-- instrumentos
INSERT INTO `caracteristica_opciones` (`caracteristica_id`, `valor`, `orden`)
SELECT id, v.valor, v.orden FROM `caracteristicas` c
JOIN (SELECT 'Guitarra' valor,1 orden UNION SELECT 'Piano',2 UNION SELECT 'Batería',3
      UNION SELECT 'Violín',4 UNION SELECT 'Bajo',5 UNION SELECT 'Canto',6) v
WHERE c.clave='instrumentos';

-- baile
INSERT INTO `caracteristica_opciones` (`caracteristica_id`, `valor`, `orden`)
SELECT id, v.valor, v.orden FROM `caracteristicas` c
JOIN (SELECT 'Salsa' valor,1 orden UNION SELECT 'Ballet',2 UNION SELECT 'Contemporáneo',3
      UNION SELECT 'Hip hop',4 UNION SELECT 'Tango',5 UNION SELECT 'Jazz',6) v
WHERE c.clave='baile';

-- actuacion
INSERT INTO `caracteristica_opciones` (`caracteristica_id`, `valor`, `orden`)
SELECT id, v.valor, v.orden FROM `caracteristicas` c
JOIN (SELECT 'Teatro' valor,1 orden UNION SELECT 'Cine',2 UNION SELECT 'Televisión',3
      UNION SELECT 'Comercial/Publicidad',4 UNION SELECT 'Doblaje',5 UNION SELECT 'Extra',6) v
WHERE c.clave='actuacion';
