"use client";

import { useEffect, useMemo, useState } from "react";
import {
  citasAPI,
  sesion,
  suscripcionesAPI,
  CitaResumen,
  SuscripcionActiva,
  Usuario,
  DiasCambioDisponibles,
} from "../../lib/api";
import { MiniCalendario } from "./agendamiento/PasoDetalle";

interface VistaPaseosProps {
  usuario: Usuario;
  onAgendar: () => void;
  recargarKey?: number;
}

const DIAS_ABREV = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const LABEL_POR_ISO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ABREV_A_IDX: Record<string, number> = {
  Lun: 0, Mar: 1, Mié: 2, Jue: 3, Vie: 4, Sáb: 5, Dom: 6,
};

const fmtFechaGrupo = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const diff = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  const f = new Intl.DateTimeFormat("es-CO", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  }).format(fecha);
  return f.charAt(0).toUpperCase() + f.slice(1);
};

const fmtFechaCorta = (iso: string): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" })
    .format(new Date(y, m - 1, d));
};

const fmtHora12 = (h: string | null): { hora: string; sufijo: string } => {
  if (!h) return { hora: "—", sufijo: "" };
  const [hh, mm] = h.split(":").map(Number);
  const fecha = new Date(2000, 0, 1, hh, mm);
  const partes = new Intl.DateTimeFormat("es-CO", {
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(fecha);
  const hora = partes.find((p) => p.type === "hour")?.value ?? "";
  const minuto = partes.find((p) => p.type === "minute")?.value ?? "";
  const suf = partes.find((p) => p.type === "dayPeriod")?.value ?? "";
  return { hora: `${hora}:${minuto}`, sufijo: suf };
};

const fmtCOP = (n: number): string =>
  new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(n);

const ESTADO_ESTILOS: Record<number, { bg: string; color: string }> = {
  1: { bg: "#FEF3C7", color: "#B45309" },
  2: { bg: "#DCFCE7", color: "#15803D" },
  3: { bg: "#DBEAFE", color: "#1E40AF" },
  4: { bg: "#F3F4F6", color: "#374151" },
  5: { bg: "#FEE2E2", color: "#B91C1C" },
};
const estilosDe = (id: number | null | undefined) =>
  (id && ESTADO_ESTILOS[id]) || { bg: "#F3F4F6", color: "#374151" };

export default function VistaPaseos({ usuario, onAgendar, recargarKey }: VistaPaseosProps) {
  const [citas, setCitas] = useState<CitaResumen[]>([]);
  const [suscs, setSuscs] = useState<SuscripcionActiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "proximos" | "historial">("proximos");
  const [verCalendario, setVerCalendario] = useState(false);
  const [mascotaActiva, setMascotaActiva] = useState<number | null>(null);

  // Modal rutina
  const [modalRutina, setModalRutina] = useState(false);
  const [diasSel, setDiasSel] = useState<string[]>([]);
  const [guardandoRutina, setGuardandoRutina] = useState(false);
  const [errorRutina, setErrorRutina] = useState("");

  // Modal cambio de día
  const [modalCambio, setModalCambio] = useState<CitaResumen | null>(null);
  const [candidatos, setCandidatos] = useState<DiasCambioDisponibles | null>(null);
  const [cargandoCand, setCargandoCand] = useState(false);
  const [fechaSel, setFechaSel] = useState("");
  const [guardandoCambio, setGuardandoCambio] = useState(false);
  const [errorCambio, setErrorCambio] = useState("");

  async function cargar() {
    const token = sesion.obtenerToken();
    if (!token) { setError("Sesión expirada"); setLoading(false); return; }
    try {
      const [dataC, dataS] = await Promise.all([
        citasAPI.listar(token),
        suscripcionesAPI.mias(token).catch(() => []),
      ]);
      setCitas(dataC);
      setSuscs(dataS);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar paseos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelado = false;
    async function run() {
      const token = sesion.obtenerToken();
      if (!token) { if (!cancelado) { setError("Sesión expirada"); setLoading(false); } return; }
      try {
        const [dataC, dataS] = await Promise.all([
          citasAPI.listar(token),
          suscripcionesAPI.mias(token).catch(() => []),
        ]);
        if (!cancelado) { setCitas(dataC); setSuscs(dataS); }
      } catch (e: unknown) {
        if (!cancelado) setError(e instanceof Error ? e.message : "Error al cargar paseos");
      } finally {
        if (!cancelado) setLoading(false);
      }
    }
    run();
    return () => { cancelado = true; };
  }, [recargarKey]);

  // ─── Mascotas con paseos (para los tabs) ───
  const mascotasConPaseos = useMemo(() => {
    const map = new Map<number, {
      id_mascota: number;
      nom_mascota: string;
      total: number;
      conRutina: boolean;
    }>();

    citas.forEach((c) => {
      const curr = map.get(c.id_mascota);
      if (curr) {
        curr.total += 1;
        if (c.id_suscripcion) curr.conRutina = true;
      } else {
        map.set(c.id_mascota, {
          id_mascota: c.id_mascota,
          nom_mascota: c.nom_mascota,
          total: 1,
          conRutina: !!c.id_suscripcion,
        });
      }
    });

    // Aseguramos incluir mascotas que tengan suscripción pero aún sin citas
    suscs.forEach((s) => {
      if (!map.has(s.id_mascota)) {
        map.set(s.id_mascota, {
          id_mascota: s.id_mascota,
          nom_mascota: s.nom_mascota,
          total: 0,
          conRutina: true,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.nom_mascota.localeCompare(b.nom_mascota)
    );
  }, [citas, suscs]);

  // ─── Auto-seleccionar la primera mascota ───
  useEffect(() => {
    queueMicrotask(() => {
      if (mascotasConPaseos.length === 0) {
        setMascotaActiva(null);
        return;
      }
      const existe = mascotasConPaseos.some((m) => m.id_mascota === mascotaActiva);
      if (!existe) {
        setMascotaActiva(mascotasConPaseos[0].id_mascota);
      }
    });
  }, [mascotasConPaseos, mascotaActiva]);

  // ─── Datos filtrados por la mascota activa ───
  const citasFiltradas = useMemo(() => {
    if (mascotaActiva === null) return citas;
    return citas.filter((c) => c.id_mascota === mascotaActiva);
  }, [citas, mascotaActiva]);

  const suscActiva = useMemo(() => {
    if (mascotaActiva === null) return null;
    return suscs.find((s) => s.id_mascota === mascotaActiva) ?? null;
  }, [suscs, mascotaActiva]);

  // Modal rutina
  function abrirModalRutina() {
    if (!suscActiva) return;
    const dias = (suscActiva.dias_semana || "").split(",").map((s) => s.trim()).filter(Boolean);
    setDiasSel(dias);
    setErrorRutina("");
    setModalRutina(true);
  }

  function toggleDia(d: string) {
    if (!suscActiva) return;
    const set = new Set(diasSel);
    if (set.has(d)) set.delete(d);
    else {
      if (set.size >= suscActiva.dias_permitidos) return;
      set.add(d);
    }
    setDiasSel(DIAS_ABREV.filter((x) => set.has(x)));
  }

  const primerDiaOriginal = useMemo(() => {
    if (!suscActiva?.dias_semana) return null;
    const arr = suscActiva.dias_semana.split(",").map((s) => s.trim()).filter(Boolean);
    if (arr.length === 0) return null;
    return [...arr].sort((a, b) => ABREV_A_IDX[a] - ABREV_A_IDX[b])[0];
  }, [suscActiva]);

  const cambiaPrimerDia = useMemo(() => {
    if (!primerDiaOriginal) return false;
    if (!diasSel.includes(primerDiaOriginal)) return true;
    const nuevoPrimero = [...diasSel].sort((a, b) => ABREV_A_IDX[a] - ABREV_A_IDX[b])[0];
    return nuevoPrimero !== primerDiaOriginal;
  }, [diasSel, primerDiaOriginal]);

  const validoRutina = suscActiva ? diasSel.length === suscActiva.dias_permitidos : false;

  async function guardarRutina() {
    if (!suscActiva || !validoRutina) return;
    setGuardandoRutina(true);
    setErrorRutina("");
    try {
      const token = sesion.obtenerToken();
      if (!token) throw new Error("Sesión expirada");
      await suscripcionesAPI.cambiarRutina(suscActiva.id_suscripcion, diasSel, token);
      setModalRutina(false);
      await cargar();
    } catch (e: unknown) {
      setErrorRutina(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setGuardandoRutina(false);
    }
  }

  // Cargar candidatos al abrir el modal de cambio de día
  useEffect(() => {
    if (!modalCambio) {
      queueMicrotask(() => {
        setCandidatos(null);
        setFechaSel("");
        setErrorCambio("");
      });
      return;
    }
    const token = sesion.obtenerToken();
    if (!token) return;
    let cancelado = false;

    queueMicrotask(() => { if (!cancelado) setCargandoCand(true); });

    citasAPI
      .diasCambioDisponibles(modalCambio.id_cita, token)
      .then((d) => { if (!cancelado) setCandidatos(d); })
      .catch(() => { if (!cancelado) setCandidatos(null); })
      .finally(() => { if (!cancelado) setCargandoCand(false); });

    return () => { cancelado = true; };
  }, [modalCambio]);

  async function confirmarCambioDia() {
    if (!modalCambio || !fechaSel) return;
    setGuardandoCambio(true);
    setErrorCambio("");
    try {
      const token = sesion.obtenerToken();
      if (!token) throw new Error("Sesión expirada");
      await citasAPI.cambiarDia(modalCambio.id_cita, fechaSel, token);
      setModalCambio(null);
      await cargar();
    } catch (e: unknown) {
      setErrorCambio(e instanceof Error ? e.message : "Error al cambiar");
    } finally {
      setGuardandoCambio(false);
    }
  }

  // ─── Grupos de citas de la mascota activa ───
  const grupos = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const filtradas = citasFiltradas.filter((c) => {
      const [y, m, d] = c.fecha.split("-").map(Number);
      const fecha = new Date(y, m - 1, d);
      const esPasada = fecha < hoy;
      if (filtro === "proximos") return !esPasada && c.id_estado !== 5;
      if (filtro === "historial") return esPasada || c.id_estado === 4 || c.id_estado === 5;
      return true;
    });
    const map = new Map<string, CitaResumen[]>();
    filtradas.forEach((c) => {
      if (!map.has(c.fecha)) map.set(c.fecha, []);
      map.get(c.fecha)!.push(c);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([fecha, items]) => ({
        fecha,
        citas: items.sort((a, b) => (b.hora || "").localeCompare(a.hora || "")),
      }));
  }, [citasFiltradas, filtro]);

  // ─── KPIs de la mascota activa ───
  const resumen = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const proximos = citasFiltradas.filter((c) => {
      const [y, m, d] = c.fecha.split("-").map(Number);
      return new Date(y, m - 1, d) >= hoy && c.id_estado !== 5;
    }).length;
    const completados = citasFiltradas.filter((c) => c.id_estado === 4).length;
    return { proximos, completados };
  }, [citasFiltradas]);

  const hora = fmtHora12(suscActiva?.hora_preferida || null);
  const mostrarTabs = mascotasConPaseos.length > 1;

  return (
    <div className="perfil-vista active">
      <div className="perfil-section">
        <div className="perfil-section-header">
          <h3>🐕 Mis Paseos</h3>
          <button className="btn-perfil btn-primary" onClick={onAgendar}>
            + Agendar paseo
          </button>
        </div>

        <p className="vp-greeting">
          Hola <strong>{usuario.nombre}</strong>, aquí ves todos tus paseos agendados.
        </p>

        {/* ── TABS por mascota ── */}
        {mostrarTabs && (
          <div className="vp-mascotas-tabs">
            {mascotasConPaseos.map((m) => {
              const activo = m.id_mascota === mascotaActiva;
              return (
                <button
                  key={m.id_mascota}
                  type="button"
                  className={`vp-mascota-tab ${activo ? "activo" : ""}`}
                  onClick={() => setMascotaActiva(m.id_mascota)}
                >
                  <span className="vp-mascota-tab-icon">
                    {m.conRutina ? "🐕" : "🐾"}
                  </span>
                  <span className="vp-mascota-tab-name">{m.nom_mascota}</span>
                  <span className="vp-mascota-tab-count">{m.total}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── KPIs de la mascota activa ── */}
        {mascotaActiva !== null && (
          <div className="perfil-kpis">
            <div className="perfil-kpi">
              <span className="perfil-kpi-icon">📅</span>
              <span className="perfil-kpi-num">{resumen.proximos}</span>
              <span className="perfil-kpi-label">Próximos</span>
            </div>
            <div className="perfil-kpi">
              <span className="perfil-kpi-icon">✅</span>
              <span className="perfil-kpi-num">{resumen.completados}</span>
              <span className="perfil-kpi-label">Completados</span>
            </div>
          </div>
        )}

        {/* ──── RUTINA ACTIVA DE LA MASCOTA SELECCIONADA ──── */}
        {suscActiva && suscActiva.activa && (
          <div className="vp-rutina">
            <div className="vp-rutina-head">
              <div>
                <p className="vp-rutina-titulo">🔄 Rutina activa</p>
                <p className="vp-rutina-plan">
                  {suscActiva.nom_plan} · {suscActiva.nom_mascota}
                </p>
              </div>
              <button
                className="vp-btn-reprog"
                onClick={abrirModalRutina}
                type="button"
              >
                ♻️ Cambiar rutina
              </button>
            </div>

            <div className="vp-rutina-dias">
              {(suscActiva.dias_semana || "").split(",").filter(Boolean).map((d) => (
                <span key={d} className="vp-rutina-chip">{d}</span>
              ))}
              <span className="vp-rutina-hora">
                {hora.hora} {hora.sufijo}
              </span>
            </div>

            <p className="vp-rutina-vigencia">
              Vigencia: {fmtFechaCorta(suscActiva.fecha_inicio || "")} — {fmtFechaCorta(suscActiva.fecha_fin || "")}
              {" · "}
              <strong>{suscActiva.dias_restantes} días restantes</strong>
            </p>

            {suscActiva.proximo_paseo && (
              <div className="vp-rutina-proximo">
                <span>Próximo paseo</span>
                <strong>
                  {fmtFechaGrupo(suscActiva.proximo_paseo)} · {hora.hora} {hora.sufijo}
                </strong>
              </div>
            )}

            <button
              type="button"
              className="vp-rutina-toggle"
              onClick={() => setVerCalendario((v) => !v)}
            >
              {verCalendario ? "Ocultar calendario ▲" : "Ver calendario ▼"}
            </button>

            {verCalendario && (
              <div className="vp-rutina-calendario">
                <MiniCalendario
                  value=""
                  onChange={() => {}}
                  diasHabilitados={new Set(DIAS_ABREV)}
                  fechasBloqueadas={new Set()}
                  fechasDestacadas={new Set(suscActiva.fechas_rutina ?? [])}
                  modoLectura
                />
              </div>
            )}
          </div>
        )}

        <div className="vp-filtros">
          {(["proximos", "historial", "todos"] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`vp-filtro-btn ${filtro === f ? "activo" : ""}`}
              onClick={() => setFiltro(f)}
            >
              {f === "proximos" ? "Próximos" : f === "historial" ? "Historial" : "Todos"}
            </button>
          ))}
        </div>

        {loading && <p className="vp-loading">Cargando paseos…</p>}
        {error && <p className="vp-error">⚠️ {error}</p>}

        {!loading && grupos.length === 0 && (
          <div className="perfil-empty">
            <i className="fas fa-hand-holding-heart" />
            <p>
              {mascotaActiva === null
                ? "Aún no tienes paseos agendados"
                : `No hay paseos ${filtro === "proximos" ? "próximos" : "para mostrar"}`}
            </p>
            <small>Usa el botón <strong>+ Agendar paseo</strong> para programar uno.</small>
          </div>
        )}

        {grupos.map((grupo) => (
          <div key={grupo.fecha} className="vp-grupo">
            <div className="vp-grupo-header">
              <span className="vp-grupo-fecha">{fmtFechaGrupo(grupo.fecha)}</span>
              <span className="vp-grupo-linea" />
            </div>
            <div className="vp-citas">
              {grupo.citas.map((c) => {
                const estilos = estilosDe(c.id_estado);
                const h = fmtHora12(c.hora);
                const esRutina = !!c.id_suscripcion;
                return (
                  <div
                    key={c.id_cita}
                    className={`vp-cita ${c.es_paseo_prueba ? "es-prueba" : ""} ${esRutina ? "es-rutina" : ""}`}
                  >
                    <div className="vp-hora">
                      <span className="vp-hora-num">{h.hora}</span>
                      <small className="vp-hora-sufijo">{h.sufijo}</small>
                    </div>
                    <div className="vp-info">
                      <div className="vp-info-top">
                        <strong className="vp-plan">{c.nom_plan}</strong>
                        {c.es_paseo_prueba && (
                          <span className="vp-badge-bienvenida">🎁 Bienvenida</span>
                        )}
                        {esRutina && (
                          <span className="vp-badge-rutina">🔄 Rutina</span>
                        )}
                      </div>
                      <div className="vp-info-meta">
                        <span>🐾 {c.nom_mascota}</span>
                        <span>⏱️ {c.duracion_minutos} min</span>
                        {c.zona && <span>📍 {c.zona}</span>}
                      </div>
                    </div>
                    <div className="vp-estado-col">
                      <span
                        className="vp-estado-badge"
                        style={{ background: estilos.bg, color: estilos.color }}
                      >
                        {c.nom_estado}
                      </span>
                      <strong className={`vp-precio ${c.precio_final === 0 ? "gratis" : ""}`}>
                        {c.precio_final === 0 ? "Incluido" : fmtCOP(c.precio_final)}
                      </strong>

                      {esRutina && c.id_estado !== 5 && c.id_estado !== 4 && (
                        <button
                          type="button"
                          className="vp-btn-mover"
                          onClick={() => setModalCambio(c)}
                        >
                          🔄 Mover este día
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ───── MODAL CAMBIAR RUTINA ───── */}
      {modalRutina && suscActiva && (
        <div className="modal-overlay active" onClick={() => setModalRutina(false)}>
          <div
            className="modal-container modal-mascota"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={() => setModalRutina(false)}>
              &times;
            </button>

            <h2 className="pfa-title">♻️ Cambiar rutina</h2>
            <p className="pfa-sub" style={{ marginBottom: "0.5rem" }}>
              {suscActiva.nom_plan} · {suscActiva.nom_mascota}
            </p>

            {!suscActiva.puede_cambiar_rutina ? (
              <div className="vp-rutina-bloqueada">
                <p className="vp-bloqueada-icon">🔒</p>
                <p className="vp-bloqueada-titulo">No puedes cambiar la rutina ahora</p>
                <p className="vp-bloqueada-texto">
                  Solo puedes cambiar los días de la rutina{" "}
                  <strong>48 horas antes del primer paseo</strong>.
                  {suscActiva.proximo_paseo && (
                    <>
                      {" "}Tu primer paseo es el{" "}
                      <strong>{fmtFechaGrupo(suscActiva.proximo_paseo)}</strong>.
                    </>
                  )}
                </p>
                <p className="vp-bloqueada-nota">
                  Si necesitas mover un día puntual, usa{" "}
                  <strong>Mover este día</strong> en cada sesión.
                </p>
              </div>
            ) : (
              <>
                <p className="pfa-sub">
                  Toca los días para intercambiarlos. La hora sigue siendo la misma.
                </p>

                <div className="vp-rutina-resumen">
                  <div className="vp-rutina-resumen-row">
                    <span>Plan</span><strong>{suscActiva.nom_plan}</strong>
                  </div>
                  <div className="vp-rutina-resumen-row">
                    <span>Hora</span>
                    <strong>{hora.hora} {hora.sufijo}</strong>
                  </div>
                  <div className="vp-rutina-resumen-row">
                    <span>Vigencia</span>
                    <strong>
                      {fmtFechaCorta(suscActiva.fecha_inicio || "")} — {fmtFechaCorta(suscActiva.fecha_fin || "")}
                    </strong>
                  </div>
                  <div className="vp-rutina-resumen-row">
                    <span>Primer paseo</span>
                    <strong>
                      {suscActiva.proximo_paseo ? fmtFechaGrupo(suscActiva.proximo_paseo) : "—"}
                    </strong>
                  </div>
                </div>

                <div className="vp-rutina-counter">
                  Días seleccionados:{" "}
                  <strong className={validoRutina ? "ok" : "warn"}>
                    {diasSel.length} / {suscActiva.dias_permitidos}
                  </strong>
                </div>

                <div className="vp-rutina-chips">
                  {DIAS_ABREV.map((d) => {
                    const sel = diasSel.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        className={`vp-dia-chip ${sel ? "sel" : ""}`}
                        onClick={() => toggleDia(d)}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>

                {cambiaPrimerDia && (
                  <div className="vp-warning">
                    ⚠️ Estás cambiando el <strong>primer día</strong> de tu plan. Esto puede
                    sumar o restar paseos dentro del mes, porque la vigencia arrancó con ese día.
                  </div>
                )}

                <div className="vp-rutina-info">
                  📌 Los cambios se aplican a partir del día siguiente. Solo puedes elegir días
                  hábiles del servicio (jueves, viernes, sábado, domingo y festivos no cuentan).
                </div>
              </>
            )}

            {errorRutina && <div className="modal-error">⚠️ {errorRutina}</div>}

            <div className="pfa-actions">
              <button
                className="btn-perfil btn-outline"
                onClick={() => setModalRutina(false)}
                disabled={guardandoRutina}
              >
                {suscActiva.puede_cambiar_rutina ? "Cancelar" : "Cerrar"}
              </button>
              {suscActiva.puede_cambiar_rutina && (
                <button
                  className="btn-perfil btn-primary"
                  onClick={guardarRutina}
                  disabled={guardandoRutina || !validoRutina}
                >
                  {guardandoRutina ? "Guardando…" : "Guardar cambios"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ───── MODAL CAMBIAR UN DÍA ───── */}
      {modalCambio && (
        <div className="modal-overlay active" onClick={() => setModalCambio(null)}>
          <div
            className="modal-container modal-mascota"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal-close-btn" onClick={() => setModalCambio(null)}>
              &times;
            </button>

            <h2 className="pfa-title">🔄 Mover este día</h2>
            <p className="pfa-sub">
              Elige otro día para esta sesión. La hora sigue siendo la misma.
            </p>

            {cargandoCand && (
              <p className="vp-loading" style={{ textAlign: "center" }}>
                Cargando días disponibles…
              </p>
            )}

            {candidatos && candidatos.bloqueada && (
              <div className="vp-rutina-bloqueada">
                <p className="vp-bloqueada-icon">🔒</p>
                <p className="vp-bloqueada-titulo">No se puede mover</p>
                <p className="vp-bloqueada-texto">{candidatos.motivo}</p>
              </div>
            )}

            {candidatos && !candidatos.bloqueada && (
              <>
                <div className="vp-rutina-resumen">
                  <div className="vp-rutina-resumen-row">
                    <span>Fecha actual</span>
                    <strong>{fmtFechaGrupo(candidatos.fecha_original)}</strong>
                  </div>
                  <div className="vp-rutina-resumen-row">
                    <span>Hora</span>
                    <strong>{candidatos.hora}</strong>
                  </div>
                  <div className="vp-rutina-resumen-row">
                    <span>Plan</span>
                    <strong>{suscActiva?.nom_plan || "—"}</strong>
                  </div>
                </div>

                <p className="form-help" style={{ marginBottom: "0.75rem" }}>
                  Los días <strong>disponibles</strong> están en naranja. Los que ya tienen
                  cupo lleno, ya son rutina o no operan aparecen <strong>deshabilitados</strong>.
                </p>

                <div className="form-group">
                  <label>Elige el nuevo día *</label>
                  <MiniCalendario
                    value={fechaSel}
                    onChange={(iso) => setFechaSel(iso)}
                    diasHabilitados={
                      new Set(
                        ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].filter(
                          (d) => !(suscActiva?.dias_semana || "").split(",").includes(d)
                        )
                      )
                    }
                    fechasBloqueadas={
                      new Set(
                        (candidatos.candidatos || [])
                          .filter((c) => !c.disponible)
                          .map((c) => c.fecha)
                      )
                    }
                    fechasDestacadas={
                      new Set(
                        (candidatos.candidatos || [])
                          .filter((c) => c.disponible)
                          .map((c) => c.fecha)
                      )
                    }
                  />
                  {fechaSel && (
                    <small className="form-help">
                      Seleccionaste: <strong>{fmtFechaGrupo(fechaSel)}</strong>
                    </small>
                  )}
                </div>

                {errorCambio && <div className="modal-error">⚠️ {errorCambio}</div>}

                <div className="pfa-actions">
                  <button
                    className="btn-perfil btn-outline"
                    onClick={() => setModalCambio(null)}
                    disabled={guardandoCambio}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-perfil btn-primary"
                    onClick={confirmarCambioDia}
                    disabled={guardandoCambio || !fechaSel}
                  >
                    {guardandoCambio ? "Guardando…" : "Confirmar cambio"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}