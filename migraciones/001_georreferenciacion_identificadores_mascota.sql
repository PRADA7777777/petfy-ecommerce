-- =====================================================================
-- Migración 001 — Módulo de Georreferenciación
-- Identificadores de mascota (código leído por QR u otra tecnología)
-- Requiere: petfy_db.sql (tabla petfy_db.mascotas)
-- =====================================================================

CREATE TABLE IF NOT EXISTS petfy_db.identificadores_mascota (
    id_identificador  SERIAL PRIMARY KEY,
    id_mascota        INTEGER NOT NULL
                          REFERENCES petfy_db.mascotas (id_mascota)
                          ON DELETE CASCADE,
    codigo            VARCHAR(64) NOT NULL UNIQUE,
    fecha_creacion    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_anulacion   TIMESTAMP              -- NULL = código activo
);

-- Una mascota solo puede tener UN código activo a la vez
CREATE UNIQUE INDEX IF NOT EXISTS uq_identificador_activo_por_mascota
    ON petfy_db.identificadores_mascota (id_mascota)
    WHERE fecha_anulacion IS NULL;
    