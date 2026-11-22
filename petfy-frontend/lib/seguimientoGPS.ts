// Seguimiento GPS del paseo en curso, sin React: lo usan el hook usePaseoPaseador y el `api`
// de la vista del paseador (lib/api.ts). Mientras se sigue un paseo:
// toma la posición del celular, la guarda en una cola (sirve sin señal), envía la cola
// por lote al backend y mantiene la pantalla encendida.
import { paseosAPI, sesion, PuntoGPS } from "@/lib/api";

// ==================== CONSTANTES ====================

const SEGUNDOS_ENVIO_GPS = 15;
// El celular da una posición por segundo; se guarda una cada 5 s, como espera el backend
const SEGUNDOS_ENTRE_PUNTOS = 5;
const MAX_PUNTOS_POR_ENVIO = 500;
const CLAVE_COLA_GPS = "petfy_cola_gps";
const HTTP_DATOS_INVALIDOS = 422;
const GPS_SIN_PERMISO = 1;

export interface EstadoGPS {
  ultimoEnvio: Date | null;
  enCola: number;
  /** El último envío falló (sin señal o error del servidor); se borra con el siguiente envío bueno */
  errorEnvio: string | null;
  /** El celular no da la ubicación; se borra con la siguiente posición buena */
  errorUbicacion: string | null;
}

export type EstadoPantalla = "activo" | "no-soportado" | "inactivo";

export interface EstadoSeguimiento {
  gps: EstadoGPS;
  pantalla: EstadoPantalla;
}

// ==================== COLA DE PUNTOS ====================

// En localStorage para que no se pierda si se cierra la página;
// si el navegador no deja usarlo, vive en memoria mientras la página esté abierta
let colaEnMemoria: PuntoGPS[] = [];

function leerCola(): PuntoGPS[] {
  try {
    const guardada = localStorage.getItem(CLAVE_COLA_GPS);
    return guardada ? JSON.parse(guardada) : [];
  } catch {
    return colaEnMemoria;
  }
}

function guardarCola(cola: PuntoGPS[]) {
  colaEnMemoria = cola;
  try {
    localStorage.setItem(CLAVE_COLA_GPS, JSON.stringify(cola));
  } catch {
    /* queda en memoria */
  }
}

// ==================== ESTADO Y AVISOS ====================

let estado: EstadoSeguimiento = {
  gps: { ultimoEnvio: null, enCola: 0, errorEnvio: null, errorUbicacion: null },
  pantalla: "inactivo",
};
const escuchas = new Set<(estado: EstadoSeguimiento) => void>();

function actualizar(cambio: { gps?: Partial<EstadoGPS>; pantalla?: EstadoPantalla }) {
  estado = { gps: { ...estado.gps, ...cambio.gps }, pantalla: cambio.pantalla ?? estado.pantalla };
  escuchas.forEach((avisar) => avisar(estado));
}

/** Estado actual, con los puntos que hayan quedado en la cola de una visita anterior */
export function estadoSeguimiento(): EstadoSeguimiento {
  return { ...estado, gps: { ...estado.gps, enCola: leerCola().length } };
}

/** Avisa cada cambio del GPS y de la pantalla; devuelve la función para dejar de escuchar */
export function escucharSeguimiento(avisar: (estado: EstadoSeguimiento) => void): () => void {
  escuchas.add(avisar);
  return () => { escuchas.delete(avisar); };
}

// ==================== ENVÍO DE LA COLA ====================

let idCitaSeguida: number | null = null;
let enviando = false;

/** Envía la cola al paseo seguido. Guardados, ignorados y rechazados salen de la cola: ninguno se reintenta */
export async function enviarColaGPS(): Promise<void> {
  const id = idCitaSeguida;
  const token = sesion.obtenerToken();
  if (enviando || id === null || !token) return;
  const cola = leerCola();
  if (cola.length === 0) return;

  enviando = true;
  const lote = cola.slice(0, MAX_PUNTOS_POR_ENVIO);
  const quitarDeLaCola = () => {
    const enviados = new Set(lote.map((p) => p.fecha_hora));
    const resto = leerCola().filter((p) => !enviados.has(p.fecha_hora));
    guardarCola(resto);
    return resto.length;
  };

  try {
    await paseosAPI.gpsLote(id, lote, token);
    actualizar({ gps: { ultimoEnvio: new Date(), enCola: quitarDeLaCola(), errorEnvio: null } });
  } catch (e) {
    // Datos inválidos nunca van a pasar: se descartan. Sin señal o error del servidor: se reintenta
    const status = (e as { status?: number }).status;
    const enCola = status === HTTP_DATOS_INVALIDOS ? quitarDeLaCola() : leerCola().length;
    const motivo = e instanceof TypeError ? "Sin señal" : e instanceof Error ? e.message : "Error del servidor";
    actualizar({ gps: { enCola, errorEnvio: `${motivo}: los puntos quedan guardados en el celular` } });
  } finally {
    enviando = false;
  }
}

// ==================== SEGUIR UN PASEO ====================

let vigilancia: number | null = null;
let intervaloEnvio: ReturnType<typeof setInterval> | null = null;
let bloqueoPantalla: WakeLockSentinel | null = null;

async function pedirPantallaEncendida() {
  if (!("wakeLock" in navigator)) {
    actualizar({ pantalla: "no-soportado" });
    return;
  }
  try {
    bloqueoPantalla = await navigator.wakeLock.request("screen");
    if (idCitaSeguida === null) { bloqueoPantalla.release(); return; }
    actualizar({ pantalla: "activo" });
    bloqueoPantalla.addEventListener("release", () => actualizar({ pantalla: "inactivo" }));
  } catch {
    actualizar({ pantalla: "inactivo" });
  }
}

// El navegador suelta la pantalla al ocultar la página: al volver (por ejemplo, desde WhatsApp)
// se pide de nuevo y se envía la cola enseguida
function alVolverALaPagina() {
  if (document.visibilityState !== "visible") return;
  pedirPantallaEncendida();
  enviarColaGPS();
}

function tomarPosicion(posicion: GeolocationPosition, ultimoPunto: { ms: number }) {
  const ahora = Date.now();
  if (ahora - ultimoPunto.ms < SEGUNDOS_ENTRE_PUNTOS * 1000) return;
  ultimoPunto.ms = ahora;
  const cola = [...leerCola(), {
    lat: posicion.coords.latitude,
    lng: posicion.coords.longitude,
    fecha_hora: new Date().toISOString(),
  }];
  guardarCola(cola);
  actualizar({ gps: { enCola: cola.length, errorUbicacion: null } });
}

/**
 * Empieza a seguir el paseo en curso. Se puede llamar en cada consulta: si ya se sigue, no hace nada.
 * Con varios perros paseados juntos basta seguir uno: el backend guarda cada punto en todos
 * los paseos en curso del paseador. Si el seguido terminó y queda otro, los puntos pasan a ese.
 */
export function seguirPaseo(idCita: number): void {
  if (idCitaSeguida === idCita) return;
  const yaSeguia = idCitaSeguida !== null;
  idCitaSeguida = idCita;
  if (yaSeguia) return;

  if ("geolocation" in navigator) {
    const ultimoPunto = { ms: 0 };
    vigilancia = navigator.geolocation.watchPosition(
      (posicion) => tomarPosicion(posicion, ultimoPunto),
      (falla) => actualizar({
        gps: { errorUbicacion: falla.code === GPS_SIN_PERMISO ? "Sin permiso de ubicación" : "No se pudo leer la ubicación" },
      }),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  } else {
    actualizar({ gps: { errorUbicacion: "Este navegador no da la ubicación" } });
  }

  intervaloEnvio = setInterval(enviarColaGPS, SEGUNDOS_ENVIO_GPS * 1000);
  pedirPantallaEncendida();
  document.addEventListener("visibilitychange", alVolverALaPagina);
}

/** Deja de seguir: sin paseos en curso no hay a dónde mandar puntos */
export function dejarDeSeguir(): void {
  if (idCitaSeguida === null) return;
  idCitaSeguida = null;
  if (vigilancia !== null) navigator.geolocation.clearWatch(vigilancia);
  if (intervaloEnvio !== null) clearInterval(intervaloEnvio);
  vigilancia = null;
  intervaloEnvio = null;
  document.removeEventListener("visibilitychange", alVolverALaPagina);
  bloqueoPantalla?.release();
  bloqueoPantalla = null;
  actualizar({ pantalla: "inactivo" });
}
