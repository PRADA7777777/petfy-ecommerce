// app/paseo/mapa/page.tsx
// Página del dueño para ver el recorrido del paseo de su mascota (módulo de georreferenciación).
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { sesion } from "../../lib/api";
import PantallaCarga from "../../components/PantallaCarga";
import { georreferenciacionAPI, RutaPaseo } from "../../lib/georreferenciacionAPI";
import MapaPaseo from "../MapaPaseo";

type Estado = "cargando" | "sin-sesion" | "error" | "listo";

function MapaDelPaseo() {
  const params = useSearchParams();
  const idCita = Number(params.get("cita"));

  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState("");
  const [ruta, setRuta] = useState<RutaPaseo | null>(null);

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
          setEstado("listo");
        })
        .catch((e: Error) => {
          setError(e.message);
          setEstado("error");
        });
    }, 0);
    return () => clearTimeout(timer);
  }, [idCita]);

  if (estado === "cargando") {
    return <PantallaCarga mensaje="Cargando el paseo..." />;
  }

  return (
    <main className="map-page">
      <div className="map-wrap">
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
            {ruta.puntos.length === 0 ? (
              <p className="map-aviso">Todavía no hay ubicaciones de este paseo.</p>
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
