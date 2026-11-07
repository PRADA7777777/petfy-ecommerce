// app/lib/georreferenciacionAPI.ts
// Cliente del módulo de georreferenciación (separado de api.ts)

import { API_URL } from "./api";

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

// Tiempo máximo de espera por respuesta del backend (datos móviles incluidos).
const TIEMPO_LIMITE_MS = 15000;

// Cada cuánto el paseador envía su ubicación y el mapa del dueño la vuelve a consultar.
export const INTERVALO_UBICACION_MS = 20000;

// Error de la API que conserva el código HTTP (por ejemplo, 409 = el paseo ya no está en curso).
export class ErrorAPI extends Error {
  constructor(mensaje: string, public status: number) {
    super(mensaje);
  }
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
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("El servidor tardó demasiado en responder. Intenta de nuevo.");
    }
    throw new Error("Sin conexión con el servidor.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ErrorAPI((data as { detail?: string }).detail || "Error en la petición", res.status);
  }
  return data as T;
}

export interface CodigoMascota {
  id_mascota: number;
  nom_mascota: string;
  codigo: string | null;
  fecha_creacion: string | null;
}

export interface UbicacionRegistrada {
  id_ubicacion: number;
  fecha_hora: string;
}

export interface PuntoRuta {
  latitud: number;
  longitud: number;
  fecha_hora: string;
}

export interface ContactoPaseo {
  nombre: string;
  telefono: string | null;
}

export interface MascotaEnCurso {
  id_cita: number;
  id_mascota: number;
  nom_mascota: string | null;
  dueno: ContactoPaseo | null;
  direccion: string | null;
  complemento_direccion: string | null;
  zona: string | null;
  plan: string | null;
  duracion_minutos: number | null;
  novedades: number;
}

export interface PaseadorEnCurso {
  id_usuario: number;
  nombre: string | null;
  telefono: string | null;
  inicio: string | null;
  ultima_posicion: PuntoRuta | null;
  mascotas: MascotaEnCurso[];
}

export interface RutaPaseo {
  id_cita: number;
  nom_mascota: string;
  nombre_paseador: string | null;
  en_curso: boolean;
  puntos: PuntoRuta[];
}

export const georreferenciacionAPI = {
  obtenerCodigo: (idMascota: number, token: string) =>
    pedir<CodigoMascota>(`${API_URL}/georreferenciacion/mascotas/${idMascota}/codigo`, token),

  generarCodigo: (idMascota: number, token: string) =>
    pedir<CodigoMascota>(`${API_URL}/georreferenciacion/mascotas/${idMascota}/codigo`, token, {
      method: "POST",
    }),

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

  enviarUbicacion: (
    idCita: number,
    token: string,
    datos: { latitud: number; longitud: number; precision_m: number | null }
  ) =>
    pedir<UbicacionRegistrada>(`${API_URL}/georreferenciacion/citas/${idCita}/ubicacion`, token, {
      method: "POST",
      body: JSON.stringify(datos),
    }),

  obtenerRuta: (idCita: number, token: string) =>
    pedir<RutaPaseo>(`${API_URL}/georreferenciacion/citas/${idCita}/ruta`, token),

  obtenerPaseosEnCurso: (token: string) =>
    pedir<{ paseadores: PaseadorEnCurso[] }>(
      `${API_URL}/georreferenciacion/admin/paseos-en-curso`,
      token
    ),
};
