// app/perfil/components/VistaFacturacion.tsx
"use client";

import { useEffect, useState } from "react";
import {
  facturacionAPI,
  sesion,
  FacturaResumen,
  FacturaCompleta,
} from "../../lib/api";

function fmt(n: number) {
  return "$" + n.toLocaleString("es-CO");
}

function fmtFecha(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

const ESTADOS: Record<number, { label: string; cls: string }> = {
  1: { label: "Emitida", cls: "badge-info" },
  2: { label: "Pagada", cls: "badge-success" },
  3: { label: "Anulada", cls: "badge-danger" },
  4: { label: "Vencida", cls: "badge-warn" },
};

export default function VistaFacturacion() {
  const [facturas, setFacturas] = useState<FacturaResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detalle, setDetalle] = useState<FacturaCompleta | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // ─── Fix #2: Lógica asíncrona fuera del effect ─────────────
  useEffect(() => {
    let cancelado = false;

    async function cargarFacturas() {
      const token = sesion.obtenerToken();
      if (!token) {
        if (!cancelado) {
          setError("Sesión expirada, vuelve a iniciar sesión");
          setLoading(false);
        }
        return;
      }
      try {
        const data = await facturacionAPI.listar(token);
        if (!cancelado) setFacturas(data);
      } catch (e: unknown) {
        if (!cancelado) {
          const msg = e instanceof Error ? e.message : "Error al cargar facturas";
          setError(msg);
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    cargarFacturas();
    return () => {
      cancelado = true;
    };
  }, []);

  // ─── Fix #3: Manejo correcto del error unknown ─────────────
  const verDetalle = async (id: number) => {
    const token = sesion.obtenerToken();
    if (!token) return;
    setLoadingDetalle(true);
    try {
      const data = await facturacionAPI.detalle(id, token);
      setDetalle(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al obtener detalle";
      alert(msg);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const descargarPDF = async (id: number, num: string) => {
    const token = sesion.obtenerToken();
    if (!token) return;
    try {
      await facturacionAPI.descargarPDF(id, token, num);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al descargar";
      alert(msg);
    }
  };

  return (
    <div className="perfil-vista active">
      <div className="perfil-section">
        <h3>💳 Facturación</h3>
        <p style={{ fontSize: "0.85rem", color: "#4B5563", marginBottom: "1rem" }}>
          Aquí encuentras el historial de tus pagos y facturas.
        </p>

        {loading && <p style={{ fontSize: "0.85rem" }}>Cargando facturas…</p>}
        {error && <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>⚠️ {error}</p>}

        {!loading && facturas.length === 0 && (
          <div className="perfil-empty">
            <i className="fas fa-file-invoice" style={{ fontSize: "2rem" }}></i>
            <p>Aún no tienes facturas</p>
            <small style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
              Cuando pagues un paseo, aparecerá aquí automáticamente.
            </small>
          </div>
        )}

        {facturas.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {facturas.map((f) => {
              const est = ESTADOS[f.id_est_fact ?? 1] || ESTADOS[1];
              return (
                <div
                  key={f.id_factura}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    background: "var(--white)",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: "140px" }}>
                    <strong style={{ display: "block", color: "var(--teal)", fontSize: "0.9rem" }}>
                      {f.num_factura}
                    </strong>
                    <small style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                      {fmtFecha(f.fecha_emision)}
                    </small>
                  </div>

                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.2rem 0.6rem",
                      borderRadius: "999px",
                      background:
                        est.cls === "badge-success" ? "#DCFCE7" :
                        est.cls === "badge-danger" ? "#FEE2E2" :
                        est.cls === "badge-warn" ? "#FEF3C7" : "#DBEAFE",
                      color:
                        est.cls === "badge-success" ? "#15803D" :
                        est.cls === "badge-danger" ? "#B91C1C" :
                        est.cls === "badge-warn" ? "#B45309" : "#1E40AF",
                    }}
                  >
                    {est.label}
                  </span>

                  <strong style={{ color: "var(--primary)", fontSize: "1rem", minWidth: "90px", textAlign: "right" }}>
                    {fmt(f.total)}
                  </strong>

                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      className="btn-perfil btn-outline"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.72rem" }}
                      onClick={() => verDetalle(f.id_factura)}
                      disabled={loadingDetalle}
                    >
                      Ver
                    </button>
                    <button
                      className="btn-perfil btn-primary"
                      style={{ padding: "0.35rem 0.7rem", fontSize: "0.72rem" }}
                      onClick={() => descargarPDF(f.id_factura, f.num_factura)}
                    >
                      <i className="fas fa-file-pdf" /> PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {detalle && (
        <div className="modal-overlay active" onClick={() => setDetalle(null)}>
          <div
            className="modal-container modal-mascota"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px" }}
          >
            <button className="modal-close-btn" onClick={() => setDetalle(null)}>
              &times;
            </button>

            {/* ─── Fix #1: loadingDetalle ahora se usa aquí ─── */}
            {loadingDetalle ? (
              <p style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-muted)" }}>
                Cargando detalle…
              </p>
            ) : (
              <>
                <h3 style={{ marginBottom: "0.5rem" }}>Factura {detalle.num_factura}</h3>
                <small style={{ color: "var(--text-muted)" }}>
                  Emitida: {fmtFecha(detalle.fecha_emision)} · Vence: {fmtFecha(detalle.fecha_vencimiento)}
                </small>

                <div style={{ marginTop: "1rem", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  <div><strong>Cliente:</strong> {detalle.nombre_cliente}</div>
                  <div><strong>Documento:</strong> {detalle.documento_cliente || "-"}</div>
                  <div><strong>Correo:</strong> {detalle.correo_cliente || "-"}</div>
                  <div><strong>Dirección:</strong> {detalle.direccion_cliente || "-"}</div>
                </div>

                <table style={{ width: "100%", marginTop: "1rem", fontSize: "0.78rem", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--teal)", color: "white" }}>
                      <th style={{ textAlign: "left", padding: "0.4rem" }}>Concepto</th>
                      <th style={{ padding: "0.4rem" }}>Cant.</th>
                      <th style={{ padding: "0.4rem" }}>Vr. Unit.</th>
                      <th style={{ padding: "0.4rem" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.detalles.map((d) => (
                      <tr key={d.id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "0.4rem" }}>{d.concepto}</td>
                        <td style={{ padding: "0.4rem", textAlign: "center" }}>{d.cantidad}</td>
                        <td style={{ padding: "0.4rem", textAlign: "right" }}>{fmt(d.precio_uni)}</td>
                        <td style={{ padding: "0.4rem", textAlign: "right" }}>{fmt(d.total_linea)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ marginTop: "0.8rem", textAlign: "right", fontSize: "0.85rem" }}>
                  <div>Subtotal: <strong>{fmt(detalle.sub_total)}</strong></div>
                  <div>IVA: <strong>{fmt(detalle.iva)}</strong></div>
                  <div style={{ fontSize: "1.05rem", color: "var(--primary)", marginTop: "0.3rem" }}>
                    Total: <strong>{fmt(detalle.total)} {detalle.moneda}</strong>
                  </div>
                </div>

                {detalle.pago && (
                  <div style={{ marginTop: "0.8rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <div><strong>Método:</strong> {detalle.pago.payment_method_type || "-"}</div>
                    {detalle.pago.card_last_four && (
                      <div><strong>Tarjeta:</strong> **** {detalle.pago.card_last_four}</div>
                    )}
                    {detalle.pago.bank_name && (
                      <div><strong>Banco:</strong> {detalle.pago.bank_name}</div>
                    )}
                    <div><strong>Ref. Wompi:</strong> {detalle.pago.id_trans_wompi || detalle.pago.ref_wompi}</div>
                  </div>
                )}

                <div className="pfa-actions" style={{ marginTop: "1.2rem" }}>
                  <button className="btn-perfil btn-outline" onClick={() => setDetalle(null)}>
                    Cerrar
                  </button>
                  <button
                    className="btn-perfil btn-primary"
                    onClick={() => descargarPDF(detalle.id_factura, detalle.num_factura)}
                  >
                    <i className="fas fa-file-pdf" /> Descargar PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}