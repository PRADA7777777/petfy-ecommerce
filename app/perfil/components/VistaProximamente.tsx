// app/perfil/components/VistaProximamente.tsx
"use client";

import { Servicio } from "../page";

interface VistaProximamenteProps {
  servicio: Servicio;
}

const INFO: Record<
  Exclude<Servicio, "paseos">,
  { icono: string; titulo: string; descripcion: string; features: string[] }
> = {
  guarderia: {
    icono: "🏠",
    titulo: "Guardería",
    descripcion: "Cuidado diario con cámaras 24/7 para que tu mascota esté segura y feliz mientras trabajas.",
    features: ["Cámaras en vivo 24/7", "Socialización supervisada", "Alimentación personalizada"],
  },
  banos: {
    icono: "🛁",
    titulo: "Baños",
    descripcion: "Servicio de baño profesional con productos hipoalergénicos y secado especializado.",
    features: ["Productos hipoalergénicos", "Secado profesional", "Servicio a domicilio"],
  },
  veterinaria: {
    icono: "🩺",
    titulo: "Veterinaria",
    descripcion: "Atención veterinaria a domicilio con profesionales certificados para el cuidado integral.",
    features: ["Consultas a domicilio", "Vacunación", "Urgencias 24/7"],
  },
  entrenamiento: {
    icono: "🎓",
    titulo: "Entrenamiento",
    descripcion: "Adiestramiento profesional personalizado para mejorar el comportamiento de tu mascota.",
    features: ["Entrenadores certificados", "Obediencia básica y avanzada", "Planes personalizados"],
  },
};

export default function VistaProximamente({ servicio }: VistaProximamenteProps) {
  if (servicio === "paseos") return null;
  const info = INFO[servicio];

  return (
    <div className="perfil-vista active">
      <div className="perfil-section">
        <div className="inactivo-placeholder">
          <div className="placeholder-icon">{info.icono}</div>
          <h3>{info.titulo} - Próximamente</h3>
          <p>{info.descripcion}</p>
          <ul className="placeholder-features">
            {info.features.map((f, i) => (
              <li key={i}>
                <i className="fas fa-check-circle"></i> {f}
              </li>
            ))}
          </ul>
          <a
            href="https://wa.me/573204829244"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-perfil btn-outline"
          >
            <i className="fab fa-whatsapp"></i> Avísame cuando esté disponible
          </a>
        </div>
      </div>
    </div>
  );
}