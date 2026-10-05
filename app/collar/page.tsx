// app/collar/page.tsx
// QR del collar de una mascota (módulo de georreferenciación).
// El dueño lo ve e imprime; el paseador lo escanea para registrar recogida y entrega.
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { sesion } from "../lib/api";
import PantallaCarga from "../components/PantallaCarga";
import { georreferenciacionAPI, CodigoMascota } from "../lib/georreferenciacionAPI";
import "../escanear/escanear.css";
import "./collar.css";

type Estado = "cargando" | "sin-sesion" | "error" | "listo" | "generando";

function Collar() {
  const params = useSearchParams();
  const idMascota = Number(params.get("m"));

  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState("");
  const [datos, setDatos] = useState<CodigoMascota | null>(null);
  const [confirmandoNuevo, setConfirmandoNuevo] = useState(false);

  // Consultar el código actual (sin cambiarlo)
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = sesion.obtenerToken();
      if (!token) {
        setEstado("sin-sesion");
        return;
      }
      if (!idMascota) {
        setError("No se indicó la mascota.");
        setEstado("error");
        return;
      }
      georreferenciacionAPI
        .obtenerCodigo(idMascota, token)
        .then((d) => {
          setDatos(d);
          setEstado("listo");
        })
        .catch((e: Error) => {
          setError(e.message);
          setEstado("error");
        });
    }, 0);
    return () => clearTimeout(timer);
  }, [idMascota]);

  // Generar (o regenerar) el código: anula el anterior en el backend
  const generar = async () => {
    const token = sesion.obtenerToken();
    if (!token) return;
    setEstado("generando");
    setConfirmandoNuevo(false);
    try {
      setDatos(await georreferenciacionAPI.generarCodigo(idMascota, token));
      setEstado("listo");
    } catch (e) {
      setError((e as Error).message);
      setEstado("error");
    }
  };

  if (estado === "cargando") {
    return <PantallaCarga mensaje="Cargando el QR..." />;
  }

  const urlEscaneo =
    datos?.codigo && typeof window !== "undefined"
      ? `${window.location.origin}/escanear?t=${datos.codigo}`
      : "";

  return (
    <div className="esc-page">
      <div className="esc-wrap">
        <header className="esc-header">
          <img src="/assets/img/Nombre-Petfy-Naranja.png" alt="Petfy" className="esc-logo" />
        </header>

        <section className="esc-card">
          {estado === "sin-sesion" && (
            <div className="esc-mensaje">
              <i className="fas fa-lock esc-icono"></i>
              <h1>Inicia sesión</h1>
              <p>Para ver el QR del collar necesitas tener tu sesión abierta.</p>
              <Link href="/" className="btn btn-primary">
                <i className="fas fa-right-to-bracket"></i> Ir a iniciar sesión
              </Link>
            </div>
          )}

          {estado === "error" && (
            <div className="esc-mensaje">
              <i className="fas fa-circle-exclamation esc-icono esc-icono-error"></i>
              <h1>No se pudo continuar</h1>
              <p>{error}</p>
              <Link href="/perfil" className="btn btn-outline">
                <i className="fas fa-arrow-left"></i> Volver a mi perfil
              </Link>
            </div>
          )}

          {(estado === "listo" || estado === "generando") && datos && !datos.codigo && (
            <div className="esc-mensaje">
              <i className="fas fa-qrcode esc-icono"></i>
              <h1>{datos.nom_mascota} aún no tiene QR</h1>
              <p>
                Genera el código para su collar. El paseador lo escaneará al recogerlo y al
                entregarlo.
              </p>
              <button
                className="btn btn-primary esc-btn-ancho"
                onClick={generar}
                disabled={estado === "generando"}
              >
                {estado === "generando" ? (
                  <><i className="fas fa-spinner fa-spin"></i> Generando...</>
                ) : (
                  <><i className="fas fa-qrcode"></i> Generar QR del collar</>
                )}
              </button>
            </div>
          )}

          {(estado === "listo" || estado === "generando") && datos?.codigo && (
            <div className="col-contenido">
              <span className="esc-badge esc-badge-recogida col-no-imprimir">
                <i className="fas fa-qrcode"></i> QR del collar
              </span>
              <h1 className="esc-titulo">
                Collar de <span>{datos.nom_mascota}</span>
              </h1>

              <div className="col-qr">
                <QRCodeSVG value={urlEscaneo} size={220} level="M" fgColor="#064f56" marginSize={2} />
              </div>
              <p className="col-instruccion">
                <i className="fas fa-paw"></i> Escanea para registrar la recogida y la entrega
              </p>

              <div className="col-no-imprimir">
                <button className="btn btn-primary esc-btn-ancho" onClick={() => window.print()}>
                  <i className="fas fa-print"></i> Imprimir QR
                </button>

                {!confirmandoNuevo ? (
                  <button
                    className="col-btn-texto"
                    onClick={() => setConfirmandoNuevo(true)}
                    disabled={estado === "generando"}
                  >
                    ¿Se perdió el collar? Generar un código nuevo
                  </button>
                ) : (
                  <div className="col-confirmar">
                    <p>
                      <i className="fas fa-triangle-exclamation"></i> El QR actual dejará de
                      funcionar. Tendrás que imprimir el nuevo.
                    </p>
                    <div className="col-confirmar-botones">
                      <button className="btn btn-outline" onClick={() => setConfirmandoNuevo(false)}>
                        Cancelar
                      </button>
                      <button className="btn btn-primary" onClick={generar}>
                        Sí, generar nuevo
                      </button>
                    </div>
                  </div>
                )}

                <Link href="/perfil" className="col-volver">
                  <i className="fas fa-arrow-left"></i> Volver a mi perfil
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// useSearchParams necesita un límite de Suspense en Next.js
export default function CollarPage() {
  return (
    <Suspense fallback={<PantallaCarga mensaje="Cargando..." />}>
      <Collar />
    </Suspense>
  );
}
