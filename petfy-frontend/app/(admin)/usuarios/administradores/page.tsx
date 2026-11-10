"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-admin";
import { Badge } from "@/components/Badge";
import { Search, Plus, UserCheck, UserX, Shield, X, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/utils";

export default function AdministradoresPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("todos");
  const [page, setPage] = useState(1);
  const [showCrearModal, setShowCrearModal] = useState(false);

  // Cargar administradores
  const { data, isLoading } = useQuery({
    queryKey: ["administradores", search, estado, page],
    queryFn: () => api.getAdministradores({ search, estado, page, pageSize: 10 }),
  });

  // Mutación: crear administrador
  const mutCrear = useMutation({
    mutationFn: (data: any) => api.crearAdministrador(data),
    onSuccess: () => {
      toast.success("Administrador creado correctamente");
      qc.invalidateQueries({ queryKey: ["administradores"] });
      setShowCrearModal(false);
    },
    onError: () => toast.error("Error al crear administrador"),
  });

  // Mutación: toggle activo
  const mutToggle = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => api.toggleAdministradorActivo(id, activo),
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["administradores"] });
    },
    onError: () => toast.error("Error al actualizar estado"),
  });

  return (
    <div className="space-y-4 max-w-7xl">
      {/* Header con botón de crear */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Administradores</h2>
          <p className="text-sm text-gray-500 mt-1">Usuarios con acceso total al sistema</p>
        </div>
        <button
          onClick={() => setShowCrearModal(true)}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo Administrador
        </button>
      </div>

      {/* Aviso de seguridad */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
        <Shield className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          Los administradores tienen acceso completo al panel, incluyendo gestión de clientes, paseadores y finanzas.
          Solo crea cuentas para personas de confianza.
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar administrador…"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <select
          value={estado}
          onChange={(e) => { setEstado(e.target.value); setPage(1); }}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="todos">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Administrador</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Último acceso</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Cargando…</td></tr>}
            {(data?.data ?? []).map((a: any) => (
              <tr key={a.id_usuario} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-semibold">
                      {a.nombre?.[0]}{a.apellido?.[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{a.nombre} {a.apellido}</div>
                      <div className="text-xs text-gray-500">{a.documento?.num_doc ?? "—"}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-700 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" /> {a.correo}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-gray-400" /> {a.telefono ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{a.ultimo_acceso}</td>
                <td className="px-4 py-3">
                  <Badge color="red">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge color={a.activo ? "green" : "gray"}>{a.activo ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => mutToggle.mutate({ id: a.id_usuario, activo: !a.activo })}
                    className={`flex items-center gap-1 ml-auto px-3 py-1.5 rounded-lg text-xs font-medium ${
                      a.activo
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-green-50 text-green-700 hover:bg-green-100"
                    }`}
                  >
                    {a.activo ? <><UserX className="w-3 h-3" /> Desactivar</> : <><UserCheck className="w-3 h-3" /> Activar</>}
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && data?.data.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay administradores con este filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
        <span className="text-gray-500">
          {data?.total ?? 0} administradores · página {page} de {Math.max(1, Math.ceil((data?.total ?? 0) / 10))}
        </span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded disabled:opacity-40 hover:bg-gray-50">Anterior</button>
          <button disabled={page >= Math.ceil((data?.total ?? 0) / 10)} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
        </div>
      </div>

      {/* MODAL: Crear administrador */}
      {showCrearModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Nuevo Administrador</h3>
              <button onClick={() => setShowCrearModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-xs text-red-800 flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 shrink-0" />
              <div>El nuevo administrador tendrá acceso completo al panel. Asegúrate de compartir sus credenciales de forma segura.</div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              mutCrear.mutate({
                nombre: fd.get("nombre"),
                apellido: fd.get("apellido"),
                correo: fd.get("correo"),
                telefono: fd.get("telefono"),
                documento: fd.get("documento"),
                contrasena: fd.get("contrasena"),
              });
            }} className="space-y-3">
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
                <span className="text-sm font-medium text-gray-700">Correo *</span>
                <input name="correo" type="email" required className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Teléfono</span>
                <input name="telefono" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Documento</span>
                <input name="documento" className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Contraseña temporal *</span>
                <input name="contrasena" type="password" required minLength={8} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                <span className="text-xs text-gray-400 mt-1 block">Mínimo 8 caracteres. El admin deberá cambiarla al primer inicio de sesión.</span>
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setShowCrearModal(false)} className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
                <button type="submit" disabled={mutCrear.isPending} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {mutCrear.isPending ? "Creando…" : "Crear administrador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}