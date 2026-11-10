"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-admin";
import { Badge } from "@/components/Badge";
import { 
  MapPin, CalendarDays, Users, PawPrint, CheckCircle2, 
  CheckSquare, Map, ListChecks
} from "lucide-react";
import { toast } from "sonner";
import { AgendaView } from "./AgendaView";
import { MapaView } from "./MapaView";
import "../../styles/paseos.css"; // <-- IMPORTAMOS EL CSS

type Tab = "planificacion" | "agenda" | "mapa";

export default function PaseosAdminPage() {
  const [tab, setTab] = useState<Tab>("planificacion");

  return (
    <div className="paseos-container">
      <div className="paseos-header">
        <h2>Gestión de Paseos</h2>
        <p>Planificación, agenda y control operativo</p>
      </div>

      <div className="paseos-tabs">
        {[
          { id: "planificacion", label: "Planificación", icon: ListChecks },
          { id: "agenda", label: "Agenda", icon: CalendarDays },
          { id: "mapa", label: "Mapa en Vivo", icon: Map },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`paseos-tab ${tab === id ? "active" : ""}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "planificacion" && <PlanificacionView />}
      {tab === "agenda" && <AgendaView />}
      {tab === "mapa" && <MapaView />}
    </div>
  );
}

function PlanificacionView() {
  const qc = useQueryClient();
  const [vista, setVista] = useState<"macro" | "micro">("macro");
  const [mes, setMes] = useState("2026-10");

  // NOTA: Estas APIs no existen aún en api-admin.ts, darán error si se ejecutan
  const { data: macroData, isLoading: loadMacro } = useQuery({
    queryKey: ["paseos-macro", mes],
    queryFn: () => api.getMacroPaseosMes(mes),
    enabled: vista === "macro",
  });

  const [fechaMicro, setFechaMicro] = useState(new Date().toISOString().split("T")[0]);
  const [horaMicro, setHoraMicro] = useState("08:00");
  const [seleccionadas, setSeleccionadas] = useState<Record<number, number>>({});

  const { data: citasMicro, isLoading: loadCitas } = useQuery({
    queryKey: ["paseos-micro", fechaMicro, horaMicro],
    queryFn: async () => {
      const res = await api.getPaseos({ fecha: fechaMicro });
      return res.data.filter((c: any) => c.hora.startsWith(horaMicro) && !c.id_usuario_paseador);
    },
    enabled: vista === "micro",
  });

  const { data: cargaPaseadores, isLoading: loadCarga } = useQuery({
    queryKey: ["carga-paseadores", fechaMicro, horaMicro],
    queryFn: () => api.getCargaPaseadores(fechaMicro, horaMicro),
    enabled: vista === "micro",
  });

  const mutAsignar = useMutation({
    mutationFn: () => {
      const asignaciones = Object.entries(seleccionadas).map(([id_cita, id_pas]) => ({
        id_cita: Number(id_cita),
        id_usuario_paseador: id_pas,
      }));
      if (asignaciones.length === 0) throw new Error("No hay citas seleccionadas");
      return api.asignarPaseadorMasivo(asignaciones);
    },
    onSuccess: (res) => {
      toast.success(`${res.count} paseos asignados`);
      qc.invalidateQueries({ queryKey: ["paseos-micro"] });
      qc.invalidateQueries({ queryKey: ["carga-paseadores"] });
      setSeleccionadas({});
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="plan-switch">
        <button onClick={() => setVista("macro")} className={`plan-switch-btn ${vista === "macro" ? "active" : ""}`}>
          Vista Macro (Mes)
        </button>
        <button onClick={() => setVista("micro")} className={`plan-switch-btn ${vista === "micro" ? "active-orange" : ""}`}>
          Asignación Micro
        </button>
      </div>

      {vista === "macro" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <input type="month" value={mes} onChange={(e) => setMes(e.target.value)} className="micro-input" />
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Planes activos comprados este mes</span>
          </div>
          {loadMacro ? <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Cargando…</div> : (
            <div className="plan-macro-grid">
              {macroData?.map((zonaData: any, idx: number) => (
                <div key={idx} className="plan-macro-card">
                  <div className="plan-macro-header">
                    <h3><MapPin size={16} /> {zonaData.zona}</h3>
                    <Badge color="orange">{zonaData.mascotas} perros</Badge>
                  </div>
                  <div className="plan-macro-body">
                    <div className="plan-macro-rutas">
                      {zonaData.rutas.map((ruta: any) => (
                        <div key={ruta.id_suscripcion} className="plan-macro-ruta">
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 500, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              🐕 {ruta.mascota} <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>({ruta.raza})</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{ruta.cliente}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.5rem' }}>
                            <div style={{ fontWeight: 700, color: '#ea580c', fontSize: '0.875rem' }}>{ruta.hora_preferida}</div>
                            <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{ruta.dias}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {vista === "micro" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="micro-top-bar">
            <div className="micro-input-group">
              <label>Fecha</label>
              <input type="date" value={fechaMicro} onChange={(e) => setFechaMicro(e.target.value)} className="micro-input" />
            </div>
            <div className="micro-input-group">
              <label>Hora</label>
              <select value={horaMicro} onChange={(e) => setHoraMicro(e.target.value)} className="micro-input">
                {Array.from({ length: 12 }, (_, i) => (i + 6).toString().padStart(2, "0")).map(h => (
                  <option key={h} value={h}>{h}:00 - {h}:59</option>
                ))}
              </select>
            </div>
            <div className="micro-limit-alert">💡 Límite: <strong>3 perros por paseador</strong></div>
          </div>

          <div className="micro-grid">
            <div className="micro-panel">
              <div className="micro-panel-header">
                <h3><PawPrint size={16} color="#ea580c" /> Pendientes ({citasMicro?.length || 0})</h3>
              </div>
              <div className="micro-list">
                {loadCitas && <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>Cargando…</div>}
                {!loadCitas && citasMicro?.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No hay paseos pendientes.</div>
                )}
                {citasMicro?.map((c: any) => (
                  <div key={c.id_cita} className={`micro-list-item ${seleccionadas[c.id_cita] ? "selected" : ""}`}>
                    <div style={{ fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🐕 {c.mascota?.nom_mascota}
                      {seleccionadas[c.id_cita] && <CheckCircle2 size={16} color="#15803d" />}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '0.25rem' }}>{c.zona} · {c.direccion}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="micro-panel">
              <div className="micro-panel-header" style={{ backgroundColor: '#fff7ed' }}>
                <h3 style={{ color: '#7c2d12' }}><Users size={16} /> Paseadores</h3>
                {Object.keys(seleccionadas).length > 0 && (
                  <button onClick={() => mutAsignar.mutate()} disabled={mutAsignar.isPending} style={{ backgroundColor: '#ea580c', color: 'white', padding: '0.375rem 0.75rem', borderRadius: '8px', border: 'none', fontSize: '0.75rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <CheckSquare size={14} />
                    {mutAsignar.isPending ? "Asignando..." : `Asignar ${Object.keys(seleccionadas).length}`}
                  </button>
                )}
              </div>
              <div className="micro-list">
                {loadCarga && <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>Cargando…</div>}
                {cargaPaseadores?.map((p: any) => (
                  <div key={p.id_usuario} style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{p.nombre} {p.apellido}</div>
                      <Badge color={p.perros_asignados >= 3 ? "red" : p.perros_asignados > 0 ? "yellow" : "green"}>
                        {p.perros_asignados}/{p.capacidad_maxima}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                      {[1, 2, 3].map(slot => (
                        <div key={slot} style={{ height: '6px', flex: 1, borderRadius: '999px', backgroundColor: slot <= p.perros_asignados ? '#ea580c' : '#e5e7eb' }} />
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {citasMicro?.filter((c: any) => !seleccionadas[c.id_cita] || seleccionadas[c.id_cita] === p.id_usuario).map((c: any) => {
                        const isSelected = seleccionadas[c.id_cita] === p.id_usuario;
                        const slotsUsados = Object.values(seleccionadas).filter(v => v === p.id_usuario).length;
                        const isDisabled = !isSelected && (p.perros_asignados + slotsUsados >= 3);
                        return (
                          <button key={c.id_cita} disabled={isDisabled}
                            onClick={() => {
                              const ns = { ...seleccionadas };
                              if (ns[c.id_cita] === p.id_usuario) delete ns[c.id_cita];
                              else ns[c.id_cita] = p.id_usuario;
                              setSeleccionadas(ns);
                            }}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'left', fontSize: '0.875rem', cursor: isDisabled ? 'not-allowed' : 'pointer',
                              backgroundColor: isSelected ? '#dcfce7' : isDisabled ? '#f9fafb' : 'white',
                              color: isSelected ? '#15803d' : isDisabled ? '#9ca3af' : '#374151',
                            }}>
                            <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? '#15803d' : 'white' }}>
                              {isSelected && <CheckCircle2 size={12} color="white" />}
                            </div>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🐕 {c.mascota?.nom_mascota}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}