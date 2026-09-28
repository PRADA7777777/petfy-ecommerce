// app/perfil/components/Sidebar.tsx
"use client";

import { useState } from "react";
import { Vista, Servicio } from "../page";

interface SidebarProps {
  nombreUsuario: string;
  vistaActiva: Vista;
  servicioActivo: Servicio;
  onCambiarVista: (v: Vista) => void;
  onCambiarServicio: (s: Servicio) => void;
  onLogout: () => void;
  sidebarMovilAbierto: boolean;
  onCerrarSidebar: () => void;
}

const SERVICIOS: { id: Servicio; icono: string; label: string; activo: boolean }[] = [
  { id: "paseos", icono: "🐕", label: "Paseos", activo: true },
  { id: "guarderia", icono: "🏠", label: "Guardería", activo: false },
  { id: "banos", icono: "🛁", label: "Baños", activo: false },
  { id: "veterinaria", icono: "🩺", label: "Veterinaria", activo: false },
  { id: "entrenamiento", icono: "🎓", label: "Entrenamiento", activo: false },
];

export default function Sidebar({
  nombreUsuario,
  vistaActiva,
  servicioActivo,
  onCambiarVista,
  onCambiarServicio,
  onLogout,
  sidebarMovilAbierto,
  onCerrarSidebar,
}: SidebarProps) {
  const [submenuServicios, setSubmenuServicios] = useState(true);

  if (!sidebarMovilAbierto) return null;

  return (
    <>
    <div className="perfil-sidebar-overlay active" onClick={onCerrarSidebar}></div>
      <aside className="perfil-sidebar-mobile active">
        {/* Cabecera con usuario */}
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">🐾</div>
          <strong className="sidebar-user-name">{nombreUsuario}</strong>
        </div>

        <div className="sidebar-divider"></div>

        {/* Navegación */}
        <nav className="sidebar-nav">
          {/* Inicio */}
          <button
            className={`sidebar-item ${vistaActiva === "inicio" ? "active" : ""}`}
            onClick={() => onCambiarVista("inicio")}
          >
            <i className="fas fa-home"></i> Inicio
          </button>


          {/* Mis Servicios (con submenú) */}
          <button
            className={`sidebar-item ${vistaActiva === "servicios" ? "active" : ""}`}
            onClick={() => setSubmenuServicios(!submenuServicios)}
          >
            <i className="fas fa-hand-holding-heart"></i> Mis Servicios
            <i
              className={`fas fa-chevron-${submenuServicios ? "up" : "down"}`}
              style={{ marginLeft: "auto", fontSize: "0.7rem" }}
            ></i>
          </button>

          {submenuServicios && (
            <div className="sidebar-submenu">
              {SERVICIOS.map((s) => (
                <a
                  key={s.id}
                  href="#"
                  className={`${!s.activo ? "inactivo" : ""} ${
                    servicioActivo === s.id && vistaActiva === "servicios" ? "activo" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!s.activo) return;
                    onCambiarServicio(s.id);
                  }}
                >
                  <span>{s.icono}</span> {s.label}
                  {!s.activo && (
                    <span style={{ marginLeft: "auto", fontSize: "0.55rem" }}>Próx.</span>
                  )}
                </a>
              ))}
            </div>
          )}

          <button
            className={`sidebar-item ${vistaActiva === "mascotas" ? "active" : ""}`}
            onClick={() => onCambiarVista("mascotas")}
          >
            <i className="fas fa-paw"></i> Mis Mascotas
          </button>

          <button
            className={`sidebar-item ${vistaActiva === "datos" ? "active" : ""}`}
            onClick={() => onCambiarVista("datos")}
          >
            <i className="fas fa-user"></i> Mi Perfil
          </button>

          <button
            className={`sidebar-item ${vistaActiva === "facturacion" ? "active" : ""}`}
            onClick={() => onCambiarVista("facturacion")}
          >
            <i className="fas fa-file-invoice"></i> Facturación
          </button>
        </nav>

        <div className="sidebar-divider"></div>

        {/* Cerrar sesión al final */}
        <button className="sidebar-logout" onClick={onLogout}>
          <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
        </button>
      </aside>
    </>
  );
}