// app/escanear/page.tsx
// Página que se abre al escanear el QR del collar (módulo de georreferenciación).
// Flujo: consultar → tomar foto → confirmar (hora + ubicación) → avisar por WhatsApp.
// Usa la identidad visual de Petfy: botones globales (.btn), logo y PantallaCarga.
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { sesion } from "../lib/api";
import PantallaCarga from "../components/PantallaCarga";
import {
  georreferenciacionAPI,
  InfoEscaneo,
  ConfirmacionEscaneo,
} from "../lib/georreferenciacionAPI";
import "./escanear.css";

type Estado = "cargando" | "sin-sesion" | "error" | "listo" | "confirmando" | "confirmado";

// ── Utilidades ──────────────────────────────────────────────

/** Pide la ubicación una sola vez. Si falla o no hay permiso, devuelve null
 *  (el evento se registra igual, sin coordenadas). */
function obtenerUbicacion(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

/** Deja solo dígitos y agrega el indicativo de Colombia si falta. */
function normalizarTelefono(tel: string | null): string | null {
  if (!tel) return null;
  const digitos = tel.replace(/\D/g, "");
  if (digitos.length === 10) return `57${digitos}`;
  return digitos || null;
}

function formatearHora(fechaIso: string): string {
  return new Date(fechaIso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });
}

// ── Componente principal ────────────────────────────────────

function Escanear() {
  const params = useSearchParams();
  const codigo = params.get("t") || "";

  const [estado, setEstado] = useState<Estado>("cargando");
  const [error, setError] = useState("");
  const [info, setInfo] = useState<InfoEscaneo | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ConfirmacionEscaneo | null>(null);
  const [sinUbicacion, setSinUbicacion] = useState(false);

  // 1. Al abrir la página, preguntar al backend si este escaneo corresponde a
  //    una recogida o a una entrega, y de qué mascota. Solo consulta: no
  //    registra nada (el registro ocurre al presionar "Confirmar").
  //    La sesión se lee dentro de un setTimeout, igual que en perfil/page.tsx.
  useEffect(() => {
    const timer = setTimeout(() => {
      const token = sesion.obtenerToken();
      if (!token) {
        setEstado("sin-sesion");
        return;
      }
      if (!codigo) {
        setError("El enlace no tiene un código válido.");
        setEstado("error");
        return;
      }
      georreferenciacionAPI
        .consultarEscaneo(codigo, token)
        .then((data) => {
          setInfo(data);
          setEstado("listo");
        })
        .catch((e: Error) => {
          setError(e.message);
          setEstado("error");
        });
    }, 0);
    return () => clearTimeout(timer);
  }, [codigo]);

  // Liberar la vista previa de la foto al cambiarla o salir
  useEffect(() => {
    return () => {
      if (fotoUrl) URL.revokeObjectURL(fotoUrl);
    };
  }, [fotoUrl]);

  const elegirFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setFoto(archivo);
    setFotoUrl(URL.createObjectURL(archivo));
  };

  // 2. Confirmar: toma la ubicación y registra el evento
  const confirmar = async () => {
    const token = sesion.obtenerToken();
    if (!token || !info) return;
    setEstado("confirmando");
    const ubicacion = await obtenerUbicacion();
    setSinUbicacion(!ubicacion);
    try {
      const r = await georreferenciacionAPI.confirmarEscaneo(codigo, token, {
        metodo_lectura: "QR",
        latitud: ubicacion?.lat ?? null,
        longitud: ubicacion?.lng ?? null,
      });
      setResultado(r);
      setEstado("confirmado");
    } catch (e) {
      setError((e as Error).message);
      setEstado("error");
    }
  };

  // 3. Avisar al dueño por WhatsApp.
  //    Por ahora la foto no se sube al sistema: se comparte directo desde el
  //    celular. Pendiente definir si además se debe guardar como evidencia.
  const avisarPorWhatsApp = async () => {
    if (!info || !resultado) return;
    const verbo = resultado.accion === "recogida" ? "recogido" : "entregado";
    const saludo = info.nombre_dueno ? `Hola ${info.nombre_dueno}, ` : "Hola, ";
    const texto =
      `${saludo}${info.nom_mascota ?? "tu mascota"} fue ${verbo} ` +
      `a las ${formatearHora(resultado.fecha_hora_evento)} 🐾 Petfy`;

    // Con foto: menú "Compartir" del celular (el paseador elige WhatsApp y el chat)
    if (foto && navigator.canShare?.({ files: [foto] })) {
      try {
        await navigator.share({ files: [foto], text: texto });
        return;
      } catch {
        /* el paseador canceló: no hacemos nada */
        return;
      }
    }
    // Sin soporte para compartir archivos: abre el chat con el texto listo
    const tel = normalizarTelefono(info.telefono_dueno);
    const url = tel
      ? `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  // ── Render ─────────────────────────────────────────────────

  if (estado === "cargando") {
    return <PantallaCarga mensaje="Consultando el paseo..." />;
  }

  const esRecogida = info?.accion === "recogida";

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
              <h1>Inicia sesión como paseador</h1>
              <p>Para registrar la recogida o la entrega necesitas tener tu sesión abierta.</p>
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
              <Link href="/" className="btn btn-outline">
                <i className="fas fa-house"></i> Volver al inicio
              </Link>
            </div>
          )}

          {(estado === "listo" || estado === "confirmando") && info && (
            <>
              <span className={`esc-badge ${esRecogida ? "esc-badge-recogida" : "esc-badge-entrega"}`}>
                <i className={`fas ${esRecogida ? "fa-person-walking" : "fa-house-chimney"}`}></i>
                {esRecogida ? "Recogida" : "Entrega"}
              </span>
              <h1 className="esc-titulo">
                Vas a {esRecogida ? "recoger" : "entregar"} a <span>{info.nom_mascota}</span>
              </h1>

              <ul className="esc-detalles">
                <li>
                  <i className="fas fa-clock"></i>
                  <span>Hora agendada</span>
                  <strong>{info.hora_agendada ?? "—"}</strong>
                </li>
                {!esRecogida && (
                  <li>
                    <i className="fas fa-person-walking"></i>
                    <span>Recogido a las</span>
                    <strong>{info.hora_recogida ?? "—"}</strong>
                  </li>
                )}
                <li>
                  <i className="fas fa-location-dot"></i>
                  <span>Dirección</span>
                  <strong>{info.direccion ?? "—"}</strong>
                </li>
              </ul>

              <label className={`esc-foto ${fotoUrl ? "esc-foto-lista" : ""}`}>
                {fotoUrl ? (
                  <img src={fotoUrl} alt={`Foto de ${info.nom_mascota}`} />
                ) : (
                  <>
                    <i className="fas fa-camera"></i>
                    <span>Toma una foto de {info.nom_mascota}</span>
                  </>
                )}
                <input type="file" accept="image/*" capture="environment" onChange={elegirFoto} hidden />
              </label>
              {fotoUrl && <p className="esc-ayuda">Toca la foto para tomarla de nuevo</p>}

              <button
                className="btn btn-primary esc-btn-ancho"
                onClick={confirmar}
                disabled={!foto || estado === "confirmando"}
              >
                {estado === "confirmando" ? (
                  <><i className="fas fa-spinner fa-spin"></i> Registrando...</>
                ) : (
                  <><i className="fas fa-check"></i> Confirmar {esRecogida ? "recogida" : "entrega"}</>
                )}
              </button>
            </>
          )}

          {estado === "confirmado" && resultado && info && (
            <div className="esc-mensaje">
              <i className="fas fa-circle-check esc-icono esc-icono-exito"></i>
              <h1>
                {resultado.accion === "recogida" ? "Recogida" : "Entrega"} registrada
              </h1>
              <p>
                {info.nom_mascota} · {formatearHora(resultado.fecha_hora_evento)}
              </p>
              {sinUbicacion && (
                <p className="esc-aviso">
                  <i className="fas fa-triangle-exclamation"></i> No se pudo obtener la ubicación;
                  el registro quedó sin coordenadas.
                </p>
              )}
              <button className="btn btn-primary esc-btn-ancho esc-btn-whatsapp" onClick={avisarPorWhatsApp}>
                <i className="fab fa-whatsapp"></i> Avisar al dueño por WhatsApp
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// useSearchParams necesita un límite de Suspense en Next.js
export default function EscanearPage() {
  return (
    <Suspense fallback={<PantallaCarga mensaje="Cargando..." />}>
      <Escanear />
    </Suspense>
  );
}
