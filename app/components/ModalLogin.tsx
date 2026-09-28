"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI, sesion } from "../lib/api";

interface ModalLoginProps {
    isOpen: boolean;
    onClose: () => void;
    onRegistroClick: () => void;
}

export default function ModalLogin({ isOpen, onClose, onRegistroClick }: ModalLoginProps) {
    const router = useRouter();
    const [correo, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        try {
            // Llamada REAL al backend
            const data = await authAPI.login({ correo, contrasena });

            // Guardar con el formato NUEVO
            sesion.guardar(data);

            onClose();

            // Redirigir al perfil
            router.push("/perfil");
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al iniciar sesión";
            setError(mensaje);
            setCargando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? "active" : ""}`}>
            <div className="modal-container">
                <button className="modal-close-btn" onClick={onClose}>
                    &times;
                </button>
                <div className="modal-icon">🐾</div>
                <h2>Iniciar Sesión</h2>

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
                            type="email"
                            placeholder="tu@email.com"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            required
                        />
                    </div>
                    <div className="modal-input-group">
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="modal-btn" disabled={cargando}>
                        {cargando ? "Ingresando..." : "Iniciar Sesión"}
                    </button>
                </form>
                <p className="modal-switch">
                    ¿No tienes cuenta?{" "}
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onRegistroClick();
                        }}
                    >
                        Crear cuenta
                    </a>
                </p>
            </div>
        </div>
    );
}