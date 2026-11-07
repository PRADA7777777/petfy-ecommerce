// app/paseo/MapaPaseo.tsx
// Mapa del paseo con OpenStreetMap (Leaflet): huella de Petfy en la posición del paseador.
"use client";

import { useEffect, useRef } from "react";
import type { Map as MapaLeaflet, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./mapa.css";

export interface PuntoMapa {
  latitud: number;
  longitud: number;
}

const ZOOM_INICIAL = 16;
const CAPA_OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUCION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const TAMANO_HUELLA = 40;

const HUELLA_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<ellipse cx="12" cy="16" rx="5" ry="4.2"/>' +
  '<ellipse cx="5.2" cy="10.5" rx="2.1" ry="2.7"/>' +
  '<ellipse cx="9.3" cy="6.6" rx="2.1" ry="2.8"/>' +
  '<ellipse cx="14.7" cy="6.6" rx="2.1" ry="2.8"/>' +
  '<ellipse cx="18.8" cy="10.5" rx="2.1" ry="2.7"/>' +
  "</svg>";

export default function MapaPaseo({ posicion }: { posicion: PuntoMapa }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const huella = useRef<Marker | null>(null);
  const posicionInicial = useRef(posicion);

  // Leaflet usa el navegador (window), por eso se carga dentro del efecto y el mapa se crea una sola vez
  useEffect(() => {
    let cancelado = false;

    import("leaflet").then((modulo) => {
      const L = (modulo as unknown as { default?: typeof modulo }).default ?? modulo;
      if (cancelado || !contenedor.current || mapa.current) return;

      const { latitud, longitud } = posicionInicial.current;
      const nuevoMapa = L.map(contenedor.current).setView([latitud, longitud], ZOOM_INICIAL);
      L.tileLayer(CAPA_OSM, { maxZoom: 19, attribution: ATRIBUCION_OSM }).addTo(nuevoMapa);

      const icono = L.divIcon({
        className: "map-huella",
        html: HUELLA_SVG,
        iconSize: [TAMANO_HUELLA, TAMANO_HUELLA],
        iconAnchor: [TAMANO_HUELLA / 2, TAMANO_HUELLA / 2],
      });
      huella.current = L.marker([latitud, longitud], { icon: icono }).addTo(nuevoMapa);
      mapa.current = nuevoMapa;
    });

    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      huella.current = null;
    };
  }, []);

  // Mueve la huella cuando cambia la posición, sin volver a crear el mapa
  useEffect(() => {
    huella.current?.setLatLng([posicion.latitud, posicion.longitud]);
  }, [posicion.latitud, posicion.longitud]);

  return <div ref={contenedor} className="map-contenedor" role="region" aria-label="Mapa del paseo" />;
}
