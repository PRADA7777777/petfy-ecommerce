"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-admin";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fmtDate } from "@/lib/utils";

type SubVista = "dia" | "semana" | "mes";

const HORAS = Array.from({ length: 15 }, (_, i) => (i + 6).toString().padStart(2, "0"));
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function AgendaView() {
  const [subVista, setSubVista] = useState<SubVista>("dia");
  const [fechaBase, setFechaBase] = useState(new Date().toISOString().split("T")[0]);

  const getRango = () => {
    const base = new Date(fechaBase + "T12:00:00");
    if (subVista === "dia") return { inicio: fechaBase, fin: fechaBase };
    if (subVista === "semana") {
      const inicio = new Date(base);
      inicio.setDate(base.getDate() - ((base.getDay() + 6) % 7));
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      return { inicio: inicio.toISOString().split("T")[0], fin: fin.toISOString().split("T")[0] };
    }
    const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
    const fin = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return { inicio: inicio.toISOString().split("T")[0], fin: fin.toISOString().split("T")[0] };
  };

  const { inicio, fin } = getRango();

  const { data, isLoading } = useQuery({
    queryKey: ["agenda", inicio, fin],
    queryFn: () => api.getAgenda(inicio, fin),
  });

  const navegar = (dir: -1 | 1) => {
    const d = new Date(fechaBase + "T12:00:00");
    if (subVista === "dia") d.setDate(d.getDate() + dir);
    else if (subVista === "semana") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setFechaBase(d.toISOString().split("T")[0]);
  };

  const citas = data?.citas ?? [];
  const porDia = data?.porDia ?? {};

  const paseadores = Array.from(
    new Map(citas.filter((c: any) => c.id_usuario_paseador).map((c: any) => [c.id_usuario_paseador, c.paseador])).values()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="agenda-controls">
        <div className="agenda-view-switch">
          {(["dia", "semana", "mes"] as SubVista[]).map((v) => (
            <button key={v} onClick={() => setSubVista(v)} className={`agenda-view-btn ${subVista === v ? "active" : ""}`}>
              {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>

        <div className="agenda-nav-group">
          <button onClick={() => navegar(-1)} className="agenda-nav-btn"><ChevronLeft size={16} /></button>
          <span className="agenda-date-label">
            {subVista === "dia" && fmtDate(fechaBase)}
            {subVista === "semana" && `${fmtDate(inicio)} — ${fmtDate(fin)}`}
            {subVista === "mes" && new Date(fechaBase + "T12:00:00").toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => navegar(1)} className="agenda-nav-btn"><ChevronRight size={16} /></button>
          <button onClick={() => setFechaBase(new Date().toISOString().split("T")[0])} className="agenda-today-btn">Hoy</button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb' }}>Cargando agenda…</div>
      ) : (
        <>
          {subVista === "dia" && (
            <div className="agenda-table-wrapper">
              <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <h3 style={{ fontWeight: 600, color: '#111827', margin: 0, fontSize: '0.95rem' }}>{citas.length} paseos programados</h3>
              </div>
              {paseadores.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Sin paseos asignados este día.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="agenda-table">
                    <thead>
                      <tr>
                        <th style={{ width: '64px' }}>Hora</th>
                        {paseadores.map((p: any) => (
                          <th key={p.id_usuario} style={{ borderLeft: '1px solid #e5e7eb' }}>{p.nombre} {p.apellido}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HORAS.map((hora) => (
                        <tr key={hora}>
                          <td style={{ color: '#6b7280', fontWeight: 500 }}>{hora}:00</td>
                          {paseadores.map((p: any) => {
                            const citasHora = citas.filter((c: any) => c.id_usuario_paseador === p.id_usuario && c.hora.startsWith(hora));
                            return (
                              <td key={p.id_usuario} style={{ borderLeft: '1px solid #e5e7eb', padding: '0.25rem 0.5rem', verticalAlign: 'top', minWidth: '140px' }}>
                                {citasHora.length === 0 ? <div style={{ height: '48px' }} /> : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    {citasHora.map((c: any) => (
                                      <div key={c.id_cita} style={{ padding: '0.5rem', borderRadius: '4px', borderLeft: `2px solid ${c.id_estado === 4 ? '#22c55e' : c.id_estado === 3 ? '#6366f1' : c.id_estado === 2 ? '#f97316' : '#eab308'}`, backgroundColor: c.id_estado === 4 ? '#f0fdf4' : c.id_estado === 3 ? '#eef2ff' : c.id_estado === 2 ? '#fff7ed' : '#fef9c3' }}>
                                        <div style={{ fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🐕 {c.mascota?.nom_mascota}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{c.zona}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Vista Semana (resumida por brevedad, usa las mismas clases) */}
          {subVista === "semana" && (
             <div className="agenda-table-wrapper" style={{ padding: '1rem', color: '#6b7280' }}>Vista Semana en construcción...</div>
          )}

          {/* Vista Mes (resumida) */}
          {subVista === "mes" && (
             <div className="agenda-table-wrapper" style={{ padding: '1rem', color: '#6b7280' }}>Vista Mes en construcción...</div>
          )}
        </>
      )}
    </div>
  );
}