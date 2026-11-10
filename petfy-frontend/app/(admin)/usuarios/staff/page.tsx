"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-admin"; // Asegúrate de actualizar tus endpoints
import { Badge } from "@/components/Badge";
import { Search, Plus, UserCheck, UserX, Clock, CheckCircle2, Star, CalendarDays, X } from "lucide-react";
import { toast } from "sonner";

// Simulamos los servicios que vienen de la BD (Paseo=2, Baño=3, Guardería=4)
const SERVICIOS_DISPONIBLES = [
  { id: 2, nombre: "Paseo", prefijo: "Paseador" },
  { id: 3, nombre: "Baño", prefijo: "Bañador" },
  { id: 4, nombre: "Guardería", prefijo: "Cuidador" },
];

export default function StaffPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<number[]>([]);

  // 1. Cargar TODO el staff (sin importar el servicio)
  const { data, isLoading } = useQuery({
    queryKey: ["staff", search, page],
    queryFn: () => api.getStaff({ search, page, pageSize: 10 }), // Endpoint nuevo en tu backend
  });

  // 2. Mutación: crear empleado (Staff)
  const mutCrear = useMutation({
    mutationFn: (data: any) => api.crearStaff(data), // Endpoint nuevo en backend
    onSuccess: () => {
      toast.success("Empleado creado correctamente.");
      qc.invalidateQueries({ queryKey: ["staff"] });
      setShowCrearModal(false);
      setServiciosSeleccionados([]);
    },
    onError: () => toast.error("Error al crear empleado"),
  });

  const toggleServicio = (id: number) => {
    setServiciosSeleccionados(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Empleados (Staff)</h2>
          <p className="text-sm text-gray-500 mt-1">Gestiona al personal y sus servicios asignados</p>
        </div>
        <button 
          onClick={() => setShowCrearModal(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo Empleado
        </button>
      </div>

      {/* Tabla de Staff */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Servicios Asignados</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={4} className="p-8 text-center text-gray-400">Cargando…</td></tr>}
            {(data?.data ?? []).map((p: any) => (
              <tr key={p.id_usuario} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{p.nombre} {p.apellido}</div>
                  <div className="text-xs text-gray-500">{p.correo}</div>
                </td>
                <td className="px-4 py-3">
                  {/* Aquí mostramos los badges de los servicios que tiene */}
                  <div className="flex flex-wrap gap-1">
                    {p.servicios?.map((s: any) => (
                      <Badge key={s.id_servicio} color="blue">
                        {s.nombre}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color={p.activo ? "green" : "gray"}>{p.activo ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  {/* Botones de acción: horarios, activar/inactivar */}
                  <button className="text-xs text-orange-600 mr-3 hover:underline">Horarios</button>
                  <button className={`text-xs ${p.activo ? 'text-red-600' : 'text-green-600'} hover:underline`}>
                    {p.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: Crear Staff */}
      {showCrearModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nuevo Empleado</h3>
              <button onClick={() => setShowCrearModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              mutCrear.mutate({
                nombre: fd.get("nombre"),
                apellido: fd.get("apellido"),
                telefono: fd.get("telefono"),
                servicios: serviciosSeleccionados, // Enviamos el array de IDs
              });
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Nombre *</span>
                  <input name="nombre" required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Apellido *</span>
                  <input name="apellido" required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Teléfono</span>
                <input name="telefono" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </label>

              {/* SELECTOR DE SERVICIOS */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm font-medium text-blue-900 block mb-2">Servicios del empleado *</span>
                <div className="space-y-2">
                  {SERVICIOS_DISPONIBLES.map((servicio) => (
                    <label key={servicio.id} className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={serviciosSeleccionados.includes(servicio.id)}
                        onChange={() => toggleServicio(servicio.id)}
                        className="rounded text-blue-600"
                      />
                      {servicio.nombre} <span className="text-gray-500">({servicio.prefijo})</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  💡 El correo se autogenerará como <strong>staff01@petfy.com</strong>
                </p>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCrearModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={mutCrear.isPending || serviciosSeleccionados.length === 0} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  Crear empleado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}