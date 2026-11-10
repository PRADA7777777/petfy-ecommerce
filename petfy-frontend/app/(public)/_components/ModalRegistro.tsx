"use client";

import { useState, useEffect } from "react";
import { authAPI, TipoDocumento } from "@/lib/api";
import Image from "next/image";

interface ModalRegistroProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginClick: () => void;
    onVerificacionClick: (correo: string, nombre: string) => void;
}

export default function ModalRegistro({
    isOpen, onClose, onLoginClick, onVerificacionClick,
}: ModalRegistroProps) {
    const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [mostrarContrasena, setMostrarContrasena] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "", apellido: "", email: "", idtipodoc: "",
        numDoc: "", telefono: "", dirFactura: "", password: "",
    });

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

    useEffect(() => {
        if (isOpen && tiposDoc.length === 0) {
            authAPI.getTiposDocumento()
                .then((data) => {
                    setTiposDoc(data);
                    if (data.length > 0) setFormData((f) => ({ ...f, idtipodoc: String(data[0].id_tipo_doc) }));
                })
                .catch(() => setError("No se pudieron cargar los tipos de documento"));
        }
    }, [isOpen, tiposDoc.length]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password.length < 8) return setError("La contraseña debe tener mínimo 8 caracteres.");
        if (formData.telefono.length < 7) return setError("Ingresa un número de teléfono válido.");
        if (formData.numDoc.length < 5) return setError("Ingresa un número de documento válido.");

        setCargando(true);
        try {
            await authAPI.registro({
                nombre: formData.nombre, apellido: formData.apellido, correo: formData.email,
                contrasena: formData.password, telefono: formData.telefono, direccion: formData.dirFactura,
                idtipodoc: parseInt(formData.idtipodoc), numdoc: formData.numDoc,
            });
            onVerificacionClick(formData.email, formData.nombre);
        } catch (err: any) {
            // 🔥 NUEVO: Mejor manejo de errores
            if (err.message?.includes("500")) {
                setError("Tuvimos un problema al crear tu cuenta. Intenta más tarde.");
            } else {
                setError(err.message || "Error al crear la cuenta. Verifica los datos.");
            }
        } finally {
            setCargando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active" onClick={onClose}>
            {/* 🔥 NUEVO: Atributos ARIA */}
            <div 
                className="modal-container" 
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="registro-modal-title"
            >
                <button className="modal-close-btn" onClick={onClose} aria-label="Cerrar modal">
                    &times;
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

                <h2 id="registro-modal-title">Crear Cuenta</h2>
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                    Datos del responsable y facturación
                </p>

                {error && <div className="modal-alert-error">⚠️ {error}</div>}

                <form onSubmit={handleSubmit} className="modal-form-grid">
                    <div className="modal-input-group">
                        {/* 🔥 NUEVO: autoFocus en el primer input */}
                        <input type="text" id="nombre" placeholder="Nombre *" value={formData.nombre} onChange={handleChange} required disabled={cargando} autoComplete="given-name" autoFocus />
                    </div>
                    <div className="modal-input-group">
                        <input type="text" id="apellido" placeholder="Apellido *" value={formData.apellido} onChange={handleChange} required disabled={cargando} autoComplete="family-name" />
                    </div>

                    <div className="modal-input-group full-width">
                        <input type="email" id="email" placeholder="Correo electrónico *" value={formData.email} onChange={handleChange} required disabled={cargando} autoComplete="email" />
                    </div>

                    <div className="modal-input-group">
                        <select id="idtipodoc" value={formData.idtipodoc} onChange={handleChange} required disabled={cargando}>
                            <option value="">Tipo Doc *</option>
                            {tiposDoc.map((t) => (
                                <option key={t.id_tipo_doc} value={t.id_tipo_doc}>{t.nom_tipo_doc}</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-input-group">
                        <input type="text" id="numDoc" placeholder="N° Documento *" value={formData.numDoc} onChange={handleChange} required disabled={cargando} />
                    </div>

                    <div className="modal-input-group">
                        <input type="tel" id="telefono" placeholder="Teléfono (WhatsApp) *" value={formData.telefono} onChange={handleChange} required disabled={cargando} autoComplete="tel" />
                    </div>
                    <div className="modal-input-group">
                        <input type="text" id="dirFactura" placeholder="Dirección *" value={formData.dirFactura} onChange={handleChange} required disabled={cargando} autoComplete="street-address" />
                    </div>

                    <div className="modal-input-group full-width" style={{ position: 'relative' }}>
                        <input
                            type={mostrarContrasena ? "text" : "password"}
                            id="password"
                            placeholder="Contraseña (mín 8) *"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={cargando}
                            autoComplete="new-password"
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

                    <div className="modal-terms full-width">
                        <input type="checkbox" id="terms" required disabled={cargando} />
                        <label htmlFor="terms">
                            Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a> y la <a href="/privacidad" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>.
                        </label>
                    </div>

                    <button type="submit" className="modal-btn full-width" disabled={cargando}>
                        {cargando ? "Creando cuenta..." : "🐾 Crear Cuenta"}
                    </button>
                </form>

                <p className="modal-switch">
                    ¿Ya tienes cuenta?{" "}
                    <a href="#" onClick={(e) => { e.preventDefault(); onLoginClick(); }}>Iniciar Sesión</a>
                </p>
            </div>
        </div>
    );
}