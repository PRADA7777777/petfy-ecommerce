// app/lib/georreferenciacionAPI.ts
// Cliente del módulo de georreferenciación (separado de api.ts)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type AccionEscaneo = "recogida" | "entrega";
export type MetodoLectura = "QR" | "NFC" | "MANUAL";

export interface InfoEscaneo {
  accion: AccionEscaneo;
  id_cita: number;
  id_mascota: number;
  nom_mascota: string | null;
  hora_agendada: string | null;
  hora_recogida: string | null;
  direccion: string | null;
  nombre_dueno: string | null;
  telefono_dueno: string | null;
}

export interface ConfirmacionEscaneo {
  accion: AccionEscaneo;
  id_evento: number;
  id_cita: number;
  nom_mascota: string | null;
  fecha_hora_evento: string;
}

async function pedir<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Sin conexión con el servidor.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { detail?: string }).detail || "Error en la petición");
  }
  return data as T;
}

export const georreferenciacionAPI = {
  consultarEscaneo: (codigo: string, token: string) =>
    pedir<InfoEscaneo>(
      `${API_URL}/georreferenciacion/escaneo/${encodeURIComponent(codigo)}`,
      token
    ),

  confirmarEscaneo: (
    codigo: string,
    token: string,
    datos: { metodo_lectura: MetodoLectura; latitud: number | null; longitud: number | null }
  ) =>
    pedir<ConfirmacionEscaneo>(
      `${API_URL}/georreferenciacion/escaneo/${encodeURIComponent(codigo)}/confirmar`,
      token,
      { method: "POST", body: JSON.stringify(datos) }
    ),
};
