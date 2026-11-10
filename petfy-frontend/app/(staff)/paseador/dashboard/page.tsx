"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/Badge";
import { MapPin, CheckCircle2, Play, Sunrise, Sunset, Key } from "lucide-react";
import { useState } from "react";
import { ModalServicioPaseador } from "@/components/ModalServicioPaseador";

export default function PaseadorDashboard() {
  const { user } = useAuth();
  const [servicioAbierto, setServicioAbierto] = useState<any>(null);

  const { data: paseosHoy, isLoading, refetch } = useQuery({ 
    queryKey: ["paseador-hoy", user?.id_usuario], 
    queryFn: async () => {
      const res = await api.getPaseosHoy();
      const misPaseos = res.todos.filter((c: any) => 
        c.id_usuario_paseador === user?.id_usuario && c.id_estado !== 4
      );
      
      const mañana = misPaseos.filter((c: any) => c.hora < "12:00").sort((a: any, b: any) => a.hora.localeCompare(b.hora));
      const tarde = misPaseos.filter((c: any) => c.hora >= "12:00").sort((a: any, b: any) => a.hora.localeCompare(b.hora));

      return { mañana, tarde, total: misPaseos.length };
    },
    enabled: !!user?.id_usuario,
    refetchInterval: 10000, // Refresca más rápido para ver cambios
  });

  const TarjetaPaseo = ({ c }: { c: any }) => {
    const estado = c.id_estado;
    
    // Lógica de estilos y botones según el estado
    const esEnCurso = estado === 7;
    const esLlegada = estado === 6;
    
    let botonAccion;
    if (esEnCurso) {
      botonAccion = (
        <button onClick={() => setServicioAbierto(c)}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4" /> Finalizar Paseo
        </button>
      );
    } else if (esLlegada) {
      botonAccion = (
        <button onClick={() => setServicioAbierto(c)}
          className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm">
          <Key className="w-4 h-4" /> Ingresar Código
        </button>
      );
    } else {
      botonAccion = (
        <button onClick={() => setServicioAbierto(c)}
          className="w-full sm:w-auto px-6 py-2.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
          <Play className="w-4 h-4" /> Iniciar Ruta
        </button>
      );
    }

    return (
      <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
        esEnCurso ? "bg-indigo-50 border-indigo-300 shadow-md ring-1 ring-indigo-300" : 
        esLlegada ? "bg-blue-50 border-blue-300 shadow-md ring-1 ring-blue-300" : 
        "bg-white shadow-sm hover:border-orange-300"
      }`}>
        <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:w-24 shrink-0">
          <div className={`text-xl font-bold ${esEnCurso ? 'text-indigo-700' : esLlegada ? 'text-blue-700' : 'text-gray-900'}`}>
            {c.hora?.slice(0, 5)}
          </div>
          <Badge color={esEnCurso ? "indigo" : esLlegada ? "blue" : "yellow"}>
            {esEnCurso ? "En curso" : esLlegada ? "Llegó" : "Pendiente"}
          </Badge>
        </div>
        
        <div className="flex-1 min-w-0 border-l-2 border-gray-100 pl-4">
          <div className="font-bold text-gray-900 text-lg flex items-center gap-2">
            🐕 {c.mascota?.nom_mascota}
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5" /> {c.direccion} · {c.zona}
          </div>
        </div>

        <div className="shrink-0 mt-2 sm:mt-0">
          {botonAccion}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mi Ruta de Hoy</h2>
          <p className="text-sm text-gray-500 mt-1">
            {paseosHoy?.total === 0 
              ? "¡Todo al día! No tienes paseos pendientes." 
              : `Tienes ${paseosHoy?.total} paseos pendientes o en curso.`}
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Fecha</p>
          <p className="font-bold text-gray-900">
            {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando tu ruta…</div>
      ) : paseosHoy?.total === 0 ? (
        <div className="bg-white rounded-2xl border p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">¡Misión cumplida!</h3>
          <p className="text-gray-500 text-sm">Has completado todos los paseos de hoy.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {paseosHoy.mañana.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Sunrise className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-gray-800 text-lg">Turno Mañana</h3>
                <span className="ml-auto text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                  {paseosHoy.mañana.length} paseos
                </span>
              </div>
              <div className="space-y-3">
                {paseosHoy.mañana.map((c: any) => <TarjetaPaseo key={c.id_cita} c={c} />)}
              </div>
            </div>
          )}

          {paseosHoy.tarde.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2">
                <Sunset className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-gray-800 text-lg">Turno Tarde</h3>
                <span className="ml-auto text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                  {paseosHoy.tarde.length} paseos
                </span>
              </div>
              <div className="space-y-3">
                {paseosHoy.tarde.map((c: any) => <TarjetaPaseo key={c.id_cita} c={c} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {servicioAbierto && (
        <ModalServicioPaseador 
          cita={servicioAbierto} 
          onClose={() => setServicioAbierto(null)}
          onSuccess={() => { setServicioAbierto(null); refetch(); }}
        />
      )}
    </div>
  );
}