"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, User, Scissors, Dog, Home, Stethoscope, Settings, LogOut, Menu } from "lucide-react";
import { Badge } from "@/components/Badge";
import "./Topbar.css"; // <-- Importación normal

interface TopbarProps {
  onMenuClick: () => void;
  onLogout: () => void;
}

export function Topbar({ onMenuClick, onLogout }: TopbarProps) {
  const { user } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const getRoleInfo = () => {
    if (user.id_rol === 1) return { label: "Administrador", color: "teal", icon: ShieldCheck };
    if (user.id_rol === 3) {
      const servicios = user.servicios || [];
      if (servicios.length > 1 || servicios.length === 0) return { label: "Staff", color: "gray", icon: User };
      const idServicio = servicios[0].id_servicio; 
      switch (idServicio) {
        case 2: return { label: "Paseador", color: "orange", icon: Dog };
        case 3: return { label: "Bañador", color: "blue", icon: Scissors };
        case 4: return { label: "Cuidador", color: "green", icon: Home };
        case 5: return { label: "Veterinario", color: "indigo", icon: Stethoscope };
        default: return { label: "Staff", color: "gray", icon: User };
      }
    }
    return { label: "Cliente", color: "blue", icon: User };
  };

  const roleInfo = getRoleInfo();

  return (
    <header className="topbar">
      
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        <div className="topbar-user-title">
          <span className="topbar-user-name">{user.nombre} {user.apellido}</span>
          <span className="topbar-separator">-</span>
          <Badge color={roleInfo.color as any}>
            {roleInfo.label}
          </Badge>
        </div>
      </div>

      <div className="topbar-right" ref={menuRef}>
        <button 
          className={`topbar-avatar ${menuAbierto ? "topbar-avatar-active" : ""}`} 
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {user.nombre?.[0]}{user.apellido?.[0]}
        </button>

        {menuAbierto && (
          <div className="topbar-dropdown">
            <div className="topbar-user-info">
              <p className="topbar-email">{user.correo}</p>
            </div>

            <div className="topbar-divider"></div>

            <button className="topbar-dropdown-item" onClick={() => { setMenuAbierto(false); }}>
              <Settings size={16} /> Configuración
            </button>
            
            <button className="topbar-dropdown-item topbar-danger" onClick={() => { onLogout(); setMenuAbierto(false); }}>
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}