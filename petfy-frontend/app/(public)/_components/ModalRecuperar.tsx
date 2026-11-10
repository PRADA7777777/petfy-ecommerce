"use client";

import { useState, useEffect } from "react";
import { authAPI } from "@/lib/api"; 
import Image from "next/image";

interface ModalRecuperarProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginClick: () => void;
}

export default function ModalRecuperar({ isOpen, onClose, onLoginClick }: ModalRecuperarProps) {
    const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);
    const [email, setEmail] = useState("");
    const [codigo, setCodigo] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [contadorReenvio, setContadorReenvio] = useState(0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            document.documentElement.style.overflow = "hidden";
            // Ya no cerramos con Escape para forzar el flujo
        } else {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
            setPaso(1); 
            setEmail(""); setCodigo(""); setPassword(""); setConfirmPassword(""); setError("");
        }
        return () => {
            document.body.style.overflow = "unset";
            document.documentElement.style.overflow = "unset";
        };
    }, [isOpen]);

    useEffect(() => {
        if (contadorReenvio > 0) {
            const timer = setTimeout(() => setContadorReenvio(contadorReenvio - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [contadorReenvio]);

    // PASO 1: Enviar Correo
    const handleEnviarCorreo = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); setCargando(true);
        try {
            await authAPI.solicitarRecuperacion(email); // 🔥 Conectado al backend
            setPaso(2); 
            setContadorReenvio(30);
        } catch (err: any) {
            setError(err.message || "Error al enviar el correo. Verifica que esté registrado.");
        } finally {
            setCargando(false);
        }
    };

    // PASO 2: Verificar Código
    const handleVerificarCodigo = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (codigo.length !== 6) return setError("El código debe tener 6 dígitos.");
        
        setCargando(true);
        try {
            await authAPI.verificarCodigoRecuperacion(email, codigo); // 🔥 Conectado al backend
            setPaso(3); 
        } catch (err: any) {
            setError(err.message || "Código incorrecto o expirado.");
        } finally {
            setCargando(false);
        }
    };

    // PASO 3: Cambiar Contraseña
    const handleCambiarPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 8) return setError("La contraseña debe tener mínimo 8 caracteres.");
        if (password !== confirmPassword) return setError("Las contraseñas no coinciden.");

        setCargando(true);
        try {
            await authAPI.cambiarPassword(email, codigo, password); // 🔥 Conectado al backend
            setPaso(4); 
            // Recargar la página y abrir el login después de 2.5 segundos
            setTimeout(() => { 
                window.location.reload(); 
            }, 2500); 
        } catch (err: any) {
            setError(err.message || "Error al actualizar la contraseña.");
        } finally {
            setCargando(false);
        }
    };

    const handleReenviar = async () => {
        setError(""); setCargando(true);
        try {
            await authAPI.solicitarRecuperacion(email);
            setContadorReenvio(30);
        } catch (err: any) {
            setError(err.message || "Error al reenviar el código.");
        } finally {
            setCargando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active">
            <div className="modal-container" role="dialog" aria-modal="true">
                
                {(paso === 1 || paso === 4) && (
                    <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
                        &times;
                    </button>
                )}

                <div className="modal-header-logo">
                    <Image src="/assets/img/Logo-Petfy-renovado-2.png" alt="Logo" width={120} height={50} className="logo-icon" priority />
                </div>

                {error && <div className="modal-alert-error">⚠️ {error}</div>}

                {paso === 1 && (
                    <>
                        <h2>Recuperar Cuenta</h2>
                        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                            Ingresa tu correo y te enviaremos un código de verificación.
                        </p>
                        <form onSubmit={handleEnviarCorreo}>
                            <div className="modal-input-group">
                                <input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                            </div>
                            <button type="submit" className="modal-btn" disabled={cargando}>
                                {cargando ? "Enviando..." : "Enviar Código"}
                            </button>
                        </form>
                    </>
                )}

                {paso === 2 && (
                    <>
                        <h2>Ingresa el Código</h2>
                        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                            Enviamos un código de 6 dígitos a <strong>{email}</strong>.
                        </p>
                        <form onSubmit={handleVerificarCodigo}>
                            <div className="modal-input-group">
                                <input type="text" placeholder="000000" value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "0.5rem", fontWeight: "bold" }} autoFocus required />
                            </div>
                            <button type="submit" className="modal-btn" disabled={cargando || codigo.length !== 6}>
                                {cargando ? "Verificando..." : "Verificar Código"}
                            </button>
                        </form>
                        <p className="modal-switch">
                            ¿No lo recibiste?{" "}
                            {contadorReenvio > 0 ? (
                                <span style={{ color: "var(--text-muted)" }}>Reenviar en {contadorReenvio}s</span>
                            ) : (
                                <a href="#" onClick={(e) => { e.preventDefault(); handleReenviar(); }}>Reenviar código</a>
                            )}
                        </p>
                    </>
                )}

                {paso === 3 && (
                    <>
                        <h2>Nueva Contraseña</h2>
                        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                            Crea una nueva contraseña segura para tu cuenta.
                        </p>
                        <form onSubmit={handleCambiarPassword}>
                            <div className="modal-input-group" style={{ position: 'relative' }}>
                                <input type={mostrarContrasena ? "text" : "password"} placeholder="Nueva contraseña *" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus style={{ paddingRight: '2.5rem' }} />
                                <button type="button" onClick={() => setMostrarContrasena(!mostrarContrasena)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} tabIndex={-1}>
                                    <i className={`fas fa-eye${mostrarContrasena ? '-slash' : ''}`}></i>
                                </button>
                            </div>
                            <div className="modal-input-group">
                                <input type={mostrarContrasena ? "text" : "password"} placeholder="Confirmar contraseña *" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                            </div>
                            <button type="submit" className="modal-btn" disabled={cargando}>
                                {cargando ? "Actualizando..." : "Cambiar Contraseña"}
                            </button>
                        </form>
                    </>
                )}

                {paso === 4 && (
                    <div style={{ textAlign: "center", padding: "1rem 0" }}>
                        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>✅</div>
                        <h2>¡Contraseña Actualizada!</h2>
                        <p style={{ color: "var(--text-light)", marginTop: "1rem", fontSize: "0.9rem" }}>
                            Tu contraseña ha sido cambiada con éxito. Refrescando la página para iniciar sesión...
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}