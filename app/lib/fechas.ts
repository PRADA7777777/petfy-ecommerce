// app/lib/fechas.ts

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
               "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MESES_CORTOS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** "2026-09-23" → "Miércoles 23 de septiembre del 2026" */
export function formatearFechaLarga(iso: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    const fecha = new Date(y, m - 1, d);
    return `${DIAS[fecha.getDay()]} ${d} de ${MESES[m - 1]} del ${y}`;
}

/** "14:00" → "02:00 PM" */
export function formatearHora12(hm: string): string {
    if (!hm) return "";
    const [h] = hm.split(":").map(Number);
    const periodo = h < 12 ? "AM" : "PM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(h12).padStart(2, "0")}:00 ${periodo}`;
}

/** Nombres para el calendario */
export const NOMBRES_MESES = MESES_CORTOS;
export const DIAS_CORTOS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];