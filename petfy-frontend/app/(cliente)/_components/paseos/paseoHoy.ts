// Datos reales del paseo de hoy para "Mis Paseos" del dueño (diseño de Jhon):
// estados, recorrido, código para el paseador y progreso. La vista solo los muestra.
import { useEffect, useMemo, useState } from "react";
import { paseosAPI, sesion, CitaResumen, CodigoPaseo, RutaPaseo } from "@/lib/api";

export const ESTADO_CONFIRMADA = 2;
export const ESTADO_EN_CURSO = 3;
export const ESTADO_COMPLETADA = 4;

const SEGUNDOS_ACTUALIZACION = 10;
const DURACION_POR_DEFECTO_MIN = 55; // la misma que usa la vista de Jhon
const RADIO_TIERRA_KM = 6371;

/** Fecha de hoy en formato "AAAA-MM-DD", igual que llega en las citas */
export const hoyISO = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

/** Estado y recorrido de los paseos de hoy, consultados cada 10 segundos sin recargar la página */
export function usePaseosDeHoy(citas: CitaResumen[]): Record<number, RutaPaseo> {
  const [rutas, setRutas] = useState<Record<number, RutaPaseo>>({});

  const citasHoy = useMemo(
    () => citas.filter((c) => c.fecha === hoyISO() && [ESTADO_CONFIRMADA, ESTADO_EN_CURSO, ESTADO_COMPLETADA].includes(c.id_estado)),
    [citas]
  );

  useEffect(() => {
    const token = sesion.obtenerToken();
    if (!token || citasHoy.length === 0) return;
    const consultar = () =>
      Promise.all(citasHoy.map((c) => paseosAPI.ruta(c.id_cita, token).catch(() => null))).then((lista) => {
        const porCita: Record<number, RutaPaseo> = {};
        lista.forEach((r) => { if (r) porCita[r.id_cita] = r; });
        setRutas(porCita);
      });
    consultar();
    const intervalo = setInterval(consultar, SEGUNDOS_ACTUALIZACION * 1000);
    return () => clearInterval(intervalo);
  }, [citasHoy]);

  return rutas;
}

/** Estado del paseo con lo último del backend (la lista de citas se carga una sola vez) */
export const estadoActual = (cita: CitaResumen, rutas: Record<number, RutaPaseo>): number =>
  rutas[cita.id_cita]?.id_estado ?? cita.id_estado;

/** Orden de los paseos de hoy: el que va en curso, luego los que faltan por hora y al final los completados */
export function ordenarPaseosDeHoy(citas: CitaResumen[], rutas: Record<number, RutaPaseo>): CitaResumen[] {
  const prioridad = (c: CitaResumen) => {
    const estado = estadoActual(c, rutas);
    return estado === ESTADO_EN_CURSO ? 0 : estado === ESTADO_COMPLETADA ? 2 : 1;
  };
  return [...citas].sort((a, b) => prioridad(a) - prioridad(b) || (a.hora ?? "").localeCompare(b.hora ?? ""));
}

/** Código de 4 dígitos de cada paseo de hoy que todavía no empezó */
export function useCodigosDeHoy(citas: CitaResumen[]): Record<number, CodigoPaseo> {
  const [codigos, setCodigos] = useState<Record<number, CodigoPaseo>>({});

  const citasHoy = useMemo(
    () => citas.filter((c) => c.fecha === hoyISO() && c.id_estado === ESTADO_CONFIRMADA),
    [citas]
  );

  useEffect(() => {
    const token = sesion.obtenerToken();
    if (!token || citasHoy.length === 0) return;
    Promise.all(citasHoy.map((c) => paseosAPI.codigo(c.id_cita, token).catch(() => null))).then((lista) => {
      const porCita: Record<number, CodigoPaseo> = {};
      lista.forEach((cod) => { if (cod && !cod.usado) porCita[cod.id_cita] = cod; });
      setCodigos(porCita);
    });
  }, [citasHoy]);

  return codigos;
}

/** El dueño se manda el código por WhatsApp (por ejemplo, a quien entrega la mascota) */
export function compartirCodigo(nomMascota: string, codigo: string): void {
  const texto = `El código para entregar a ${nomMascota} al paseador de Petfy hoy es: ${codigo}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
}

/** Kilómetros recorridos (haversine), igual que services/recorrido.py del backend */
export function distanciaKm(puntos: RutaPaseo["puntos"]): number {
  const rad = (g: number) => (g * Math.PI) / 180;
  let total = 0;
  for (let i = 1; i < puntos.length; i++) {
    const a = puntos[i - 1], b = puntos[i];
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2
      + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    total += 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h));
  }
  return total;
}

/** Progreso del paseo: tiempo desde el inicio sobre la duración del plan; 100 % al terminar */
export function progresoPaseo(ruta: RutaPaseo, duracionMin = DURACION_POR_DEFECTO_MIN) {
  const minutos = ruta.inicio
    ? Math.max(0, Math.round(((ruta.fin ? new Date(ruta.fin) : new Date()).getTime() - new Date(ruta.inicio).getTime()) / 60000))
    : 0;
  const porcentaje = ruta.id_estado === ESTADO_COMPLETADA ? 100 : Math.min(99, Math.round((minutos / duracionMin) * 100));
  return { porcentaje, minutos, km: distanciaKm(ruta.puntos) };
}
