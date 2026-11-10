"use client";

export default function Resenas() {
    // Datos de las reseñas (puedes extraerlos a un array para mantenerlos ordenados)
    const reviews = [
        {
            id: 1,
            avatar: "M",
            nombre: "María Gómez",
            pet: "🐕 Max",
            stars: 5,
            texto: '"¡Increíble! Max regresa feliz de cada paseo. El GPS me da tranquilidad."',
            fecha: "📅 Hace 2 días",
            plan: "✅ Paseo 3 Días",
        },
        {
            id: 2,
            avatar: "C",
            nombre: "Carlos Ruiz",
            pet: "🐕 Rocky",
            stars: 5,
            texto: '"El plan de 5 días es perfecto. Rocky llega agotado y feliz. ¡10/10!"',
            fecha: "📅 Hace 1 semana",
            plan: "✅ Paseo 5 Días",
        },
        {
            id: 3,
            avatar: "A",
            nombre: "Ana López",
            pet: "🐱 Luna",
            stars: 5,
            texto: '"La agenda es súper fácil. El paseador llegó puntual. ¡Profesionales!"',
            fecha: "📅 Hace 2 semanas",
            plan: "✅ Paseo Único",
        },
    ];

    return (
        <section className="reviews-section">
            <div className="container">
                <div className="section-header">
                    <span className="section-subtitle">Testimonios</span>
                    <h2 className="section-title">Clientes Felices</h2>
                </div>
                <div className="reviews-grid">
                    {reviews.map((review) => (
                        <div key={review.id} className="review-card">
                            <div className="review-header">
                                <div className="review-avatar">{review.avatar}</div>
                                <div>
                                    <h4>{review.nombre}</h4>
                                    <span className="review-pet">{review.pet}</span>
                                </div>
                                <div className="review-stars">
                                    {"★".repeat(review.stars)}
                                </div>
                            </div>
                            <p className="review-text">{review.texto}</p>
                            <div className="review-footer">
                                <span>{review.fecha}</span>
                                <span>{review.plan}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}