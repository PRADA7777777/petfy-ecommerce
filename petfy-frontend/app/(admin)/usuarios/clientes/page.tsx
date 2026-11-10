"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-admin";
import { Badge } from "@/components/Badge";
import { Search, PawPrint, CheckCircle2, UserPlus, UserX, ChevronRight } from "lucide-react";
import { fmtDate } from "@/lib/utils";

type EstadoCliente = "todos" | "activo" | "registrado" | "inactivo";

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<EstadoCliente>("todos");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["clientes-detalle", search, estado, page],
    queryFn: () => api.getClientesConDetalle({ search, estado, page, pageSize: 10 }),
  });

  const todos = (data?.data ?? []) as any[];
  const totalActivos = todos.filter((c) => c.estado_cliente === "activo").length;
  const totalRegistrados = todos.filter((c) => c.estado_cliente === "registrado").length;
  const totalInactivos = todos.filter((c) => c.estado_cliente === "inactivo").length;

  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
        <p className="text-sm text-gray-500 mt-1">Gestiona los clientes de Petfy y su relación con las mascotas</p>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => { setEstado(estado === "activo" ? "todos" : "activo"); setPage(1); }}
          className={`text-left bg-white rounded-xl border p-4 hover:border-green-300 transition-colors ${estado === "activo" ? "ring-2 ring-green-500" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Con servicio activo</p>
              <p className="text-xl font-bold text-gray-900">{totalActivos}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => { setEstado(estado === "registrado" ? "todos" : "registrado"); setPage(1); }}
          className={`text-left bg-white rounded-xl border p-4 hover:border-blue-300 transition-colors ${estado === "registrado" ? "ring-2 ring-blue-500" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Registró mascota</p>
              <p className="text-xl font-bold text-gray-900">{totalRegistrados}</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => { setEstado(estado === "inactivo" ? "todos" : "inactivo"); setPage(1); }}
          className={`text-left bg-white rounded-xl border p-4 hover:border-gray-300 transition-colors ${estado === "inactivo" ? "ring-2 ring-gray-400" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Solo registrados</p>
              <p className="text-xl font-bold text-gray-900">{totalInactivos}</p>
            </div>
          </div>
        </button>
      </div>

      {/* Búsqueda */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar cliente…"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        {estado !== "todos" && (
          <button onClick={() => setEstado("todos")} className="text-sm text-orange-600 hover:underline">
            Mostrar todos
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Mascotas</th>
              <th className="px-4 py-3">Plan Activo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Cargando…</td></tr>}
            {!isLoading && (data?.data ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">No hay clientes con este filtro.</td></tr>
            )}
            {!isLoading && (data?.data ?? []).map((c: any) => (
              <tr key={c.id_usuario} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3">
                  <Link href={`/usuarios/clientes/${c.id_usuario}`} className="block">
                    <div className="font-medium text-gray-900">{c.nombre} {c.apellido}</div>
                    <div className="text-xs text-gray-500">{c.documento?.num_doc ?? "—"}</div>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="text-gray-700">{c.correo}</div>
                  <div className="text-xs text-gray-500">{c.telefono ?? "—"}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1 text-orange-600 font-medium">
                    <PawPrint className="w-3.5 h-3.5" /> {c.mascotas_count}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.suscripcion_activa ? (
                    <div>
                      <div className="text-gray-900 font-medium text-xs">{c.suscripcion_activa.plan?.nom_plan}</div>
                      <div className="text-xs text-gray-500">Vence {fmtDate(c.suscripcion_activa.fecha_fin)}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Sin plan</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge color={
                    c.estado_cliente === "activo" ? "green" :
                    c.estado_cliente === "registrado" ? "blue" : "gray"
                  }>
                    {c.estado_cliente === "activo" ? "Activo" :
                     c.estado_cliente === "registrado" ? "Registró mascota" :
                     "Solo registrado"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/usuarios/clientes/${c.id_usuario}`} className="text-gray-400 hover:text-orange-600">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between px-4 py-3 border-t text-sm">
        <span className="text-gray-500">
          {data?.total ?? 0} clientes · página {page} de {Math.max(1, Math.ceil((data?.total ?? 0) / 10))}
        </span>
        <div className="flex gap-2">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 border rounded disabled:opacity-40 hover:bg-gray-50">Anterior</button>
          <button disabled={page >= Math.ceil((data?.total ?? 0) / 10)} onClick={() => setPage(page + 1)} className="px-3 py-1.5 border rounded disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
        </div>
      </div>
    </div>
  );
}