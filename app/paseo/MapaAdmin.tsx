// app/paseo/MapaAdmin.tsx
// Mapa del administrador: una huella de Petfy por paseador en curso.
// Al tocar la huella se ven el paseador y las mascotas que lleva.
"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapaLeaflet, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./mapa.css";
import { cargarLeaflet, crearIconoHuella, crearMapaBase, LeafletModulo, ZOOM_INICIAL } from "./mapaComun";
import type { PaseadorEnCurso } from "../lib/georreferenciacionAPI";

/** Contenido de la ventanita de un paseador. Se arma con textContent para que
 *  los nombres se muestren como texto y nunca se interpreten como HTML. */
function crearContenidoVentana(paseador: PaseadorEnCurso): HTMLElement {
  const contenedor = document.createElement("div");
  contenedor.className = "map-ventana";

  const nombrePaseador = document.createElement("strong");
  nombrePaseador.className = "map-ventana-titulo";
  nombrePaseador.textContent = paseador.nombre ?? "Paseador";
  contenedor.appendChild(nombrePaseador);

  for (const mascota of paseador.mascotas) {
    const nombreMascota = document.createElement("span");
    nombreMascota.className = "map-ventana-mascota";
    nombreMascota.textContent = `🐾 ${mascota.nom_mascota ?? "Mascota"}`;
    contenedor.appendChild(nombreMascota);
  }
  return contenedor;
}

export default function MapaAdmin({ paseadores }: { paseadores: PaseadorEnCurso[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const leaflet = useRef<LeafletModulo | null>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const huellas = useRef(new Map<number, Marker>());
  const centrado = useRef(false);
  const [listo, setListo] = useState(false);

  // El mapa se crea una sola vez
  useEffect(() => {
    let cancelado = false;
    const marcadores = huellas.current;

    cargarLeaflet().then((L) => {
      if (cancelado || !contenedor.current || mapa.current) return;
      leaflet.current = L;
      mapa.current = crearMapaBase(L, contenedor.current);
      setListo(true);
    });

    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      marcadores.clear();
      centrado.current = false;
    };
  }, []);

  // Crea, mueve o quita una huella por paseador según los datos recibidos
  useEffect(() => {
    const L = leaflet.current;
    const m = mapa.current;
    if (!listo || !L || !m) return;

    const conPosicion = paseadores.filter((p) => p.ultima_posicion);
    const vigentes = new Set(conPosicion.map((p) => p.id_usuario));

    for (const [id, marcador] of huellas.current) {
      if (!vigentes.has(id)) {
        marcador.remove();
        huellas.current.delete(id);
      }
    }

    for (const paseador of conPosicion) {
      const { latitud, longitud } = paseador.ultima_posicion!;
      let marcador = huellas.current.get(paseador.id_usuario);
      if (!marcador) {
        marcador = L.marker([latitud, longitud], { icon: crearIconoHuella(L), keyboard: true })
          .bindPopup("")
          .addTo(m);
        huellas.current.set(paseador.id_usuario, marcador);
      } else {
        marcador.setLatLng([latitud, longitud]);
      }
      marcador.setPopupContent(crearContenidoVentana(paseador));
    }

    // Se centra solo la primera vez, para no mover el mapa mientras el admin lo explora
    if (!centrado.current && conPosicion.length > 0) {
      const posiciones = conPosicion.map(
        (p) => [p.ultima_posicion!.latitud, p.ultima_posicion!.longitud] as [number, number]
      );
      if (posiciones.length > 1) {
        m.fitBounds(L.latLngBounds(posiciones), { padding: [40, 40] });
      } else {
        m.setView(posiciones[0], ZOOM_INICIAL);
      }
      centrado.current = true;
    }
  }, [listo, paseadores]);

  return <div ref={contenedor} className="map-contenedor" role="region" aria-label="Mapa de paseos en curso" />;
}
