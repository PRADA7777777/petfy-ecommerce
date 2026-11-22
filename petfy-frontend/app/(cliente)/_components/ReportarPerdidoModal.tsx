"use client";

import { useRef, useState } from "react";
import { Mascota, mascotasAPI, sesion } from "@/lib/api";
import { CartelPerdido } from "./CartelPerdido";

interface Props {
  mascota: Mascota;
  nombreDueno?: string;
  telefonoDueno?: string;
  codigoPlaca?: string | null;
  onClose: () => void;
  onActualizada?: () => void;
}

type Paso = "formulario" | "cartel";

export default function ReportarPerdidoModal({
  mascota,
  nombreDueno,
  telefonoDueno,
  codigoPlaca,
  onClose,
  onActualizada,
}: Props) {
  const [paso, setPaso] = useState<Paso>("formulario");
  const [fecha, setFecha] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [ubicacion, setUbicacion] = useState("");
  const [recompensa, setRecompensa] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mascotaActualizada, setMascotaActualizada] = useState<Mascota>(mascota);
  const [descargando, setDescargando] = useState(false);

  const cartelRef = useRef<HTMLDivElement>(null);

  const handleActivar = async () => {
    const token = sesion.obtenerToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await mascotasAPI.marcarPerdida(
        mascota.id_mascota,
        {
          perdido: true,
          fecha_perdida: fecha ? new Date(fecha).toISOString() : null,
          ultima_ubicacion: ubicacion || null,
          recompensa: recompensa || null,
          mensaje_perdido: mensaje || null,
        },
        token
      );
      setMascotaActualizada({
        ...mascota,
        modo_perdido: true,
        fecha_perdida: fecha ? new Date(fecha).toISOString() : new Date().toISOString(),
        ultima_ubicacion: ubicacion || null,
        recompensa: recompensa || null,
        mensaje_perdido: mensaje || null,
      });
      setPaso("cartel");
      onActualizada?.();
    } catch (e: any) {
      setError(e.message || "No se pudo activar el modo perdido");
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = async () => {
    if (!cartelRef.current) return;
    setDescargando(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cartelRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `perdido_${mascota.nom_mascota.replace(/\s+/g, "_")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e: any) {
      alert("No se pudo generar la imagen: " + (e.message || ""));
    } finally {
      setDescargando(false);
    }
  };

  const handleCompartirWhatsApp = async () => {
    if (!cartelRef.current) return;
    setDescargando(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cartelRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `perdido_${mascota.nom_mascota}.png`, { type: "image/png" });
        const urlPublica = codigoPlaca
          ? `${window.location.origin}/p/${codigoPlaca}`
          : `${window.location.origin}/pet/${mascota.id_mascota}`;
        const texto = `🚨 SE BUSCA: ${mascota.nom_mascota}\n\nSe perdió el ${new Date(fecha).toLocaleDateString("es-CO")}${ubicacion ? ` en ${ubicacion}` : ""}.\n\n${mensaje ? `"${mensaje}"\n\n` : ""}${recompensa ? `💰 Recompensa: ${recompensa}\n\n` : ""}Más información: ${urlPublica}\n\n🐾 Compartido desde Petfy`;

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], text: texto, title: `Se busca: ${mascota.nom_mascota}` });
          } catch { /* usuario canceló */ }
        } else {
          const link = document.createElement("a");
          link.download = `perdido_${mascota.nom_mascota}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          setTimeout(() => {
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
          }, 800);
        }
      }, "image/png");
    } catch (e: any) {
      alert("No se pudo compartir: " + (e.message || ""));
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="perdido-backdrop" onClick={onClose}>
      <div className="perdido-modal" onClick={(e) => e.stopPropagation()}>
        <button className="perdido-close" onClick={onClose}>✕</button>

        <div className="perdido-header">
          <div className="perdido-header-icon">🚨</div>
          <h2>Reportar como perdido</h2>
          <p>
            <strong>{mascota.nom_mascota}</strong>
          </p>
        </div>

        {paso === "formulario" && (
          <>
            <div className="perdido-info">
              Al activar el modo perdido, el perfil público mostrará una alerta y podrás generar un cartel descargable para compartir.
            </div>

            <label className="perdido-field">
              <span>¿Cuándo se perdió?</span>
              <input
                type="datetime-local"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="perdido-field">
              <span>Última ubicación</span>
              <input
                type="text"
                placeholder="Ej: Chapinero, Bogotá"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="perdido-field">
              <span>Recompensa (opcional)</span>
              <input
                type="text"
                placeholder="Ej: $500.000"
                value={recompensa}
                onChange={(e) => setRecompensa(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="perdido-field">
              <span>Mensaje para quien la encuentre</span>
              <textarea
                placeholder="Ej: Es muy tímido, no corras detrás de él, llama su nombre con calma..."
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </label>

            {error && <div className="perdido-error">⚠️ {error}</div>}

            <button
              className="perdido-btn perdido-btn-danger"
              onClick={handleActivar}
              disabled={loading}
            >
              {loading ? "Activando…" : "🚨 Activar modo perdido"}
            </button>
          </>
        )}

        {paso === "cartel" && (
          <>
            <div className="perdido-success">
              ✅ Mascota marcada como perdida
            </div>
            <p className="perdido-hint">
              Descarga o comparte este cartel por WhatsApp. El perfil público también mostrará una alerta.
            </p>

            <div className="perdido-cartel-preview">
              <CartelPerdido
                mascota={mascotaActualizada}
                idRef={cartelRef}
                nombreDueno={nombreDueno}
                telefonoDueno={telefonoDueno}
                codigoPlaca={codigoPlaca}
              />
            </div>

            <div className="perdido-acciones">
              <button
                className="perdido-btn perdido-btn-primary"
                onClick={handleDescargar}
                disabled={descargando}
              >
                {descargando ? "Generando…" : "📥 Descargar imagen"}
              </button>
              <button
                className="perdido-btn perdido-btn-wa"
                onClick={handleCompartirWhatsApp}
                disabled={descargando}
              >
                {descargando ? "Preparando…" : "📤 Compartir por WhatsApp"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}