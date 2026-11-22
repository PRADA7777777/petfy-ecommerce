"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { placasAdminAPI } from "@/lib/placas-admin";
import { Badge } from "@/components/Badge";
import { toast } from "sonner";
import {
  Tag, Plus, Download, Search, X, TagIcon,
  CheckCircle2, AlertCircle, Ban,
} from "lucide-react";
import "../styles/placas.css";

type TabEstado = "todos" | "disponible" | "activo" | "suspendido";

export default function PlacasAdminPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [estado, setEstado] = useState<TabEstado>("todos");
  const [lote, setLote] = useState("");
  const [search, setSearch] = useState("");
  const [showGenerar, setShowGenerar] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["placas-stats"],
    queryFn: () => placasAdminAPI.stats(),
  });

  const { data: lista, isLoading } = useQuery({
    queryKey: ["placas-lista", page, estado, lote, search],
    queryFn: () => placasAdminAPI.listar({ page, pageSize: 20, estado, lote, search }),
  });

  const mutSuspender = useMutation({
    mutationFn: (codigo: string) => placasAdminAPI.suspender(codigo),
    onSuccess: () => {
      toast.success("Placa suspendida");
      qc.invalidateQueries({ queryKey: ["placas-lista"] });
      qc.invalidateQueries({ queryKey: ["placas-stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const mutReactivar = useMutation({
    mutationFn: (codigo: string) => placasAdminAPI.reactivar(codigo),
    onSuccess: () => {
      toast.success("Placa reactivada");
      qc.invalidateQueries({ queryKey: ["placas-lista"] });
      qc.invalidateQueries({ queryKey: ["placas-stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleExport = async () => {
    try {
      await placasAdminAPI.exportarCSV(estado, lote);
      toast.success("CSV descargado");
    } catch {
      toast.error("No se pudo exportar");
    }
  };

  const fmtFecha = (iso: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const totalPages = Math.ceil((lista?.total ?? 0) / 20);

  return (
    <div className="placas-container">
      <div className="placas-header">
        <div>
          <h2>Placas NFC / QR</h2>
          <p>Gestiona el inventario de placas Petfy</p>
        </div>
        <div className="placas-header-actions">
          <button className="placas-btn placas-btn-outline" onClick={handleExport}>
            <Download size={16} /> Exportar CSV
          </button>
          <button className="placas-btn placas-btn-primary" onClick={() => setShowGenerar(true)}>
            <Plus size={16} /> Generar lote
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="placas-kpis">
        <div className="placas-kpi kpi-total">
          <div className="placas-kpi-icon"><Tag size={20} /></div>
          <div>
            <span className="placas-kpi-label">Total</span>
            <span className="placas-kpi-value">{stats?.total ?? 0}</span>
          </div>
        </div>
        <div className="placas-kpi kpi-disponibles">
          <div className="placas-kpi-icon"><TagIcon size={20} /></div>
          <div>
            <span className="placas-kpi-label">Disponibles</span>
            <span className="placas-kpi-value">{stats?.disponibles ?? 0}</span>
          </div>
        </div>
        <div className="placas-kpi kpi-activas">
          <div className="placas-kpi-icon"><CheckCircle2 size={20} /></div>
          <div>
            <span className="placas-kpi-label">Activas</span>
            <span className="placas-kpi-value">{stats?.activas ?? 0}</span>
          </div>
        </div>
        <div className="placas-kpi kpi-suspendidas">
          <div className="placas-kpi-icon"><Ban size={20} /></div>
          <div>
            <span className="placas-kpi-label">Suspendidas</span>
            <span className="placas-kpi-value">{stats?.suspendidas ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="placas-filtros">
        <div className="placas-tabs">
          {(["todos", "disponible", "activo", "suspendido"] as TabEstado[]).map((t) => (
            <button
              key={t}
              className={`placas-tab ${estado === t ? "active" : ""}`}
              onClick={() => { setEstado(t); setPage(1); }}
            >
              {t === "todos" && "Todos"}
              {t === "disponible" && "Disponibles"}
              {t === "activo" && "Activas"}
              {t === "suspendido" && "Suspendidas"}
            </button>
          ))}
        </div>
        <div className="placas-search">
          <Search size={16} className="placas-search-icon" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar código…"
            className="placas-search-input"
          />
        </div>
        <input
          value={lote}
          onChange={(e) => { setLote(e.target.value); setPage(1); }}
          placeholder="Filtrar por lote…"
          className="placas-input-lote"
        />
      </div>

      {/* Tabla */}
      <div className="placas-tabla-wrapper">
        <table className="placas-tabla">
          <thead>
            <tr>
              <th>Código</th>
              <th>Estado</th>
              <th>Lote</th>
              <th>Material</th>
              <th>Mascota</th>
              <th>Generación</th>
              <th>Activación</th>
              <th style={{ textAlign: "right" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="placas-empty">Cargando…</td></tr>
            )}
            {!isLoading && (lista?.data ?? []).length === 0 && (
              <tr><td colSpan={8} className="placas-empty">No hay placas con este filtro.</td></tr>
            )}
            {!isLoading && (lista?.data ?? []).map((p) => (
              <tr key={p.id_placa}>
                <td>
                  <code className="placas-codigo">{p.codigo}</code>
                </td>
                <td>
                  <Badge color={
                    p.estado === "activo" ? "green"
                    : p.estado === "disponible" ? "blue"
                    : p.estado === "suspendido" ? "red"
                    : "gray"
                  }>
                    {p.estado === "activo" && "Activa"}
                    {p.estado === "disponible" && "Disponible"}
                    {p.estado === "suspendido" && "Suspendida"}
                    {p.estado === "perdida" && "Perdida"}
                  </Badge>
                </td>
                <td className="placas-text-muted">{p.lote ?? "—"}</td>
                <td className="placas-text-muted">{p.material ?? "—"}</td>
                <td>
                  {p.nom_mascota ? (
                    <div>
                      <div className="placas-mascota-nombre">{p.nom_mascota}</div>
                      <div className="placas-mascota-dueno">{p.nom_dueno ?? ""}</div>
                    </div>
                  ) : (
                    <span className="placas-text-muted">—</span>
                  )}
                </td>
                <td className="placas-text-muted">{fmtFecha(p.fecha_generacion)}</td>
                <td className="placas-text-muted">{fmtFecha(p.fecha_activacion)}</td>
                <td style={{ textAlign: "right" }}>
                  <div className="placas-acciones">
                    {p.estado === "suspendido" ? (
                      <button
                        className="placas-accion-btn accion-reactivar"
                        onClick={() => mutReactivar.mutate(p.codigo)}
                        title="Reactivar"
                      >
                        <CheckCircle2 size={14} /> Reactivar
                      </button>
                    ) : (
                      <button
                        className="placas-accion-btn accion-suspender"
                        onClick={() => {
                          if (confirm(`¿Suspender la placa ${p.codigo}?`))
                            mutSuspender.mutate(p.codigo);
                        }}
                        title="Suspender"
                      >
                        <AlertCircle size={14} /> Suspender
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="placas-paginacion">
        <span>
          {lista?.total ?? 0} placas · página {page} de {Math.max(1, totalPages)}
        </span>
        <div className="placas-pag-btns">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="placas-pag-btn"
          >
            Anterior
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="placas-pag-btn"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal Generar */}
      {showGenerar && (
        <GenerarLoteModal
          onClose={() => setShowGenerar(false)}
          onSuccess={(codigos) => {
            toast.success(`Se generaron ${codigos.length} códigos`);
            qc.invalidateQueries({ queryKey: ["placas-lista"] });
            qc.invalidateQueries({ queryKey: ["placas-stats"] });
            setShowGenerar(false);
          }}
        />
      )}
    </div>
  );
}

function GenerarLoteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (codigos: string[]) => void }) {
  const [cantidad, setCantidad] = useState(100);
  const [lote, setLote] = useState("");
  const [material, setMaterial] = useState("acero");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigosGenerados, setCodigosGenerados] = useState<string[] | null>(null);

  const handleGenerar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await placasAdminAPI.generar({ cantidad, lote: lote || undefined, material });
      setCodigosGenerados(res.codigos);
    } catch (e: any) {
      setError(e.message || "Error al generar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="placas-modal-backdrop" onClick={onClose}>
      <div className="placas-modal" onClick={(e) => e.stopPropagation()}>
        <button className="placas-modal-close" onClick={onClose}><X size={18} /></button>

        <h2 className="placas-modal-title">Generar lote de placas</h2>

        {!codigosGenerados ? (
          <>
            <label className="placas-field">
              <span>Cantidad (1-500)</span>
              <input
                type="number"
                min={1}
                max={500}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                disabled={loading}
              />
            </label>
            <label className="placas-field">
              <span>Lote (opcional)</span>
              <input
                type="text"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                placeholder="Ej: LOTE-2024-001"
                disabled={loading}
              />
            </label>
            <label className="placas-field">
              <span>Material</span>
              <select value={material} onChange={(e) => setMaterial(e.target.value)} disabled={loading}>
                <option value="acero">Acero inoxidable</option>
                <option value="acrilico">Acrílico</option>
                <option value="silicona">Silicona</option>
                <option value="mixto">Mixto</option>
              </select>
            </label>
            {error && <div className="placas-error">⚠️ {error}</div>}
            <button
              className="placas-btn placas-btn-primary placas-btn-full"
              onClick={handleGenerar}
              disabled={loading}
            >
              {loading ? "Generando…" : `Generar ${cantidad} códigos`}
            </button>
          </>
        ) : (
          <>
            <div className="placas-success">✅ Se generaron {codigosGenerados.length} códigos</div>
            <p className="placas-modal-desc">Códigos creados:</p>
            <div className="placas-codigos-preview">
              {codigosGenerados.slice(0, 50).map((c) => (
                <code key={c}>{c}</code>
              ))}
              {codigosGenerados.length > 50 && (
                <span className="placas-mas">+{codigosGenerados.length - 50} más…</span>
              )}
            </div>
            <button
              className="placas-btn placas-btn-primary placas-btn-full"
              onClick={() => onSuccess(codigosGenerados)}
            >
              ✅ Listo
            </button>
          </>
        )}
      </div>
    </div>
  );
}