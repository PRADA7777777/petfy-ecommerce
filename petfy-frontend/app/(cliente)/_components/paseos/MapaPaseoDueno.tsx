"use client";
import dynamic from "next/dynamic";
import { RutaPaseo } from "@/lib/api";

// Leaflet solo funciona en el navegador
const MapaPaseoDuenoInner = dynamic(() => import("./MapaPaseoDuenoInner"), { ssr: false });

export default function MapaPaseoDueno({ rutas }: { rutas: Record<number, RutaPaseo> }) {
  return <MapaPaseoDuenoInner rutas={rutas} />;
}
