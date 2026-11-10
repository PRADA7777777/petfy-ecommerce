"use client";
import dynamic from "next/dynamic";

const MapaViewInner = dynamic(() => import("./MapaViewInner"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-white rounded-xl border flex items-center justify-center text-gray-500">
      Cargando mapa…
    </div>
  ),
});

export function MapaView() {
  return <MapaViewInner />;
}