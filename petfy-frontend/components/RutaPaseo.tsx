"use client";
import { ReactNode, useEffect } from "react";
import { Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { horaDeFecha } from "@/lib/fechas";

type Punto = { lat: number; lng: number; fecha_hora?: string };

function icono(color: string, emoji: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background:${color};border:3px solid white;width:28px;height:28px;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const iconoInicio = icono("#16a34a", "🏁");
const iconoFin = icono("#f97316", "🐕");

/** Ajusta el zoom al recorrido cuando se abre uno nuevo; mientras avanza no lo mueve (también lo usa el mapa del dueño) */
export function AjustarVista({ puntos }: { puntos: Punto[] }) {
  const map = useMap();
  const inicio = puntos[0];
  useEffect(() => {
    if (puntos.length > 0) {
      map.fitBounds(L.latLngBounds(puntos.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40] });
    }
  }, [map, inicio?.lat, inicio?.lng, inicio?.fecha_hora]);
  return null;
}

/** Dibuja el recorrido de un paseo: línea, punto de inicio y última posición */
export function RutaPaseo({ puntos, detalle }: { puntos: Punto[]; detalle?: ReactNode }) {
  if (puntos.length === 0) return null;
  const inicio = puntos[0];
  const fin = puntos[puntos.length - 1];

  return (
    <>
      <Polyline positions={puntos.map((p) => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#f97316", weight: 4, opacity: 0.8 }} />
      <Marker position={[inicio.lat, inicio.lng]} icon={iconoInicio}>
        <Popup>Inicio {horaDeFecha(inicio.fecha_hora)}</Popup>
      </Marker>
      <Marker position={[fin.lat, fin.lng]} icon={iconoFin}>
        <Popup>{detalle ?? `Último punto ${horaDeFecha(fin.fecha_hora)}`}</Popup>
      </Marker>
      <AjustarVista puntos={puntos} />
    </>
  );
}
