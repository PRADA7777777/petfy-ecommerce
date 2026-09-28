"use client";

interface ModalOfertaProps {
    isOpen: boolean;
    onClose: () => void;
    onReclamar: () => void;
}

export default function ModalOferta({ isOpen, onClose, onReclamar }: ModalOfertaProps) {
    if (!isOpen) return null;

    return (
        <div className={`modal-overlay ${isOpen ? "active" : ""}`}>
            <div className="modal-container modal-oferta">
                <button className="modal-close-btn" onClick={onClose}>
                    &times;
                </button>
                <div className="oferta-icono">🎉</div>
                <h2>¡Bienvenido!</h2>
                <p>50% OFF + Paseo Gratis</p>
                <div className="oferta-grid">
                    <div className="oferta-card oferta-descuento">
                        <div className="oferta-emoji">🛍️</div>
                        <div className="oferta-numero">50%</div>
                        <div className="oferta-etiqueta">DESCUENTO</div>
                        <div className="oferta-codigo">BIENVENIDO50</div>
                    </div>
                    <div className="oferta-card oferta-gratis">
                        <div className="oferta-emoji">🐕</div>
                        <div className="oferta-numero">1</div>
                        <div className="oferta-etiqueta">PASEO GRATIS</div>
                        <div className="oferta-codigo">PASEOGRATIS1</div>
                    </div>
                </div>
                <button onClick={onReclamar} className="modal-btn oferta-btn-principal">
                    Crear Cuenta y Reclamar
                </button>
                <button onClick={onClose} className="oferta-btn-secundario">
                    No gracias
                </button>
            </div>
        </div>
    );
}