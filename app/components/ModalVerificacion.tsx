"use client";

import { useEffect, useState } from "react";
import { authAPI } from "../lib/api";

interface ModalVerificacionProps {
    isOpen: boolean;
    correo: string;
    nombre: string;
    onClose: () => void;
    onVerificado: () => void;
}

export default function ModalVerificacion({
    isOpen,
    correo,
    nombre,
    onClose,
    onVerificado,
}: ModalVerificacionProps) {
    const [codigo, setCodigo] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [exito, setExito] = useState(false);
    const [reenviando, setReenviando] = useState(false);
    const [contadorReenvio, setContadorReenvio] = useState(0);
    const [tiempoRestante, setTiempoRestante] = useState(300);

    // Temporizador de 5 minutos
    useEffect(() => {
        if (tiempoRestante > 0 && !exito && isOpen) {
            const timer = setInterval(() => {
                setTiempoRestante((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [tiempoRestante, exito, isOpen]);

    // Contador de reenvío
    useEffect(() => {
        if (contadorReenvio > 0) {
            const timer = setTimeout(() => setContadorReenvio(contadorReenvio - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [contadorReenvio]);

    const formatearTiempo = (segundos: number) => {
        const min = Math.floor(segundos / 60);
        const seg = segundos % 60;
        return `${min.toString().padStart(2, "0")}:${seg.toString().padStart(2, "0")}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (tiempoRestante === 0) {
            setError("El código ha expirado. Solicita uno nuevo.");
            return;
        }

        if (codigo.length !== 6) {
            setError("El código debe tener 6 dígitos");
            return;
        }

        setCargando(true);
        try {
            await authAPI.verificar(correo, codigo);
            setExito(true);
            setTimeout(() => {
                onVerificado();
            }, 2000);
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al verificar";
            setError(mensaje);
        } finally {
            setCargando(false);
        }
    };

    const handleReenviar = async () => {
        setError("");
        setReenviando(true);
        try {
            await authAPI.reenviarCodigo(correo);
            setContadorReenvio(30);
            setTiempoRestante(300);
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al reenviar";
            setError(mensaje);
        } finally {
            setReenviando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? "active" : ""}`}>
            <div className="modal-container">
                <button className="modal-close-btn" onClick={onClose}>
                    &times;
                </button>
                <div className="modal-icon">📱</div>

                {exito ? (
                    <>
                        <h2>¡Cuenta verificada!</h2>
                        <p style={{ textAlign: "center", color: "#2e7d32", fontSize: "1rem", marginTop: "1rem" }}>
                            ✅ Ya puedes iniciar sesión. Redirigiendo...
                        </p>
                    </>
                ) : (
                    <>
                        <h2>Verifica tu cuenta</h2>
                        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                            Hola <strong>{nombre}</strong>, enviamos un código de 6 dígitos a tu correo. 📧
                        </p>

                        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                            {tiempoRestante > 0 ? (
                                <span
                                    style={{
                                        fontSize: "1.1rem",
                                        color: tiempoRestante < 60 ? "#d32f2f" : "#2e7d32",
                                        fontWeight: "bold",
                                    }}
                                >
                                    ⏳ El código expira en: {formatearTiempo(tiempoRestante)}
                                </span>
                            ) : (
                                <span style={{ fontSize: "1.1rem", color: "#d32f2f", fontWeight: "bold" }}>
                                    ⚠️ El código ha expirado
                                </span>
                            )}
                        </div>

                        {error && (
                            <div
                                style={{
                                    background: "#ffebee",
                                    color: "#c62828",
                                    padding: "0.5rem",
                                    borderRadius: "8px",
                                    marginBottom: "1rem",
                                    fontSize: "0.85rem",
                                }}
                            >
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="modal-input-group">
                                <input
                                    type="text"
                                    placeholder="Código de 6 dígitos"
                                    value={codigo}
                                    onChange={(e) => {
                                        const valor = e.target.value.replace(/\D/g, "");
                                        setCodigo(valor.slice(0, 6));
                                        setError("");
                                    }}
                                    maxLength={6}
                                    style={{
                                        textAlign: "center",
                                        fontSize: "1.5rem",
                                        letterSpacing: "0.5rem",
                                        fontWeight: "bold",
                                    }}
                                    autoFocus
                                    required
                                    disabled={tiempoRestante === 0}
                                />
                            </div>

                            <button
                                type="submit"
                                className="modal-btn"
                                disabled={cargando || codigo.length !== 6 || tiempoRestante === 0}
                            >
                                {cargando ? "Verificando..." : "Verificar"}
                            </button>
                        </form>

                        <p className="modal-switch" style={{ marginTop: "1rem", textAlign: "center" }}>
                            ¿No recibiste el código?{" "}
                            {contadorReenvio > 0 ? (
                                <span style={{ color: "var(--text-muted)" }}>
                                    Reenviar en {contadorReenvio}s
                                </span>
                            ) : (
                                <a
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (!reenviando) handleReenviar();
                                    }}
                                >
                                    {reenviando ? "Reenviando..." : "Reenviar código"}
                                </a>
                            )}
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}