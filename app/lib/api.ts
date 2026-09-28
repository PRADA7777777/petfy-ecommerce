const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const WOMPI_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||
  "pub_test_vNlNK9d5Ikh1hN6o5vNM5DNQVodPnF1u";

const STORAGE_KEYS = {
  TOKEN: "petfy_token",
  USUARIO: "petfy_usuario",
  LOGGED: "petfy_logged",
} as const;

// ==================== EVENTO GLOBAL DE SESIÓN ====================

export const AUTH_ERROR_EVENT = "petfy:auth-error";

export interface AuthErrorDetail {
  motivo: "usuario-no-encontrado" | "token-invalido" | "red-caida" | "otro";
  mensaje: string;
  status?: number;
}

function dispararAuthError(detail: AuthErrorDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AuthErrorDetail>(AUTH_ERROR_EVENT, { detail })
  );
}

/**
 * Clasifica la respuesta del backend y dispara el evento global
 * si corresponde a un problema de sesión.
 *
 * Reglas:
 *  - 401                 → token inválido/expirado
 *  - 404 "Usuario no..."  → usuario borrado de la BD
 *  - 403 "verificar"      → no lo tratamos como error de sesión
 */
let redireccionEnCurso = false;

function limpiarSesionLocal() {
  try {
    localStorage.removeItem("petfy_token");
    localStorage.removeItem("petfy_usuario");
    localStorage.removeItem("petfy_logged");
  } catch {
    /* noop */
  }
}

function redirigirALanding(motivo: string) {
  if (typeof window === "undefined") return;
  if (redireccionEnCurso) return;
  redireccionEnCurso = true;

  limpiarSesionLocal();

  const destino = `/?motivo=${encodeURIComponent(motivo)}`;
  if (window.location.pathname === "/" && window.location.search === "") {
    // ya estamos en el landing limpio, no hacemos nada
    redireccionEnCurso = false;
    return;
  }
  window.location.href = destino;
}

function evaluarRespuestaAuth(status: number, detail: string): boolean {
  const txt = (detail || "").toLowerCase();

  // 401 → token expirado / inválido
  if (status === 401) {
    redirigirALanding("token-invalido");
    return true;
  }

  // 404 "Usuario no encontrado" → usuario borrado de la BD
  if (status === 404 && /usuario\s+no\s+encontrado/i.test(txt)) {
    redirigirALanding("usuario-no-encontrado");
    return true;
  }

  return false;
}

// ==================== TIPOS ====================

export interface TipoDocumento {
  id_tipo_doc: number;
  nom_tipo_doc: string;
}

export interface RegistroData {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  telefono: string;
  direccion: string;
  idtipodoc: number;
  numdoc: string;
}

export interface LoginData {
  correo: string;
  contrasena: string;
}

export interface Usuario {
  idusuario: number;
  id_usuario?: number;
  nombre: string;
  apellido: string;
  correo: string;
  telefono?: string | null;
  direccion?: string | null;
  verificado?: boolean;
  id_tipo_doc?: number | null;
  nom_tipo_doc?: string | null;
  num_doc?: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
  primer_ingreso: boolean;
  tiene_mascotas: boolean;
}

export interface MascotaData {
  nommascota: string;
  raza?: string;
  peso?: number;
  edad?: number;
  carne_vacunacion?: string;
  otras_indicaciones?: string;
  observar_condicion?: string;
  observar_comportamiento?: string;
  img_masc?: string;
  id_raza?: number;
  id_comportamiento?: number;
  id_condicion_medica?: number;
}

export interface Mascota {
  id_mascota: number;
  nom_mascota: string;
  raza?: string;
  nom_raza?: string;
  peso?: number;
  edad?: number;
  carne_vacunacion?: string;
  otras_indicaciones?: string;
  observar_condicion?: string;
  observar_comportamiento?: string;
  img_masc?: string;
  id_raza?: number;
  id_comportamiento?: number;
  id_condicion_medica?: number;
}

export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface ActualizarPerfilPayload {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string | null;
  direccion: string | null;
}

export interface CambiarPasswordPayload {
  contrasena_actual: string;
  contrasena_nueva: string;
}

export interface Servicio {
  id_servicio: number;
  nombre: string;
  descripcion?: string;
  icono?: string;
  orden: number;
}

export interface Plan {
  id_plan: number;
  nom_plan: string;
  descripcion?: string;
  precio_actual: number;
  dias_permitidos: number;
  duracion_minutos?: number;
  orden: number;
  id_servicio: number;
}

export interface DiaDisponible {
  dia_semana: number;
  label: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface ExcepcionDisponibilidad {
  fecha: string;
  motivo?: string;
  es_laborable: boolean;
}

export interface DisponibilidadPlan {
  id_plan: number;
  id_servicio: number;
  dias_permitidos: number;
  dias_disponibles: DiaDisponible[];
  excepciones: ExcepcionDisponibilidad[];
}

export interface CitaRequest {
  id_mascota: number;
  id_plan: number;
  fecha: string;
  hora: string;
  zona?: string;
  direccion: string;
  complemento_direccion?: string;
  es_conjunto?: boolean;
  torre?: string;
  apto?: string;
  dias_semana?: string[];
  persona_entrega?: string;
  persona_recibe?: string;
  es_paseo_prueba?: boolean;
  recurrente?: boolean;
}

export interface CitaGenerada {
  id_cita: number;
  fecha: string;
  hora: string;
}

export interface CitaResponse {
  id_cita: number;
  monto: number;
  referencia: string;
  estado: string;
  firma_integridad: string;
  id_suscripcion?: number | null;
  citas_generadas?: CitaGenerada[];
}

export interface CitaResumen {
  id_cita: number;
  fecha: string;
  hora: string | null;
  zona?: string | null;
  direccion?: string | null;
  precio_final: number;
  id_estado: number;
  nom_estado: string;
  id_mascota: number;
  nom_mascota: string;
  id_plan?: number | null;
  nom_plan: string;
  duracion_minutos: number;
  es_paseo_prueba: boolean;
  id_usuario_paseador?: number | null;
  id_suscripcion?: number | null;
  dias_semana?: string | null;
}

export interface PaseoPruebaDisponible {
  disponible: boolean;
  id_cita_prueba: number | null;
  id_estado_prueba: number | null;
}

export interface FacturaResumen {
  id_factura: number;
  num_factura: string;
  fecha_emision: string | null;
  total: number;
  moneda: string;
  id_est_fact: number | null;
  id_cita: number | null;
  id_pago: number | null;
}

export interface FacturaDetalle {
  id: number;
  concepto: string;
  cantidad: number;
  precio_uni: number;
  iva: number;
  total_linea: number;
}

export interface FacturaCompleta extends FacturaResumen {
  fecha_vencimiento: string | null;
  plan_pago: string | null;
  nombre_cliente: string | null;
  documento_cliente: string | null;
  correo_cliente: string | null;
  direccion_cliente: string | null;
  telefono_cliente: string | null;
  sub_total: number;
  iva: number;
  observaciones: string | null;
  cufe: string | null;
  detalles: FacturaDetalle[];
  pago: {
    id_pago: number;
    id_trans_wompi: string | null;
    ref_wompi: string | null;
    payment_method_type: string | null;
    card_last_four: string | null;
    bank_name: string | null;
    wompi_status: string | null;
    wompi_finalized_at: string | null;
  } | null;
}

export interface SuscripcionActiva {
  id_suscripcion: number;
  id_mascota: number;
  nom_mascota: string;
  id_plan: number;
  nom_plan: string;
  dias_permitidos: number;
  precio_actual: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  dias_restantes: number;
  activa: boolean;
  dias_semana?: string | null;
  hora_preferida?: string | null;

  ya_iniciada?: boolean;
  fechas_rutina?: string[];
  proximo_paseo?: string | null;
  puede_cambiar_rutina?: boolean;
}

export interface SuscripcionDetalle extends SuscripcionActiva {
  citas: {
    id_cita: number;
    fecha: string;
    hora: string | null;
    id_estado: number | null;
    nom_estado: string;
  }[];
}

export interface SlotHora {
  hora: string;
  ocupados: number;
  capacidad: number;
  disponible: boolean;
}

export interface DisponibilidadDia {
  fecha: string;
  laborable: boolean;
  motivo?: string | null;
  slots: SlotHora[];
}

export interface CandidatoCambio {
  fecha: string;
  disponible: boolean;
  motivo: string | null;
}

export interface DiasCambioDisponibles {
  id_cita: number;
  fecha_original: string;
  hora: string;
  dias_rutina: number[];
  candidatos: CandidatoCambio[];
  bloqueada: boolean;
  motivo: string | null;
}

export type DisponibilidadRango = Record<string, DisponibilidadDia>;

// ==================== FETCH HELPER ====================

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    dispararAuthError({
      motivo: "red-caida",
      mensaje: "Se perdió la conexión con el servidor.",
    });
    throw new Error("Sin conexión con el servidor.");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail =
      (data as { detail?: string }).detail || "Error en la petición";
    evaluarRespuestaAuth(res.status, detail);
    throw new Error(detail);
  }
  return data as T;
}

/**
 * Helper para los fetch() crudos: hace fetch, maneja red caída,
 * clasifica la respuesta y lanza Error con el detail del backend.
 */
async function fetchRaw<T>(
  url: string,
  options: RequestInit = {},
  fallbackMsg = "Error en la petición"
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    dispararAuthError({
      motivo: "red-caida",
      mensaje: "Se perdió la conexión con el servidor.",
    });
    throw new Error("Sin conexión con el servidor.");
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    const detail = err.detail || fallbackMsg;
    evaluarRespuestaAuth(res.status, detail);
    throw new Error(detail);
  }

  // 204 No Content → devolvemos null como any
  if (res.status === 204) return null as T;

  return (await res.json()) as T;
}

// ==================== AUTH ====================

export const authAPI = {
  getTiposDocumento: () =>
    fetchAPI<TipoDocumento[]>("/auth/tipos-documento"),

  registro: (data: RegistroData) =>
    fetchAPI<{ mensaje: string; idusuario: number; correo: string }>(
      "/auth/registro",
      { method: "POST", body: JSON.stringify(data) }
    ),

  verificar: (correo: string, codigo: string) =>
    fetchAPI<{ mensaje: string }>("/auth/verificar", {
      method: "POST",
      body: JSON.stringify({ correo, codigo }),
    }),

  reenviarCodigo: (correo: string) =>
    fetchAPI<{ mensaje: string }>("/auth/reenviar-codigo", {
      method: "POST",
      body: JSON.stringify({ correo }),
    }),

  login: (data: LoginData) =>
    fetchAPI<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ==================== MASCOTAS ====================

export const mascotasAPI = {
  crear: (data: MascotaData, token: string): Promise<Mascota> =>
    fetchRaw<Mascota>(
      `${API_URL}/mascotas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
      "No se pudo crear la mascota"
    ),

  actualizar: (id: number, data: MascotaData, token: string): Promise<Mascota> =>
    fetchRaw<Mascota>(
      `${API_URL}/mascotas/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
      "No se pudo actualizar la mascota"
    ),

  listar: (token: string) =>
    fetchAPI<Mascota[]>("/mascotas", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  eliminar: (id: number, token: string) =>
    fetchAPI<{ mensaje: string }>(`/mascotas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  getComportamientos: () =>
    fetchAPI<CatalogoItem[]>("/mascotas/catalogos/comportamientos"),

  getCondiciones: () =>
    fetchAPI<CatalogoItem[]>("/mascotas/catalogos/condiciones"),

  getRazas: () => fetchAPI<CatalogoItem[]>("/mascotas/catalogos/razas"),
};

// ==================== SERVICIOS ====================

export const serviciosAPI = {
  listar: (): Promise<Servicio[]> =>
    fetchRaw<Servicio[]>(`${API_URL}/servicios`, {}, "No se pudieron cargar los servicios"),
};

// ==================== PLANES ====================

export const planesAPI = {
  listar: (servicio?: string): Promise<Plan[]> => {
    const url = servicio
      ? `${API_URL}/planes?servicio=${encodeURIComponent(servicio)}`
      : `${API_URL}/planes`;
    return fetchRaw<Plan[]>(url, {}, "No se pudieron cargar los planes");
  },

  disponibilidad: (idPlan: number): Promise<DisponibilidadPlan> =>
    fetchRaw<DisponibilidadPlan>(
      `${API_URL}/planes/${idPlan}/disponibilidad`,
      {},
      "No se pudo cargar la disponibilidad"
    ),
};

// ==================== CITAS ====================

export const citasAPI = {
  crear: (data: CitaRequest, token: string): Promise<CitaResponse> =>
    fetchRaw<CitaResponse>(
      `${API_URL}/citas`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
      "No se pudo crear la cita"
    ),

  listar: (token: string): Promise<CitaResumen[]> =>
    fetchRaw<CitaResumen[]>(
      `${API_URL}/citas`,
      { headers: { Authorization: `Bearer ${token}` } },
      "No se pudieron cargar las citas"
    ),

  paseoPruebaDisponible: (
    idMascota: number,
    token: string
  ): Promise<PaseoPruebaDisponible> =>
    fetchRaw<PaseoPruebaDisponible>(
      `${API_URL}/citas/mascotas/${idMascota}/paseo-prueba-disponible`,
      { headers: { Authorization: `Bearer ${token}` } },
      "No se pudo consultar el paseo de prueba"
    ),

  disponibilidadDia: (
    fecha: string,
    idPlan: number,
    token: string
  ): Promise<DisponibilidadDia> =>
    fetchRaw<DisponibilidadDia>(
      `${API_URL}/citas/disponibilidad?fecha=${fecha}&id_plan=${idPlan}`,
      { headers: { Authorization: `Bearer ${token}` } },
      "No se pudo consultar la disponibilidad"
    ),

  disponibilidadRango: (
    desde: string,
    hasta: string,
    idPlan: number,
    dias: string[],
    token: string
  ): Promise<DisponibilidadRango> => {
    const params = new URLSearchParams({
      desde,
      hasta,
      id_plan: String(idPlan),
      dias: dias.join(","),
    });
    return fetchRaw<DisponibilidadRango>(
      `${API_URL}/citas/disponibilidad-rango?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
      "No se pudo consultar la disponibilidad"
    );
  },

  reprogramar: (
    idCita: number,
    data: { fecha: string; hora?: string },
    token: string
  ): Promise<{ mensaje: string; id_cita: number; fecha: string; hora: string }> =>
    fetchRaw(
      `${API_URL}/citas/${idCita}/reprogramar`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
      "No se pudo reprogramar la cita"
    ),

diasCambioDisponibles: (idCita: number, token: string): Promise<DiasCambioDisponibles> =>
  fetchRaw<DiasCambioDisponibles>(
    `${API_URL}/citas/${idCita}/dias-cambio-disponibles`,
    { headers: { Authorization: `Bearer ${token}` } },
    "No se pudieron cargar los días disponibles"
  ),

cambiarDia: (
  idCita: number,
  fecha: string,
  token: string
): Promise<{
  mensaje: string;
  id_cita: number;
  fecha_anterior: string;
  fecha_nueva: string;
  hora: string;
}> =>
  fetchRaw(
    `${API_URL}/citas/${idCita}/cambiar-dia`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fecha }),
    },
    "No se pudo cambiar el día"
  ),

};

// ==================== SUSCRIPCIONES ====================

export const suscripcionesAPI = {
  mia: async (token: string): Promise<SuscripcionActiva | null> => {
    // 404 aquí NO significa usuario borrado, así que llamamos fetchRaw normal
    return fetchRaw<SuscripcionActiva | null>(
      `${API_URL}/suscripciones/mia`,
      { headers: { Authorization: `Bearer ${token}` } },
      "No se pudo consultar la suscripción"
    );
  },

  detalle: (id: number, token: string): Promise<SuscripcionDetalle> =>
    fetchRaw<SuscripcionDetalle>(
      `${API_URL}/suscripciones/${id}`,
      { headers: { Authorization: `Bearer ${token}` } },
      "No se pudo obtener la suscripción"
    ),

  cambiarRutina: (
    idSuscripcion: number,
    diasSemana: string[],
    token: string
  ): Promise<{
    mensaje: string;
    id_suscripcion: number;
    dias_semana: string[];
    citas_generadas: number;
    fecha_inicio: string;
    fecha_fin: string;
  }> =>
    fetchRaw(
      `${API_URL}/citas/suscripciones/${idSuscripcion}/rutina`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dias_semana: diasSemana }),
      },
      "No se pudo actualizar la rutina"
    ),

  mias: (token: string): Promise<SuscripcionActiva[]> =>
  fetchRaw<SuscripcionActiva[]>(
    `${API_URL}/suscripciones/mias`,
    { headers: { Authorization: `Bearer ${token}` } },
    "No se pudieron cargar las suscripciones"
  ),
};

// ==================== SESIÓN ====================

export const sesion = {
  guardar: (data: LoginResponse) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, data.access_token);
    localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(data.usuario));
    localStorage.setItem(STORAGE_KEYS.LOGGED, "true");
  },

  obtenerToken: () => localStorage.getItem(STORAGE_KEYS.TOKEN),

  obtenerUsuario: (): Usuario | null => {
    const u = localStorage.getItem(STORAGE_KEYS.USUARIO);
    return u ? JSON.parse(u) : null;
  },

  cerrar: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USUARIO);
    localStorage.removeItem(STORAGE_KEYS.LOGGED);
  },

  estaLogueado: () => localStorage.getItem(STORAGE_KEYS.LOGGED) === "true",
};

// ==================== PERFIL ====================

export const perfilAPI = {
  tiposDocumento: (): Promise<TipoDocumento[]> =>
    fetchRaw<TipoDocumento[]>(
      `${API_URL}/auth/tipos-documento`,
      {},
      "No se pudieron cargar los tipos de documento"
    ),

  actualizar: (token: string, datos: ActualizarPerfilPayload): Promise<Usuario> =>
    fetchRaw<Usuario>(
      `${API_URL}/auth/perfil`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
      },
      "No se pudo actualizar el perfil"
    ),

  cambiarPassword: (
    token: string,
    datos: CambiarPasswordPayload
  ): Promise<{ mensaje: string }> =>
    fetchRaw<{ mensaje: string }>(
      `${API_URL}/auth/cambiar-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
      },
      "No se pudo cambiar la contraseña"
    ),
};

// ==================== FACTURACIÓN ====================

export const facturacionAPI = {
  listar: (token: string): Promise<FacturaResumen[]> =>
    fetchRaw<FacturaResumen[]>(
      `${API_URL}/facturacion`,
      { headers: { Authorization: `Bearer ${token}` } },
      "Error al listar facturas"
    ),

  detalle: (id: number, token: string): Promise<FacturaCompleta> =>
    fetchRaw<FacturaCompleta>(
      `${API_URL}/facturacion/${id}`,
      { headers: { Authorization: `Bearer ${token}` } },
      "Error al obtener detalle"
    ),

  descargarPDF: async (
    id: number,
    token: string,
    numFactura: string
  ): Promise<void> => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/facturacion/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      dispararAuthError({
        motivo: "red-caida",
        mensaje: "Se perdió la conexión con el servidor.",
      });
      throw new Error("Sin conexión con el servidor.");
    }

    if (!res.ok) {
      evaluarRespuestaAuth(res.status, "Error al generar PDF");
      throw new Error("Error al generar PDF");
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${numFactura}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};