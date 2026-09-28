"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Inicio() {
    // Estado para el carrusel de banners
    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = 4;

    // Datos de los banners (puedes moverlos a un array)
    const banners = [
        {
            id: 1,
            image: "/assets/img/Petfy-Carusell-1.jpg",
            alt: "Banner 1",
            btnText: "Agendar Ahora",
            btnLink: "#planes",
            btnClass: "banner-1",
        },
        {
            id: 2,
            image: "/assets/img/Petfy-Carusell-2.jpg",
            alt: "Banner 2",
            btnText: "Quiero mi Paseo Gratis",
            btnLink: "#planes",
            btnClass: "banner-2",
        },
        {
            id: 3,
            image: "/assets/img/Petfy-Carrusel-3.jpg",
            alt: "Banner 3",
            btnText: "Ver Planes",
            btnLink: "#planes",
            btnClass: "banner-3",
        },
        {
            id: 4,
            image: "/assets/img/Petfy-Carrusel-4.jpg",
            alt: "Banner 4",
            btnText: "Chatear Ahora",
            btnLink: "https://wa.me/573204829244",
            btnClass: "banner-4",
        },
    ];

    // Cambiar slide automáticamente
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % totalSlides);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const goToSlide = (index: number) => setCurrentSlide(index);
    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

    return (
        <section id="inicio" className="section-inicio">
            {/* Carrusel de banners */}
            <section className="banner-carousel">
                <div className="carousel-container" id="mainCarousel">
                    <button className="carousel-btn carousel-prev" onClick={prevSlide}>
                        ‹
                    </button>
                    <button className="carousel-btn carousel-next" onClick={nextSlide}>
                        ›
                    </button>
                    <div
                        className="carousel-track"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {banners.map((banner, index) => (
                            <div
                                key={banner.id}
                                className={`carousel-slide ${banner.btnClass}`}
                            >
                                <Image
                                    src={banner.image}
                                    alt={banner.alt}
                                    width={1920}
                                    height={600}
                                    className="carousel-img"
                                    priority={index === 0}
                                />
                                <Link href={banner.btnLink} className="carousel-btn-accion">
                                    {banner.btnText} <i className="fas fa-arrow-right"></i>
                                </Link>
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

            {/* Hero */}
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