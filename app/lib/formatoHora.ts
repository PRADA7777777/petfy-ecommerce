// app/lib/formatoHora.ts
// Formatos de hora del módulo de georreferenciación (hora de Colombia).

/** "11:52 a. m." */
export function formatearHora(fecha: string | Date): string {
  return new Date(fecha).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

/** "1:11:23 p. m." */
export function formatearHoraExacta(fecha: string | Date): string {
  return new Date(fecha).toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** "hace 3 min" o "hace un momento" */
export function tiempoTranscurrido(fecha: string | Date): string {
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  return minutos < 1 ? "hace un momento" : `hace ${minutos} min`;
}
