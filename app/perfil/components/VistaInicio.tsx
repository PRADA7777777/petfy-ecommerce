// app/perfil/components/VistaInicio.tsx
"use client";

import { useEffect, useState } from "react";
import {
    Mascota,
    Usuario,
    SuscripcionActiva,
    suscripcionesAPI,
    sesion,
} from "../../lib/api";
import { Vista, Servicio } from "../page";

interface VistaInicioProps {
    usuario: Usuario;
    mascotas: Mascota[];
    onCambiarVista: (v: Vista) => void;
    onCambiarServicio: (s: Servicio) => void;
    onAgregarMascota: () => void;
    onAbrirAgendamiento: () => void;
}

const SERVICIOS: {
    id: Servicio;
    icono: string;
    label: string;
    descripcion: string;
    activo: boolean;
}[] = [
        { id: "paseos", icono: "🐕", label: "Paseos", descripcion: "Paseos profesionales con GPS en vivo y fotos", activo: true },
        { id: "guarderia", icono: "🏠", label: "Guardería", descripcion: "Cuidado diario con cámaras 24/7", activo: false },
        { id: "banos", icono: "🛁", label: "Baños", descripcion: "Baño profesional con productos hipoalergénicos", activo: false },
        { id: "veterinaria", icono: "🩺", label: "Veterinaria", descripcion: "Atención veterinaria a domicilio", activo: false },
        { id: "entrenamiento", icono: "🎓", label: "Entrenamiento", descripcion: "Adiestramiento personalizado", activo: false },
    ];

const fmtFechaCorta = (iso: string | null) => {
    if (!iso) return "-";
    const [y, m, d] = iso.split("-").map(Number);
    return new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
    }).format(new Date(y, m - 1, d));
};

export default function VistaInicio({
    usuario,
    mascotas,
    onCambiarVista,
    onCambiarServicio,
    onAgregarMascota,
    onAbrirAgendamiento,
}: VistaInicioProps) {
    const primerNombre = usuario.nombre?.split(" ")[0] || "Usuario";

    const [susc, setSusc] = useState<SuscripcionActiva | null>(null);
    const [cargandoSusc, setCargandoSusc] = useState(true);

    useEffect(() => {
        const token = sesion.obtenerToken();
        if (!token) {
            // desfasado para no disparar el warning de setState sync en effect
            queueMicrotask(() => setCargandoSusc(false));
            return;
        }
        let cancelado = false;
        suscripcionesAPI
            .mia(token)
            .then((s) => { if (!cancelado) setSusc(s); })
            .catch(() => { if (!cancelado) setSusc(null); })
            .finally(() => { if (!cancelado) setCargandoSusc(false); });
        return () => { cancelado = true; };
    }, []);

    const serviciosActivos = susc?.activa ? 1 : 0;

    return (
        <div className="perfil-vista active">
            {/* Bienvenida */}
            <div className="perfil-section inicio-bienvenida">
                <h2 className="inicio-titulo">
                    ¡Hola, <strong>{primerNombre}</strong>!
                </h2>
                <p className="inicio-subtitulo">
                    Bienvenido a tu panel de control de Petfy. Gestiona tus mascotas y servicios desde un solo lugar.
                </p>
            </div>

            {/* KPIs */}
            <div className="perfil-kpis">
                <div className="perfil-kpi">
                    <span className="perfil-kpi-icon">🐾</span>
                    <span className="perfil-kpi-num">{mascotas.length}</span>
                    <span className="perfil-kpi-label">Mascotas</span>
                </div>
                <div className="perfil-kpi">
                    <span className="perfil-kpi-icon">📅</span>
                    <span className="perfil-kpi-num">{serviciosActivos}</span>
                    <span className="perfil-kpi-label">Servicios Activos</span>
                </div>
                <div className="perfil-kpi">
                    <span className="perfil-kpi-icon">💰</span>
                    <span className="perfil-kpi-num">
                        {cargandoSusc ? "…" : susc?.activa ? "Sí" : "—"}
                    </span>
                    <span className="perfil-kpi-label">
                        {susc?.activa ? susc.nom_plan : "Plan Activo"}
                    </span>
                </div>
                <div className="perfil-kpi">
                    <span className="perfil-kpi-icon">📆</span>
                    <span className="perfil-kpi-num">
                        {cargandoSusc
                            ? "…"
                            : susc?.activa
                                ? fmtFechaCorta(susc.fecha_fin)
                                : "—"}
                    </span>
                    <span className="perfil-kpi-label">
                        {susc?.activa
                            ? `${susc.dias_restantes} días restantes`
                            : "Próximo Pago"}
                    </span>
                </div>
            </div>

            {/* Servicios disponibles */}
            <div className="perfil-section">
                <div className="perfil-section-header">
                    <h3>✨ Nuestros Servicios</h3>
                </div>
                <p className="inicio-help-text">
                    Elige el servicio que necesitas. Estamos ampliando nuestra oferta.
                </p>

                <div className="inicio-servicios-grid">
                    {SERVICIOS.map((s) => (
                        <button
                            key={s.id}
                            className={`inicio-servicio-card ${!s.activo ? "inactivo" : ""}`}
                            onClick={() => {
                                if (!s.activo) return;
                                if (s.id === "paseos") {
                                    onAbrirAgendamiento();
                                } else {
                                    onCambiarServicio(s.id);
                                }
                            }}
                            disabled={!s.activo}
                        >
                            <div className="inicio-servicio-icono">{s.icono}</div>
                            <div className="inicio-servicio-info">
                                <strong>{s.label}</strong>
                                <p>{s.descripcion}</p>
                                {!s.activo && <span className="inicio-servicio-badge">Próximamente</span>}
                            </div>
                            {s.activo && (
                                <div className="inicio-servicio-arrow">
                                    <i className="fas fa-arrow-right"></i>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mis mascotas */}
            <div className="perfil-section">
                <div className="perfil-section-header">
                    <h3>🐾 Mis Mascotas</h3>
                    <button
                        className="btn-perfil btn-outline"
                        onClick={() => onCambiarVista("mascotas")}
                    >
                        Ver todas
                    </button>
                </div>

                {mascotas.length === 0 ? (
                    <div className="perfil-empty">
                        <i className="fas fa-paw" style={{ fontSize: "2rem" }}></i>
                        <p>Aún no tienes mascotas registradas</p>
                        <button className="btn-perfil btn-primary" onClick={onAgregarMascota}>
                            🐕 Agregar mi primera mascota
                        </button>
                    </div>
                ) : (
                    <div className="mascotas-grid">
                        {mascotas.slice(0, 4).map((m) => (
                            <div
                                key={m.id_mascota}
                                className="mascota-perfil-card"
                                onClick={() => onCambiarVista("mascotas")}
                            >
                                <div className="mascota-card-foto-container">
                                    {m.img_masc ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={m.img_masc} alt={m.nom_mascota} />
                                    ) : (
                                        <div className="mascota-card-foto-placeholder">🐕</div>
                                    )}
                                </div>
                                <div className="mascota-card-info">
                                    <strong>{m.nom_mascota}</strong>
                                    <p>
                                        {m.raza || "Sin raza"}
                                        {m.edad ? ` · ${m.edad} años` : ""}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {mascotas.length > 4 && (
                            <div className="mascota-perfil-card mascota-mas" onClick={() => onCambiarVista("mascotas")}>
                                <div className="mascota-card-foto-container">
                                    <span className="mascota-card-foto-placeholder">+{mascotas.length - 4}</span>
                                </div>
                                <div className="mascota-card-info">
                                    <strong>Ver todas</strong>
                                    <p>Y {mascotas.length - 4} más</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}