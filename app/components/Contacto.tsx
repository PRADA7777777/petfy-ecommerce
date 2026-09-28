"use client";

//import Link from "next/link";
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Aquí iría la lógica de envío (por ahora solo mostramos un alert)
        alert("✅ Mensaje enviado. Pronto nos pondremos en contacto.");
        setFormData({
            nombre: "",
            apellido: "",
            email: "",
            telefono: "",
            asunto: "",
            mensaje: "",
        });
    };

    return (
        <section id="contacto" className="contacto-section">
            {/* Encabezado con doodles */}
            <div className="contacto-header">
                <span className="doodle d1">📞</span>
                <span className="doodle d2">💬</span>
                <span className="doodle d3">🐾</span>
                <span className="doodle d4">⭐</span>
                <div className="container">
                    <h1>Contacto</h1>
                    <p>Estamos aquí para ayudarte. Escríbenos por cualquier medio.</p>
                </div>

                {/* Contenido principal */}
                <div className="container">
                    <div className="contacto-grid">
                        {/* Columna izquierda: información de contacto */}
                        <div className="contacto-info">
                            {/* WhatsApp */}
                            <div className="info-card">
                                <div className="info-icon">
                                    <i className="fab fa-whatsapp"></i>
                                </div>
                                <div className="info-text">
                                    <h4>WhatsApp</h4>
                                    <p>
                                        <a href="https://wa.me/573204829244" target="_blank">
                                            320 482 9244
                                        </a>
                                    </p>
                                    <p className="info-detail">Respuesta inmediata</p>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="info-card">
                                <div className="info-icon">
                                    <i className="fas fa-envelope"></i>
                                </div>
                                <div className="info-text">
                                    <h4>Email</h4>
                                    <p>
                                        <a href="mailto:petfyservice@gmail.com">petfyservice@gmail.com</a>
                                    </p>
                                    <p className="info-detail">Respondemos en menos de 2 horas</p>
                                </div>
                            </div>

                            {/* Instagram */}
                            <div className="info-card">
                                <div className="info-icon">
                                    <i className="fab fa-instagram"></i>
                                </div>
                                <div className="info-text">
                                    <h4>Instagram</h4>
                                    <p>
                                        <a href="https://www.instagram.com/petfyservice___/" target="_blank">
                                            @petfyservice___
                                        </a>
                                    </p>
                                </div>
                            </div>

                            {/* Facebook */}
                            <div className="info-card">
                                <div className="info-icon">
                                    <i className="fab fa-facebook"></i>
                                </div>
                                <div className="info-text">
                                    <h4>Facebook</h4>
                                    <p>
                                        <a
                                            href="https://www.facebook.com/share/195h52699J/?mibextid=wwXIfr"
                                            target="_blank"
                                        >
                                            Petfy Service
                                        </a>
                                    </p>
                                </div>
                            </div>

                            {/* Redes sociales (solo íconos) */}
                            <div className="social-mini">
                                <span>Síguenos en</span>
                                <a
                                    href="https://www.instagram.com/petfyservice___/"
                                    target="_blank"
                                    aria-label="Instagram"
                                >
                                    <i className="fab fa-instagram"></i>
                                </a>
                                <a href="https://wa.me/573204829244" target="_blank" aria-label="WhatsApp">
                                    <i className="fab fa-whatsapp"></i>
                                </a>
                                <a
                                    href="https://www.facebook.com/share/195h52699J/?mibextid=wwXIfr"
                                    target="_blank"
                                    aria-label="Facebook"
                                >
                                    <i className="fab fa-facebook"></i>
                                </a>
                            </div>
                        </div>

                        {/* Columna derecha: formulario */}
                        <div className="form-wrapper">
                            <h2>✉️ Escríbenos</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="nombre">Nombre *</label>
                                        <input
                                            type="text"
                                            id="nombre"
                                            required
                                            placeholder="Tu nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="apellido">Apellido *</label>
                                        <input
                                            type="text"
                                            id="apellido"
                                            required
                                            placeholder="Tu apellido"
                                            value={formData.apellido}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="email">Email *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            placeholder="tu@email.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="telefono">Teléfono</label>
                                        <input
                                            type="tel"
                                            id="telefono"
                                            placeholder="+57 300 123 4567"
                                            value={formData.telefono}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="asunto">Asunto *</label>
                                    <select id="asunto" required value={formData.asunto} onChange={handleChange}>
                                        <option value="">Selecciona un asunto</option>
                                        <option>Quiero contratar un paseo</option>
                                        <option>Información de servicios</option>
                                        <option>Tengo una duda</option>
                                        <option>Sugerencia o reclamo</option>
                                        <option>Otro</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mensaje">Mensaje *</label>
                                    <textarea
                                        id="mensaje"
                                        required
                                        placeholder="Escribe tu mensaje aquí..."
                                        value={formData.mensaje}
                                        onChange={handleChange}
                                    />
                                </div>
                                <button type="submit" className="btn-enviar">
                                    <i className="fas fa-paper-plane"></i> Enviar Mensaje
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}