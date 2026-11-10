"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-admin";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/Badge";
import { Users, PawPrint, CalendarDays, CreditCard, FileText, Wallet } from "lucide-react";
import { fmtCOP, fmtDate } from "@/lib/utils";
import "../styles/dashboard.css"; // <-- Importación normal, sin module

export default function DashboardPage() {
  const { data: stats, isLoading: loadingStats } = useQuery({ 
    queryKey: ["stats"], 
    queryFn: () => api.getStats() 
  });
  
  const { data: citasRecientes, isLoading: loadingCitas } = useQuery({ 
    queryKey: ["citas-recientes"], 
    queryFn: () => api.getCitas({ page: 1 }) 
  });

  if (loadingStats || !stats) {
    return <div style={{ padding: '2rem', color: '#6b7280' }}>Cargando métricas…</div>;
  }

  return (
    <div className="dash-container">
      
      <div className="dash-header">
        <h2>Resumen general</h2>
        <p>Vista general del estado de Petfy</p>
      </div>

      <div className="dash-kpi-grid">
        <StatCard title="Usuarios" value={stats.usuarios_total} hint={`${stats.clientes} clientes · ${stats.staff || 0} empleados`} icon={Users} color="blue" />
        <StatCard title="Mascotas" value={stats.mascotas} icon={PawPrint} color="purple" />
        <StatCard title="Citas hoy" value={stats.citas_hoy} hint={`${stats.citas_pendientes} pendientes · ${stats.citas_completadas_mes} completadas`} icon={CalendarDays} color="brand" />
        <StatCard title="Ingresos del mes" value={fmtCOP(stats.ingresos_mes)} icon={CreditCard} color="green" />
        <StatCard title="Facturas emitidas" value={stats.facturas_emitidas} icon={FileText} color="indigo" />
        <StatCard title="Devoluciones pendientes" value={stats.devoluciones_pendientes} icon={Wallet} color="red" />
      </div>

      <div className="dash-table-container">
        <div className="dash-table-header">
          <h3 className="dash-table-title">Citas recientes</h3>
          <a href="/admin/citas" className="dash-table-link">Ver todas →</a>
        </div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Mascota</th>
              <th>Asignado a</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loadingCitas && (
              <tr><td colSpan={6} className="dash-empty">Cargando citas...</td></tr>
            )}
            {!loadingCitas && (citasRecientes?.data ?? []).slice(0, 5).map((c: any) => (
              <tr key={c.id_cita}>
                <td>{fmtDate(c.fecha)}</td>
                <td>{c.hora?.slice(0, 5)}</td>
                <td>{c.cliente?.nombre} {c.cliente?.apellido}</td>
                <td>{c.mascota?.nom_mascota ?? "—"}</td>
                <td>
                  {(c.staff || c.paseador) 
                    ? `${(c.staff || c.paseador).nombre} ${(c.staff || c.paseador).apellido}` 
                    : <span style={{ color: '#d97706' }}>Sin asignar</span>}
                </td>
                <td>
                  <Badge color={c.id_estado === 1 ? "yellow" : c.id_estado === 2 ? "blue" : c.id_estado === 3 ? "indigo" : c.id_estado === 4 ? "green" : "red"}>
                    {c.estado?.nom_estado ?? "Pendiente"}
                  </Badge>
                </td>
              </tr>
            ))}
            {!loadingCitas && citasRecientes?.data.length === 0 && (
              <tr><td colSpan={6} className="dash-empty">No hay citas registradas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}