"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { fmtDate } from "@/lib/utils";

type Tab = "hoy" | "semana" | "mes";
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function AgendaPaseadorPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("hoy");
  const [fechaBase, setFechaBase] = useState(new Date().toISOString().split("T")[0]);

  // Cargar TODAS las citas del paseador
  const { data: citas, isLoading } = useQuery({
    queryKey: ["agenda-paseador", user?.id_usuario],
    queryFn: async () => {
      const res = await api.getCitas({ page: 1, pageSize: 1000 });
      return res.data.filter((c: any) => c.id_usuario_paseador === user?.id_usuario);
    },
    enabled: !!user?.id_usuario,
  });

  // Helpers de fechas
  const getRango = () => {
    const base = new Date(fechaBase + "T12:00:00");
    if (tab === "hoy") return { inicio: fechaBase, fin: fechaBase };
    if (tab === "semana") {
      const inicio = new Date(base);
      inicio.setDate(base.getDate() - ((base.getDay() + 6) % 7)); // Lunes
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 6);
      return { inicio: inicio.toISOString().split("T")[0], fin: fin.toISOString().split("T")[0] };
    }
    const inicio = new Date(base.getFullYear(), base.getMonth(), 1);
    const fin = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    return { inicio: inicio.toISOString().split("T")[0], fin: fin.toISOString().split("T")[0] };
  };

  const { inicio, fin } = getRango();
  const citasFiltradas = citas?.filter((c: any) => c.fecha >= inicio && c.fecha <= fin) || [];

  const navegar = (dir: -1 | 1) => {
    const d = new Date(fechaBase + "T12:00:00");
    if (tab === "hoy") d.setDate(d.getDate() + dir);
    else if (tab === "semana") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setFechaBase(d.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mi Agenda</h2>
        <p className="text-sm text-gray-500 mt-1">Consulta tu horario asignado (solo lectura)</p>
      </div>

      {/* Controles de vista */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-xl border p-3">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {(["hoy", "semana", "mes"] as Tab[]).map((v) => (
            <button key={v} onClick={() => setTab(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                tab === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}>
              {v === "hoy" ? "Hoy" : v === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => navegar(-1)} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {tab === "hoy" && fmtDate(fechaBase)}
            {tab === "semana" && `${fmtDate(inicio)} - ${fmtDate(fin)}`}
            {tab === "mes" && new Date(fechaBase + "T12:00:00").toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => navegar(1)} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-400 bg-white rounded-xl border">Cargando agenda…</div>
      ) : (
        <>
          {/* VISTA HOY */}
          {tab === "hoy" && (
            <div className="space-y-3">
              {citasFiltradas.length === 0 ? (
                <div className="p-8 text-center text-gray-400 bg-white rounded-xl border">No tienes paseos programados para este día.</div>
              ) : (
                citasFiltradas.map((c: any) => (
                  <div key={c.id_cita} className="bg-white rounded-xl border p-4 flex items-center gap-4">
                    <div className="w-20 shrink-0 text-center border-r pr-4">
                      <div className="text-xl font-bold text-gray-900">{c.hora?.slice(0, 5)}</div>
                      <div className="text-xs text-gray-500">Hora</div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        🐕 {c.mascota?.nom_mascota}
                        <Badge color={c.id_estado === 4 ? "green" : c.id_estado === 7 ? "indigo" : "blue"}>
                          {c.estado?.nom_estado}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {c.direccion} · {c.zona}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VISTA SEMANA */}
          {tab === "semana" && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 w-16"></th>
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(inicio + "T12:00:00");
                      d.setDate(d.getDate() + i);
                      return (
                        <th key={i} className="px-2 py-2 text-center font-medium text-gray-700 border-l">
                          <div className="text-[10px] uppercase">{DIAS_SEMANA[i]}</div>
                          <div className="text-lg font-bold">{d.getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-3 py-2 font-bold text-gray-500 text-xs">Mañana</td>
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(inicio + "T12:00:00");
                      d.setDate(d.getDate() + i);
                      const fechaStr = d.toISOString().split("T")[0];
                      const paseos = citasFiltradas.filter((c: any) => c.fecha === fechaStr && c.hora < "12:00");
                      return (
                        <td key={i} className="px-2 py-3 text-center border-l align-top">
                          {paseos.map((c: any) => (
                            <div key={c.id_cita} className="bg-orange-50 text-orange-800 text-[10px] p-1.5 rounded mb-1 text-left leading-tight">
                              <strong>{c.hora?.slice(0,5)}</strong> 🐕 {c.mascota?.nom_mascota}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                  <tr className="border-t">
                    <td className="px-3 py-2 font-bold text-gray-500 text-xs">Tarde</td>
                    {Array.from({ length: 7 }, (_, i) => {
                      const d = new Date(inicio + "T12:00:00");
                      d.setDate(d.getDate() + i);
                      const fechaStr = d.toISOString().split("T")[0];
                      const paseos = citasFiltradas.filter((c: any) => c.fecha === fechaStr && c.hora >= "12:00");
                      return (
                        <td key={i} className="px-2 py-3 text-center border-l align-top">
                          {paseos.map((c: any) => (
                            <div key={c.id_cita} className="bg-blue-50 text-blue-800 text-[10px] p-1.5 rounded mb-1 text-left leading-tight">
                              <strong>{c.hora?.slice(0,5)}</strong> 🐕 {c.mascota?.nom_mascota}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* VISTA MES */}
          {tab === "mes" && (
            <div className="bg-white rounded-xl border p-4">
              <div className="grid grid-cols-7 gap-2">
                {DIAS_SEMANA.map((d) => <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>)}
                {(() => {
                  const base = new Date(inicio + "T12:00:00");
                  const primerDia = base.getDay() === 0 ? 6 : base.getDay() - 1;
                  const celdas = [];
                  for (let i = 0; i < primerDia; i++) celdas.push(<div key={`e-${i}`} />);
                  
                  const diasMes = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
                  for (let dia = 1; dia <= diasMes; dia++) {
                    const fechaStr = `${base.getFullYear()}-${(base.getMonth() + 1).toString().padStart(2, "0")}-${dia.toString().padStart(2, "0")}`;
                    const paseos = citasFiltradas.filter((c: any) => c.fecha === fechaStr);
                    celdas.push(
                      <div key={dia} className="aspect-square rounded-lg bg-gray-50 flex flex-col items-center justify-center text-sm border hover:border-orange-300 cursor-default relative">
                        <span className="font-medium text-gray-700">{dia}</span>
                        {paseos.length > 0 && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 rounded-full mt-1">
                            {paseos.length} 🐕
                          </span>
                        )}
                      </div>
                    );
                  }
                  return celdas;
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}