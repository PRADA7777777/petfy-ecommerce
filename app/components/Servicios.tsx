"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useModal } from "../context/ModalContext";

// ========== DATOS DE PLANES (igual que en tu JS original) ==========
const planesData = [
    {
        id: "001",
        emoji: "⚡",
        nombre: "Paseo Único",
        tag: "tag-ahorro",
        tagText: "Sin suscripción",
        precio: 19990,
        periodo: "por paseo",
        diasPermitidos: 1,
        duracion: "1 hora",
        duracionLetra: "55 minutos",
        features: ["1 hora de paseo", "GPS en vivo", "5 fotos", "Paseador certificado"],
    },
    {
        id: "002",
        emoji: "🌟",
        nombre: "3 Días/Semana",
        tag: "tag-popular",
        tagText: "Más Popular",
        precio: 189990,
        periodo: "/mes",
        diasPermitidos: 3,
        duracion: "1 hora",
        duracionLetra: "55 minutos",
        features: ["1h por sesión", "Paseador fijo", "GPS en vivo", "Fotos", "Seguro incluido"],
    },
    {
        id: "003",
        emoji: "🔥",
        nombre: "5 Días/Semana",
        tag: "tag-premium",
        tagText: "Recomendado",
        precio: 299990,
        periodo: "/mes",
        diasPermitidos: 5,
        duracion: "1 hora",
        duracionLetra: "55 minutos",
        features: ["1h por sesión", "Paseador VIP", "GPS en vivo", "Fotos + video", "Seguro incluido"],
    },
];

export default function Servicios() {
    // ========== HOOKS ==========
    const router = useRouter();
    const { openLogin } = useModal();

    // ========== ESTADOS ==========
    const [currentIndex, setCurrentIndex] = useState(0);
    const [servicioActivo, setServicioActivo] = useState("paseos");

    // ========== FUNCIONES DEL CARRUSEL 3D ==========
    const girarCarousel = (dir: number) => {
        setCurrentIndex((prev) => (prev + dir + planesData.length) % planesData.length);
    };

    // ========== FUNCIONES DE SERVICIOS ==========
    const mostrarServicio = (servicio: string) => {
        setServicioActivo(servicio);
    };

  // ========== FUNCIÓN PARA ELEGIR PLAN ==========
  const elegirPlan = () => {
    // Verificar si el usuario está logueado
    const isLogged = localStorage.getItem("petfyLogged") === "true";
    if (!isLogged) {
      openLogin();
    } else {
      router.push("/perfil");
    }
  };

    // ========== RENDER ==========
    return (
        <section id="servicios" className="services-full-section">
            {/* HEADER SERVICIOS */}
            <div className="servicios-header">
                <span className="doodle d1">🐾</span>
                <span className="doodle d2">✨</span>
                <span className="doodle d3">🦴</span>
                <span className="doodle d4">🐾</span>
                <div className="container">
                    <span className="section-subtitle">Cuidado Integral</span>
                    <h1>Nuestros Servicios</h1>
                    <p>Gira el carrusel y elige tu plan ideal</p>
                </div>
            </div>

            {/* NAVEGACIÓN DE SERVICIOS */}
            <div className="servicios-nav">
                <div className="container">
                    {["paseos", "guarderia", "banos", "veterinaria", "entrenamiento"].map((serv) => (
                        <button
                            key={serv}
                            className={`servicio-nav-btn ${servicioActivo === serv ? "active" : "inactivo"}`}
                            onClick={() => mostrarServicio(serv)}
                        >
                            <i className={`fas ${serv === "paseos" ? "fa-dog" : serv === "guarderia" ? "fa-home" : serv === "banos" ? "fa-shower" : serv === "veterinaria" ? "fa-stethoscope" : "fa-graduation-cap"}`}></i>
                            {serv.charAt(0).toUpperCase() + serv.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENIDO DE SERVICIOS */}
            <div className="servicios-content">
                <div className="container">
                    {/* PANEL PASEOS (ACTIVO POR DEFECTO) */}
                    <div className={`servicio-panel ${servicioActivo === "paseos" ? "active" : ""}`} id="panel-paseos">
                        {/* CARRUSEL 3D DE PLANES */}
                        <div className="carousel-3d-container" id="carousel3D">
                            <div className="carousel-3d" id="carouselTrack3D">
                                {planesData.map((plan, i) => {
                                    const diff = (i - currentIndex + planesData.length) % planesData.length;
                                    let clase = "";
                                    if (diff === 0) clase = "center";
                                    else if (diff === 1 || diff === -(planesData.length - 1)) clase = "right";
                                    else if (diff === planesData.length - 1 || diff === -1) clase = "left";
                                    else if (diff === 2) clase = "far-right";
                                    else clase = "far-left";

                                    return (
                                        <div key={plan.id} className={`plan-card-3d ${clase}`}>
                                            <div className="plan-emoji">{plan.emoji}</div>
                                            <h3>{plan.nombre}</h3>
                                            <span className={`plan-tag ${plan.tag}`}>{plan.tagText}</span>
                                            <div className="plan-precio">
                                                ${plan.precio.toLocaleString()}
                                                <small>{plan.periodo}</small>
                                            </div>
                                            <ul className="plan-features">
                                                {plan.features.map((feat, idx) => (
                                                    <li key={idx}>
                                                        <i className="fas fa-check-circle"></i> {feat}
                                                    </li>
                                                ))}
                                            </ul>
                                            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                                *Duración: {plan.duracionLetra}
                                            </p>
                                            <button className="plan-btn-elegir" onClick={elegirPlan}>
                                                Elegir este Plan
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="carousel-arrows">
                                <button className="carousel-arrow" onClick={() => girarCarousel(-1)} aria-label="Anterior">
                                    ‹
                                </button>
                                <button className="carousel-arrow" onClick={() => girarCarousel(1)} aria-label="Siguiente">
                                    ›
                                </button>
                            </div>
                        </div>

                        {/* INDICADORES DEL CARRUSEL */}
                        <div className="carousel-indicators" id="carouselIndicators">
                            {planesData.map((_, i) => (
                                <span
                                    key={i}
                                    className={`dot-indicator ${i === currentIndex ? "active" : ""}`}
                                    onClick={() => setCurrentIndex(i)}
                                />
                            ))}
                        </div>

                        {/* BENEFICIOS INCLUIDOS */}
                        <div className="benefits-inline">
                            {[
                                { icon: "fa-map-marker-alt", text: "GPS en Vivo" },
                                { icon: "fa-camera", text: "Fotos del Paseo" },
                                { icon: "fa-user-check", text: "Paseador Fijo" },
                                { icon: "fa-headset", text: "Soporte 24/7" },
                            ].map((benefit, idx) => (
                                <div key={idx} className="benefit-item">
                                    <i className={`fas ${benefit.icon}`}></i>
                                    <span>{benefit.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PANELES INACTIVOS */}
                    {["guarderia", "banos", "veterinaria", "entrenamiento"].map((serv) => (
                        <div key={serv} className={`servicio-panel ${servicioActivo === serv ? "active" : ""}`} id={`panel-${serv}`}>
                            <div className="inactivo-placeholder">
                                <div className="placeholder-icon">
                                    {serv === "guarderia" && "🏠"}
                                    {serv === "banos" && "🛁"}
                                    {serv === "veterinaria" && "🩺"}
                                    {serv === "entrenamiento" && "🎓"}
                                </div>
                                <h3>
                                    {serv.charAt(0).toUpperCase() + serv.slice(1)} - Próximamente
                                </h3>
                                <p>
                                    {serv === "guarderia" &&
                                        "Cuidado diario con cámaras 24/7 para que tu mascota esté segura y feliz mientras trabajas"}
                                    {serv === "banos" &&
                                        "Servicio de baño profesional con productos hipoalergénicos y secado especializado"}
                                    {serv === "veterinaria" &&
                                        "Atención veterinaria a domicilio con profesionales certificados para el cuidado integral de tu mascota"}
                                    {serv === "entrenamiento" &&
                                        "Adiestramiento profesional personalizado para mejorar el comportamiento y fortalecer el vínculo con tu mascota"}
                                </p>
                                <ul className="placeholder-features">
                                    {serv === "guarderia" && [
                                        { icon: "fa-video", text: "Cámaras en vivo 24/7" },
                                        { icon: "fa-users", text: "Socialización supervisada" },
                                        { icon: "fa-bone", text: "Alimentación personalizada" },
                                    ].map((feat, idx) => (
                                        <li key={idx}>
                                            <i className={`fas ${feat.icon}`}></i> {feat.text}
                                        </li>
                                    ))}
                                    {serv === "banos" && [
                                        { icon: "fa-shield-alt", text: "Productos hipoalergénicos" },
                                        { icon: "fa-wind", text: "Secado profesional" },
                                        { icon: "fa-home", text: "Servicio a domicilio" },
                                    ].map((feat, idx) => (
                                        <li key={idx}>
                                            <i className={`fas ${feat.icon}`}></i> {feat.text}
                                        </li>
                                    ))}
                                    {serv === "veterinaria" && [
                                        { icon: "fa-stethoscope", text: "Consultas a domicilio" },
                                        { icon: "fa-syringe", text: "Vacunación" },
                                        { icon: "fa-ambulance", text: "Urgencias 24/7" },
                                    ].map((feat, idx) => (
                                        <li key={idx}>
                                            <i className={`fas ${feat.icon}`}></i> {feat.text}
                                        </li>
                                    ))}
                                    {serv === "entrenamiento" && [
                                        { icon: "fa-graduation-cap", text: "Entrenadores certificados" },
                                        { icon: "fa-check-circle", text: "Obediencia básica y avanzada" },
                                        { icon: "fa-calendar-check", text: "Planes personalizados" },
                                    ].map((feat, idx) => (
                                        <li key={idx}>
                                            <i className={`fas ${feat.icon}`}></i> {feat.text}
                                        </li>
                                    ))}
                                </ul>
                                <a href="https://wa.me/573204829244" className="btn btn-outline">
                                    <i className="fab fa-whatsapp"></i> Avísame cuando esté disponible
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}