"use client";
import dynamic from "next/dynamic";
import { RutaPaseo } from "@/lib/api";

const MapaPaseoInner = dynamic(() => import("./MapaPaseoInner"), {
  ssr: false,
  loading: () => (
    <div className="mp-wrapper">
      <div className="mp-loading">
        <div className="mp-loading-spinner" />
        <span>Cargando mapa…</span>
      </div>
    </div>
  ),
});

interface MapaPaseoProps {
  direccion: string;
  estadoId: number;
  hayPaseador: boolean;
  ruta?: RutaPaseo;
  duracionMin?: number;
}

export default function MapaPaseo(props: MapaPaseoProps) {
  return <MapaPaseoInner {...props} />;
}