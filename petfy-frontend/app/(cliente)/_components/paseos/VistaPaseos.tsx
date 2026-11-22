"use client";

import { useEffect, useMemo, useState } from "react";
import {
  citasAPI, sesion, suscripcionesAPI,
  CitaResumen, SuscripcionActiva, Usuario, Mascota,
} from "@/lib/api";
import CalendarioPaseos from "./CalendarioPaseos";
import MapaPaseo from "./MapaPaseo/MapaPaseo";
import "./paseos.css";
// Datos reales del paseo de hoy (georreferenciación): estado, recorrido y código
import type { CodigoPaseo, RutaPaseo } from "@/lib/api";
import { usePaseosDeHoy, useCodigosDeHoy, estadoActual, compartirCodigo, ordenarPaseosDeHoy } from "./paseoHoy";

interface VistaPaseosProps {
  usuario: Usuario;
  mascotas: Mascota[];
  onAgendar: () => void;
  recargarKey?: number;
  onCambiarVista: (v: any) => void;
}

type Tab = "hoy" | "calendario";

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmtFechaCorta = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
  }).format(new Date(y, m - 1, d));
};

const fmtHoraAMPM = (horaStr: string | null | undefined) => {
  if (!horaStr) return "";
  const [h, m] = horaStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const calcularHoraLlegada = (
  horaStr: string | null,
  duracionMin: number | undefined
) => {
  if (!horaStr) return "";
  const [h, m] = horaStr.split(":").map(Number);
  const total = h * 60 + m + (duracionMin ?? 55);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return fmtHoraAMPM(
    `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
  );
};

const esCitaPasada = (fecha: string, hora: string | null) => {
  if (!hora) return false;
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm) < new Date();
};

const esHoy = (fecha: string) => {
  const hoy = new Date();
  const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  return fecha === iso;
};

const humanizarFecha = (iso: string) => {
  if (!iso) return "—";
  const hoy = new Date();
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const hoyMid = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diff = Math.round((fecha.getTime() - hoyMid.getTime()) / 86_400_000);

  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff > 1 && diff <= 6) return `En ${diff} días`;
  if (diff < -1) return `Hace ${Math.abs(diff)} días`;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
  }).format(fecha);
};

const getEstadoBadge = (
  idEstado: number,
  fecha: string,
  hora: string | null
) => {
  if (idEstado === 5)
    return <span className="status-badge status-cancelada">Cancelado</span>;
  // Hoy se muestra el estado real del paseo (un paseo puede empezar después de su hora)
  if (esCitaPasada(fecha, hora) && !esHoy(fecha))
    return <span className="status-badge status-completada">Completado</span>;
  switch (idEstado) {
    case 1:
      return <span className="status-badge status-pendiente">Programado</span>;
    case 2:
      return <span className="status-badge status-confirmada">Confirmado</span>;
    case 3:
      return <span className="status-badge status-encurso">En Curso</span>;
    case 4:
      return <span className="status-badge status-completada">Completado</span>;
    default:
      return <span className="status-badge status-pendiente">Programado</span>;
  }
};

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════

export default function VistaPaseos({
  usuario,
  mascotas,
  onAgendar,
  recargarKey,
  onCambiarVista,
}: VistaPaseosProps) {
  const [citas, setCitas] = useState<CitaResumen[]>([]);
  const [suscs, setSuscs] = useState<SuscripcionActiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [mascotaFiltro, setMascotaFiltro] = useState<number | "todos">("todos");
  const [tab, setTab] = useState<Tab>("hoy");

  useEffect(() => {
    async function cargar() {
      const token = sesion.obtenerToken();
      if (!token) return;
      try {
        const [dataC, dataS] = await Promise.all([
          citasAPI.listar(token),
          suscripcionesAPI.mias(token).catch(() => []),
        ]);
        setCitas(dataC);
        setSuscs(dataS);
      } finally {
        setLoading(false);
      }
    }
    if (mascotas.length > 0) cargar();
    else setLoading(false);
  }, [recargarKey, mascotas.length]);

  const citasFiltradas = useMemo(
    () =>
      mascotaFiltro === "todos"
        ? citas
        : citas.filter((c) => c.id_mascota === mascotaFiltro),
    [citas, mascotaFiltro]
  );

  // Recorrido y código de los paseos de hoy, consultados al backend cada 10 s
  const rutasHoy = usePaseosDeHoy(citasFiltradas);
  const codigosHoy = useCodigosDeHoy(citasFiltradas);

  const { paseosHoy, proximosPaseos, historialPaseos, paseoDestacado } =
    useMemo(() => {
      const hoyArr: CitaResumen[] = [];
      const proxArr: CitaResumen[] = [];
      const histArr: CitaResumen[] = [];

      citasFiltradas.forEach((c) => {
        if (c.id_estado === 5) return;
        // Los de hoy se quedan en "Hoy" (en curso o completados) para seguirlos en el mapa
        const pasada = esCitaPasada(c.fecha, c.hora) && !esHoy(c.fecha);
        if (pasada || (c.id_estado === 4 && !esHoy(c.fecha))) {
          histArr.push(c);
        } else if (esHoy(c.fecha)) {
          hoyArr.push(c);
          if (estadoActual(c, rutasHoy) !== 4) proxArr.push(c);
        } else {
          proxArr.push(c);
        }
      });

      proxArr.sort(
        (a, b) =>
          a.fecha.localeCompare(b.fecha) ||
          (a.hora || "").localeCompare(b.hora || "")
      );
      histArr.sort(
        (a, b) =>
          b.fecha.localeCompare(a.fecha) ||
          (b.hora || "").localeCompare(a.hora || "")
      );

      const hoyOrdenados = ordenarPaseosDeHoy(hoyArr, rutasHoy);
      const destacado =
        hoyOrdenados[0] ??
        proxArr.find((c) => !esCitaPasada(c.fecha, c.hora)) ??
        null;

      return {
        paseosHoy: hoyOrdenados,
        proximosPaseos: proxArr,
        historialPaseos: histArr,
        paseoDestacado: destacado,
      };
    }, [citasFiltradas, rutasHoy]);

  const suscActiva = useMemo(() => {
    if (mascotaFiltro === "todos") return null;
    return suscs.find((s) => s.id_mascota === mascotaFiltro && s.activa) ?? null;
  }, [suscs, mascotaFiltro]);

  const tabsMascotas = useMemo(
    () => mascotas.map((m) => ({ id: m.id_mascota, nombre: m.nom_mascota })),
    [mascotas]
  );

  const waLink = `https://wa.me/573204829244?text=${encodeURIComponent(
    "Hola Petfy, necesito ayuda con un paseo de mi mascota."
  )}`;

  // ── Sin mascotas ──────────────────────────────────────────
  if (mascotas.length === 0) {
    return (
      <div className="perfil-vista active">
        <div className="vp-empty-state">
          <div className="vp-empty-icon">🐾</div>
          <h3>¡Aún no tienes mascotas registradas!</h3>
          <p>
            Para agendar un paseo, primero registra a tu peludo. El primer paseo
            es <strong>gratis</strong>.
          </p>
          <button
            className="btn-perfil btn-primary"
            onClick={() => onCambiarVista("mascotas")}
          >
            Registrar mi primera mascota
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="perfil-vista active vp-wrapper">
      <div className="vp-container">
        {/* Header */}
        <div className="vp-header">
          <div className="vp-title">
            <h3>🐕 Mis Paseos</h3>
            <p>
              Hola <strong>{usuario.nombre}</strong>, gestiona la agenda de tus
              peludos.
            </p>
          </div>
          <button className="vp-btn-agendar" onClick={onAgendar}>
            <i className="fas fa-plus"></i> Agendar Paseo
          </button>
        </div>

        {/* Tabs principales */}
        <div className="ph-tabs">
          <button
            className={`ph-tab ${tab === "hoy" ? "activo" : ""}`}
            onClick={() => setTab("hoy")}
          >
            <i className="fas fa-bolt"></i> Hoy
          </button>
          <button
            className={`ph-tab ${tab === "calendario" ? "activo" : ""}`}
            onClick={() => setTab("calendario")}
          >
            <i className="fas fa-calendar-alt"></i> Calendario
          </button>
        </div>

        {/* Filtro mascotas */}
        <div className="vp-tabs">
          <button
            className={`vp-tab ${mascotaFiltro === "todos" ? "activo" : ""}`}
            onClick={() => setMascotaFiltro("todos")}
          >
            🐾 Todos
          </button>
          {tabsMascotas.map((m) => (
            <button
              key={m.id}
              className={`vp-tab ${mascotaFiltro === m.id ? "activo" : ""}`}
              onClick={() => setMascotaFiltro(m.id)}
            >
              {m.nombre}
            </button>
          ))}
        </div>

        {/* ═══════════ TAB: HOY ═══════════ */}
        {tab === "hoy" &&
          (loading ? (
            <p className="ph-loading">Cargando paseo…</p>
          ) : !paseoDestacado ? (
            <div className="ph-empty">
              <div className="ph-empty-icon">🐾</div>
              <h3>No tienes paseos programados</h3>
              <p>
                Agenda un paseo para ver aquí el mapa, el paseador y el código
                de entrega.
              </p>
              <button
                className="btn-perfil btn-primary"
                onClick={onAgendar}
              >
                Agendar Paseo
              </button>
              {historialPaseos.length > 0 && (
                <HistorialSection paseos={historialPaseos} />
              )}
            </div>
          ) : (
            <>
              <PaseoDestacado
                paseo={paseoDestacado}
                ruta={rutasHoy[paseoDestacado.id_cita]}
                codigo={codigosHoy[paseoDestacado.id_cita]}
              />
              <PaseosHoySection
                paseos={paseosHoy.filter(
                  (c) => c.id_cita !== paseoDestacado.id_cita
                )}
                rutas={rutasHoy}
              />
              <HistorialSection paseos={historialPaseos} />
            </>
          ))}

        {/* ═══════════ TAB: CALENDARIO ═══════════ */}
        {tab === "calendario" && (
          <div className="vp-layout">
            <div className="vp-main-card">
              <div className="vp-calendario-wrapper">
                {loading ? (
                  <p className="ph-loading">Cargando agenda…</p>
                ) : (
                  <CalendarioPaseos
                    citas={citasFiltradas}
                    mascotas={mascotas}
                  />
                )}
              </div>
            </div>

            <div className="vp-sidebar">
              {suscActiva ? (
                <div className="vp-plan-banner">
                  <div className="vp-plan-info">
                    <h4>Plan de {suscActiva.nom_mascota}</h4>
                    <p>
                      {suscActiva.nom_plan
                        .toLowerCase()
                        .includes("bienvenida") ||
                      suscActiva.nom_plan.toLowerCase().includes("prueba")
                        ? "Paseo de prueba gratuito"
                        : `${suscActiva.nom_plan} · ${fmtFechaCorta(
                            suscActiva.fecha_inicio || ""
                          )} al ${fmtFechaCorta(suscActiva.fecha_fin || "")}`}
                    </p>
                    <div className="vp-plan-dias">
                      {(suscActiva.dias_semana || "")
                        .split(",")
                        .filter(Boolean)
                        .map((d) => (
                          <span key={d} className="vp-plan-dia">
                            {d}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ) : mascotaFiltro !== "todos" ? (
                <div className="vp-plan-banner vp-plan-empty">
                  <div className="vp-plan-info">
                    <h4>Sin plan activo</h4>
                    <p>Esta mascota no tiene un plan vigente.</p>
                  </div>
                  <button
                    className="btn-perfil btn-primary"
                    onClick={onAgendar}
                  >
                    Ver Planes
                  </button>
                </div>
              ) : null}

              {paseosHoy.length > 0 && (
                <div className="vp-card-hoy">
                  <div className="vp-hoy-badge">¡HOY!</div>
                  <h4>Tus paseos para hoy</h4>
                  <div className="vp-hoy-lista">
                    {paseosHoy.map((c) => (
                      <div key={c.id_cita} className="vp-hoy-item">
                        <div className="vp-hoy-hora">
                          {fmtHoraAMPM(c.hora)}
                        </div>
                        <div className="vp-hoy-info">
                          <strong>{c.nom_mascota}</strong>
                          <span>{c.nom_plan}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="vp-card-proximo">
                <h4>Próximos paseos</h4>
                {proximosPaseos.length === 0 ? (
                  <p className="vp-empty-text">No tienes paseos programados.</p>
                ) : (
                  <div className="vp-scroll-lista">
                    {proximosPaseos.map((c) => (
                      <div key={c.id_cita} className="prox-item">
                        <div className="prox-item-info">
                          <span className="prox-item-fecha">
                            {fmtFechaCorta(c.fecha)}
                          </span>
                          <span className="prox-item-hora">
                            {fmtHoraAMPM(c.hora)} · {c.nom_mascota}
                          </span>
                        </div>
                        {getEstadoBadge(c.id_estado, c.fecha, c.hora)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="vp-card-historial">
                <h4>Historial reciente</h4>
                {historialPaseos.length === 0 ? (
                  <p className="vp-empty-text">Aún no hay paseos completados.</p>
                ) : (
                  <div className="vp-scroll-lista">
                    {historialPaseos.map((c) => (
                      <div key={c.id_cita} className="prox-item">
                        <div className="prox-item-info">
                          <span className="prox-item-fecha">
                            {fmtFechaCorta(c.fecha)}
                          </span>
                          <span className="prox-item-hora">
                            {c.nom_mascota}
                          </span>
                        </div>
                        <span className="status-badge status-completada">
                          Completado
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="vp-card-contacto">
                <h4>¿Quieres cambiar un día?</h4>
                <p>Si necesitas mover un paseo, contáctanos.</p>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-vp"
                >
                  <i className="fab fa-whatsapp"></i> Contactar Soporte
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTE: Paseo destacado (el del día)
// ═══════════════════════════════════════════════════════════

function PaseoDestacado({
  paseo,
  ruta,
  codigo,
}: {
  paseo: CitaResumen;
  ruta?: RutaPaseo;
  codigo?: CodigoPaseo;
}) {
  const esDeHoy = esHoy(paseo.fecha);
  const direccion =
    [paseo.direccion, paseo.zona].filter(Boolean).join(", ") ||
    "Dirección no disponible";

  // Con el paseo iniciado se usan la hora real de salida y la de fin
  const estado = ruta?.id_estado ?? paseo.id_estado;
  const horaSalida = fmtHoraAMPM(ruta?.inicio?.slice(11, 16) ?? paseo.hora);
  const horaLlegada = ruta?.fin
    ? fmtHoraAMPM(ruta.fin.slice(11, 16))
    : calcularHoraLlegada(paseo.hora, paseo.duracion_minutos);
  const enVivo = estado === 3;

  return (
    <div className="ph-layout">
      {/* Mapa */}
      <MapaPaseo
        direccion={direccion}
        estadoId={estado}
        hayPaseador={!!paseo.id_usuario_paseador}
        ruta={ruta}
        duracionMin={paseo.duracion_minutos}
      />

      {/* Panel derecho */}
      <aside className="ph-side">
        {/* Salida + Llegada */}
        <div className="ph-info-card ph-info-tiempos">
          <div className="ph-tiempo-row">
            <div className="ph-tiempo-item">
              <span className="ph-info-label">
                <i className="fas fa-sign-out-alt"></i> Salida
              </span>
              <span className="ph-info-value">{horaSalida || "—"}</span>
              <span className="ph-info-sub">
                {esDeHoy ? "Hoy" : fmtFechaCorta(paseo.fecha)}
              </span>
            </div>
            <div className="ph-tiempo-arrow">→</div>
            <div className="ph-tiempo-item">
              <span className="ph-info-label">
                <i className="fas fa-sign-in-alt"></i> Llegada
              </span>
              <span className="ph-info-value">{horaLlegada || "—"}</span>
              <span className="ph-info-sub">
                {ruta?.fin ? "Real" : "Estimada"}
              </span>
            </div>
          </div>
          {enVivo && (
            <div className="ph-live-badge">
              <span className="ph-live-dot" />
              En vivo · {paseo.duracion_minutos ?? 55} min
            </div>
          )}
        </div>

        {/* Paseador */}
        <div className="ph-info-card ph-info-paseador">
          <span className="ph-info-label">
            <i className="fas fa-user"></i> Paseador
          </span>
          <div className="ph-paseador-row">
            <div className="ph-avatar">🐾</div>
            <div>
              <strong className="ph-paseador-nombre">
                {ruta?.nombre_paseador ??
                  (paseo.id_usuario_paseador
                    ? `Asignado #${paseo.id_usuario_paseador}`
                    : "Aún sin asignar")}
              </strong>
              <span className="ph-paseador-sub">
                {paseo.id_usuario_paseador
                  ? "Verificado por Petfy"
                  : "Te avisaremos pronto"}
              </span>
            </div>
          </div>
        </div>

        {/* Código del paseo: el paseador lo pide para iniciar; desaparece cuando el paseo empieza */}
        {codigo && estado === 2 && (
          <div className="ph-info-card ph-info-codigo">
            <span className="ph-info-label">
              <i className="fas fa-key"></i> Código del paseo
            </span>
            <div className="ph-codigo-row">
              {codigo.codigo
                .split("")
                .map((d, i) => (
                  <span key={i} className="ph-codigo-digito">
                    {d}
                  </span>
                ))}
            </div>
            <span className="ph-info-sub">
              Dáselo al paseador cuando llegue por tu mascota
            </span>
            <button
              type="button"
              className="btn-whatsapp-vp"
              onClick={() => compartirCodigo(paseo.nom_mascota, codigo.codigo)}
            >
              <i className="fab fa-whatsapp"></i> Compartir código
            </button>
          </div>
        )}
      </aside>

      {/* Detalle inferior */}
      <div className="ph-detalle-card">
        <div className="ph-detalle-row">
          <span className="ph-detalle-icon">🐕</span>
          <div>
            <strong>{paseo.nom_mascota}</strong>
            <span className="ph-detalle-sub">{paseo.nom_plan}</span>
          </div>
        </div>
        <div className="ph-detalle-row">
          <span className="ph-detalle-icon">⏱️</span>
          <div>
            <strong>{paseo.duracion_minutos ?? 55} min</strong>
            <span className="ph-detalle-sub">Duración del paseo</span>
          </div>
        </div>
        <div className="ph-detalle-row">
          <span className="ph-detalle-icon">
            {getEstadoBadge(estado, paseo.fecha, paseo.hora)}
          </span>
          <div>
            <strong>Estado del paseo</strong>
            <span className="ph-detalle-sub">
              {paseo.nom_estado ?? "Programado"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTE: Otros paseos de hoy
// ═══════════════════════════════════════════════════════════

function PaseosHoySection({
  paseos,
  rutas,
}: {
  paseos: CitaResumen[];
  rutas: Record<number, RutaPaseo>;
}) {
  if (paseos.length === 0) return null;

  return (
    <div className="ph-seccion">
      <h4 className="ph-seccion-titulo">📅 Hoy también</h4>
      <div className="ph-seccion-lista">
        {paseos.map((c) => (
          <div key={c.id_cita} className="ph-seccion-item">
            <div className="ph-seccion-hora">{fmtHoraAMPM(c.hora)}</div>
            <div className="ph-seccion-info">
              <strong>{c.nom_mascota}</strong>
              <span>{c.nom_plan}</span>
            </div>
            {getEstadoBadge(estadoActual(c, rutas), c.fecha, c.hora)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTE: Historial
// ═══════════════════════════════════════════════════════════

function HistorialSection({ paseos }: { paseos: CitaResumen[] }) {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const visibles = mostrarTodos ? paseos : paseos.slice(0, 4);

  if (paseos.length === 0) return null;

  return (
    <div className="ph-seccion">
      <div className="ph-seccion-header">
        <h4 className="ph-seccion-titulo">📚 Historial reciente</h4>
        {paseos.length > 4 && (
          <button
            className="ph-seccion-link"
            onClick={() => setMostrarTodos((v) => !v)}
          >
            {mostrarTodos ? "Ver menos" : `Ver todos (${paseos.length})`}
          </button>
        )}
      </div>
      <div className="ph-seccion-lista">
        {visibles.map((c) => {
          const horaSalida = fmtHoraAMPM(c.hora);
          const horaLlegada = calcularHoraLlegada(
            c.hora,
            c.duracion_minutos
          );
          return (
            <div
              key={c.id_cita}
              className="ph-seccion-item ph-seccion-item-hist"
            >
              <div className="ph-seccion-fecha">{humanizarFecha(c.fecha)}</div>
              <div className="ph-seccion-info">
                <strong>{c.nom_mascota}</strong>
                <span>
                  {horaSalida} → {horaLlegada} · {c.nom_plan}
                </span>
              </div>
              <span className="ph-check">✓</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}