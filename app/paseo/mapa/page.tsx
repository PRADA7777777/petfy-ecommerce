// app/paseo/mapa/page.tsx
// Página del mapa del paseo (módulo de georreferenciación).
"use client";

import MapaPaseo from "../MapaPaseo";

const PARQUE_EL_VIRREY = { latitud: 4.6745, longitud: -74.0531 };

export default function MapaPaseoPagina() {
  return (
    <main className="map-page">
      <div className="map-wrap">
        <h1 className="map-titulo">Paseo en curso</h1>
        <MapaPaseo posicion={PARQUE_EL_VIRREY} />
      </div>
    </main>
  );
}
