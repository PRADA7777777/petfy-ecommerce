"use client";

import { useEffect, useMemo, useState } from "react";
import { paseosAPI, sesion, CitaResumen, CodigoPaseo } from "@/lib/api";

const ESTADO_CONFIRMADA = 2;

const hoyISO = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};

/** Código de 4 dígitos que el dueño entrega al paseador para iniciar el paseo de hoy */
export default function CodigoPaseoHoy({ citas }: { citas: CitaResumen[] }) {
  const [codigos, setCodigos] = useState<Record<number, CodigoPaseo>>({});

  const citasHoy = useMemo(
    () => citas.filter((c) => c.fecha === hoyISO() && c.id_estado === ESTADO_CONFIRMADA),
    [citas]
  );

  useEffect(() => {
    const token = sesion.obtenerToken();
    if (!token || citasHoy.length === 0) return;
    Promise.all(citasHoy.map((c) => paseosAPI.codigo(c.id_cita, token).catch(() => null))).then((lista) => {
      const porCita: Record<number, CodigoPaseo> = {};
      lista.forEach((cod) => { if (cod && !cod.usado) porCita[cod.id_cita] = cod; });
      setCodigos(porCita);
    });
  }, [citasHoy]);

  const conCodigo = citasHoy.filter((c) => codigos[c.id_cita]);
  if (conCodigo.length === 0) return null;

  const compartir = (c: CitaResumen) => {
    const texto = `El código para entregar a ${c.nom_mascota} al paseador de Petfy hoy es: ${codigos[c.id_cita].codigo}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="vp-card-hoy">
      <div className="vp-hoy-badge">CÓDIGO</div>
      <h4>Código para tu paseo de hoy</h4>
      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", margin: "-0.4rem 0 0.8rem" }}>
        Dáselo al paseador cuando llegue por tu mascota.
      </p>
      <div className="vp-hoy-lista">
        {conCodigo.map((c) => (
          <div key={c.id_cita} className="vp-hoy-item" style={{ flexWrap: "wrap" }}>
            <div className="vp-hoy-info" style={{ flex: 1 }}>
              <strong>{c.nom_mascota}</strong>
              <span>{c.hora?.slice(0, 5)}</span>
            </div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "1.6rem", letterSpacing: "6px", color: "var(--teal)" }}>
              {codigos[c.id_cita].codigo}
            </div>
            <button type="button" className="btn-whatsapp-vp" style={{ width: "100%", marginTop: "0.4rem" }} onClick={() => compartir(c)}>
              <i className="fab fa-whatsapp"></i> Compartir código
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
