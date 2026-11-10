"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { CalendarDays, ChevronLeft, ChevronRight, Clock } from "lucide-react";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function MiHorarioPage() {
  const { user } = useAuth();
  const [semanaOffset, setSemanaOffset] = useState(0);

  // Calcular días de la semana actual
  const hoy = new Date();
  hoy.setDate(hoy.getDate() - hoy.getDay() + (semanaOffset * 7)); // Domingo de esta semana
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + i);
    return d;
  });

  const { data: citas, isLoading } = useQuery({
    queryKey: ["mi-horario", user?.id_usuario],
    queryFn: async () => {
      const res = await api.getCitas({ page: 1 });
      return res.data.filter((c: any) => c.id_usuario_paseador === user?.id_usuario);
    },
    enabled: !!user?.id_usuario,
  });

  const citasDelDia = (fecha: Date) => {
    const fechaStr = fecha.toISOString().split("T")[0];
    return (citas ?? []).filter((c: any) => c.fecha === fechaStr);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Horario</h2>
          <p className="text-sm text-gray-500 mt-1">Paseos asignados de la semana</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setSemanaOffset(semanaOffset - 1)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 px-3">
            {diasSemana[0].toLocaleDateString("es-CO", { month: "short", day: "numeric" })} —{" "}
            {diasSemana[6].toLocaleDateString("es-CO", { month: "short", day: "numeric" })}
          </span>
          <button 
            onClick={() => setSemanaOffset(semanaOffset + 1)}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Cargando horario…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {diasSemana.map((dia, i) => {
            const paseosDia = citasDelDia(dia);
            const esHoy = dia.toDateString() === new Date().toDateString();
            return (
              <div 
                key={i} 
                className={`bg-white rounded-xl border overflow-hidden ${esHoy ? "ring-2 ring-orange-500" : ""}`}
              >
                <div className={`px-3 py-2 border-b text-center ${esHoy ? "bg-orange-50" : "bg-gray-50"}`}>
                  <div className="text-xs text-gray-500 uppercase font-semibold">{DIAS[i]}</div>
                  <div className={`text-lg font-bold ${esHoy ? "text-orange-600" : "text-gray-900"}`}>
                    {dia.getDate()}
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {paseosDia.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center pt-6">Sin paseos</div>
                  ) : (
                    paseosDia.map((c: any) => (
                      <div 
                        key={c.id_cita}
                        className={`text-xs p-2 rounded-lg border-l-4 ${
                          c.id_estado === 4 ? "bg-green-50 border-green-500" :
                          c.id_estado === 3 ? "bg-indigo-50 border-indigo-500" :
                          "bg-orange-50 border-orange-500"
                        }`}
                      >
                        <div className="font-bold text-gray-900 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {c.hora?.slice(0, 5)}
                        </div>
                        <div className="text-gray-700 mt-1 truncate">🐕 {c.mascota?.nom_mascota}</div>
                        <div className="text-gray-500 truncate">{c.zona}</div>
                        <Badge color={
                          c.id_estado === 4 ? "green" : 
                          c.id_estado === 3 ? "indigo" : 
                          c.id_estado === 2 ? "blue" : "yellow"
                        }>{c.estado?.nom_estado}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resumen */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Resumen de la semana</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold text-orange-600">{citas?.length ?? 0}</div>
            <div className="text-xs text-gray-500">Paseos totales</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {citas?.filter((c: any) => c.id_estado === 4).length ?? 0}
            </div>
            <div className="text-xs text-gray-500">Completados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {citas?.filter((c: any) => c.id_estado === 2 || c.id_estado === 3).length ?? 0}
            </div>
            <div className="text-xs text-gray-500">Programados</div>
          </div>
        </div>
      </div>
    </div>
  );
}