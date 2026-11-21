-- Tabla de placas NFC/QR de Petfy
CREATE TABLE IF NOT EXISTS placas (
    id_placa SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
    id_mascota INTEGER REFERENCES mascotas(id_mascota) ON DELETE SET NULL,
    lote VARCHAR(50),
    material VARCHAR(50),
    fecha_generacion TIMESTAMP DEFAULT NOW(),
    fecha_activacion TIMESTAMP,
    notas TEXT,
    CONSTRAINT chk_estado_placa CHECK (estado IN ('disponible', 'activo', 'suspendido', 'perdida'))
);

CREATE INDEX IF NOT EXISTS idx_placas_codigo ON placas(codigo);
CREATE INDEX IF NOT EXISTS idx_placas_mascota ON placas(id_mascota);
CREATE INDEX IF NOT EXISTS idx_placas_estado ON placas(estado);