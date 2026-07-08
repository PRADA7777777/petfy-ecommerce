// ========== PETFY - FOOTER COMPONENT ==========
function inicializarFooter() {
    var footerHTML = `
    <footer class="footer">
        <div class="container">
            <div class="footer-grid">
                <div class="footer-col">
                    <h4>Conócenos</h4>
                    <ul>
                        <li><a href="${getBasePath()}nosotros/">Nosotros</a></li>
                        <li><a href="${getBasePath()}nosotros/equipo.html">Nuestro Equipo</a></li>
                        <li><a href="${getBasePath()}nosotros/trabaja.html">Trabaja con Nosotros</a></li>
                        <li><a href="${getBasePath()}servicios/">Servicios</a></li>
                        <li><a href="${getBasePath()}tienda/">Tienda</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Información</h4>
                    <ul>
                        <li><a href="${getBasePath()}legal/terminos.html">Términos y Condiciones</a></li>
                        <li><a href="#faq">Preguntas Frecuentes</a></li>
                        <li><a href="${getBasePath()}legal/privacidad.html">Política de Privacidad</a></li>
                        <li><a href="${getBasePath()}legal/envios.html">Políticas de Entrega</a></li>
                        <li><a href="${getBasePath()}legal/devoluciones.html">Devoluciones</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Contáctanos</h4>
                    <ul>
                        <li><a href="https://wa.me/573204829244" target="_blank"><i class="fab fa-whatsapp"></i> 320 482 9244</a></li>
                        <li><a href="mailto:petfyservice@gmail.com"><i class="fas fa-envelope"></i> petfyservice@gmail.com</a></li>
                        <li><a href="https://www.instagram.com/petfyservice___/" target="_blank"><i class="fab fa-instagram"></i> @petfyservice___</a></li>
                        <li><a href="https://www.facebook.com/share/195h52699J/?mibextid=wwXIfr" target="_blank"><i class="fab fa-facebook"></i> Petfy Service</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h4>Suscríbete</h4>
                    <p>Recibe noticias y promociones diarias</p>
                    <form class="newsletter-form" onsubmit="return false;">
                        <input type="email" placeholder="Correo electrónico" required>
                        <button type="submit"><i class="fas fa-paper-plane"></i></button>
                    </form>
                </div>
            </div>
            <div class="footer-bottom">
                <div class="footer-bottom-content">
                    <img src="${getBasePath()}assets/img/petfy.png" alt="Petfy" class="footer-logo-bottom">
                    <p>&copy; 2024 Petfy. Todos los derechos reservados.</p>
                    <div class="payment-methods">
                        <i class="fab fa-cc-visa"></i><i class="fab fa-cc-mastercard"></i>
                        <i class="fab fa-cc-amex"></i><i class="fab fa-cc-paypal"></i>
                    </div>
                </div>
            </div>
        </div>
    </footer>`;

    // Insertar footer antes del cierre de body
    var footer = document.querySelector('footer');
    if (!footer || !footer.classList.contains('footer')) {
        document.body.insertAdjacentHTML('beforeend', footerHTML);
    }
}

// Obtener ruta base según ubicación
function getBasePath() {
    var path = window.location.pathname;
    if (path.includes('/tienda/') || path.includes('/servicios/') || 
        path.includes('/contacto/') || path.includes('/nosotros/') ||
        path.includes('/cuenta/') || path.includes('/legal/')) {
        return '../';
    }
    return '';
}

document.addEventListener('DOMContentLoaded', inicializarFooter);