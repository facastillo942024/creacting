-- ============================================================
--  CreactingCinema - Esquema de base de datos
--  Plataforma de actores/talento con roles y búsqueda flexible
--  Motor: MariaDB / MySQL (InnoDB, utf8mb4)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- Base de datos (reutiliza la existente `creating`)
CREATE DATABASE IF NOT EXISTS `creating`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `creating`;

-- ------------------------------------------------------------
-- 1. USUARIOS Y ROLES
-- ------------------------------------------------------------
-- Un usuario tiene un rol. actor = talento que se inscribe.
-- director = productor/director que busca talento.
-- admin = gestión de la plataforma y del catálogo.
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(180) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol`           ENUM('actor','director','admin') NOT NULL DEFAULT 'actor',
  `nombre`        VARCHAR(150) NOT NULL,
  `telefono`      VARCHAR(40)  DEFAULT NULL,
  `activo`        TINYINT(1)   NOT NULL DEFAULT 1,
  `creado_en`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en` TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  KEY `idx_usuarios_rol` (`rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. PERFIL DE ACTOR (columnas fijas: datos estables y siempre presentes)
-- ------------------------------------------------------------
-- Un usuario con rol 'actor' tiene exactamente un perfil.
CREATE TABLE IF NOT EXISTS `actores` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id`       INT UNSIGNED NOT NULL,
  `nombre_artistico` VARCHAR(150) DEFAULT NULL,
  `genero`           ENUM('masculino','femenino','no_binario','otro') DEFAULT NULL,
  `fecha_nacimiento` DATE         DEFAULT NULL,
  `pais`             VARCHAR(80)  DEFAULT NULL,
  `ciudad`           VARCHAR(120) DEFAULT NULL,
  `estatura_cm`      SMALLINT UNSIGNED DEFAULT NULL,   -- estatura en centímetros
  `peso_kg`          SMALLINT UNSIGNED DEFAULT NULL,   -- peso en kilogramos
  `color_cabello`    VARCHAR(50)  DEFAULT NULL,
  `color_ojos`       VARCHAR(50)  DEFAULT NULL,
  `color_piel`       VARCHAR(50)  DEFAULT NULL,
  `mano_dominante`   ENUM('diestro','zurdo','ambidiestro') DEFAULT NULL,
  `biografia`        TEXT         DEFAULT NULL,
  `reel_url`         VARCHAR(255) DEFAULT NULL,        -- enlace a video/reel externo (YouTube/Vimeo)
  `foto_principal_id` INT UNSIGNED DEFAULT NULL,       -- FK a actor_fotos (se define después de crear la tabla)
  `disponible`       TINYINT(1)   NOT NULL DEFAULT 1,  -- disponible para castings
  `creado_en`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `actualizado_en`   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_actores_usuario` (`usuario_id`),
  KEY `idx_actores_genero` (`genero`),
  KEY `idx_actores_pais` (`pais`),
  KEY `idx_actores_estatura` (`estatura_cm`),
  KEY `idx_actores_peso` (`peso_kg`),
  KEY `idx_actores_disponible` (`disponible`),
  CONSTRAINT `fk_actores_usuario` FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. FOTOS DEL ACTOR (archivos en disco; en BBDD solo la ruta)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `actor_fotos` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_id`   INT UNSIGNED NOT NULL,
  `ruta`       VARCHAR(255) NOT NULL,           -- ruta relativa del archivo comprimido (webp)
  `ancho`      SMALLINT UNSIGNED DEFAULT NULL,
  `alto`       SMALLINT UNSIGNED DEFAULT NULL,
  `peso_bytes` INT UNSIGNED DEFAULT NULL,
  `orden`      SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `creado_en`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fotos_actor` (`actor_id`),
  CONSTRAINT `fk_fotos_actor` FOREIGN KEY (`actor_id`)
    REFERENCES `actores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK de foto_principal en actores -> actor_fotos (ON DELETE SET NULL)
ALTER TABLE `actores`
  ADD CONSTRAINT `fk_actores_foto_principal` FOREIGN KEY (`foto_principal_id`)
    REFERENCES `actor_fotos` (`id`) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 4. CATÁLOGO FLEXIBLE DE CARACTERÍSTICAS
-- ------------------------------------------------------------
-- Define QUÉ atributos existen. Permite agregar rasgos nuevos
-- (idiomas, deportes, discapacidades, habilidades...) sin tocar
-- el esquema ni el código.
--
-- tipo_dato controla cómo se valida/almacena el valor del actor:
--   'texto'   -> valor_texto libre
--   'numero'  -> valor_numero
--   'boolean' -> valor_booleano (0/1): sordo, mudo, discapacitado, etc.
--   'opcion'  -> una opción del set (caracteristica_opciones)
--   'multi'   -> varias opciones del set (idiomas, deportes)
CREATE TABLE IF NOT EXISTS `caracteristicas` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `clave`       VARCHAR(60)  NOT NULL,          -- identificador estable, ej. 'idiomas'
  `etiqueta`    VARCHAR(120) NOT NULL,          -- nombre visible, ej. 'Idiomas que habla'
  `grupo`       VARCHAR(60)  DEFAULT NULL,      -- agrupación en el formulario, ej. 'Habilidades'
  `tipo_dato`   ENUM('texto','numero','boolean','opcion','multi') NOT NULL,
  `unidad`      VARCHAR(20)  DEFAULT NULL,      -- ej. 'cm', 'kg' (para tipo numero)
  `buscable`    TINYINT(1)   NOT NULL DEFAULT 1,-- si aparece como filtro para directores
  `orden`       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `activo`      TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_caracteristicas_clave` (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Opciones posibles para características de tipo 'opcion' o 'multi'
CREATE TABLE IF NOT EXISTS `caracteristica_opciones` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `caracteristica_id` INT UNSIGNED NOT NULL,
  `valor`            VARCHAR(120) NOT NULL,     -- ej. 'Español', 'Inglés', 'Fútbol'
  `orden`            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_opcion` (`caracteristica_id`, `valor`),
  CONSTRAINT `fk_opcion_caracteristica` FOREIGN KEY (`caracteristica_id`)
    REFERENCES `caracteristicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. VALORES DE CARACTERÍSTICAS POR ACTOR (EAV)
-- ------------------------------------------------------------
-- Cada fila es el valor de una característica para un actor.
-- Para 'multi' habrá varias filas (una por opción seleccionada).
CREATE TABLE IF NOT EXISTS `actor_caracteristicas` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_id`          INT UNSIGNED NOT NULL,
  `caracteristica_id` INT UNSIGNED NOT NULL,
  `opcion_id`         INT UNSIGNED DEFAULT NULL, -- para 'opcion'/'multi'
  `valor_texto`       VARCHAR(255) DEFAULT NULL, -- para 'texto'
  `valor_numero`      DECIMAL(10,2) DEFAULT NULL,-- para 'numero'
  `valor_booleano`    TINYINT(1)   DEFAULT NULL, -- para 'boolean'
  PRIMARY KEY (`id`),
  KEY `idx_ac_actor` (`actor_id`),
  KEY `idx_ac_caracteristica` (`caracteristica_id`),
  KEY `idx_ac_opcion` (`opcion_id`),
  KEY `idx_ac_bool` (`caracteristica_id`, `valor_booleano`),
  CONSTRAINT `fk_ac_actor` FOREIGN KEY (`actor_id`)
    REFERENCES `actores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ac_caracteristica` FOREIGN KEY (`caracteristica_id`)
    REFERENCES `caracteristicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ac_opcion` FOREIGN KEY (`opcion_id`)
    REFERENCES `caracteristica_opciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
