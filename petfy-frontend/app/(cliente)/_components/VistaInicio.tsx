"use client";

import { useEffect, useState } from "react";

import { Mascota, Usuario } from "@/lib/api"; 

import { Vista, Servicio } from "../perfil/page"; 

interface VistaInicioProps {
    usuario: Usuario;
    mascotas: Mascota[];
    onCambiarVista: (v: Vista) => void;
    onCambiarServicio: (s: Servicio) => void;
}

const COLORES_MASCOTAS = ["var(--primary-light)", "var(--teal-light)", "var(--pink-light)", "var(--orange-light)"];

const TIPS_MASCOTAS = [
  "Recuerda mantener a tu mascota hidratada antes y después de cada paseo, especialmente en días soleados.",
  "Revisa las almohadillas de sus patas después de caminar. Si están agrietadas, aplica una crema especial.",
  "Cepillar su pelaje 2 o 3 veces por semana no solo lo mantiene limpio, sino que fortalece el vínculo contigo.",
  "Los juguetes de rompecabezas son excelentes para mantener su mente activa y reducir la ansiedad cuando no estás.",
  "No olvides revisar sus orejas una vez a la semana. Si notas mal olor o mucha cera, consulta con tu veterinario.",
  "Asegúrate de que la placa de identificación de tu perro tenga tu número actual antes de cada paseo. Una mascota identificada viaja más segura.",
  "Si tu perro es tímido, los paseos frecuentes en entornos controlados le ayudan a ganar confianza con otros caninos de forma gradual.",
  "Premiar las buenas conductas durante el paseo refuerza el aprendizaje positivo y hace que tu perro disfrute mucho más la experiencia.",
  "Dejar que tu perro huela el entorno durante sus salidas es vital. El olfato es su forma de leer el 'periódico' del vecindario.",
  "Si el paseo coincide con una llovizna, recuerda limpiar y secar bien sus patas y abdomen al volver para evitar humedades en la piel.",
  "Las caminatas diarias no solo son para ir al baño; ayudan a canalizar la energía de tu perro y reducen conductas destructivas en casa.",
  "Exponer a tu cachorro de forma amigable a diferentes personas y ruidos durante sus salidas forma a un adulto equilibrado y feliz.",
  "Mantén siempre a la mano bolsas para residuos, una botella de agua portátil y premios saludables antes de que llegue su paseador.",
  "Elige un arnés de pecho en lugar de un collar tradicional si tu perro suele tirar mucho de la correa, protegiendo así su delicado cuello.",
  "Mantener horarios constantes para sus salidas ayuda a sincronizar el reloj biológico de tu perro y reduce su ansiedad por separación.",
  "Un chequeo general con el veterinario al menos una vez al año es la mejor forma de detectar cualquier problema de salud a tiempo.",
  "Mantener al día el tratamiento contra pulgas y garrapatas es vital para tu mascota, especialmente si frecuentan parques y zonas verdes.",
  "Lava los recipientes de agua y comida de tus mascotas diariamente para evitar la acumulación de bacterias que puedan enfermar su estómago.",
  "Los snacks son maravillosos para educar, pero no deben superar el 10% de la ingesta calórica diaria de tu mascota para evitar el sobrepeso.",
  "Acostumbra a tu mascota desde pequeña al cepillado dental o usa juguetes interactivos que ayuden a reducir la acumulación de sarro."
];


export default function VistaInicio({
    usuario,
    mascotas,
    onCambiarVista,
    onCambiarServicio,
}: VistaInicioProps) {
    const primerNombre = usuario.nombre?.split(" ")[0] || "Usuario";
    
    // Estados para el tip automático y su animación
    const [tipIndex, setTipIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        // Temporizador para cambiar el tip cada 8 segundos
        const interval = setInterval(() => {
            setIsFading(true); // Inicia el desvanecimiento
            
            setTimeout(() => {
                setTipIndex((prev) => (prev + 1) % TIPS_MASCOTAS.length);
                setIsFading(false); // Termina el desvanecimiento y muestra el nuevo texto
            }, 500); // 500ms coincide con la transición del CSS
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="perfil-vista active dashboard-layout">
            {/* BIENVENIDA */}
            <div className="perfil-section inicio-bienvenida dashboard-full-width">
                <h2 className="inicio-titulo">¡Hola, <strong>{primerNombre}</strong>! 👋</h2>
                <p className="inicio-subtitulo">Aquí está el resumen de tus peludos hoy.</p>
            </div>

            {/* CONTENIDO PRINCIPAL EN 2 COLUMNAS */}
            <div className="dashboard-grid">
                
                {/* COLUMNA IZQUIERDA: Mascotas y Próximo Paseo */}
                <div className="dashboard-col-main">
                    {/* Próximo Servicio */}
                    <div className="perfil-section dashboard-proximo-evento">
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
                    </div>

                    {/* Tus Mascotas */}
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
                                    return (
                                        <div key={m.id_mascota} className="pet-status-card-full">
                                            <div className="psc-header">
                                                <div className="psc-img" style={{ background: !m.img_masc ? colorFondo : 'transparent' }}>
                                                    {m.img_masc ? <img src={m.img_masc} alt={m.nom_mascota} /> : <span>🐶</span>}
                                                </div>
                                                <div className="psc-title">
                                                    <strong>{m.nom_mascota}</strong>
                                                    <p>{m.raza || "Mascota"}</p>
                                                </div>
                                            </div>

                                            <div className="psc-plan-box">
                                                <div className="psc-plan-info">
                                                    <span className="badge-plan warn">Sin plan activo</span>
                                                    <span className="psc-date">Adquiere un plan para empezar</span>
                                                </div>
                                                <button className="btn-perfil btn-primary btn-sm" onClick={() => onCambiarServicio("paseos")}>
                                                    Ver Planes
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA DERECHA: Widgets de Valor */}
                <div className="dashboard-col-side">
                    {/* Widget de Soporte */}
                    <div className="perfil-section widget-soporte">
                        <div className="widget-icon">📞</div>
                        <h3>¿Necesitas ayuda?</h3>
                        <p>Estamos aquí para ti y tus peludos.</p>
                        <a href="https://wa.me/573204829244" target="_blank" rel="noopener noreferrer" className="btn-perfil btn-outline widget-btn">
                            Contactar Soporte
                        </a>
                    </div>

                    {/* 🆕 Widget Tip del Día Automático */}
                    <div className="perfil-section widget-tip">
                        <div className="widget-icon">💡</div>
                        <h3>Tip del día</h3>
                        <div className={`widget-tip-content ${isFading ? 'fade-out' : ''}`}>
                            <p>{TIPS_MASCOTAS[tipIndex]}</p>
                        </div>
                    </div>


                </div>
            </div>
        </div>
    );
}