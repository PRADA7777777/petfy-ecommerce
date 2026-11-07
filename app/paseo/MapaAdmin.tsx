// app/paseo/MapaAdmin.tsx
// Mapa del administrador: una huella de Petfy por paseador en curso.
// Al tocar la huella se ven el paseador y las mascotas que lleva, y se puede
// mostrar el recorrido de cada mascota sobre el mismo mapa.
"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as MapaLeaflet, Marker, Polyline } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./mapa.css";
import { cargarLeaflet, crearIconoHuella, crearMapaBase, LeafletModulo, ZOOM_INICIAL } from "./mapaComun";
import type { PaseadorEnCurso, PuntoRuta } from "../lib/georreferenciacionAPI";
import { formatearHora, tiempoTranscurrido } from "../lib/formatoHora";

// Con varias mascotas desplegadas la ventanita crece: más allá de este alto se desplaza por dentro
const ALTO_MAXIMO_VENTANA = 280;
const GROSOR_RECORRIDO = 5;
// Colores de marca para distinguir los recorridos; se repiten si hay más recorridos que colores
const VARIABLES_COLOR_RECORRIDO = ["--secondary", "--primary", "--accent", "--info"];

/** Acciones de la ventanita sobre los recorridos (las resuelve el componente). */
interface AccionesRecorrido {
  colorDe: (idCita: number) => string;
  estaVisible: (idCita: number) => boolean;
  alternar: (idCita: number) => void;
}

// Toda la ventanita se arma con textContent para que los datos se muestren como
// texto y nunca se interpreten como HTML.

function crearDato(etiqueta: string, valor: string | null | undefined): HTMLElement | null {
  if (!valor) return null;
  const linea = document.createElement("span");
  linea.className = "map-dato";
  linea.textContent = `${etiqueta}: ${valor}`;
  return linea;
}

/** Un nombre que se despliega al tocarlo (<details>). Recuerda si estaba abierto
 *  para no cerrarlo cuando la ventanita se actualiza. */
function crearDesplegable(
  clave: string,
  titulo: string,
  claseTitulo: string,
  datos: (HTMLElement | null)[],
  abiertos: Set<string>
): HTMLElement {
  const desplegable = document.createElement("details");
  desplegable.className = "map-desplegable";
  desplegable.open = abiertos.has(clave);
  desplegable.addEventListener("toggle", () => {
    if (desplegable.open) abiertos.add(clave);
    else abiertos.delete(clave);
  });

  const resumen = document.createElement("summary");
  resumen.className = claseTitulo;
  resumen.textContent = titulo;
  desplegable.appendChild(resumen);

  const cuerpo = document.createElement("div");
  cuerpo.className = "map-desplegable-cuerpo";
  for (const dato of datos) if (dato) cuerpo.appendChild(dato);
  desplegable.appendChild(cuerpo);
  return desplegable;
}

function crearBotonRecorrido(idCita: number, acciones: AccionesRecorrido): HTMLElement {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "map-boton-recorrido";
  boton.style.borderLeftColor = acciones.colorDe(idCita);
  boton.textContent = acciones.estaVisible(idCita) ? "Ocultar recorrido" : "Ver recorrido";
  boton.addEventListener("click", () => {
    boton.disabled = true;
    acciones.alternar(idCita);
  });
  return boton;
}

function crearContenidoVentana(
  paseador: PaseadorEnCurso,
  abiertos: Set<string>,
  acciones: AccionesRecorrido
): HTMLElement {
  const contenedor = document.createElement("div");
  contenedor.className = "map-ventana";

  contenedor.appendChild(
    crearDesplegable(
      `paseador-${paseador.id_usuario}`,
      paseador.nombre ?? "Paseador",
      "map-ventana-titulo",
      [
        crearDato("Teléfono", paseador.telefono),
        crearDato("En paseo desde", paseador.inicio ? formatearHora(paseador.inicio) : null),
        crearDato(
          "Último punto",
          paseador.ultima_posicion ? tiempoTranscurrido(paseador.ultima_posicion.fecha_hora) : null
        ),
      ],
      abiertos
    )
  );

  for (const mascota of paseador.mascotas) {
    const direccion = [mascota.direccion, mascota.complemento_direccion].filter(Boolean).join(", ");
    const plan = mascota.plan
      ? `${mascota.plan}${mascota.duracion_minutos ? ` (${mascota.duracion_minutos} min)` : ""}`
      : null;
    contenedor.appendChild(
      crearDesplegable(
        `cita-${mascota.id_cita}`,
        `🐾 ${mascota.nom_mascota ?? "Mascota"}`,
        "map-ventana-mascota",
        [
          crearDato(
            "Dueño",
            mascota.dueno
              ? [mascota.dueno.nombre, mascota.dueno.telefono].filter(Boolean).join(" · ")
              : null
          ),
          crearDato("Dirección", direccion),
          crearDato("Zona", mascota.zona?.trim()),
          crearDato("Plan", plan),
          crearDato("Novedades", String(mascota.novedades)),
          crearBotonRecorrido(mascota.id_cita, acciones),
        ],
        abiertos
      )
    );
  }
  return contenedor;
}

interface Props {
  paseadores: PaseadorEnCurso[];
  cargarRuta: (idCita: number) => Promise<PuntoRuta[]>;
}

export default function MapaAdmin({ paseadores, cargarRuta }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const leaflet = useRef<LeafletModulo | null>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const huellas = useRef(new Map<number, Marker>());
  const centrado = useRef(false);
  const abiertos = useRef(new Set<string>());
  const recorridos = useRef(new Map<number, Polyline>());
  const colores = useRef<string[]>([]);
  const cargarRutaActual = useRef(cargarRuta);
  const [version, setVersion] = useState(0);
  const [listo, setListo] = useState(false);

  // La función para cargar rutas llega de la página; se guarda sin volver a dibujar el mapa
  useEffect(() => {
    cargarRutaActual.current = cargarRuta;
  }, [cargarRuta]);

  // El mapa se crea una sola vez
  useEffect(() => {
    let cancelado = false;
    const marcadores = huellas.current;
    const lineas = recorridos.current;

    cargarLeaflet().then((L) => {
      if (cancelado || !contenedor.current || mapa.current) return;
      leaflet.current = L;
      mapa.current = crearMapaBase(L, contenedor.current);
      const estilos = getComputedStyle(document.documentElement);
      colores.current = VARIABLES_COLOR_RECORRIDO.map((v) => estilos.getPropertyValue(v).trim());
      setListo(true);
    });

    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      marcadores.clear();
      lineas.clear();
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
    const citasEnCurso = new Set(paseadores.flatMap((p) => p.mascotas.map((c) => c.id_cita)));

    const dibujarRecorrido = (idCita: number, puntos: PuntoRuta[]) => {
      const coordenadas = puntos.map((p) => [p.latitud, p.longitud] as [number, number]);
      const linea = recorridos.current.get(idCita);
      if (linea) {
        linea.setLatLngs(coordenadas);
      } else {
        recorridos.current.set(
          idCita,
          L.polyline(coordenadas, {
            color: acciones.colorDe(idCita),
            weight: GROSOR_RECORRIDO,
            opacity: 0.85,
          }).addTo(m)
        );
      }
    };

    const acciones: AccionesRecorrido = {
      colorDe: (idCita) => colores.current[idCita % colores.current.length],
      estaVisible: (idCita) => recorridos.current.has(idCita),
      alternar: (idCita) => {
        const linea = recorridos.current.get(idCita);
        if (linea) {
          linea.remove();
          recorridos.current.delete(idCita);
          setVersion((v) => v + 1);
          return;
        }
        cargarRutaActual.current(idCita)
          .then((puntos) => dibujarRecorrido(idCita, puntos))
          .catch(() => undefined)
          .finally(() => setVersion((v) => v + 1));
      },
    };

    // Recorridos visibles: se quitan los de paseos terminados y se actualizan los demás
    for (const [idCita, linea] of recorridos.current) {
      if (!citasEnCurso.has(idCita)) {
        linea.remove();
        recorridos.current.delete(idCita);
      }
    }

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
          .bindPopup("", { maxHeight: ALTO_MAXIMO_VENTANA })
          .addTo(m);
        huellas.current.set(paseador.id_usuario, marcador);
      } else {
        marcador.setLatLng([latitud, longitud]);
      }
      marcador.setPopupContent(crearContenidoVentana(paseador, abiertos.current, acciones));
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
  }, [listo, paseadores, version]);

  // Con cada actualización de datos, los recorridos visibles traen sus puntos nuevos
  useEffect(() => {
    if (!listo) return;
    for (const [idCita, linea] of recorridos.current) {
      cargarRutaActual.current(idCita)
        .then((puntos) => linea.setLatLngs(puntos.map((p) => [p.latitud, p.longitud] as [number, number])))
        .catch(() => undefined);
    }
  }, [listo, paseadores]);

  return <div ref={contenedor} className="map-contenedor" role="region" aria-label="Mapa de paseos en curso" />;
}
