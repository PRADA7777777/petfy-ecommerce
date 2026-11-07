// app/paseo/admin/page.tsx
// Página del administrador para ver todos los paseos en curso (módulo de georreferenciación).
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { sesion } from "../../lib/api";
import PantallaCarga from "../../components/PantallaCarga";
import {
  georreferenciacionAPI,
  INTERVALO_UBICACION_MS,
  PaseadorEnCurso,
} from "../../lib/georreferenciacionAPI";
import { formatearHoraExacta } from "../../lib/formatoHora";
import MapaAdmin from "../MapaAdmin";

type Estado = "cargando" | "sin-sesion" | "error" | "listo";

export default function MapaAdminPagina() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState("");
  const [paseadores, setPaseadores] = useState<PaseadorEnCurso[]>([]);
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
      georreferenciacionAPI
        .obtenerPaseosEnCurso(token)
        .then((data) => {
          setPaseadores(data.paseadores);
          setActualizado(new Date());
          setEstado("listo");
        })
        .catch((e: Error) => {
          setError(e.message);
          setEstado("error");
        });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Vuelve a consultar cada INTERVALO_UBICACION_MS. Si la página no está visible no consulta.
  useEffect(() => {
    if (estado !== "listo") return;
    const token = sesion.obtenerToken();
    if (!token) return;

    const intervalo = setInterval(() => {
      if (document.hidden) return;
      georreferenciacionAPI
        .obtenerPaseosEnCurso(token)
        .then((data) => {
          setPaseadores(data.paseadores);
          setActualizado(new Date());
          setSinConexion(false);
        })
        .catch(() => setSinConexion(true));
    }, INTERVALO_UBICACION_MS);

    return () => clearInterval(intervalo);
  }, [estado]);

  const cargarRuta = useCallback((idCita: number) => {
    const token = sesion.obtenerToken();
    if (!token) return Promise.reject(new Error("Sin sesión"));
    return georreferenciacionAPI.obtenerRuta(idCita, token).then((ruta) => ruta.puntos);
  }, []);

  if (estado === "cargando") {
    return <PantallaCarga mensaje="Cargando los paseos..." />;
  }

  const totalMascotas = paseadores.reduce((total, p) => total + p.mascotas.length, 0);

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
            <h1 className="map-titulo">Inicia sesión para ver los paseos</h1>
            <Link href="/" className="btn btn-primary">
              <i className="fas fa-right-to-bracket"></i> Ir a iniciar sesión
            </Link>
          </div>
        )}

        {estado === "error" && (
          <div className="map-mensaje">
            <h1 className="map-titulo">No se pudieron cargar los paseos</h1>
            <p>{error}</p>
            <Link href="/" className="btn btn-outline">
              <i className="fas fa-house"></i> Volver al inicio
            </Link>
          </div>
        )}

        {estado === "listo" && (
          <>
            <h1 className="map-titulo">Paseos en curso</h1>
            <p className="map-estado" role="status">
              <span className="map-punto" aria-hidden="true"></span>
              <span>
                {paseadores.length} {paseadores.length === 1 ? "paseador" : "paseadores"} ·{" "}
                {totalMascotas} {totalMascotas === 1 ? "mascota" : "mascotas"}
                {actualizado && ` · actualizado a las ${formatearHoraExacta(actualizado)}`}
              </span>
            </p>
            {sinConexion && <p className="map-aviso">Sin conexión, reintentando…</p>}
            {paseadores.length === 0 ? (
              <p className="map-aviso">No hay paseos en curso en este momento.</p>
            ) : (
              <MapaAdmin paseadores={paseadores} cargarRuta={cargarRuta} />
            )}
          </>
        )}
      </div>
    </main>
  );
}
