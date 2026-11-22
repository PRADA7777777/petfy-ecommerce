"use client";

import { Mascota } from "@/lib/api";

interface CartelPerdidoProps {
  mascota: Mascota;
  idRef: React.RefObject<HTMLDivElement | null>;
  nombreDueno?: string;
  telefonoDueno?: string;
  codigoPlaca?: string | null;
}

export function CartelPerdido({
  mascota,
  idRef,
  nombreDueno = "su familia",
  telefonoDueno = "",
  codigoPlaca = null,
}: CartelPerdidoProps) {
  const fmtFecha = (iso: string | null | undefined) => {
    if (!iso) return "recientemente";
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
  };

  const telLimpio = telefonoDueno?.replace(/\D/g, "") || "";
  const urlPublica = codigoPlaca
    ? `petfy.com.co/p/${codigoPlaca}`
    : `petfy.com.co/pet/${mascota.id_mascota}`;

  return (
    <div
      ref={idRef}
      style={{
        width: 540,
        background: "#ffffff",
        borderRadius: 24,
        overflow: "hidden",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
      }}
    >
      {/* Header rojo con "SE BUSCA" */}
      <div
        style={{
          background: "linear-gradient(135deg, #dc2626, #b91c1c)",
          padding: "22px 20px 18px",
          textAlign: "center",
          color: "#ffffff",
        }}
      >
        <div style={{ fontSize: 34, lineHeight: 1, marginBottom: 6 }}>🚨</div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 3,
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          Se Busca
        </div>
        <div
          style={{
            fontSize: 14,
            marginTop: 6,
            opacity: 0.9,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Mascota perdida
        </div>
      </div>

      {/* Foto */}
      <div style={{ padding: 20, paddingBottom: 0 }}>
        {mascota.img_masc ? (
          <img
            src={mascota.img_masc}
            alt={mascota.nom_mascota}
            style={{
              width: "100%",
              height: 320,
              objectFit: "cover",
              borderRadius: 16,
              display: "block",
              border: "4px solid #fef3c7",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: 320,
              background: "#f3f4f6",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 120,
              border: "4px solid #fef3c7",
            }}
          >
            🐕
          </div>
        )}
      </div>

      {/* Nombre y datos */}
      <div style={{ padding: "18px 24px 0", textAlign: "center" }}>
        <div
          style={{
            fontSize: 42,
            fontWeight: 900,
            color: "#064f56",
            lineHeight: 1.05,
            letterSpacing: -1,
          }}
        >
          {mascota.nom_mascota}
        </div>
        <div
          style={{
            fontSize: 15,
            color: "#6b7280",
            marginTop: 6,
            fontWeight: 600,
          }}
        >
          {[mascota.nom_raza || mascota.raza, mascota.edad ? `${mascota.edad} años` : null, mascota.peso ? `${mascota.peso} kg` : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>

      {/* Info perdido */}
      <div style={{ padding: "18px 24px 0" }}>
        <div
          style={{
            background: "#fff7ed",
            borderLeft: "4px solid #ea580c",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 14,
            color: "#7c2d12",
            lineHeight: 1.5,
          }}
        >
          <strong>Desapareció el {fmtFecha(mascota.fecha_perdida)}</strong>
          {mascota.ultima_ubicacion && (
            <div style={{ marginTop: 4 }}>📍 Última vez visto en: <strong>{mascota.ultima_ubicacion}</strong></div>
          )}
        </div>
      </div>

      {/* Mensaje del dueño */}
      {mascota.mensaje_perdido && (
        <div style={{ padding: "14px 24px 0" }}>
          <div
            style={{
              background: "#f4fbfa",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
              color: "#374151",
              lineHeight: 1.55,
              fontStyle: "italic",
            }}
          >
            "{mascota.mensaje_perdido}"
          </div>
        </div>
      )}

      {/* Recompensa */}
      {mascota.recompensa && (
        <div style={{ padding: "14px 24px 0", textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #ea9200, #ca8a04)",
              color: "#ffffff",
              padding: "10px 24px",
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            💰 Recompensa: {mascota.recompensa}
          </div>
        </div>
      )}

      {/* Contacto */}
      <div style={{ padding: "22px 24px 0", textAlign: "center" }}>
        <div
          style={{
            background: "#064f56",
            color: "#ffffff",
            padding: "14px 20px",
            borderRadius: 14,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.75, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
            Si la ves, llama
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
            📞 {nombreDueno}
          </div>
          {telLimpio && (
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, letterSpacing: 1 }}>
              {telLimpio.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}
            </div>
          )}
        </div>
      </div>

      {/* URL pública */}
      <div style={{ padding: "18px 24px 22px", textAlign: "center" }}>
        <div
          style={{
            fontSize: 11,
            color: "#9ca3af",
            letterSpacing: 1,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Más información en
        </div>
        <div
          style={{
            fontSize: 15,
            color: "#ea580c",
            fontWeight: 800,
            marginTop: 4,
            fontFamily: "Courier New, monospace",
          }}
        >
          {urlPublica}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#9ca3af",
          }}
        >
          🐾 Chip NFC registrado en Petfy
        </div>
      </div>
    </div>
  );
}