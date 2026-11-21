// lib/placas-admin.ts
import { sesion } from "./api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

async function fetchAdmin<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = sesion.obtenerToken();
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).detail || "Error en la petición");
  }
  return res.json();
}

export interface PlacaAdmin {
  id_placa: number;
  codigo: string;
  estado: "disponible" | "activo" | "suspendido" | "perdida";
  lote: string | null;
  material: string | null;
  id_mascota: number | null;
  nom_mascota: string | null;
  nom_dueno: string | null;
  fecha_generacion: string | null;
  fecha_activacion: string | null;
}

export interface PlacasStats {
  total: number;
  disponibles: number;
  activas: number;
  suspendidas: number;
  lotes: { lote: string; cantidad: number }[];
}

export interface PlacasListResponse {
  data: PlacaAdmin[];
  total: number;
  page: number;
  page_size: number;
}

export const placasAdminAPI = {
  stats: (): Promise<PlacasStats> =>
    fetchAdmin<PlacasStats>("/admin/placas/stats"),

  listar: (params: { page?: number; pageSize?: number; estado?: string; lote?: string; search?: string }): Promise<PlacasListResponse> => {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    qs.set("page_size", String(params.pageSize ?? 20));
    if (params.estado && params.estado !== "todos") qs.set("estado", params.estado);
    if (params.lote) qs.set("lote", params.lote);
    if (params.search) qs.set("search", params.search);
    return fetchAdmin<PlacasListResponse>(`/admin/placas?${qs}`);
  },

  generar: (payload: { cantidad: number; lote?: string; material?: string }): Promise<{ generados: number; codigos: string[] }> =>
    fetchAdmin("/placas/generar", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  suspender: (codigo: string): Promise<{ mensaje: string }> =>
    fetchAdmin(`/admin/placas/${codigo}/suspender`, { method: "POST" }),

  reactivar: (codigo: string): Promise<{ mensaje: string }> =>
    fetchAdmin(`/admin/placas/${codigo}/reactivar`, { method: "POST" }),

  exportarCSV: async (estado: string, lote: string): Promise<void> => {
    const token = sesion.obtenerToken();
    const qs = new URLSearchParams();
    if (estado !== "todos") qs.set("estado", estado);
    if (lote) qs.set("lote", lote);
    const res = await fetch(`${API_URL}/admin/placas/export?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Error al exportar");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `placas_${estado}_${lote || "todas"}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};