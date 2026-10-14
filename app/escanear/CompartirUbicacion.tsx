// app/escanear/CompartirUbicacion.tsx
// Envía la ubicación del paseador mientras el paseo está en curso (etapa 2).
// Solo funciona con la página abierta, como se aprobó con la ingeniera.
"use client";

import { useEffect, useRef, useState } from "react";
import { sesion } from "../lib/api";
import { georreferenciacionAPI, ErrorAPI } from "../lib/georreferenciacionAPI";

// El GPS puede reportar varias veces por segundo: se envía como máximo un punto cada 20 s.
const INTERVALO_ENVIO_MS = 20000;
// El backend no acepta precisiones mayores a esta (en metros).
const PRECISION_MAXIMA_M = 100000;

type EstadoUbicacion = "iniciando" | "activo" | "sin-permiso" | "no-disponible" | "finalizado";

function formatearHoraExacta(fecha: Date): string {
  return fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

export default function CompartirUbicacion({ idCita }: { idCita: number }) {
  const [estado, setEstado] = useState<EstadoUbicacion>("iniciando");
  const [ultimoEnvio, setUltimoEnvio] = useState<Date | null>(null);
  const [fallaEnvio, setFallaEnvio] = useState(false);
  const ultimoEnvioMs = useRef(0);
  const enviando = useRef(false);

  useEffect(() => {
    const token = sesion.obtenerToken();
    if (!token || !navigator.geolocation) {
      // setTimeout: mismo patrón que perfil/page.tsx para cambiar estado dentro de un efecto
      const timer = setTimeout(() => setEstado("no-disponible"), 0);
      return () => clearTimeout(timer);
    }
    const tokenSesion: string = token;

    let watchId: number | null = null;
    let bloqueoPantalla: WakeLockSentinel | null = null;
    let activo = true;

    // Mantener la pantalla encendida mientras se comparte la ubicación
    const pedirPantallaEncendida = async () => {
      try {
        bloqueoPantalla = await navigator.wakeLock.request("screen");
      } catch {
        /* navegador sin soporte o batería baja: se sigue sin bloqueo de pantalla */
      }
    };
    // El navegador suelta el bloqueo al cambiar de app; se pide de nuevo al volver
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible" && activo) pedirPantallaEncendida();
    };

    const detener = () => {
      activo = false;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      bloqueoPantalla?.release().catch(() => {});
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };

    const alRecibirPosicion = async (pos: GeolocationPosition) => {
      const ahora = Date.now();
      if (!activo || enviando.current || ahora - ultimoEnvioMs.current < INTERVALO_ENVIO_MS) return;
      enviando.current = true;
      try {
        await georreferenciacionAPI.enviarUbicacion(idCita, tokenSesion, {
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          precision_m: Math.min(Math.round(pos.coords.accuracy * 10) / 10, PRECISION_MAXIMA_M),
        });
        ultimoEnvioMs.current = ahora;
        setUltimoEnvio(new Date(ahora));
        setFallaEnvio(false);
        setEstado("activo");
      } catch (e) {
        if (e instanceof ErrorAPI && e.status === 409) {
          // El paseo ya terminó (entrega registrada): dejar de enviar
          setEstado("finalizado");
          detener();
        } else {
          // Sin señal u otro error: se reintenta con la siguiente posición
          setFallaEnvio(true);
        }
      } finally {
        enviando.current = false;
      }
    };

    const alFallarPosicion = (error: GeolocationPositionError) => {
      if (error.code === error.PERMISSION_DENIED) {
        setEstado("sin-permiso");
        detener();
      }
      // Si el GPS tarda o pierde señal, watchPosition sigue intentando solo
    };

    watchId = navigator.geolocation.watchPosition(alRecibirPosicion, alFallarPosicion, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 30000,
    });
    pedirPantallaEncendida();
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return detener;
  }, [idCita]);

  const enVivo = estado === "activo" || estado === "iniciando";

  return (
    <div className="esc-ubicacion">
      <div className="esc-ubicacion-titulo">
        <span className={`esc-punto ${enVivo ? "" : "esc-punto-inactivo"}`}></span>
        {estado === "finalizado" ? "Paseo finalizado" : "Paseo en curso"}
      </div>

      {estado === "iniciando" && <p>Obteniendo tu ubicación...</p>}

      {estado === "activo" && (
        <>
          <p>
            Compartiendo tu ubicación con el dueño
            {ultimoEnvio && <> · último envío {formatearHoraExacta(ultimoEnvio)}</>}
          </p>
          {fallaEnvio && (
            <p className="esc-aviso">
              <i className="fas fa-wifi"></i> Sin conexión, reintentando...
            </p>
          )}
          <p className="esc-ayuda">Mantén esta página abierta hasta la entrega.</p>
        </>
      )}

      {estado === "sin-permiso" && (
        <p className="esc-aviso">
          <i className="fas fa-location-crosshairs"></i> Activa el permiso de ubicación del navegador
          para que el dueño pueda seguir el paseo.
        </p>
      )}

      {estado === "no-disponible" && (
        <p className="esc-aviso">
          <i className="fas fa-triangle-exclamation"></i> Este navegador no permite compartir la ubicación.
        </p>
      )}

      {estado === "finalizado" && <p>Ya no se comparte la ubicación.</p>}
    </div>
  );
}
