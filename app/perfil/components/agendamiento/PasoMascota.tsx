// app/perfil/components/agendamiento/PasoMascota.tsx
"use client";

import { Mascota } from "../../../lib/api";

interface Props {
  mascotas: Mascota[];
  selected: number | null;
  onChange: (id: number) => void;
  onNext: () => void;
}

export default function PasoMascota({
  mascotas,
  selected,
  onChange,
  onNext,
}: Props) {
  const sinMascotas = mascotas.length === 0;

  return (
    <>
      <h2 className="pfa-title">¿Para cuál de tus mascotas?</h2>
      <p className="pfa-sub">
        {sinMascotas
          ? "Todavía no tienes mascotas registradas."
          : "Elige a quién le agendamos el paseo."}
      </p>

      {sinMascotas ? (
        <div className="perfil-empty" style={{ margin: "1.5rem 0" }}>
          <i className="fas fa-paw" style={{ fontSize: "2rem" }}></i>
          <p>No tienes mascotas aún</p>
          <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
            Cierra este panel y regístrala desde Mis Mascotas
          </small>
        </div>
      ) : (
        <div className="pfa-mascotas-grid">
          {mascotas.map((m) => (
            <button
              key={m.id_mascota}
              type="button"
              className={`pfa-mascota-card ${selected === m.id_mascota ? "pfa-selected" : ""}`}
              onClick={() => onChange(m.id_mascota)}
            >
              <div className="pfa-mascota-avatar">
                {m.img_masc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.img_masc} alt={m.nom_mascota} />
                ) : (
                  <span>🐕</span>
                )}
              </div>
              <div className="pfa-mascota-info">
                <strong>{m.nom_mascota}</strong>
                <small>{m.nom_raza || m.raza || "Sin raza"}</small>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="pfa-actions">
        <span />
        <button
          className="btn-perfil btn-primary"
          onClick={onNext}
          disabled={!selected || sinMascotas}
        >
          Continuar
        </button>
      </div>
    </>
  );
}