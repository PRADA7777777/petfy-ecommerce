$petProfilePath = "$((Get-Location).Path)\petfy-frontend\app\(public)\pet\[id]\PetProfileClient.tsx"

$petContent = @'
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mascotasAPI, MascotaPublica } from "@/lib/api";
import "./pet-profile.css";

function normalizarTelefonoWA(tel: string | null | undefined): string {
  if (!tel) return "";
  let digits = tel.replace(/\D/g, "");
  if (digits.startsWith("57") && digits.length === 12) return digits;
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return "57" + digits;
  return digits;
}

function fmtFechaPerdida(iso: string | null | undefined): string {
  if (!iso) return "recientemente";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "recientemente";
  }
}

export function PetProfileClient({ id }: { id: string }) {
  const [pet, setPet] = useState<MascotaPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      try {
        const data = await mascotasAPI.publica(id);
        if (!cancelled) setPet(data);
      } catch {
        if (!cancelled) setPet(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    cargar();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (pet) {
      document.title = pet.modo_perdido
        ? `¡Se busca a ${pet.nom_mascota}! · Petfy`
        : `¡Encontraste a ${pet.nom_mascota}! · Petfy`;
    }
  }, [pet]);

  const compartirUbicacion = () => {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://maps.google.com/?q=${latitude},${longitude}`;
        const tel = normalizarTelefonoWA(pet?.telefono_dueno);
        const msg = `¡Hola! Encontré a ${pet?.nom_mascota}. Estoy en: ${link}`;
        if (tel) {
          window.open(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`, "_blank");
        } else {
          navigator.clipboard.writeText(link);
          alert(`📍 Ubicación copiada: ${link}`);
        }
        setGeoStatus("ok");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loading) {
    return (
      <div className="petp-loading">
        <div className="petp-spinner" />
        <span>Cargando…</span>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="petp-error">
        <div className="petp-error-icon">🐾</div>
        <h2>Perfil no disponible</h2>
        <p>Este chip NFC no está activado o la mascota fue desregistrada.</p>
        <Link href="/" className="petp-btn petp-btn-primary">
          Ir a Petfy
        </Link>
      </div>
    );
  }

  const telWA = normalizarTelefonoWA(pet.telefono_dueno);
  const tieneTel = telWA.length >= 12;
  const waMsg = encodeURIComponent(
    pet.modo_perdido
      ? `¡Hola! Vi el cartel de ${pet.nom_mascota}. Creo que lo/a encontré.`
      : `¡Hola! Encontré a ${pet.nom_mascota}. ¿Puedes venir por él/ella?`
  );

  return (
    <div className="petp-wrapper">
      {/* Alerta perdido (datos REALES de la BD) */}
      {pet.modo_perdido && (
        <div className="petp-alert-perdido">
          <span className="petp-alert-icon">🚨</span>
          <div>
            <strong>ESTA MASCOTA ESTÁ PERDIDA</strong>
            <p>
              Desapareció el {fmtFechaPerdida(pet.fecha_perdida)}
              {pet.ultima_ubicacion && ` en ${pet.ultima_ubicacion}`}.
            </p>
            {pet.mensaje_perdido && (
              <p style={{ marginTop: "0.4rem", fontStyle: "italic" }}>
                "{pet.mensaje_perdido}"
              </p>
            )}
            {pet.recompensa && (
              <div className="petp-recompensa">
                💰 Recompensa: <strong>{pet.recompensa}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="petp-hero">
        <div className="petp-hero-img-wrap">
          {pet.img_masc ? (
            <img src={pet.img_masc} alt={pet.nom_mascota} className="petp-hero-img" />
          ) : (
            <div className="petp-hero-img-placeholder">🐶</div>
          )}
          <span className="petp-badge-float">
            {pet.modo_perdido ? "🚨 PERDIDA" : "🐾 Chip Petfy"}
          </span>
        </div>
        <div className="petp-hero-info">
          <p className="petp-saludo">¡Hola! Me llamo</p>
          <h1 className="petp-nombre">{pet.nom_mascota}</h1>
          <div className="petp-meta">
            {pet.raza && <span className="petp-meta-item">{pet.raza}</span>}
            {pet.edad != null && <span className="petp-meta-item">🎂 {pet.edad} años</span>}
          </div>
          {pet.nombre_dueno && (
            <p className="petp-dueno">Mi familia: <strong>{pet.nombre_dueno}</strong></p>
          )}
        </div>
      </div>

      <div className="petp-contacto-card">
        <h2 className="petp-contacto-titulo">
          {pet.modo_perdido ? "¿Me viste? ¡Llama a mi familia! 🚨" : "¿Me encontraste? Contáctame 🐾"}
        </h2>
        <div className="petp-contacto-btns">
          {tieneTel ? (
            <>
              <a href={`tel:+${telWA}`} className="petp-btn petp-btn-call">
                📞 Llamar a mi familia
              </a>
              <a
                href={`https://wa.me/${telWA}?text=${waMsg}`}
                target="_blank"
                rel="noopener noreferrer"
                className="petp-btn petp-btn-wa"
              >
                💬 WhatsApp
              </a>
            </>
          ) : (
            <div className="petp-sin-tel">
              El dueño aún no ha activado el contacto público.
            </div>
          )}
        </div>
        <button
          className="petp-btn petp-btn-location"
          onClick={compartirUbicacion}
          disabled={geoStatus === "loading" || !tieneTel}
        >
          {geoStatus === "loading" && "📍 Obteniendo ubicación…"}
          {geoStatus === "ok" && "✅ Ubicación compartida"}
          {geoStatus === "error" && "⚠️ No pudimos obtener ubicación"}
          {geoStatus === "idle" && "📍 Compartir mi ubicación"}
        </button>
        <p className="petp-hint">
          Esto abrirá WhatsApp con un mapa del lugar donde estás.
        </p>
      </div>

      {pet.condicion_medica && (
        <div className="petp-alert-medica">
          <span className="petp-alert-medica-icon">⚠️</span>
          <div>
            <strong>Cuidado, tengo una condición médica:</strong>
            <p>{pet.condicion_medica}</p>
          </div>
        </div>
      )}

      {pet.comportamiento && (
        <div className="petp-section">
          <h2 className="petp-section-title">Mi carácter</h2>
          <p className="petp-comportamiento">🐕 {pet.comportamiento}</p>
        </div>
      )}

      {pet.otras_indicaciones && (
        <div className="petp-section">
          <h2 className="petp-section-title">Notas de mi familia</h2>
          <p className="petp-bio">{pet.otras_indicaciones}</p>
        </div>
      )}

      <div className="petp-brand">
        <span>Chip NFC registrado en <strong>Petfy</strong> · petfy.com.co</span>
      </div>
    </div>
  );
}
'@
[IO.File]::WriteAllText($petProfilePath, $petContent, $utf8)
Write-Host "✅ PetProfileClient.tsx actualizado" -ForegroundColor Green