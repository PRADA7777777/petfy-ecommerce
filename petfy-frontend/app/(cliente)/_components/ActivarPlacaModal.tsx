"use client";

import { useEffect, useState } from "react";
import { Mascota, placasAPI, sesion } from "@/lib/api";

interface Props {
  mascota: Mascota;
  onClose: () => void;
  onActivada?: () => void;
}

type Vista = "cargando" | "sin-placa" | "con-placa";

export default function ActivarPlacaModal({ mascota, onClose, onActivada }: Props) {
  const [vista, setVista] = useState<Vista>("cargando");
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placaCodigo, setPlacaCodigo] = useState<string | null>(null);
  const [urlCopiada, setUrlCopiada] = useState(false);

  useEffect(() => {
    const token = sesion.obtenerToken();
    if (!token) { setVista("sin-placa"); return; }
    placasAPI
      .verDeMascota(mascota.id_mascota, token)
      .then((res) => {
        if (res.tiene_placa && res.placa) {
          setPlacaCodigo(res.placa.codigo);
          setVista("con-placa");
        } else {
          setVista("sin-placa");
        }
      })
      .catch(() => setVista("sin-placa"));
  }, [mascota.id_mascota]);

  const handleActivar = async () => {
    if (!codigo.trim()) { setError("Ingresa el código de la placa"); return; }
    const token = sesion.obtenerToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await placasAPI.activar(
        codigo.trim().toUpperCase(),
        mascota.id_mascota,
        token
      );
      setPlacaCodigo(res.codigo);
      setVista("con-placa");
      onActivada?.();
    } catch (e: any) {
      setError(e.message || "No se pudo activar la placa");
    } finally {
      setLoading(false);
    }
  };

  const handleCopiarUrl = async () => {
    if (!placaCodigo) return;
    const url = `${window.location.origin}/p/${placaCodigo}`;
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopiada(true);
      setTimeout(() => setUrlCopiada(false), 2000);
    } catch {
      prompt("Copia este link:", url);
    }
  };

  const handleDesactivar = async () => {
    if (!placaCodigo) return;
    if (!confirm(`¿Desactivar la placa ${placaCodigo}? El código quedará libre.`)) return;
    const token = sesion.obtenerToken();
    if (!token) return;
    setLoading(true);
    try {
      await placasAPI.desactivar(placaCodigo, token);
      setPlacaCodigo(null);
      setVista("sin-placa");
      onActivada?.();
    } catch (e: any) {
      setError(e.message || "No se pudo desactivar");
    } finally {
      setLoading(false);
    }
  };

  const urlPublica = placaCodigo ? `${window.location.origin}/p/${placaCodigo}` : "";

  return (
    <div className="placa-modal-backdrop" onClick={onClose}>
      <div className="placa-modal" onClick={(e) => e.stopPropagation()}>
        <button className="placa-modal-close" onClick={onClose}>✕</button>

        <div className="placa-modal-header">
          <div className="placa-modal-icon">🪪</div>
          <h2>Placa oficial Petfy</h2>
          <p>Mascota: <strong>{mascota.nom_mascota}</strong></p>
        </div>

        {vista === "cargando" && <div className="placa-modal-loading">Cargando…</div>}

        {vista === "sin-placa" && (
          <>
            <p className="placa-modal-desc">
              Ingresa el código de tu placa Petfy. Lo encuentras grabado en el reverso de la placa, debajo del QR.
            </p>
            <input
              type="text"
              className="placa-modal-input"
              placeholder="Ej: ZLBHL4"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              maxLength={10}
              disabled={loading}
              autoFocus
            />
            {error && <div className="placa-modal-error">⚠️ {error}</div>}
            <button
              className="placa-modal-btn placa-modal-btn-primary"
              onClick={handleActivar}
              disabled={loading || !codigo.trim()}
            >
              {loading ? "Activando…" : "🔗 Activar placa"}
            </button>
          </>
        )}

        {vista === "con-placa" && placaCodigo && (
          <>
            <div className="placa-modal-success">✅ Placa activada</div>
            <div className="placa-modal-codigo">{placaCodigo}</div>
            <p className="placa-modal-desc">Tu URL pública es:</p>
            <div className="placa-modal-url">{urlPublica}</div>
            <button className="placa-modal-btn placa-modal-btn-secondary" onClick={handleCopiarUrl}>
              {urlCopiada ? "✅ ¡Copiado!" : "📋 Copiar link"}
            </button>
            <a
              className="placa-modal-btn placa-modal-btn-outline"
              href={`/p/${placaCodigo}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              👁 Ver perfil público
            </a>
            <button
              className="placa-modal-btn placa-modal-btn-danger"
              onClick={handleDesactivar}
              disabled={loading}
            >
              🗑️ Desactivar placa
            </button>
          </>
        )}
      </div>
    </div>
  );
}