"use client";

import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation"; 
import { authAPI } from "@/lib/api";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

interface ModalLoginProps {
    isOpen: boolean;
    onClose: () => void;
    onRegistroClick: () => void;
    onRecuperarClick: () => void;
}

export default function ModalLogin({ isOpen, onClose, onRegistroClick, onRecuperarClick }: ModalLoginProps) {
    // 2. Usamos nuestro hook mágico
    const { login } = useAuth(); 
    
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mostrarContrasena, setMostrarContrasena] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";

            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        } else {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        try {
            // Petición a tu backend
            const data = await authAPI.login({ correo, contrasena }) as any;
            
            // 3. AQUÍ LA MAGIA: Usamos el login del contexto
            const userData = data.user || data.usuario || data; 
            const tokenData = data.token || data.access_token || "token-simulado";
            
            login(userData, tokenData);
            
            // Cerramos el modal (la redirección la hace el AuthContext)
            onClose(); 
            
        } catch (err: any) {
            // Tu manejo de errores está perfecto, lo dejamos igual
            if (err.message?.includes("401") || err.message?.toLowerCase().includes("incorrect")) {
                setError("Correo o contraseña incorrectos. Verifica tus datos.");
            } else if (err.message?.includes("429") || err.message?.toLowerCase().includes("too many")) {
                setError("Demasiados intentos. Por seguridad, espera 5 minutos.");
            } else if (err.message?.includes("500")) {
                setError("Tuvimos un problema en nuestros servidores. Intenta de nuevo más tarde.");
            } else {
                setError("Error al iniciar sesión. Revisa tu conexión a internet.");
            }
        } finally {
            setCargando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div
                className="modal-container"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-modal-title"
            >
                <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
                    <i className="fas fa-times"></i>
                </button>
                <div className="modal-header-logo">
                    <Image
                        src="/assets/img/Logo-Petfy-renovado-2.png"
                        alt="Logo de Petfy"
                        width={120}
                        height={50}
                        className="logo-icon"
                        priority
                    />
                </div>

                <h2 id="login-modal-title">Iniciar Sesión</h2>

                {error && (
                    <div className="modal-alert-error">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modal-input-group">
                        <label htmlFor="login-email" className="sr-only">Correo electrónico</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="tu@email.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            disabled={cargando}
                            required
                            autoComplete="email"
                            autoFocus
                        />
                    </div>
                    <div className="modal-input-group" style={{ position: 'relative' }}>
                        <label htmlFor="login-pass" className="sr-only">Contraseña</label>
                        <input
                            id="login-pass"
                            type={mostrarContrasena ? "text" : "password"}
                            placeholder="Contraseña"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            disabled={cargando}
                            required
                            autoComplete="current-password"
                            style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => setMostrarContrasena(!mostrarContrasena)}
                            style={{
                                position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'
                            }}
                            tabIndex={-1}
                        >
                            <i className={`fas fa-eye${mostrarContrasena ? '-slash' : ''}`}></i>
                        </button>
                    </div>

                    <div style={{ textAlign: "right", marginTop: "-0.5rem", marginBottom: "1rem" }}>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); onRecuperarClick(); }}
                            style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none" }}
                        >
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    <button type="submit" className="modal-btn" disabled={cargando}>
                        {cargando ? <><i className="fas fa-spinner fa-spin"></i> Ingresando...</> : "Iniciar Sesión"}
                    </button>
                </form>
                <p className="modal-switch">
                    ¿No tienes cuenta?{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); onRegistroClick(); }}>
                        Crear cuenta
                    </a>
                </p>
            </div>
        </div>
    );
}