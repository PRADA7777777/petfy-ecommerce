-- =====================================================================
-- Migración 004 — Módulo de Georreferenciación
-- Novedades que el paseador registra durante el paseo
-- Requiere: petfy_db.sql y migraciones 001 a 003
-- =====================================================================

CREATE TABLE IF NOT EXISTS petfy_db.novedades_paseo (
    id_novedad    SERIAL PRIMARY KEY,
    id_cita       INTEGER NOT NULL
                      REFERENCES petfy_db.citas (id_cita)
                      ON DELETE CASCADE,
    id_usuario    INTEGER NOT NULL
                      REFERENCES petfy_db.usuarios (id_usuario),
    texto         VARCHAR(500) NOT NULL
                      CHECK (char_length(btrim(texto)) > 0),
    fecha_hora    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP  -- hora del servidor
);

-- Las novedades de una cita se consultan en orden de tiempo
CREATE INDEX IF NOT EXISTS ix_novedades_paseo_cita_fecha
    ON petfy_db.novedades_paseo (id_cita, fecha_hora);
