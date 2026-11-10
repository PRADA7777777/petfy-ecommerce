"use client";

import { useState } from "react";

export default function Contacto() {
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        asunto: "",
        mensaje: "",
    });

    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");
        setEnviado(false);

        try {
            // Asegúrate de que esta ruta exista en tu backend FastAPI
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contacto`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error("Error al enviar el mensaje");
            }

            setEnviado(true);
            setFormData({ nombre: "", apellido: "", email: "", telefono: "", asunto: "", mensaje: "" });
            
            // Ocultar mensaje de éxito después de 5 segundos
            setTimeout(() => setEnviado(false), 5000);
        } catch (error) {
            setErrorMsg("Hubo un problema al enviar el mensaje. Por favor, intenta de nuevo o escríbenos por WhatsApp.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="contacto" className="contacto-section">
            <div className="contacto-header">
                <span className="doodle d1">📞</span>
                <span className="doodle d2">💬</span>
                <span className="doodle d3">🐾</span>
                <span className="doodle d4">⭐</span>
                <div className="container">
                    <h1>Contacto</h1>
                    <p>Estamos aquí para ayudarte. Escríbenos por cualquier medio.</p>
                </div>

                <div className="container">
                    <div className="contacto-grid">
                        {/* Columna Izquierda: Información */}
                        <div className="contacto-info">
                            <div className="info-card">
                                <div className="info-icon"><i className="fab fa-whatsapp"></i></div>
                                <div className="info-text">
                                    <h4>WhatsApp</h4>
                                    <p><a href="https://wa.me/573204829244" target="_blank" rel="noreferrer">320 482 9244</a></p>
                                    <p className="info-detail">Respuesta inmediata</p>
                                </div>
                            </div>

                            <div className="info-card">
                                <div className="info-icon"><i className="fas fa-envelope"></i></div>
                                <div className="info-text">
                                    <h4>Email</h4>
                                    <p><a href="mailto:petfyservice@gmail.com">petfyservice@gmail.com</a></p>
                                    <p className="info-detail">Respondemos en menos de 2 horas</p>
                                </div>
                            </div>

                            <div className="info-card">
                                <div className="info-icon"><i className="fab fa-instagram"></i></div>
                                <div className="info-text">
                                    <h4>Instagram</h4>
                                    <p><a href="https://www.instagram.com/petfyservice___/" target="_blank" rel="noreferrer">@petfyservice___</a></p>
                                </div>
                            </div>

                            <div className="info-card">
                                <div className="info-icon"><i className="fab fa-facebook"></i></div>
                                <div className="info-text">
                                    <h4>Facebook</h4>
                                    <p><a href="https://www.facebook.com/share/195h52699J/?mibextid=wwXIfr" target="_blank" rel="noreferrer">Petfy Service</a></p>
                                </div>
                            </div>

                            <div className="social-mini">
                                <span>Síguenos en</span>
                                <a href="https://www.instagram.com/petfyservice___/" target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                                <a href="https://wa.me/573204829244" target="_blank" rel="noreferrer" aria-label="WhatsApp"><i className="fab fa-whatsapp"></i></a>
                                <a href="https://www.facebook.com/share/195h52699J/?mibextid=wwXIfr" target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                            </div>
                        </div>

                        {/* Columna Derecha: Formulario */}
                        <div className="form-wrapper">
                            <h2>✉️ Escríbenos</h2>
                            
                            {/* Alertas de Éxito / Error */}
                            {enviado && (
                                <div style={{ background: "#ecfdf5", color: "#059669", padding: "1rem", borderRadius: "10px", marginBottom: "1rem", fontWeight: "bold", textAlign: "center" }}>
                                    ✅ ¡Mensaje enviado! Pronto nos pondremos en contacto.
                                </div>
                            )}
                            {errorMsg && (
                                <div style={{ background: "#fee2e2", color: "#ef4444", padding: "1rem", borderRadius: "10px", marginBottom: "1rem", fontWeight: "bold", textAlign: "center" }}>
                                    ❌ {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="nombre">Nombre *</label>
                                        <input type="text" id="nombre" required placeholder="Tu nombre" value={formData.nombre} onChange={handleChange} disabled={loading} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="apellido">Apellido *</label>
                                        <input type="text" id="apellido" required placeholder="Tu apellido" value={formData.apellido} onChange={handleChange} disabled={loading} />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email">Email *</label>
                                        <input type="email" id="email" required placeholder="tu@email.com" value={formData.email} onChange={handleChange} disabled={loading} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="telefono">Teléfono</label>
                                        <input type="tel" id="telefono" placeholder="+57 300 123 4567" value={formData.telefono} onChange={handleChange} disabled={loading} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="asunto">Asunto *</label>
                                    <select id="asunto" required value={formData.asunto} onChange={handleChange} disabled={loading}>
                                        <option value="">Selecciona un asunto</option>
                                        <option value="Quiero contratar un paseo">Quiero contratar un paseo</option>
                                        <option value="Información de servicios">Información de servicios</option>
                                        <option value="Tengo una duda">Tengo una duda</option>
                                        <option value="Sugerencia o reclamo">Sugerencia o reclamo</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mensaje">Mensaje *</label>
                                    <textarea id="mensaje" required placeholder="Escribe tu mensaje aquí..." value={formData.mensaje} onChange={handleChange} disabled={loading} />
                                </div>
                                <button type="submit" className="btn-enviar" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                                    {loading ? (
                                        <><i className="fas fa-spinner fa-spin"></i> Enviando...</>
                                    ) : (
                                        <><i className="fas fa-paper-plane"></i> Enviar Mensaje</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}