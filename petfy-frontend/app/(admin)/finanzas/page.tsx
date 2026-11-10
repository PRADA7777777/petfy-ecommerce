"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-admin";
import { Badge } from "@/components/Badge";
import { 
  CreditCard, FileText, Wallet, Search, CheckCircle2, XCircle, 
  Clock, AlertCircle, Download, Send, DollarSign
} from "lucide-react";
import { fmtCOP, fmtDateTime } from "@/lib/utils";
import { toast } from "sonner";
import "../styles/finanzas.css"; // <-- IMPORTAMOS EL CSS

type Tab = "pagos" | "facturas" | "devoluciones";

export default function FinanzasPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("pagos");
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("todos");
  const [page, setPage] = useState(1);

  const { data: kpis } = useQuery({ queryKey: ["finanzas-kpis"], queryFn: () => api.getKpisFinanzas() });

  const { data: pagos, isLoading: loadingPagos } = useQuery({ 
    queryKey: ["pagos", search, estado, page], 
    queryFn: () => api.getPagos({ search, estado, page }), 
    enabled: activeTab === "pagos" 
  });
  const { data: facturas, isLoading: loadingFacturas } = useQuery({ 
    queryKey: ["facturas", search, estado, page], 
    queryFn: () => api.getFacturas({ search, estado, page }), 
    enabled: activeTab === "facturas" 
  });
  const { data: devoluciones, isLoading: loadingDevoluciones } = useQuery({ 
    queryKey: ["devoluciones", search, estado, page], 
    queryFn: () => api.getDevoluciones({ search, estado, page }), 
    enabled: activeTab === "devoluciones" 
  });

  const mutDevolucion = useMutation({
    mutationFn: ({ id, estado }: { id: number; estado: number }) => api.cambiarEstadoDevolucion(id, estado),
    onSuccess: () => {
      toast.success("Estado de devolución actualizado");
      qc.invalidateQueries({ queryKey: ["devoluciones"] });
      qc.invalidateQueries({ queryKey: ["finanzas-kpis"] });
    },
  });

  return (
    <div className="finanzas-container">
      
      <div className="finanzas-header">
        <h2>Finanzas</h2>
        <p>Gestiona pagos, facturación y devoluciones</p>
      </div>

      {/* KPIs */}
      <div className="finanzas-kpi-grid">
        <div className="finanzas-kpi-card kpi-green">
          <div className="finanzas-kpi-content">
            <div>
              <p className="finanzas-kpi-title">Ingresos (aprobados)</p>
              <p className="finanzas-kpi-value">{fmtCOP(kpis?.ingresos_mes ?? 0)}</p>
            </div>
            <div className="finanzas-kpi-icon"><DollarSign size={20} /></div>
          </div>
        </div>
        <div className="finanzas-kpi-card kpi-amber">
          <div className="finanzas-kpi-content">
            <div>
              <p className="finanzas-kpi-title">Pendientes por cobrar</p>
              <p className="finanzas-kpi-value">{fmtCOP(kpis?.pendientes_mes ?? 0)}</p>
            </div>
            <div className="finanzas-kpi-icon"><Clock size={20} /></div>
          </div>
        </div>
        <div className="finanzas-kpi-card kpi-indigo">
          <div className="finanzas-kpi-content">
            <div>
              <p className="finanzas-kpi-title">Facturas emitidas</p>
              <p className="finanzas-kpi-value">{kpis?.facturas_emitidas ?? 0}</p>
            </div>
            <div className="finanzas-kpi-icon"><FileText size={20} /></div>
          </div>
        </div>
        <div className="finanzas-kpi-card kpi-red">
          <div className="finanzas-kpi-content">
            <div>
              <p className="finanzas-kpi-title">Devoluciones pendientes</p>
              <p className="finanzas-kpi-value">{kpis?.devoluciones_pendientes ?? 0}</p>
              <p className="finanzas-kpi-title" style={{ marginTop: '0.25rem' }}>{fmtCOP(kpis?.monto_devoluciones_pendientes ?? 0)}</p>
            </div>
            <div className="finanzas-kpi-icon"><AlertCircle size={20} /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="finanzas-tabs">
        {[
          { id: "pagos", label: "Pagos", icon: CreditCard },
          { id: "facturas", label: "Facturas", icon: FileText },
          { id: "devoluciones", label: "Devoluciones", icon: Wallet },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id as Tab); setPage(1); setEstado("todos"); setSearch(""); }}
            className={`finanzas-tab ${activeTab === id ? "active" : ""}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="finanzas-filters">
        <div className="finanzas-search-wrapper">
          <Search className="finanzas-search-icon" size={16} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por cliente, referencia o factura…"
            className="finanzas-search-input"
          />
        </div>
        <select value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} className="finanzas-select">
          <option value="todos">Todos los estados</option>
          {activeTab === "pagos" && <>
            <option value="1">Pendiente</option>
            <option value="2">Aprobado</option>
            <option value="3">Rechazado</option>
            <option value="4">Reembolsado</option>
          </>}
          {activeTab === "facturas" && <>
            <option value="1">Emitida</option>
            <option value="2">Pagada</option>
            <option value="3">Anulada</option>
            <option value="4">Vencida</option>
          </>}
          {activeTab === "devoluciones" && <>
            <option value="1">Solicitada</option>
            <option value="2">En Proceso</option>
            <option value="3">Procesada</option>
            <option value="4">Rechazada</option>
          </>}
        </select>
      </div>

      {/* TAB PAGOS */}
      {activeTab === "pagos" && (
        <div className="finanzas-table-container">
          <table className="finanzas-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Ref Wompi</th>
                <th>Cliente</th>
                <th>Método</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loadingPagos && <tr><td colSpan={6} className="finanzas-empty">Cargando…</td></tr>}
              {(pagos?.data ?? []).map((p: any) => (
                <tr key={p.id_pago}>
                  <td>{fmtDateTime(p.fecha_pago)}</td>
                  <td style={{ fontWeight: 600 }}>{fmtCOP(p.monto)}</td>
                  <td><code className="finanzas-code">{p.ref_wompi ?? "—"}</code></td>
                  <td>{p.customer_email ?? "—"}</td>
                  <td>
                    {p.payment_method_type ?? p.metodo?.nom_metodo ?? "—"}
                    {p.card_last_four && <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block' }}>**** {p.card_last_four}</span>}
                  </td>
                  <td>
                    <Badge color={p.id_estado_pago === 2 ? "green" : p.id_estado_pago === 1 ? "yellow" : p.id_estado_pago === 4 ? "blue" : "red"}>
                      {p.wompi_status ?? "—"}
                    </Badge>
                  </td>
                </tr>
              ))}
              {!loadingPagos && pagos?.data.length === 0 && (
                <tr><td colSpan={6} className="finanzas-empty">Sin pagos registrados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB FACTURAS */}
      {activeTab === "facturas" && (
        <div className="finanzas-table-container">
          <table className="finanzas-table">
            <thead>
              <tr>
                <th>N° Factura</th>
                <th>Emisión</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingFacturas && <tr><td colSpan={6} className="finanzas-empty">Cargando…</td></tr>}
              {(facturas?.data ?? []).map((f: any) => (
                <tr key={f.id_factura}>
                  <td>
                    <div style={{ fontWeight: 500, color: '#111827' }}>{f.num_factura}</div>
                    {f.cufe && <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>CUFE: {f.cufe.slice(0, 12)}…</div>}
                  </td>
                  <td>{fmtDateTime(f.fecha_emision)}</td>
                  <td>
                    <div style={{ color: '#111827' }}>{f.nombre_cliente ?? "—"}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{f.correo_cliente ?? ""}</div>
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmtCOP(f.total)}</td>
                  <td>
                    <Badge color={f.id_est_fact === 2 ? "green" : f.id_est_fact === 3 ? "red" : f.id_est_fact === 4 ? "yellow" : "indigo"}>
                      {f.estado?.nom_est_fact ?? "—"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      <button onClick={() => toast.info("Descarga de PDF en desarrollo")} style={{ padding: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }} title="Descargar PDF">
                        <Download size={16} />
                      </button>
                      <button onClick={() => toast.success(`Factura enviada a ${f.correo_cliente}`)} style={{ padding: '0.375rem', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }} title="Enviar por correo">
                        <Send size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loadingFacturas && facturas?.data.length === 0 && (
                <tr><td colSpan={6} className="finanzas-empty">Sin facturas emitidas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB DEVOLUCIONES */}
      {activeTab === "devoluciones" && (
        <div className="finanzas-table-container">
          <table className="finanzas-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Motivo</th>
                <th>Ref Wompi</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingDevoluciones && <tr><td colSpan={6} className="finanzas-empty">Cargando…</td></tr>}
              {(devoluciones?.data ?? []).map((d: any) => (
                <tr key={d.id_devolucion}>
                  <td>{fmtDateTime(d.fecha_solicitud)}</td>
                  <td style={{ fontWeight: 600 }}>{fmtCOP(d.monto)}</td>
                  <td>{d.motivo ?? "—"}</td>
                  <td><code className="finanzas-code">{d.ref_wompi_dev ?? "—"}</code></td>
                  <td>
                    <Badge color={d.id_est_devo === 3 ? "green" : d.id_est_devo === 4 ? "red" : d.id_est_devo === 2 ? "blue" : "yellow"}>
                      {d.estado?.nom_est_devo ?? "—"}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {(d.id_est_devo === 1 || d.id_est_devo === 2) && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button
                          onClick={() => mutDevolucion.mutate({ id: d.id_devolucion, estado: 3 })}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f0fdf4', color: '#15803d', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <CheckCircle2 size={12} /> Aprobar
                        </button>
                        <button
                          onClick={() => mutDevolucion.mutate({ id: d.id_devolucion, estado: 4 })}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '4px', border: 'none', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <XCircle size={12} /> Rechazar
                        </button>
                      </div>
                    )}
                    {(d.id_est_devo === 3 || d.id_est_devo === 4) && (
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Procesada</span>
                    )}
                  </td>
                </tr>
              ))}
              {!loadingDevoluciones && devoluciones?.data.length === 0 && (
                <tr><td colSpan={6} className="finanzas-empty">Sin devoluciones registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}