-- =====================================================================
-- Migración 002 — Módulo de Georreferenciación
-- Eventos del paseo: recogida y entrega de la mascota
-- Requiere: petfy_db.sql y migración 001
-- =====================================================================

CREATE TABLE IF NOT EXISTS petfy_db.eventos_paseo (
    id_evento         SERIAL PRIMARY KEY,
    id_cita           INTEGER NOT NULL
                          REFERENCES petfy_db.citas (id_cita)
                          ON DELETE CASCADE,
    id_identificador  INTEGER NOT NULL
                          REFERENCES petfy_db.identificadores_mascota (id_identificador),
    id_usuario        INTEGER NOT NULL
                          REFERENCES petfy_db.usuarios (id_usuario),
    tipo_evento       VARCHAR(20) NOT NULL
                          CHECK (tipo_evento IN ('RECOGIDA', 'ENTREGA')),
    metodo_lectura    VARCHAR(20) NOT NULL
                          CHECK (metodo_lectura IN ('QR', 'NFC', 'MANUAL')),
    fecha_hora        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- hora del servidor
    latitud           NUMERIC(9,6),   -- opcional: GPS puede fallar o no tener permiso
    longitud          NUMERIC(9,6),
    url_foto          TEXT,           -- opcional hasta definir el almacenamiento de fotos

    -- Una sola recogida y una sola entrega por cita
    CONSTRAINT uq_evento_por_cita UNIQUE (id_cita, tipo_evento)
);
