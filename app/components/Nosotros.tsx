"use client";

export default function Nosotros() {
    return (
        <section id="nosotros" className="nosotros-section">
            <div className="nosotros-hero">
                <div className="container">
                    <h1>Somos Petfy</h1>
                    <p>
                        Nacimos del amor incondicional por las mascotas. Somos más que una tienda: una comunidad dedicada al
                        bienestar y felicidad de tus compañeros peludos.
                    </p>
                    <div className="nosotros-stats">
                        <div className="nosotros-stat">
                            <span className="nosotros-stat-num">+5000</span>
                            <span className="nosotros-stat-label">Clientes Felices</span>
                        </div>
                        <div className="nosotros-stat">
                            <span className="nosotros-stat-num">+1000</span>
                            <span className="nosotros-stat-label">Productos</span>
                        </div>
                        <div className="nosotros-stat">
                            <span className="nosotros-stat-num">50+</span>
                            <span className="nosotros-stat-label">Marcas</span>
                        </div>
                        <div className="nosotros-stat">
                            <span className="nosotros-stat-num">24/7</span>
                            <span className="nosotros-stat-label">Soporte</span>
                        </div>
                    </div>
                </div>
                           <div className="mvv-section">
                <div className="container">
                    <div className="mvv-grid">
                        <div className="mvv-card">
                            <div className="mvv-icon">
                                <i className="fas fa-bullseye"></i>
                            </div>
                            <h2>🎯 Nuestra Misión</h2>
                            <p>Proveer productos y servicios de la más alta calidad para el cuidado de las mascotas.</p>
                        </div>

                        <div className="mvv-card">
                            <div className="mvv-icon">
                                <i className="fas fa-eye"></i>
                            </div>
                            <h2>🔭 Nuestra Visión</h2>
                            <p>Ser la plataforma líder en Latinoamérica para el cuidado integral de mascotas para 2030.</p>
                        </div>

                        <div className="mvv-card">
                            <div className="mvv-icon">
                                <i className="fas fa-heart"></i>
                            </div>
                            <h2>💛 Nuestros Valores</h2>
                            <ul>
                                <li>
                                    <i className="fas fa-paw"></i> <strong>Amor Animal</strong>
                                </li>
                                <li>
                                    <i className="fas fa-shield-alt"></i> <strong>Calidad</strong>
                                </li>
                                <li>
                                    <i className="fas fa-handshake"></i> <strong>Confianza</strong>
                                </li>
                                <li>
                                    <i className="fas fa-leaf"></i> <strong>Sostenibilidad</strong>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            </div>

        </section>
    );
}