"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI, TipoDocumento } from "../lib/api";

interface ModalRegistroProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginClick: () => void;
    onVerificacionClick: (correo: string, nombre: string) => void;

}

export default function ModalRegistro({
    isOpen,
    onClose,
    onLoginClick,
    onVerificacionClick,
}: ModalRegistroProps) {
    const router = useRouter();
    const [tiposDoc, setTiposDoc] = useState<TipoDocumento[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        idtipodoc: "",
        numDoc: "",
        telefono: "",
        dirFactura: "",
        password: "",
    });

    // Cargar tipos de documento al abrir el modal
    useEffect(() => {
        if (isOpen && tiposDoc.length === 0) {
            authAPI
                .getTiposDocumento()
                .then((data) => {
                    setTiposDoc(data);
                    if (data.length > 0) {
                        setFormData((f) => ({ ...f, idtipodoc: String(data[0].id_tipo_doc) }));
                    }
                })
                .catch((e) => {
                    console.error("Error cargando tipos de documento:", e);
                    setError("No se pudieron cargar los tipos de documento");
                });
        }
    }, [isOpen, tiposDoc.length]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (formData.password.length < 8) {
            setError("La contraseña debe tener mínimo 8 caracteres");
            return;
        }

        setCargando(true);
        try {
            await authAPI.registro({
                nombre: formData.nombre,
                apellido: formData.apellido,
                correo: formData.email,
                contrasena: formData.password,
                telefono: formData.telefono,
                direccion: formData.dirFactura,
                idtipodoc: parseInt(formData.idtipodoc),
                numdoc: formData.numDoc,
            });

            // Éxito → pasa al modal de verificación
            onVerificacionClick(formData.email, formData.nombre);
        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al crear una cuenta";
            setError(mensaje);
        } finally {
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
                <h2>Crear Cuenta</h2>
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                    Datos del responsable y facturación
                </p>

                {error && (
                    <div style={{ background: "#ffebee", color: "#c62828", padding: "0.5rem", borderRadius: "8px", marginBottom: "1rem", fontSize: "0.85rem" }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div className="modal-input-group">
                            <input
                                type="text"
                                id="nombre"
                                placeholder="Nombre *"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="modal-input-group">
                            <input
                                type="text"
                                id="apellido"
                                placeholder="Apellido *"
                                value={formData.apellido}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-input-group">
                        <input
                            type="email"
                            id="email"
                            placeholder="Correo electrónico *"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div className="modal-input-group">
                            <select
                                id="idtipodoc"
                                value={formData.idtipodoc}
                                onChange={handleChange}
                                required >
                                <option value="">Tipo *</option>
                                {tiposDoc.map((t) => (
                                    <option key={t.id_tipo_doc} value={t.id_tipo_doc}>
                                        {t.nom_tipo_doc}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-input-group">
                            <input
                                type="text"
                                id="numDoc"
                                placeholder="N° Documento *"
                                value={formData.numDoc}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-input-group">
                        <input
                            type="tel"
                            id="telefono"
                            placeholder="Teléfono (WhatsApp) *"
                            value={formData.telefono}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="modal-input-group">
                        <input
                            type="text"
                            id="dirFactura"
                            placeholder="Dirección *"
                            value={formData.dirFactura}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="modal-input-group">
                        <input
                            type="password"
                            id="password"
                            placeholder="Contraseña (mín 8) *"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="modal-btn" disabled={cargando}>
                        {cargando ? "Creando cuenta..." : "🐾 Crear Cuenta"}
                    </button>
                </form>

                <p className="modal-switch">
                    ¿Ya tienes cuenta?{" "}
                    <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onLoginClick();
                        }}
                    >
                        Iniciar Sesión
                    </a>
                </p>
            </div>
        </div>
    );
}