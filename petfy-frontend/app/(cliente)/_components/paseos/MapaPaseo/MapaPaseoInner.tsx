"use client";

import { useState, useMemo } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Polyline, Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Recorrido real del paseo (georreferenciación)
import { RutaPaseo } from "@/lib/api";
import { AjustarVista } from "@/components/RutaPaseo";
import { progresoPaseo } from "../paseoHoy";

// Fix de íconos Leaflet en Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ─── Íconos custom ────────────────────────────────────────
const iconOrigen = L.divIcon({
  className: "",
  html: `
    <div class="mp-pin mp-pin-origen">
      <span>🏠</span>
      <div class="mp-pin-pulse"></div>
    </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const iconPaseador = L.divIcon({
  className: "",
  html: `
    <div class="mp-pin mp-pin-paseador">
      <span>🐕</span>
      <div class="mp-pin-pulse mp-pin-pulse-orange"></div>
    </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// ─── Defaults (Bogotá) ────────────────────────────────────
// TODO: BACKEND — reemplazar por lat/lng reales de la cita
const CENTER: [number, number] = [4.6097, -74.0817];

interface Props {
  direccion: string;
  estadoId: number;
  hayPaseador: boolean;
  ruta?: RutaPaseo;
  duracionMin?: number;
}

export default function MapaPaseoInner({ direccion, estadoId, hayPaseador, ruta, duracionMin }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  // Recorrido GPS real: el primer punto es la recogida y el último, donde va el paseador
  const completado: [number, number][] = (ruta?.puntos ?? []).map((p) => [p.lat, p.lng]);
  const origenPos   = completado[0] ?? CENTER;
  const paseadorPos = hayPaseador && completado.length > 0 ? completado[completado.length - 1] : null;
  const progreso    = ruta && completado.length > 0 ? progresoPaseo(ruta, duracionMin) : null;

  const estadoLabel = useMemo(() => {
    if (estadoId === 3) return { texto: "En curso", color: "#ea580c" };
    if (estadoId === 2) return { texto: "Confirmado", color: "#0a6b74" };
    if (estadoId === 1) return { texto: "Programado", color: "#ca8a04" };
    if (estadoId === 4) return { texto: "Completado", color: "#15803d" };
    return { texto: "Pendiente", color: "#6b7280" };
  }, [estadoId]);

  return (
    <div className={`mp-wrapper ${fullscreen ? "mp-fullscreen" : ""}`}>
      {/* Overlay superior */}
      <div className="mp-overlay-top">
        <span className="mp-chip mp-chip-estado" style={{ borderColor: estadoLabel.color }}>
          <span className="mp-dot" style={{ background: estadoLabel.color }} />
          {estadoLabel.texto}
        </span>
        <span className="mp-chip">
          <i className="fas fa-map-marker-alt" style={{ color: "#ea580c" }} />
          {direccion}
        </span>
      </div>

      {/* Botón fullscreen */}
      <div className="mp-controls">
        <button
          className="mp-ctrl"
          onClick={() => setFullscreen((f) => !f)}
          title={fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          <i className={`fas ${fullscreen ? "fa-compress" : "fa-expand"}`} />
        </button>
      </div>

      {/* Overlay inferior con progreso */}
      {progreso && (
        <div className="mp-overlay-bottom">
          <div className="mp-progreso">
            <div className="mp-progreso-info">
              <span className="mp-progreso-label">Progreso del paseo</span>
              <span className="mp-progreso-pct">{progreso.porcentaje}%</span>
            </div>
            <div className="mp-progreso-bar">
              <div className="mp-progreso-fill" style={{ width: `${progreso.porcentaje}%` }} />
            </div>
            <div className="mp-progreso-meta">
              <span><i className="fas fa-route" /> {progreso.km.toFixed(2)} km</span>
              <span><i className="fas fa-clock" /> {progreso.minutos} min</span>
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <MapContainer
        center={origenPos}
        zoom={15}
        scrollWheelZoom={false}
        className="mp-map"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap &copy; CARTO'
        />

        {/* Sin recorrido todavía no se dibuja nada: la cita no trae coordenadas de la casa */}
        {completado.length > 0 && (
          <>
            <Circle
              center={origenPos}
              radius={80}
              pathOptions={{
                color: "#0a6b74",
                fillColor: "#0a6b74",
                fillOpacity: 0.08,
                weight: 1,
              }}
            />

            <Polyline
              positions={completado}
              pathOptions={{ color: "#ea580c", weight: 5, opacity: 0.9 }}
            />

            <Marker position={origenPos} icon={iconOrigen}>
              <Popup>
                <strong>🏠 Punto de recogida</strong>
                <br />
                {direccion}
              </Popup>
            </Marker>

            <AjustarVista puntos={ruta!.puntos} />
          </>
        )}

        {paseadorPos && (
          <Marker position={paseadorPos} icon={iconPaseador}>
            <Popup>
              <strong>🐕 Paseador</strong>
              <br />
              En camino
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}