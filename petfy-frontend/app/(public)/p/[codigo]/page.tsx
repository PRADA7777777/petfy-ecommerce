import { PetProfileClient } from "../../pet/[id]/PetProfileClient";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Resultado =
  | { ok: true; idMascota: number; motivo?: undefined }
  | { ok: false; motivo: "no-existe" | "no-activada" | "error-red" };

async function verificarPlaca(codigo: string): Promise<Resultado> {
  try {
    const res = await fetch(
      `${API_URL}/public/placas/${codigo.toUpperCase()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { ok: false, motivo: "no-existe" };
    const data = await res.json();
    if (data.estado !== "activo" || !data.id_mascota) {
      return { ok: false, motivo: "no-activada" };
    }
    return { ok: true, idMascota: data.id_mascota };
  } catch {
    return { ok: false, motivo: "error-red" };
  }
}

export default async function PetPageByCodigo({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const resultado = await verificarPlaca(codigo);

  if (!resultado.ok) {
    return (
      <div
        style={{
          maxWidth: 480,
          margin: "4rem auto",
          padding: "2rem 1.25rem",
          textAlign: "center",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 20,
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>🐾</div>
        <h2 style={{ margin: "0 0 0.5rem", color: "#111827", fontSize: "1.3rem" }}>
          {resultado.motivo === "no-existe" && "Código no válido"}
          {resultado.motivo === "no-activada" && "Esta placa aún no ha sido activada"}
          {resultado.motivo === "error-red" && "No pudimos cargar el perfil"}
        </h2>
        <p style={{ margin: "0 0 1.5rem", color: "#6b7280", fontSize: "0.9rem" }}>
          {resultado.motivo === "no-existe" &&
            `El código "${codigo}" no existe. Verifica la placa.`}
          {resultado.motivo === "no-activada" &&
            "Si acabas de comprar esta placa, actívala desde tu cuenta Petfy."}
          {resultado.motivo === "error-red" && "Revisa tu conexión e intenta de nuevo."}
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "#064f56",
            color: "#fff",
            padding: "0.85rem 1.25rem",
            borderRadius: 12,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Ir a Petfy
        </Link>
      </div>
    );
  }

  return <PetProfileClient id={String(resultado.idMascota)} />;
}