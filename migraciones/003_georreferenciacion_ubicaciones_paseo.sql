-- =====================================================================
-- Migración 003 — Módulo de Georreferenciación
-- Ubicaciones del paseador durante el paseo (ubicación en vivo)
-- Requiere: petfy_db.sql y migraciones 001 y 002
-- =====================================================================

CREATE TABLE IF NOT EXISTS petfy_db.ubicaciones_paseo (
    id_ubicacion  SERIAL PRIMARY KEY,
    id_cita       INTEGER NOT NULL
                      REFERENCES petfy_db.citas (id_cita)
                      ON DELETE CASCADE,
    id_usuario    INTEGER NOT NULL
                      REFERENCES petfy_db.usuarios (id_usuario),
    latitud       NUMERIC(9,6) NOT NULL
                      CHECK (latitud BETWEEN -90 AND 90),
    longitud      NUMERIC(9,6) NOT NULL
                      CHECK (longitud BETWEEN -180 AND 180),
    precision_m   NUMERIC(7,1),   -- margen de error del GPS en metros (opcional)
    fecha_hora    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP  -- hora del servidor
);

-- El mapa consulta los puntos de una cita en orden de tiempo
CREATE INDEX IF NOT EXISTS ix_ubicaciones_paseo_cita_fecha
    ON petfy_db.ubicaciones_paseo (id_cita, fecha_hora);
    