"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-admin";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Users, Activity, History } from "lucide-react";
import { Badge } from "@/components/Badge";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const iconoPaseador = L.divIcon({
  className: "custom-marker",
  html: '<div style="background:#f97316;border:3px solid white;width:28px;height:28px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">🐕</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function MapaViewInner() {
  const [modo, setModo] = useState<"vivo" | "historial">("vivo");
  const [seleccionado, setSeleccionado] = useState<number | null>(null);

  // Asumiendo que usas api.getPaseosActivos() para admin
  const { data: paseosActivos, isLoading } = useQuery({
    queryKey: ["paseos-activos-mapa"],
    queryFn: () => api.getPaseadoresActivos(), // Ajusta si tu método se llama distinto
    refetchInterval: 10000,
    enabled: modo === "vivo",
  });

  const centro: [number, number] = [4.6097, -74.0817];
  const paseos = paseosActivos ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      
      <div className="agenda-controls" style={{ padding: '0.75rem' }}>
        <div className="agenda-view-switch">
          <button onClick={() => setModo("vivo")} className={`agenda-view-btn ${modo === "vivo" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={16} /> En vivo
          </button>
          <button onClick={() => setModo("historial")} className={`agenda-view-btn ${modo === "historial" ? "active" : ""}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={16} /> Historial
          </button>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          {modo === "vivo" ? `${paseos.length} paseo(s) activo(s)` : "Selecciona una cita para ver su ruta"}
        </div>
      </div>

      <div className="mapa-layout">
        <div className="mapa-container">
          <MapContainer center={centro} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {modo === "vivo" && paseos.map((p: any) => (
              <div key={p.id_cita}>
                <Polyline positions={p.ruta} pathOptions={{ color: "#f97316", weight: 4, opacity: 0.7 }} />
                <Marker position={[p.lat_actual, p.lng_actual]} icon={iconoPaseador}>
                  <Popup>
                    <div style={{ fontSize: '0.875rem' }}>
                      <strong>{p.paseador_nombre}</strong>
                      <div>🐕 {p.mascota_nombre}</div>
                    </div>
                  </Popup>
                </Marker>
              </div>
            ))}
          </MapContainer>
        </div>

        <div className="mapa-sidebar">
          <div className="mapa-sidebar-header">
            <Users size={16} color="#ea580c" />
            <h3>{modo === "vivo" ? "Paseos activos" : "Seleccionar cita"}</h3>
          </div>
          <div className="mapa-list">
            {isLoading && <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>Cargando…</div>}
            {!isLoading && paseos.length === 0 && modo === "vivo" && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                <MapPin size={32} style={{ margin: '0 auto 0.5rem', color: '#d1d5db' }} />
                No hay paseos activos ahora.
              </div>
            )}
            {modo === "vivo" && paseos.map((p: any) => (
              <div key={p.id_cita} className="mapa-list-item" onClick={() => setSeleccionado(p.id_cita)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                  <div style={{ fontWeight: 500, color: '#111827', fontSize: '0.875rem' }}>{p.paseador_nombre}</div>
                  <Badge color={p.progreso > 80 ? "green" : p.progreso > 20 ? "orange" as any : "yellow"}>
                    {p.progreso}%
                  </Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>🐕 {p.mascota_nombre}</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <MapPin size={12} /> {p.zona}
                </div>
                <div className="mapa-progress-bar">
                  <div className="mapa-progress-fill" style={{ width: `${p.progreso}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}