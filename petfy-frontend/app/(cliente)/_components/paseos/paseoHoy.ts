// Estados de la cita, fecha de hoy y consulta de los paseos de hoy que usan las tarjetas del dueño
import { useEffect, useMemo, useState } from "react";
import { paseosAPI, sesion, CitaResumen, RutaPaseo } from "@/lib/api";

export const ESTADO_CONFIRMADA = 2;
export const ESTADO_EN_CURSO = 3;
export const ESTADO_COMPLETADA = 4;

const SEGUNDOS_ACTUALIZACION = 10;

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
