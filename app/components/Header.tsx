"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";  // ← Correcto: useRouter, no userRouter
import { useModal } from "../context/ModalContext";  // ← Usa alias @ para consistencia

export default function Header() {  // ← Elimina la prop onOpenLogin
    const router = useRouter();
    const { openLogin } = useModal();  // ← Obtén openLogin del contexto
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    // Función para manejar el clic en "Mi cuenta"
    const handleCuentaClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const logged = localStorage.getItem("petfyLogged") === "true";
        if (logged) {
            // Si está logueado, redirigir a perfil usando router.push
            router.push("/perfil");
        } else {
            // Si no, abrir modal de login con el contexto
            openLogin();
        }
    };

    return (
        <header className={`header ${isScrolled ? "scrolled" : ""}`} id="mainHeader">
            <div className="container">
                <nav className="navbar">
                    {/* Logo */}

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

                    {/* Enlaces del menú */}
                    <div className="nav-links-wrapper">
                        <ul className={`nav-links ${isMenuOpen ? "open" : ""}`} id="navLinks">
                            <li className="nav-item">
                                <Link href="#inicio" className="nav-link" onClick={closeMenu}>Inicio</Link>
                            </li>
                            <li className="nav-item">
                                <Link href="#servicios" className="nav-link" onClick={closeMenu}>Servicios</Link>
                            </li>
                            <li className="nav-item">
                                <Link href="#nosotros" className="nav-link" onClick={closeMenu}>Nosotros</Link>
                            </li>
                            <li className="nav-item">
                                <Link href="#contacto" className="nav-link" onClick={closeMenu}>Contacto</Link>
                            </li>
                            <li className="nav-item mobile-only">
                                <button
                                    className="nav-link"
                                    onClick={(e) => {
                                        closeMenu();
                                        handleCuentaClick(e);
                                    }}
                                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                                >
                                    <i className="fas fa-user"></i> Mi cuenta
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Acciones de usuario (solo escritorio) */}
                    <div className="user-actions">
                        <button
                            className="icon-link"
                            title="Mi cuenta"
                            id="btnCuenta"
                            onClick={handleCuentaClick}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            <i className="fas fa-user"></i>
                        </button>
                    </div>

                    {/* Botón menú móvil */}
                    <button className="mobile-menu-btn" aria-label="Menú" onClick={toggleMenu}>
                        <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"}`}></i>
                    </button>
                </nav>
            </div>
        </header>
    );
}