// app/paseo/mapaComun.ts
// Piezas compartidas por los mapas del módulo (dueño y administrador):
// carga de Leaflet, capa de OpenStreetMap y marcador con la huella de Petfy.
import type * as Leaflet from "leaflet";

export type LeafletModulo = typeof Leaflet;

export const ZOOM_INICIAL = 16;
const CAPA_OSM = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUCION_OSM =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const ZOOM_MAXIMO = 19;
const TAMANO_HUELLA = 40;

const HUELLA_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<ellipse cx="12" cy="16" rx="5" ry="4.2"/>' +
  '<ellipse cx="5.2" cy="10.5" rx="2.1" ry="2.7"/>' +
  '<ellipse cx="9.3" cy="6.6" rx="2.1" ry="2.8"/>' +
  '<ellipse cx="14.7" cy="6.6" rx="2.1" ry="2.8"/>' +
  '<ellipse cx="18.8" cy="10.5" rx="2.1" ry="2.7"/>' +
  "</svg>";

/** Leaflet usa el navegador (window): solo se carga desde un efecto, nunca en el servidor. */
export async function cargarLeaflet(): Promise<LeafletModulo> {
  const modulo = await import("leaflet");
  return (modulo as unknown as { default?: LeafletModulo }).default ?? modulo;
}

/** Crea el mapa con la capa de OpenStreetMap y su atribución obligatoria. */
export function crearMapaBase(L: LeafletModulo, contenedor: HTMLElement): Leaflet.Map {
  const mapa = L.map(contenedor);
  L.tileLayer(CAPA_OSM, { maxZoom: ZOOM_MAXIMO, attribution: ATRIBUCION_OSM }).addTo(mapa);
  return mapa;
}

/** Icono de la huella de Petfy (estilos en mapa.css, clase map-huella). */
export function crearIconoHuella(L: LeafletModulo): Leaflet.DivIcon {
  return L.divIcon({
    className: "map-huella",
    html: HUELLA_SVG,
    iconSize: [TAMANO_HUELLA, TAMANO_HUELLA],
    iconAnchor: [TAMANO_HUELLA / 2, TAMANO_HUELLA / 2],
  });
}
