// app/paseo/MapaPaseo.tsx
// Mapa del paseo con OpenStreetMap (Leaflet): recorrido del paseador y huella de Petfy
// en la última posición. Al tocar la huella se ve la mascota y el paseador.
"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapaLeaflet, Marker, Polyline } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./mapa.css";

export interface PuntoMapa {
  latitud: number;
  longitud: number;
}

interface Props {
  puntos: PuntoMapa[];
  mascota: string;
  paseador: string | null;
}

const ZOOM_INICIAL = 16;
const CAPA_OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUCION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const TAMANO_HUELLA = 40;
const GROSOR_RECORRIDO = 5;

const HUELLA_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<ellipse cx="12" cy="16" rx="5" ry="4.2"/>' +
  '<ellipse cx="5.2" cy="10.5" rx="2.1" ry="2.7"/>' +
  '<ellipse cx="9.3" cy="6.6" rx="2.1" ry="2.8"/>' +
  '<ellipse cx="14.7" cy="6.6" rx="2.1" ry="2.8"/>' +
  '<ellipse cx="18.8" cy="10.5" rx="2.1" ry="2.7"/>' +
  "</svg>";

/** Contenido de la ventanita de la huella. Se arma con textContent para que
 *  los nombres se muestren como texto y nunca se interpreten como HTML. */
function crearContenidoVentana(mascota: string, paseador: string | null): HTMLElement {
  const contenedor = document.createElement("div");
  contenedor.className = "map-ventana";

  const nombreMascota = document.createElement("strong");
  nombreMascota.className = "map-ventana-mascota";
  nombreMascota.textContent = `🐾 ${mascota}`;
  contenedor.appendChild(nombreMascota);

  if (paseador) {
    const nombrePaseador = document.createElement("span");
    nombrePaseador.className = "map-ventana-paseador";
    nombrePaseador.textContent = `Paseador: ${paseador}`;
    contenedor.appendChild(nombrePaseador);
  }
  return contenedor;
}

export default function MapaPaseo({ puntos, mascota, paseador }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const huella = useRef<Marker | null>(null);
  const recorrido = useRef<Polyline | null>(null);
  const centrado = useRef(false);
  const [listo, setListo] = useState(false);

  // Leaflet usa el navegador (window), por eso se carga dentro del efecto y el mapa se crea una sola vez
  useEffect(() => {
    let cancelado = false;

    import("leaflet").then((modulo) => {
      const L = (modulo as unknown as { default?: typeof modulo }).default ?? modulo;
      if (cancelado || !contenedor.current || mapa.current) return;

      const nuevoMapa = L.map(contenedor.current);
      L.tileLayer(CAPA_OSM, { maxZoom: 19, attribution: ATRIBUCION_OSM }).addTo(nuevoMapa);

      const colorRecorrido = getComputedStyle(document.documentElement)
        .getPropertyValue("--secondary")
        .trim();
      recorrido.current = L.polyline([], {
        color: colorRecorrido,
        weight: GROSOR_RECORRIDO,
        opacity: 0.85,
      }).addTo(nuevoMapa);

      const icono = L.divIcon({
        className: "map-huella",
        html: HUELLA_SVG,
        iconSize: [TAMANO_HUELLA, TAMANO_HUELLA],
        iconAnchor: [TAMANO_HUELLA / 2, TAMANO_HUELLA / 2],
      });
      huella.current = L.marker([0, 0], { icon: icono, keyboard: true }).bindPopup("");

      mapa.current = nuevoMapa;
      setListo(true);
    });

    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      huella.current = null;
      recorrido.current = null;
      centrado.current = false;
    };
  }, []);

  // Dibuja el recorrido y mueve la huella al último punto, sin volver a crear el mapa
  useEffect(() => {
    const m = mapa.current;
    const marcador = huella.current;
    const linea = recorrido.current;
    if (!listo || !m || !marcador || !linea || puntos.length === 0) return;

    const coordenadas = puntos.map((p) => [p.latitud, p.longitud] as [number, number]);
    const ultimo = coordenadas[coordenadas.length - 1];

    linea.setLatLngs(coordenadas);
    marcador.setLatLng(ultimo);
    if (!m.hasLayer(marcador)) marcador.addTo(m);

    // Se centra solo la primera vez, para no mover el mapa mientras el dueño lo explora
    if (!centrado.current) {
      if (coordenadas.length > 1) {
        m.fitBounds(linea.getBounds(), { padding: [40, 40] });
      } else {
        m.setView(ultimo, ZOOM_INICIAL);
      }
      centrado.current = true;
    }
  }, [listo, puntos]);

  // Contenido de la ventanita de la huella
  useEffect(() => {
    if (!listo) return;
    huella.current?.setPopupContent(crearContenidoVentana(mascota, paseador));
  }, [listo, mascota, paseador]);

  return <div ref={contenedor} className="map-contenedor" role="region" aria-label="Mapa del paseo" />;
}
