"use client";
import { useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { RutaPaseo as Ruta } from "@/lib/api";
import { RutaPaseo } from "@/components/RutaPaseo";
import { horaDeFecha } from "@/lib/fechas";
import { ESTADO_EN_CURSO, ESTADO_COMPLETADA } from "./paseoHoy";

const CENTRO_BOGOTA: [number, number] = [4.6097, -74.0817];

/** Recorrido de los paseos de hoy de las mascotas del dueño: primero los que van en curso */
export default function MapaPaseoDuenoInner({ rutas }: { rutas: Record<number, Ruta> }) {
  const [seleccionado, setSeleccionado] = useState<number | null>(null);

  const visibles = Object.values(rutas)
    .filter((r) => r.id_estado === ESTADO_EN_CURSO || r.id_estado === ESTADO_COMPLETADA)
    .sort((a, b) => (a.id_estado - b.id_estado) || (b.inicio ?? "").localeCompare(a.inicio ?? ""));
  if (visibles.length === 0) return null;

  const actual = visibles.find((r) => r.id_cita === seleccionado) ?? visibles[0];
  const ultimo = actual.puntos[actual.puntos.length - 1];

  return (
    <div style={{ background: "var(--white)", borderRadius: "var(--radius)", padding: "1.5rem", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", flexShrink: 0 }}>
      <h4 style={{ margin: "0 0 0.8rem", fontFamily: "'Fredoka One', cursive", color: "var(--teal)" }}>🐕 Tu paseo de hoy</h4>

      {visibles.length > 1 && (
        <div className="vp-tabs" style={{ marginBottom: "0.8rem" }}>
          {visibles.map((r) => (
            <button key={r.id_cita} className={`vp-tab ${r.id_cita === actual.id_cita ? "activo" : ""}`} onClick={() => setSeleccionado(r.id_cita)}>
              {r.nom_mascota} · {horaDeFecha(r.inicio)}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
        <span>
          Paseador: <strong style={{ color: "var(--teal)" }}>{actual.nombre_paseador}</strong> · Inició {horaDeFecha(actual.inicio)}
          {actual.fin && ` · Terminó ${horaDeFecha(actual.fin)}`}
        </span>
        {actual.id_estado === ESTADO_EN_CURSO
          ? <span className="status-badge status-encurso">En Curso</span>
          : <span className="status-badge status-completada">Completado</span>}
      </div>

      <div style={{ height: "320px", borderRadius: "12px", overflow: "hidden" }}>
        <MapContainer center={ultimo ? [ultimo.lat, ultimo.lng] : CENTRO_BOGOTA} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <RutaPaseo
            puntos={actual.puntos}
            detalle={<div style={{ fontSize: "0.875rem" }}><strong>{actual.nombre_paseador}</strong><div>🐕 {actual.nom_mascota}</div></div>}
          />
        </MapContainer>
      </div>
      {actual.puntos.length === 0 && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0.6rem 0 0" }}>Esperando la primera ubicación del paseador…</p>
      )}
    </div>
  );
}
