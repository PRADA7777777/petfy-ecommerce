"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CheckCircle2, ReceiptText, CalendarDays, Image as ImageIcon, AlertTriangle, PawPrint } from "lucide-react";
import { fmtDate } from "@/lib/utils";
import { toast } from "sonner";

export default function GananciasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  
  const [tab, setTab] = useState<"saldo" | "historial" | "servicios">("saldo");
  
  // Estados para el filtro de fechas en "Servicios del Ciclo"
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  
  // Estado para ver la foto en grande
  const [fotoAbierta, setFotoAbierta] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["paseador-ganancias", user?.id_usuario],
    queryFn: () => api.getGananciasPaseador(user!.id_usuario),
    enabled: !!user?.id_usuario,
  });

  const mutPagar = useMutation({
    mutationFn: () => api.pagarSaldoPaseador(user!.id_usuario, data!.saldoActual),
    onSuccess: () => {
      toast.success("Pago liquidado. Ciclo reiniciado.");
      qc.invalidateQueries({ queryKey: ["paseador-ganancias"] });
    },
  });

  // Filtro para la pestaña de Servicios del Ciclo
  const citasSaldoActual = data?.todasLasCitas.filter((c: any) => new Date(c.fecha + "T12:00:00") > new Date(data.pagosRealizados[0].fecha_pago)) || [];
  const citasSaldoFiltradas = citasSaldoActual.filter((c: any) => {
    if (fechaInicio && c.fecha < fechaInicio) return false;
    if (fechaFin && c.fecha > fechaFin) return false;
    return true;
  });

  if (isLoading) return <div className="p-12 text-center text-gray-400">Cargando información…</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mis Servicios</h2>
        <p className="text-sm text-gray-500 mt-1">Revisa tu historial de paseos y tu progreso mensual</p>
      </div>

      {/* TARJETA PRINCIPAL (Conteo de paseos) */}
      <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 text-8xl opacity-10">🐾</div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <p className="text-green-100 text-sm font-semibold mb-1 uppercase tracking-wider">Paseos este ciclo</p>
            <h3 className="text-5xl font-bold">{data?.paseosSaldoActual || 0}</h3>
            <p className="text-green-100 text-sm mt-2">Servicios realizados desde el último corte</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 w-full md:w-auto text-center">
            <p className="text-green-100 text-xs uppercase font-bold tracking-wider mb-1">Próximo Corte</p>
            <p className="font-bold text-lg">{fmtDate(data?.proximoPago)}</p>
            <button 
              onClick={() => mutPagar.mutate()} 
              disabled={mutPagar.isPending || (data?.paseosSaldoActual || 0) === 0}
              className="mt-3 w-full bg-white text-green-700 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 transition-colors"
            >
              {mutPagar.isPending ? "Procesando..." : "Simular Pago"}
            </button>
          </div>
        </div>
      </div>

      {/* SELECTOR DE PESTAÑAS */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        <button onClick={() => setTab("saldo")} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${tab === "saldo" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Servicios del Ciclo</button>
        <button onClick={() => setTab("historial")} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${tab === "historial" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Historial de Pagos</button>
        <button onClick={() => setTab("servicios")} className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${tab === "servicios" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>Todos los Paseos</button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        
        {/* 1. SERVICIOS DEL CICLO (Los que se van a cobrar) */}
        {tab === "saldo" && (
          <div>
            <div className="px-5 py-4 border-b bg-gray-50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h3 className="font-bold text-gray-900">Paseos acumulados para el pago</h3>
              
              <div className="flex items-center gap-2 bg-white border rounded-lg p-1.5 shadow-sm">
                <CalendarDays className="w-4 h-4 text-gray-400 ml-1" />
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="text-xs border-none focus:outline-none bg-transparent" />
                <span className="text-gray-300">-</span>
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="text-xs border-none focus:outline-none bg-transparent" />
              </div>
            </div>
            
            <div className="px-5 py-3 bg-orange-50 text-orange-800 text-sm font-medium border-b flex justify-between">
              <span>Resultados del filtro:</span>
              <span>{citasSaldoFiltradas.length} paseos</span>
            </div>

            {citasSaldoFiltradas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No hay paseos pendientes en las fechas seleccionadas.</div>
            ) : (
              <div className="divide-y">
                {citasSaldoFiltradas.map((c: any) => (
                  <div key={c.id_cita} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center shrink-0 text-green-600">
                        <PawPrint className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.mascota?.nom_mascota}</p>
                        <p className="text-xs text-gray-500">{fmtDate(c.fecha)} · {c.hora?.slice(0, 5)}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold uppercase">Por liquidar</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. HISTORIAL DE PAGOS (Cortes liquidados) */}
        {tab === "historial" && (
          <div>
            <div className="px-5 py-4 border-b bg-blue-50">
              <h3 className="font-bold text-blue-900">Cortes Liquidados</h3>
            </div>
            <div className="divide-y">
              {data?.pagosRealizados.map((p: any) => (
                <div key={p.id_pago} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0 text-blue-600">
                      <ReceiptText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Corte de Pago</p>
                      <p className="text-xs text-gray-500">Fecha: {fmtDate(p.fecha_pago)}</p>
                      <p className="text-[10px] text-gray-400 uppercase">Periodo: {p.periodo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase mt-1">Pagado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. TODOS LOS PASEOS (Historial de trabajo completo) */}
        {tab === "servicios" && (
          <div>
            <div className="px-5 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-900">Registro Histórico de Paseos</h3>
            </div>
            
            {data?.todasLasCitas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Aún no has completado ningún paseo.</div>
            ) : (
              <div className="divide-y">
                {data?.todasLasCitas.map((c: any) => {
                  let duracion = null;
                  if (c.hora_inicio_real && c.hora_fin_real) {
                    const ms = new Date(c.hora_fin_real).getTime() - new Date(c.hora_inicio_real).getTime();
                    duracion = `${Math.round(ms / 60000)} min`;
                  }

                  return (
                    <div key={c.id_cita} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          
                          {c.foto_cierre ? (
                            <button onClick={() => setFotoAbierta(c.foto_cierre)}
                              className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-gray-200 hover:opacity-80 transition-opacity">
                              <img src={c.foto_cierre} alt="Cierre" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-gray-400">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm">🐕 {c.mascota?.nom_mascota}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{fmtDate(c.fecha)} · {c.hora?.slice(0, 5)}</p>
                            
                            {duracion && (
                              <p className="text-[11px] text-gray-400 mt-1">
                                Duración: <strong className="text-gray-600">{duracion}</strong>
                              </p>
                            )}

                            {c.novedad && (
                              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 mt-2 flex items-start gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{c.novedad}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mt-1 flex items-center gap-1 justify-end">
                            <CheckCircle2 className="w-3 h-3" /> Completado
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Lightbox para ver la foto en grande */}
      {fotoAbierta && (
        <div onClick={() => setFotoAbierta(null)} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <img src={fotoAbierta} alt="Foto de cierre" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}