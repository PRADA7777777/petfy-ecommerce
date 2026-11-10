/** lib/utils.ts **/

export function fmtCOP(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "$ 0";
  
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$ 0";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Formatea una fecha */
export function fmtDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";

  try {
    // Si la fecha viene con hora, la separamos. Ej: "2024-05-20T10:00:00" -> "2024-05-20"
    const datePart = dateString.split("T")[0];
    const [year, month, day] = datePart.split("-");
    
    // Retornamos en formato DD/MM/YYYY
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateString; // Si falla, devuelve el string original
  }
}

/**
 * Formatea una fecha y hora
 */
export function fmtDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateString;
  }
}