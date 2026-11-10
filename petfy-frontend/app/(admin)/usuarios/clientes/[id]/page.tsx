"use client";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { 
  ArrowLeft, PawPrint, Mail, Phone, FileText, MapPin, 
  CalendarDays, CheckCircle2, UserPlus, UserX, CreditCard, 
  FileText as FileIcon, Wallet, User 
} from "lucide-react";
import { fmtCOP, fmtDate, fmtDateTime } from "@/lib/utils";
import Link from "next/link";

export default function ClienteDetallePage() {
  const params = useParams();
  const router = useRouter();
  const clienteId = Number(params.id);

  const { data: cliente, isLoading } = useQuery({
    queryKey: ["cliente-detalle", clienteId],
    queryFn: () => api.getClientePorId(clienteId),
    enabled: !isNaN(clienteId),
  });

  if (isLoading) return <div className="p-8 text-gray-500">Cargando cliente…</div>;
  if (!cliente) return <div className="p-8 text-red-600">Cliente no encontrado.</div>;

  const estadoBadge = {
    activo: { color: "green" as const, label: "Cliente activo", icon: CheckCircle2 },
    registrado: { color: "blue" as const, label: "Registró mascota", icon: UserPlus },
    inactivo: { color: "gray" as const, label: "Solo registrado", icon: UserX },
  };
  const estado = estadoBadge[cliente.estado_cliente as keyof typeof estadoBadge];
  const EstadoIcon = estado.icon;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header con volver */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/usuarios/clientes")}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" /> Volver a Clientes
        </button>
      </div>

      {/* Cabecera del cliente */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex flex-wrap items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-2xl font-bold">
            {cliente.nombre?.[0]}{cliente.apellido?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">{cliente.nombre} {cliente.apellido}</h2>
              <Badge color={estado.color}>
                <span className="flex items-center gap-1">
                  <EstadoIcon className="w-3 h-3" /> {estado.label}
                </span>
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" /> {cliente.correo}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" /> {cliente.telefono ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <FileText className="w-4 h-4 text-gray-400" /> {cliente.documento?.num_doc ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400" /> {cliente.direccion ?? "Sin dirección"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas del cliente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <PawPrint className="w-3.5 h-3.5" /> Mascotas
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{cliente.mascotas_count}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CalendarDays className="w-3.5 h-3.5" /> Citas totales
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{cliente.citas.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <CreditCard className="w-3.5 h-3.5" /> Pagos
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{cliente.pagos.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <FileIcon className="w-3.5 h-3.5" /> Facturas
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{cliente.facturas.length}</div>
        </div>
      </div>

      {/* Suscripción activa */}
      {cliente.suscripcion_activa && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-green-900">
              Plan activo: {cliente.suscripcion_activa.plan?.nom_plan}
            </div>
            <div className="text-xs text-green-700 mt-0.5">
              Vigencia: {fmtDate(cliente.suscripcion_activa.fecha_inicio)} → {fmtDate(cliente.suscripcion_activa.fecha_fin)}
            </div>
          </div>
          <Badge color="green">Activo</Badge>
        </div>
      )}

      {/* Mascotas */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Mascotas ({cliente.mascotas.length})</h3>
        </div>
        {cliente.mascotas.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Este cliente no ha registrado mascotas todavía.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {cliente.mascotas.map((m: any) => (
              <div key={m.id_mascota} className="bg-gray-50 rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center">
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{m.nom_mascota}</p>
                    <p className="text-xs text-gray-500">{m.raza ?? "—"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
                  <div><span className="text-gray-400">Edad:</span> {m.edad ?? "—"} años</div>
                  <div><span className="text-gray-400">Peso:</span> {m.peso ?? "—"} kg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial de citas */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Historial de citas ({cliente.citas.length})</h3>
        </div>
        {cliente.citas.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Sin citas registradas.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Mascota</th>
                <th className="px-4 py-3">Paseador</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cliente.citas.map((c: any) => (
                <tr key={c.id_cita} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{fmtDate(c.fecha)}</div>
                    <div className="text-xs text-gray-500">{c.hora?.slice(0, 5)}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.mascota?.nom_mascota ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {c.paseador ? `${c.paseador.nombre} ${c.paseador.apellido}` : <span className="text-amber-600">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={c.id_estado === 4 ? "green" : c.id_estado === 5 ? "red" : "yellow"}>
                      {c.estado?.nom_estado ?? "—"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagos del cliente */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Pagos ({cliente.pagos.length})</h3>
        </div>
        {cliente.pagos.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Sin pagos registrados.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Monto</th>
                <th className="px-4 py-3">Ref Wompi</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cliente.pagos.map((p: any) => (
                <tr key={p.id_pago} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{fmtDateTime(p.fecha_pago)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{fmtCOP(p.monto)}</td>
                  <td className="px-4 py-3"><code className="text-xs text-gray-600">{p.ref_wompi ?? "—"}</code></td>
                  <td className="px-4 py-3">
                    <Badge color={p.id_estado_pago === 2 ? "green" : p.id_estado_pago === 1 ? "yellow" : "red"}>
                      {p.wompi_status ?? "—"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}