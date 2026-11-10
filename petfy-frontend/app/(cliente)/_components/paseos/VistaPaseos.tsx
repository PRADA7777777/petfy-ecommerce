"use client";

import { useEffect, useMemo, useState } from "react";
import {
  citasAPI, sesion, suscripcionesAPI, CitaResumen, SuscripcionActiva, Usuario, Mascota
} from "@/lib/api";
import CalendarioPaseos from "./CalendarioPaseos";
import "./paseos.css";

interface VistaPaseosProps {
  usuario: Usuario;
  mascotas: Mascota[];
  onAgendar: () => void;
  recargarKey?: number;
  onCambiarVista: (v: any) => void;
}

const fmtFechaCorta = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(new Date(y, m - 1, d));
};

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
  const citaDate = new Date(y, m - 1, d, hh, mm);
  return citaDate < new Date();
};

const esHoy = (fecha: string) => {
  const hoy = new Date();
  const isoHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  return fecha === isoHoy;
};

const getEstadoBadge = (idEstado: number, fecha: string, hora: string | null) => {
  if (idEstado === 5) return <span className="status-badge status-cancelada">Cancelado</span>;
  if (esCitaPasada(fecha, hora)) return <span className="status-badge status-completada">Completado</span>;
  switch (idEstado) {
    case 1: return <span className="status-badge status-pendiente">Programado</span>;
    case 2: return <span className="status-badge status-confirmada">Confirmado</span>;
    case 3: return <span className="status-badge status-encurso">En Curso</span>;
    case 4: return <span className="status-badge status-completada">Completado</span>;
    default: return <span className="status-badge status-pendiente">Programado</span>;
  }
};

export default function VistaPaseos({ usuario, mascotas, onAgendar, recargarKey, onCambiarVista }: VistaPaseosProps) {
  const [citas, setCitas] = useState<CitaResumen[]>([]);
  const [suscs, setSuscs] = useState<SuscripcionActiva[]>([]);
  const [loading, setLoading] = useState(true);
  const [mascotaFiltro, setMascotaFiltro] = useState<number | "todos">("todos");

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

  const citasFiltradas = useMemo(() => {
    if (mascotaFiltro === "todos") return citas;
    return citas.filter((c) => c.id_mascota === mascotaFiltro);
  }, [citas, mascotaFiltro]);

  const { paseosHoy, proximosPaseos, historialPaseos } = useMemo(() => {
    const hoyArr: CitaResumen[] = [];
    const proxArr: CitaResumen[] = [];
    const histArr: CitaResumen[] = [];

    citasFiltradas.forEach(c => {
      if (c.id_estado === 5) return; 
      const pasada = esCitaPasada(c.fecha, c.hora);
      if (pasada || c.id_estado === 4) {
        histArr.push(c);
      } else if (esHoy(c.fecha)) {
        hoyArr.push(c);
        proxArr.push(c);
      } else {
        proxArr.push(c);
      }
    });

    proxArr.sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.hora || "").localeCompare(b.hora || ""));
    histArr.sort((a, b) => b.fecha.localeCompare(a.fecha) || (b.hora || "").localeCompare(a.hora || ""));

    return { paseosHoy: hoyArr, proximosPaseos: proxArr, historialPaseos: histArr };
  }, [citasFiltradas]);

  const suscActiva = useMemo(() => {
    if (mascotaFiltro === "todos") return null;
    return suscs.find((s) => s.id_mascota === mascotaFiltro && s.activa) ?? null;
  }, [suscs, mascotaFiltro]);

  const tabsMascotas = useMemo(() => {
    const map = new Map<number, { id: number; nombre: string; foto: string | null }>();
    mascotas.forEach(m => map.set(m.id_mascota, { id: m.id_mascota, nombre: m.nom_mascota, foto: m.img_masc || null }));
    return Array.from(map.values());
  }, [mascotas]);

  const waMessage = encodeURIComponent(`Hola Petfy, necesito ayuda para cambiar un día de paseo de mi mascota.`);
  const waLink = `https://wa.me/573204829244?text=${waMessage}`; 

  if (mascotas.length === 0) {
    return (
      <div className="perfil-vista active">
        <div className="vp-empty-state">
          <div className="vp-empty-icon">🐾</div>
          <h3>¡Aún no tienes mascotas registradas!</h3>
          <p>Para poder agendar un paseo, primero debes registrar a tu peludo. Recuerda que el primer paseo es totalmente <strong>gratis</strong>.</p>
          <button className="btn-perfil btn-primary" onClick={() => onCambiarVista("mascotas")}>
            Registrar mi primera mascota
          </button>
        </div>
      </div>
    );
  }

    return (
    <div className="perfil-vista active vp-wrapper">
      <div className="vp-container">
        <div className="vp-header">
          <div className="vp-title">
            <h3>🐕 Mis Paseos</h3>
            <p>Hola <strong>{usuario.nombre}</strong>, gestiona la agenda de tus peludos.</p>
          </div>
          <button className="vp-btn-agendar" onClick={onAgendar}>
            <i className="fas fa-plus"></i> Agendar Paseo
          </button>
        </div>

        <div className="vp-tabs">
          <button className={`vp-tab ${mascotaFiltro === "todos" ? "activo" : ""}`} onClick={() => setMascotaFiltro("todos")}>
            🐾 Todos
          </button>
          {tabsMascotas.map((m) => (
            <button key={m.id} className={`vp-tab ${mascotaFiltro === m.id ? "activo" : ""}`} onClick={() => setMascotaFiltro(m.id)}>
              {m.nombre}
            </button>
          ))}
        </div>

        <div className="vp-layout">
          
          {/* COLUMNA IZQUIERDA: Solo Calendario */}
          <div className="vp-main-card">
            <div className="vp-calendario-wrapper">
              {loading ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Cargando agenda...</p>
              ) : (
                <CalendarioPaseos citas={citasFiltradas} mascotas={mascotas} />
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: Widgets y Banner */}
          <div className="vp-sidebar">
            
            {/* 🔥 Banner movido aquí arriba */}
            {suscActiva ? (
              <div className="vp-plan-banner">
                <div className="vp-plan-info">
                  <h4>Plan de {suscActiva.nom_mascota}</h4>
                  <p>
                    {suscActiva.nom_plan.toLowerCase().includes("bienvenida") || suscActiva.nom_plan.toLowerCase().includes("prueba")
                      ? "Paseo de prueba gratuito"
                      : `${suscActiva.nom_plan} · Vigencia: ${fmtFechaCorta(suscActiva.fecha_inicio || "")} al ${fmtFechaCorta(suscActiva.fecha_fin || "")}`}
                  </p>
                  <div className="vp-plan-dias">
                    {(suscActiva.dias_semana || "").split(",").filter(Boolean).map(d => (
                      <span key={d} className="vp-plan-dia">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : mascotaFiltro !== "todos" ? (
              <div className="vp-plan-banner vp-plan-empty">
                <div className="vp-plan-info">
                  <h4>Sin plan activo</h4>
                  <p>Esta mascota no tiene un plan de paseos vigente.</p>
                </div>
                <button className="btn-perfil btn-primary" onClick={onAgendar}>
                  Ver Planes
                </button>
              </div>
            ) : null}

            {paseosHoy.length > 0 && (
              <div className="vp-card-hoy">
                <div className="vp-hoy-badge">¡HOY!</div>
                <h4>Tus paseos para hoy</h4>
                <div className="vp-hoy-lista">
                  {paseosHoy.map(c => (
                    <div key={c.id_cita} className="vp-hoy-item">
                      <div className="vp-hoy-hora">{fmtHoraAMPM(c.hora)}</div>
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
                        <span className="prox-item-fecha">{fmtFechaCorta(c.fecha)}</span>
                        <span className="prox-item-hora">{fmtHoraAMPM(c.hora)} - {c.nom_mascota}</span>
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
                        <span className="prox-item-fecha">{fmtFechaCorta(c.fecha)}</span>
                        <span className="prox-item-hora">{c.nom_mascota}</span>
                      </div>
                      <span className="status-badge status-completada">Completado</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="vp-card-contacto">
              <h4>¿Quieres cambiar un día?</h4>
              <p>Si necesitas mover un paseo de tu plan, contáctanos directamente.</p>
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp-vp">
                <i className="fab fa-whatsapp"></i> Contactar Soporte
              </a>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}