// lib/api-admin.ts

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function real<T>(path: string, init: RequestInit = {}): Promise<T> {
  // 1. Obtenemos el token del AuthContext
  const token = typeof window !== "undefined" ? localStorage.getItem("petfy_token") : null;

  const res = await fetch(BASE + path, {
    ...init,
    headers: { 
      "Content-Type": "application/json", 
      // 2. Enviamos el token para que Python nos deje pasar
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      ...(init.headers || {}) 
    },
    cache: "no-store",
    // 3. ELIMINAMOS 'credentials: "include"' (era lo que causaba el error 401)
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.message ?? `Error ${res.status}: ${res.statusText}`);
  }
  
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  async getStats() {
    return real<any>("/admin/stats");
  },

  async getUsuarios(params: { search?: string; rol?: string; page?: number; pageSize?: number } = {}) {
    return real<any>("/admin/usuarios?" + new URLSearchParams(params as any));
  },

  async getClientesConDetalle(params: { search?: string; estado?: string; page?: number; pageSize?: number } = {}) {
    return real<any>("/admin/clientes?" + new URLSearchParams(params as any));
  },

  async getClientePorId(id: number) {
    return real<any>(`/admin/clientes/${id}`);
  },

  async getPaseadores(params: { search?: string; estado?: string; page?: number; pageSize?: number } = {}) {
    return real<any>("/admin/paseadores?" + new URLSearchParams(params as any));
  },

  async crearPaseador(data: any) {
    return real<any>("/admin/paseadores", { method: "POST", body: JSON.stringify(data) });
  },

  async togglePaseadorActivo(id: number, activo: boolean) {
    return real<any>(`/admin/paseadores/${id}/activar`, { method: "PUT", body: JSON.stringify({ activo }) });
  },

  async actualizarDisponibilidad(id: number, disponibilidad: any[]) {
    return real<any>(`/admin/paseadores/${id}/disponibilidad`, { method: "PUT", body: JSON.stringify({ disponibilidad }) });
  },

  async getPaseadoresActivos() {
    return real<any>("/admin/paseadores/activos");
  },

  async getAdministradores(params: { search?: string; estado?: string; page?: number; pageSize?: number } = {}) {
    return real<any>("/admin/administradores?" + new URLSearchParams(params as any));
  },

  async crearAdministrador(data: any) {
    return real<any>("/admin/administradores", { method: "POST", body: JSON.stringify(data) });
  },

  async toggleAdministradorActivo(id: number, activo: boolean) {
    return real<any>(`/admin/administradores/${id}/activar`, { method: "PUT", body: JSON.stringify({ activo }) });
  },

  async getPaseos(params: { fecha?: string; estado?: number | string; paseador?: number; page?: number; pageSize?: number } = {}) {
    return real<any>("/admin/paseos?" + new URLSearchParams(params as any));
  },

  async getPaseosHoy() {
    return real<any>("/admin/paseos/hoy");
  },

  async cambiarEstadoPaseo(id: number, nuevoEstado: number) {
    return real<any>(`/admin/paseos/${id}/estado`, { method: "PUT", body: JSON.stringify({ id_estado: nuevoEstado }) });
  },

  async asignarPaseador(id: number, id_usuario_paseador: number | null) {
    return real<any>(`/admin/paseos/${id}/asignar`, { method: "PUT", body: JSON.stringify({ id_usuario_paseador }) });
  },

  async getCitas(params: any = {}) {
    return real<any>("/admin/citas?" + new URLSearchParams(params));
  },

  async getMascotas(page = 1) {
    return real<any>("/admin/mascotas?page=" + page);
  },

  async marcarLlegada(id_cita: number) {
    return real<any>(`/paseos/${id_cita}/llegada`, { method: "POST" });
  },

  async iniciarPaseo(id_cita: number, codigo: string) {
    return real<any>(`/paseos/${id_cita}/iniciar`, { method: "POST", body: JSON.stringify({ codigo }) });
  },

  async finalizarPaseo(id_cita: number, data: { foto: string; novedad?: string }) {
    return real<any>(`/paseos/${id_cita}/finalizar`, { method: "POST", body: JSON.stringify(data) });
  },

  async enviarPuntoGPS(id_cita: number, lat: number, lng: number) {
    return real<any>(`/paseos/${id_cita}/gps`, { method: "POST", body: JSON.stringify({ lat, lng }) });
  },

  async getGananciasPaseador(id_paseador: number) {
    return real<any>(`/admin/paseadores/${id_paseador}/ganancias`);
  },

  async pagarSaldoPaseador(id_paseador: number, monto: number) {
    return real<any>(`/admin/paseadores/${id_paseador}/pagar`, { method: "POST", body: JSON.stringify({ monto }) });
  },

  async getSuscripciones(page = 1) {
    return real<any>("/admin/suscripciones?page=" + page);
  },

  async getServicios() {
    return real<any[]>("/admin/servicios");
  },

  async getPlanes() {
    return real<any[]>("/admin/planes");
  },

  // FINANZAS
  
  async getKpisFinanzas() {
    return real<any>("/admin/finanzas/kpis");
  },

  async getPagos(params: { search?: string; estado?: string; page?: number } = {}) {
    return real<any>("/admin/finanzas/pagos?" + new URLSearchParams(params as any));
  },

  async getFacturas(params: { search?: string; estado?: string; page?: number } = {}) {
    return real<any>("/admin/finanzas/facturas?" + new URLSearchParams(params as any));
  },

  async getDevoluciones(params: { search?: string; estado?: string; page?: number } = {}) {
    return real<any>("/admin/finanzas/devoluciones?" + new URLSearchParams(params as any));
  },

  async cambiarEstadoDevolucion(id: number, estado: number) {
    return real<any>(`/admin/finanzas/devoluciones/${id}`, { 
      method: "PUT", 
      body: JSON.stringify({ id_est_devo: estado }) 
    });
  }
};