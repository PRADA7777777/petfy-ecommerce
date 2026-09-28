// app/perfil/components/Topbar.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Vista, Servicio } from "../page";


interface TopbarProps {
  nombreUsuario: string;
  vistaActiva: Vista;
  servicioActivo: Servicio;
  sidebarAbierto: boolean;
  onCambiarVista: (v: Vista) => void;
  onCambiarServicio: (s: Servicio) => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

const SERVICIOS: { id: Servicio; icono: string; label: string; activo: boolean }[] = [
  { id: "paseos", icono: "🐕", label: "Paseos", activo: true },
  { id: "guarderia", icono: "🏠", label: "Guardería", activo: false },
  { id: "banos", icono: "🛁", label: "Baños", activo: false },
  { id: "veterinaria", icono: "🩺", label: "Veterinaria", activo: false },
  { id: "entrenamiento", icono: "🎓", label: "Entrenamiento", activo: false },
];

export default function Topbar({
  nombreUsuario,
  vistaActiva,
  servicioActivo,
  sidebarAbierto,
  onCambiarVista,
  onCambiarServicio,
  onToggleSidebar,
  onLogout,
}: TopbarProps) {
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAbierto(false);
      }
    };
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, []);

  const handleServicio = (s: Servicio, activo: boolean) => {
    if (!activo) return;
    onCambiarServicio(s);
    setDropdownAbierto(false);
  };

  return (
    <header className="perfil-topbar">
      <div className="container">
        <div className="perfil-topbar-content">
          {/* Logo (izquierda, siempre visible) */}
{/* Logo (izquierda, siempre visible — estático, sin link) */}
<div className="logo logo-con-isotipo" aria-label="Petfy">
  <Image
    src="/assets/img/Logo-Petfy-renovado-2.png"
    alt=""
    width={34}
    height={34}
    priority
    className="logo-isotipo"
  />
  <Image
    src="/assets/img/Nombre-Petfy-Naranja.png"
    alt="Petfy"
    width={90}
    height={30}
    priority
    className="logo-texto"
  />
</div>

          {/* Navegacion */}
          <nav className="perfil-nav">
            <ul className="perfil-nav-links">
              {/* Inicio */}
              <li className="perfil-nav-item">
                <button
                  className={`perfil-nav-link ${vistaActiva === "inicio" ? "active" : ""}`}
                  onClick={() => onCambiarVista("inicio")}
                >
                  <i className="fas fa-home"></i> Inicio
                </button>
              </li>

              {/* Mis Servicios (dropdown) */}
              <li className="perfil-nav-item dropdown-perfil" ref={dropdownRef}>
                <button
                  className={`perfil-nav-link ${vistaActiva === "servicios" ? "active" : ""}`}
                  onClick={() => setDropdownAbierto(!dropdownAbierto)}
                >
                  <i className="fas fa-hand-holding-heart"></i> Mis Servicios{" "}
                  <i className="fas fa-chevron-down dropdown-arrow"></i>
                </button>
                <div className={`dropdown-menu-perfil ${dropdownAbierto ? "show" : ""}`}>
                  {SERVICIOS.map((s) => (
                    <Link
                      key={s.id}
                      href="#"
                      className={`dropdown-item-perfil ${!s.activo ? "inactivo" : ""} ${servicioActivo === s.id && vistaActiva === "servicios" ? "activo" : ""
                        }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleServicio(s.id, s.activo);
                      }}
                    >
                      <span>{s.icono}</span> {s.label}
                      {!s.activo && (
                        <span style={{ marginLeft: "auto", fontSize: "0.55rem", opacity: 0.7 }}>
                          Próx.
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </li>

              {/* Mis Mascotas */}
              <li className="perfil-nav-item">
                <button
                  className={`perfil-nav-link ${vistaActiva === "mascotas" ? "active" : ""}`}
                  onClick={() => onCambiarVista("mascotas")}
                >
                  <i className="fas fa-paw"></i> Mis Mascotas
                </button>
              </li>

              {/* Mi Perfil */}
              <li className="perfil-nav-item">
                <button
                  className={`perfil-nav-link ${vistaActiva === "datos" ? "active" : ""}`}
                  onClick={() => onCambiarVista("datos")}
                >
                  <i className="fas fa-user"></i> Mi Perfil
                </button>
              </li>

              {/* Facturación */}
              <li className="perfil-nav-item">
                <button
                  className={`perfil-nav-link ${vistaActiva === "facturacion" ? "active" : ""}`}
                  onClick={() => onCambiarVista("facturacion")}
                >
                  <i className="fas fa-file-invoice"></i> Facturación
                </button>
              </li>
            </ul>
          </nav>

          {/* Usuario + logout (oculto en móvil) */}
          <div className="perfil-topbar-user">
            <span>{nombreUsuario}</span>
            <a
              href="#"
              className="perfil-topbar-logout"
              onClick={(e) => {
                e.preventDefault();
                onLogout();
              }}
              title="Cerrar sesión"
            >
              <i className="fas fa-sign-out-alt"></i>
            </a>
          </div>

          {/* Hamburguesa (solo visible en móvil) */}
          <button
            className="perfil-menu-toggle"
            onClick={onToggleSidebar}
            aria-label={sidebarAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            <i className={`fas ${sidebarAbierto ? "fa-times" : "fa-bars"}`}></i>
          </button>
        </div>
      </div>
    </header>
  );
}