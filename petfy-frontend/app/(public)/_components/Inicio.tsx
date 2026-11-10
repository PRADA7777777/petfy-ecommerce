"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useModal } from "../_context/ModalContext";

export default function Inicio() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 4;
    const { openLogin } = useModal();

    // Datos de los banners actualizados con tipos de acción
    const banners = [
        {
            id: 1,
            image: "/assets/img/Petfy-Carusell-1.jpg",
            alt: "Banner 1",
            btnText: "Agendar Ahora",
            action: "login", // Acción de abrir login
            btnClass: "banner-1",
        },
        {
            id: 2,
            image: "/assets/img/Petfy-Carusell-2.jpg",
            alt: "Banner 2",
            btnText: "Quiero mi Paseo Gratis",
            action: "login", // Acción de abrir login
            btnClass: "banner-2",
        },
        {
            id: 3,
            image: "/assets/img/Petfy-Carrusel-3.jpg",
            alt: "Banner 3",
            btnText: "Ver Planes",
            action: "scroll", // Acción de bajar a la sección
            targetId: "servicios", // El ID de tu sección de planes
            btnClass: "banner-3",
        },
        {
            id: 4,
            image: "/assets/img/Petfy-Carrusel-4.jpg",
            alt: "Banner 4",
            btnText: "Chatear Ahora",
            action: "link",
            link: "https://wa.me/573204829244",
            btnClass: "banner-4",
        },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const goToSlide = (index: number) => setCurrentSlide(index);
    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

    // Función para hacer scroll suave
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Renderizador dinámico del botón según su acción
    const renderBannerButton = (banner: any) => {
        if (banner.action === "login") {
            return (
                <button onClick={openLogin} className="carousel-btn-accion" style={{ border: "none", cursor: "pointer" }}>
                    {banner.btnText} <i className="fas fa-arrow-right"></i>
                </button>
            );
        }
        if (banner.action === "scroll") {
            return (
                <button onClick={() => scrollToSection(banner.targetId)} className="carousel-btn-accion" style={{ border: "none", cursor: "pointer" }}>
                    {banner.btnText} <i className="fas fa-arrow-right"></i>
                </button>
            );
        }
        return (
            <a href={banner.link} target="_blank" rel="noopener noreferrer" className="carousel-btn-accion">
                {banner.btnText} <i className="fas fa-arrow-right"></i>
            </a>
        );
    };

    return (
        <section id="inicio" className="section-inicio">
            <section className="banner-carousel">
                <div className="carousel-container" id="mainCarousel">
                    <button className="carousel-btn carousel-prev" onClick={prevSlide}>‹</button>
                    <button className="carousel-btn carousel-next" onClick={nextSlide}>›</button>
                    <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                        {banners.map((banner, index) => (
                            <div key={banner.id} className={`carousel-slide ${banner.btnClass}`}>
                                <Image
                                    src={banner.image}
                                    alt={banner.alt}
                                    width={1920}
                                    height={600}
                                    className="carousel-img"
                                    priority={index === 0}
                                />
                                {renderBannerButton(banner)}
                            </div>
                        ))}
                    </div>
                    <div className="carousel-dots">
                        {banners.map((_, index) => (
                            <span
                                key={index}
                                className={`dot ${currentSlide === index ? "active" : ""}`}
                                onClick={() => goToSlide(index)}
                            ></span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hero (se mantiene igual) */}
            <section className="hero-section">
                <div className="container">
                    <div className="container-badge">
                        <span className="hero-badge">🐾 BIENVENIDOS A PETFY 🐾</span>
                    </div>
                    <div className="hero">
                        <div className="hero-content">
                            <h1>
                                UN <span className="highlight">MUNDO PELUDO</span>
                                <br /> PARA TUS
                                <br />
                                <span className="highlight">MEJORES AMIGOS</span>
                            </h1>
                            <p className="hero-description">
                                Baños, Vet y Diversión ya están en camino. Mientras tanto,
                                estrenamos con los paseos más seguros y felices para tu peludo.
                            </p>
                            <div className="hero-stats">
                                <div className="stat-item">
                                    <span className="stat-number">+500</span>
                                    <span className="stat-label">Paseos</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">4.9</span>
                                    <span className="stat-label">Rating</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-number">24/7</span>
                                    <span className="stat-label">Soporte</span>
                                </div>
                            </div>
                        </div>
                        <div className="hero-image">
                            <div className="image-wrapper">
                                <Image
                                    src="/assets/img/Group 1.png"
                                    alt="Mascotas"
                                    width={400}
                                    height={400}
                                    className="floating-image"
                                />
                                <div className="floating-badge">
                                    <i className="fas fa-star"></i>
                                    <span>4.9/5 Reseñas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </section>
    );
}