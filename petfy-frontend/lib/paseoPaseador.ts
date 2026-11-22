// Lógica del paseador durante el paseo: sus paseos de hoy y las acciones de cada paseo.
// El GPS y la pantalla encendida van en lib/seguimientoGPS.ts.
// No tiene vista: la usa la vista de prueba. El modal del paseador (diseño de Oscar) usa compartirFotoConDueno.
"use client";
import { useCallback, useEffect, useState } from "react";
import { paseosAPI, sesion, PaseoDelDia } from "@/lib/api";
import { ESTADO_EN_CURSO, ESTADO_COMPLETADA } from "@/app/(cliente)/_components/paseos/paseoHoy";
import {
  EstadoGPS, EstadoPantalla, EstadoSeguimiento,
  enviarColaGPS, estadoSeguimiento, escucharSeguimiento, seguirPaseo, dejarDeSeguir,
} from "@/lib/seguimientoGPS";

export type { EstadoGPS, EstadoPantalla };

// ==================== CONSTANTES ====================

const SEGUNDOS_LISTA = 10;
const PREFIJO_WHATSAPP = "57";

// ==================== HELPERS ====================

function tokenDelPaseador(): string {
  const token = sesion.obtenerToken();
  if (!token) throw new Error("Tu sesión terminó. Vuelve a iniciar sesión");
  return token;
}

const mensajeDe = (e: unknown, porDefecto: string) => (e instanceof Error ? e.message : porDefecto);

/** Por hora, con los completados al final */
function ordenarPaseos(paseos: PaseoDelDia[]): PaseoDelDia[] {
  return [...paseos].sort((a, b) => {
    const completoA = a.id_estado === ESTADO_COMPLETADA ? 1 : 0;
    const completoB = b.id_estado === ESTADO_COMPLETADA ? 1 : 0;
    if (completoA !== completoB) return completoA - completoB;
    return (a.hora ?? "99:99").localeCompare(b.hora ?? "99:99");
  });
}

// ==================== FOTOS AL DUEÑO POR WHATSAPP ====================
// Envío manual por costo: sin API de WhatsApp ni almacenamiento. La foto no pasa por el backend.

type MomentoFoto = "inicio" | "entrega";

const DETALLE_FOTO: Record<MomentoFoto, string> = {
  inicio: "la foto de salida del paseo",
  entrega: "la foto de entrega del paseo",
};

function textoParaDueno(paseo: PaseoDelDia, detalle = "el paseo"): string {
  return `Hola ${paseo.cliente?.nombre ?? ""}, soy el paseador de Petfy. Te comparto ${detalle} de ${paseo.mascota?.nom_mascota ?? "tu mascota"} 🐕`;
}

/** Enlace para escribirle al dueño por WhatsApp; null si no tiene teléfono */
export function enlaceWhatsApp(paseo: PaseoDelDia, detalle?: string): string | null {
  const telefono = paseo.cliente?.telefono?.replace(/\D/g, "");
  if (!telefono) return null;
  const numero = telefono.startsWith(PREFIJO_WHATSAPP) && telefono.length > 10 ? telefono : PREFIJO_WHATSAPP + telefono;
  return `https://wa.me/${numero}?text=${encodeURIComponent(textoParaDueno(paseo, detalle))}`;
}

/** Foto en data URL → archivo. Sin await: el celular solo deja compartir justo después del toque */
function archivoDeFoto(foto: string, nombre: string): File {
  const [cabecera, base64] = foto.split(",");
  const tipo = cabecera.match(/data:(.*?);/)?.[1] ?? "image/jpeg";
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new File([bytes], `${nombre}.${tipo.split("/")[1] ?? "jpg"}`, { type: tipo });
}

/**
 * Abre el menú de compartir del celular con la foto; el paseador elige el chat del dueño y la envía.
 * Si el navegador no comparte archivos, abre el chat del dueño y la foto se adjunta a mano.
 */
export async function compartirFotoConDueno(paseo: PaseoDelDia, foto: string, momento: MomentoFoto): Promise<void> {
  const archivo = archivoDeFoto(foto, `petfy-${momento}-${paseo.id_cita}`);
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], text: textoParaDueno(paseo, DETALLE_FOTO[momento]) });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) throw e; // cerrar el menú no es error
    }
    return;
  }
  const enlace = enlaceWhatsApp(paseo, DETALLE_FOTO[momento]);
  if (!enlace) throw new Error("El dueño no tiene teléfono registrado");
  window.open(enlace, "_blank");
}

// ==================== HOOK ====================

export function usePaseoPaseador() {
  const [paseos, setPaseos] = useState<PaseoDelDia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [{ gps, pantalla }, setSeguimiento] = useState<EstadoSeguimiento>(estadoSeguimiento);

  const idEnCurso = paseos.find((p) => p.id_estado === ESTADO_EN_CURSO)?.id_cita ?? null;

  // --- 1. Paseos de hoy, cada 10 s ---

  const cargar = useCallback(async () => {
    try {
      const lista = await paseosAPI.paseosDeHoy(tokenDelPaseador());
      setPaseos(ordenarPaseos(lista));
      setError(null);
    } catch (e) {
      setError(mensajeDe(e, "No se pudieron consultar los paseos de hoy"));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, SEGUNDOS_LISTA * 1000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  // --- 2. GPS y pantalla encendida mientras haya un paseo en curso ---

  useEffect(() => escucharSeguimiento(setSeguimiento), []);

  useEffect(() => {
    if (cargando) return;
    if (idEnCurso !== null) seguirPaseo(idEnCurso);
    else dejarDeSeguir();
  }, [cargando, idEnCurso]);

  // --- 3. Acciones del paseo (lanzan el error del backend para mostrarlo en la vista) ---

  const marcarLlegada = useCallback(async (idCita: number) => {
    await paseosAPI.llegada(idCita, tokenDelPaseador());
    await cargar();
  }, [cargar]);

  const iniciar = useCallback(async (idCita: number, codigo: string) => {
    await paseosAPI.iniciar(idCita, codigo, tokenDelPaseador());
    await cargar();
  }, [cargar]);

  const registrarNovedad = useCallback(async (idCita: number, texto: string) => {
    await paseosAPI.novedad(idCita, texto, tokenDelPaseador());
  }, []);

  /** Primero se envía la cola, para que el paseo que termina no pierda su último tramo */
  const finalizar = useCallback(async (idCita: number, novedad?: string) => {
    await enviarColaGPS();
    await paseosAPI.finalizar(idCita, novedad || undefined, tokenDelPaseador());
    await cargar();
  }, [cargar]);

  return { paseos, cargando, error, gps, pantalla, marcarLlegada, iniciar, registrarNovedad, finalizar };
}
