"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Mascota, Usuario, CitaResumen, SuscripcionActiva,
  citasAPI, sesion, suscripcionesAPI,
} from "@/lib/api";
import { Vista, Servicio } from "../perfil/page";

interface VistaInicioProps {
  usuario: Usuario;
  mascotas: Mascota[];
  onCambiarVista: (v: Vista) => void;
  onCambiarServicio: (s: Servicio) => void;
}

const COLORES_MASCOTAS = [
  "var(--primary-light)",
  "var(--teal-light)",
  "var(--pink-light)",
  "var(--orange-light)",
];

const TIPS_MASCOTAS = [
  "Recuerda mantener a tu mascota hidratada antes y después de cada paseo, especialmente en días soleados.",
  "Revisa las almohadillas de sus patas después de caminar. Si están agrietadas, aplica una crema especial.",
  "Cepillar su pelaje 2 o 3 veces por semana no solo lo mantiene limpio, sino que fortalece el vínculo contigo.",
  "Los juguetes de rompecabezas son excelentes para mantener su mente activa y reducir la ansiedad cuando no estás.",
  "No olvides revisar sus orejas una vez a la semana. Si notas mal olor o mucha cera, consulta con tu veterinario.",
  "Asegúrate de que la placa de identificación de tu perro tenga tu número actual antes de cada paseo.",
  "Si tu perro es tímido, los paseos frecuentes en entornos controlados le ayudan a ganar confianza.",
  "Premiar las buenas conductas durante el paseo refuerza el aprendizaje positivo.",
  "Dejar que tu perro huela el entorno durante sus salidas es vital para su bienestar mental.",
  "Si el paseo coincide con una llovizna, recuerda limpiar y secar bien sus patas al volver.",
  "Las caminatas diarias ayudan a canalizar la energía de tu perro y reducen conductas destructivas.",
  "Exponer a tu cachorro de forma amigable a diferentes personas y ruidos forma un adulto equilibrado.",
  "Mantén siempre a la mano bolsas para residuos, agua portátil y premios antes del paseo.",
  "Elige un arnés de pecho si tu perro tira mucho de la correa, protegiendo su delicado cuello.",
  "Horarios constantes para sus salidas reducen la ansiedad por separación.",
  "Un chequeo general con el veterinario una vez al año detecta problemas a tiempo.",
  "Mantener al día el tratamiento contra pulgas y garrapatas es vital si frecuentan parques.",
  "Lava los recipientes de agua y comida de tus mascotas diariamente.",
  "Los snacks no deben superar el 10% de la ingesta calórica diaria de tu mascota.",
  "Acostumbra a tu mascota al cepillado dental o usa juguetes interactivos.",
];

// ─── Helpers ─────────────────────────────────────────────
const fmtHoraAMPM = (horaStr: string | null | undefined) => {
  if (!horaStr) return "";
  const [h, m] = horaStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

const esCitaPasada = (fecha: string, hora: string | null) => {
  if (!hora) return false;
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm) < new Date();
};

const humanizarFecha = (iso: string) => {
  if (!iso) return "—";
  const hoy = new Date();
  const [y, m, d] = iso.split("-").map(Number);
  const fecha = new Date(y, m - 1, d);
  const hoyMid = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const diffDias = Math.round((fecha.getTime() - hoyMid.getTime()) / 86_400_000);

  if (diffDias === 0) return "Hoy";
  if (diffDias === 1) return "Mañana";
  if (diffDias === -1) return "Ayer";
  if (diffDias > 1 && diffDias <= 6) return `En ${diffDias} días`;
  if (diffDias < -1) return `Hace ${Math.abs(diffDias)} días`;
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(fecha);
};

const calcularCountdown = (fecha: string, hora: string) => {
  const [y, m, d] = fecha.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const target = new Date(y, m - 1, d, hh, mm).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return null;

  const horas = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);

  if (horas >= 48) {
    const dias = Math.floor(horas / 24);
    return `en ${dias} días`;
  }
  if (horas >= 24) {
    const dias = Math.floor(horas / 24);
    const hRest = horas % 24;
    return `en ${dias}d ${hRest}h`;
  }
  if (horas === 0) return `en ${mins} min`;
  return `en ${horas}h ${mins}min`;
};

// ══════════════════════════════════════════════════════════
export default function VistaInicio({
  usuario,
  mascotas,
  onCambiarVista,
  onCambiarServicio,
}: VistaInicioProps) {
  const primerNombre = usuario.nombre?.split(" ")[0] || "Usuario";

  const [citas, setCitas] = useState<CitaResumen[]>([]);
  const [suscripciones, setSuscripciones] = useState<SuscripcionActiva[]>([]);
  const [cargando, setCargando] = useState(true);

  const [tipIndex, setTipIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // Cargar datos reales
  useEffect(() => {
    async function cargar() {
      const token = sesion.obtenerToken();
      if (!token) { setCargando(false); return; }
      try {
        const [c, s] = await Promise.all([
          citasAPI.listar(token).catch(() => []),
          suscripcionesAPI.mias(token).catch(() => []),
        ]);
        setCitas(c);
        setSuscripciones(s);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // Rotación del tip
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % TIPS_MASCOTAS.length);
        setIsFading(false);
      }, 500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Próximo paseo global
  const proximoPaseo = useMemo(() => {
    const futuras = citas
      .filter((c) => c.id_estado !== 5 && !esCitaPasada(c.fecha, c.hora))
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || "").localeCompare(b.hora || ""));
    return futuras[0] ?? null;
  }, [citas]);

  // Countdown en vivo (se actualiza cada minuto)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const countdown = useMemo(() => {
    if (!proximoPaseo || !proximoPaseo.hora) return null;
    return calcularCountdown(proximoPaseo.fecha, proximoPaseo.hora);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proximoPaseo, tick]);

  // Suscripción activa por mascota
  const suscPorMascota = useMemo(() => {
    const map = new Map<number, SuscripcionActiva>();
    suscripciones.forEach((s) => { if (s.activa) map.set(s.id_mascota, s); });
    return map;
  }, [suscripciones]);

  // Próximo paseo por mascota
  const proxPorMascota = useMemo(() => {
    const map = new Map<number, CitaResumen>();
    citas
      .filter((c) => c.id_estado !== 5 && !esCitaPasada(c.fecha, c.hora))
      .forEach((c) => {
        const actual = map.get(c.id_mascota);
        if (!actual || c.fecha < actual.fecha || (c.fecha === actual.fecha && (c.hora || "") < (actual.hora || ""))) {
          map.set(c.id_mascota, c);
        }
      });
    return map;
  }, [citas]);

  // Actividad reciente
  const actividadReciente = useMemo(() => {
    return citas
      .filter((c) => esCitaPasada(c.fecha, c.hora) || c.id_estado === 4)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.hora || "").localeCompare(a.hora || ""))
      .slice(0, 4);
  }, [citas]);

  const planesActivos = suscripciones.filter((s) => s.activa).length;

  return (
    <div className="perfil-vista active dashboard-layout">

      {/* HERO DINÁMICO */}
      <div className="perfil-section inicio-bienvenida dashboard-full-width">
        <h2 className="inicio-titulo">¡Hola, <strong>{primerNombre}</strong>! 👋</h2>
        <p className="inicio-subtitulo">
          {proximoPaseo && countdown ? (
            <>Tu próximo paseo es <strong>{countdown}</strong> con <strong>{proximoPaseo.nom_mascota}</strong>.</>
          ) : mascotas.length === 0 ? (
            <>Registra a tu primer peludo para empezar.</>
          ) : planesActivos === 0 ? (
            <>Aún no tienes planes activos. ¡Dale un paseo a tus peludos!</>
          ) : (
            <>Todo tranquilo por aquí. Aquí está tu resumen.</>
          )}
        </p>
      </div>

      {/* KPIs */}
      <div className="di-kpis dashboard-full-width">
        <div className="di-kpi">
          <span className="di-kpi-icon">🐾</span>
          <div>
            <span className="di-kpi-value">{mascotas.length}</span>
            <span className="di-kpi-label">Mascotas</span>
          </div>
        </div>
        <div className="di-kpi">
          <span className="di-kpi-icon">🦮</span>
          <div>
            <span className="di-kpi-value">{citas.length}</span>
            <span className="di-kpi-label">Paseos</span>
          </div>
        </div>
        <div className="di-kpi di-kpi-highlight">
          <span className="di-kpi-icon">📅</span>
          <div>
            <span className="di-kpi-value">{countdown || "—"}</span>
            <span className="di-kpi-label">Próximo paseo</span>
          </div>
        </div>
        <div className="di-kpi">
          <span className="di-kpi-icon">✨</span>
          <div>
            <span className="di-kpi-value">{planesActivos}</span>
            <span className="di-kpi-label">Planes activos</span>
          </div>
        </div>
      </div>

      {/* PRÓXIMO PASEO */}
      <div className="perfil-section dashboard-full-width">
        <div className="perfil-section-header">
          <h3>🎯 Próximo paseo</h3>
        </div>

        {cargando ? (
          <div className="di-loading">Cargando…</div>
        ) : proximoPaseo ? (
          <div className="di-prox-paseo">
            <div className="di-prox-left">
              <div className="di-prox-pet">🐕</div>
              <div>
                <strong className="di-prox-nombre">{proximoPaseo.nom_mascota}</strong>
                <span className="di-prox-plan">{proximoPaseo.nom_plan}</span>
              </div>
            </div>
            <div className="di-prox-center">
              <div className="di-prox-cuando">
                <span className="di-prox-fecha">{humanizarFecha(proximoPaseo.fecha)}</span>
                <span className="di-prox-hora">{fmtHoraAMPM(proximoPaseo.hora)}</span>
              </div>
              {countdown && <span className="di-prox-countdown">⏱️ {countdown}</span>}
            </div>
            <div className="di-prox-right">
              <button
                className="btn-perfil btn-primary"
                onClick={() => onCambiarServicio("paseos")}
              >
                Ver detalle →
              </button>
            </div>
          </div>
        ) : (
          <div className="dpe-vacio">
            <div className="dpe-vacio-icon">🐾</div>
            <div>
              <h3>No hay paseos próximos</h3>
              <p>¿Le damos un paseo a tus peludos?</p>
            </div>
            <button className="btn-perfil btn-primary" onClick={() => onCambiarServicio("paseos")}>
              Agendar
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO EN 2 COLUMNAS */}
      <div className="dashboard-grid">
        <div className="dashboard-col-main">
          {/* MASCOTAS */}
          <div className="perfil-section">
            <div className="perfil-section-header">
              <h3>🐾 Tus Mascotas</h3>
              <button className="btn-perfil btn-outline" onClick={() => onCambiarVista("mascotas")}>
                Ver todas ({mascotas.length})
              </button>
            </div>

            {mascotas.length === 0 ? (
              <div className="perfil-empty">
                <i className="fas fa-paw"></i>
                <p>No tienes mascotas registradas.</p>
                <button className="btn-perfil btn-primary" onClick={() => onCambiarVista("mascotas")}>
                  Agregar Mascota
                </button>
              </div>
            ) : (
              <div className="dashboard-pets-grid">
                {mascotas.map((m, index) => {
                  const colorFondo = COLORES_MASCOTAS[index % COLORES_MASCOTAS.length];
                  const susc = suscPorMascota.get(m.id_mascota);
                  const prox = proxPorMascota.get(m.id_mascota);

                  return (
                    <div key={m.id_mascota} className="pet-status-card-full">
                      <div className="psc-header">
                        <div className="psc-img" style={{ background: !m.img_masc ? colorFondo : "transparent" }}>
                          {m.img_masc ? <img src={m.img_masc} alt={m.nom_mascota} /> : <span>🐶</span>}
                        </div>
                        <div className="psc-title">
                          <strong>{m.nom_mascota}</strong>
                          <p>
                            {m.raza || "Mascota"}
                            {m.edad ? ` · ${m.edad} años` : ""}
                          </p>
                        </div>
                      </div>

                      {susc ? (
                        <div className="psc-plan-box">
                          <div className="psc-plan-info">
                            <span className="badge-plan ok">✨ {susc.nom_plan}</span>
                            <span className="psc-date">
                              {prox
                                ? `Próximo: ${humanizarFecha(prox.fecha)} · ${fmtHoraAMPM(prox.hora)}`
                                : "Sin paseos programados"}
                            </span>
                          </div>
                          <button
                            className="btn-perfil btn-primary btn-sm"
                            onClick={() => onCambiarServicio("paseos")}
                          >
                            Ver
                          </button>
                        </div>
                      ) : (
                        <div className="psc-plan-box">
                          <div className="psc-plan-info">
                            <span className="badge-plan warn">Sin plan activo</span>
                            <span className="psc-date">Adquiere un plan para empezar</span>
                          </div>
                          <button
                            className="btn-perfil btn-primary btn-sm"
                            onClick={() => onCambiarServicio("paseos")}
                          >
                            Ver Planes
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="dashboard-col-side">

          {/* Actividad reciente */}
          {actividadReciente.length > 0 && (
            <div className="perfil-section di-actividad">
              <div className="perfil-section-header">
                <h3>🕐 Actividad reciente</h3>
              </div>
              <div className="di-actividad-list">
                {actividadReciente.map((c) => (
                  <div key={c.id_cita} className="di-actividad-item">
                    <div className="di-actividad-dot" />
                    <div className="di-actividad-info">
                      <strong>{c.nom_mascota}</strong>
                      <span>{humanizarFecha(c.fecha)} · {fmtHoraAMPM(c.hora)}</span>
                    </div>
                    <span className="di-actividad-badge">✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Soporte */}
          <div className="perfil-section widget-soporte">
            <div className="widget-icon">📞</div>
            <h3>¿Necesitas ayuda?</h3>
            <p>Estamos aquí para ti y tus peludos.</p>
            <a
              href="https://wa.me/573204829244"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-perfil btn-outline widget-btn"
            >
              Contactar Soporte
            </a>
          </div>

          {/* Tip del día */}
          <div className="perfil-section widget-tip">
            <div className="widget-icon">💡</div>
            <h3>Tip del día</h3>
            <div className={`widget-tip-content ${isFading ? "fade-out" : ""}`}>
              <p>{TIPS_MASCOTAS[tipIndex]}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}