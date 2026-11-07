// app/paseo/mapa/page.tsx
// Página del dueño para ver el recorrido del paseo de su mascota (módulo de georreferenciación).
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { sesion } from "../../lib/api";
import PantallaCarga from "../../components/PantallaCarga";
import {
  georreferenciacionAPI,
  INTERVALO_UBICACION_MS,
  RutaPaseo,
} from "../../lib/georreferenciacionAPI";
import MapaPaseo from "../MapaPaseo";

type Estado = "cargando" | "sin-sesion" | "error" | "listo";

function formatearHoraExacta(fecha: Date): string {
  return fecha.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function MapaDelPaseo() {
  const params = useSearchParams();
  const idCita = Number(params.get("cita"));

  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState("");
  const [ruta, setRuta] = useState<RutaPaseo | null>(null);
  const [actualizado, setActualizado] = useState<Date | null>(null);
  const [sinConexion, setSinConexion] = useState(false);

  // La sesión se lee dentro de un setTimeout, igual que en escanear/page.tsx
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = sesion.obtenerToken();
      if (!token) {
        setEstado("sin-sesion");
        return;
      }
      if (!Number.isInteger(idCita) || idCita <= 0) {
        setError("El enlace no tiene un paseo válido.");
        setEstado("error");
        return;
      }
      georreferenciacionAPI
        .obtenerRuta(idCita, token)
        .then((data) => {
          setRuta(data);
          setActualizado(new Date());
          setEstado("listo");
        })
        .catch((e: Error) => {
          setError(e.message);
          setEstado("error");
        });
    }, 0);
    return () => clearTimeout(timer);
  }, [idCita]);

  // Mientras el paseo está en curso, vuelve a consultar la ruta cada INTERVALO_UBICACION_MS.
  // Si la página no está visible (otra pestaña o pantalla bloqueada) no consulta.
  const enCurso = ruta?.en_curso ?? false;
  useEffect(() => {
    if (!enCurso) return;
    const token = sesion.obtenerToken();
    if (!token) return;

    const intervalo = setInterval(() => {
      if (document.hidden) return;
      georreferenciacionAPI
        .obtenerRuta(idCita, token)
        .then((data) => {
          setRuta(data);
          setActualizado(new Date());
          setSinConexion(false);
        })
        .catch(() => setSinConexion(true));
    }, INTERVALO_UBICACION_MS);

    return () => clearInterval(intervalo);
  }, [enCurso, idCita]);

  if (estado === "cargando") {
    return <PantallaCarga mensaje="Cargando el paseo..." />;
  }

  return (
    <main className="map-page">
      <div className="map-wrap">
        <header className="map-header">
          <img src="/assets/img/Nombre-Petfy-Naranja.png" alt="Petfy" className="map-logo" />
          <Link href="/perfil" className="btn btn-outline map-volver">
            <i className="fas fa-arrow-left"></i> Mi perfil
          </Link>
        </header>

        {estado === "sin-sesion" && (
          <div className="map-mensaje">
            <h1 className="map-titulo">Inicia sesión para ver el paseo</h1>
            <Link href="/" className="btn btn-primary">
              <i className="fas fa-right-to-bracket"></i> Ir a iniciar sesión
            </Link>
          </div>
        )}

        {estado === "error" && (
          <div className="map-mensaje">
            <h1 className="map-titulo">No se pudo cargar el paseo</h1>
            <p>{error}</p>
            <Link href="/" className="btn btn-outline">
              <i className="fas fa-house"></i> Volver al inicio
            </Link>
          </div>
        )}

        {estado === "listo" && ruta && (
          <>
            <h1 className="map-titulo">Paseo de {ruta.nom_mascota}</h1>

            <div className="map-estado" role="status">
              {ruta.nombre_paseador && (
                <span className="map-paseador">🐾 Con {ruta.nombre_paseador} ·</span>
              )}
              {ruta.en_curso ? (
                <>
                  <span className="map-punto" aria-hidden="true"></span>
                  <span>
                    En curso
                    {actualizado && ` · actualizado a las ${formatearHoraExacta(actualizado)}`}
                  </span>
                </>
              ) : (
                <>
                  <span className="map-punto map-punto-inactivo" aria-hidden="true"></span>
                  <span>Paseo terminado</span>
                </>
              )}
            </div>
            {sinConexion && <p className="map-aviso">Sin conexión, reintentando…</p>}

            {ruta.puntos.length === 0 ? (
              <p className="map-aviso">
                {ruta.en_curso
                  ? "Esperando la primera ubicación del paseador…"
                  : "Este paseo no tiene ubicaciones registradas."}
              </p>
            ) : (
              <MapaPaseo
                puntos={ruta.puntos}
                mascota={ruta.nom_mascota}
                paseador={ruta.nombre_paseador}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

// useSearchParams necesita un límite de Suspense en Next.js
export default function MapaPaseoPagina() {
  return (
    <Suspense fallback={<PantallaCarga mensaje="Cargando..." />}>
      <MapaDelPaseo />
    </Suspense>
  );
}
