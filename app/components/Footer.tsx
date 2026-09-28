"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Conócenos */}
          <div className="footer-col">
            <h4>Conócenos</h4>
            <ul>
              <li><Link href="#nosotros">Nosotros</Link></li>
              <li><Link href="#nosotros">Nuestro Equipo</Link></li>
              <li><Link href="#contacto">Trabaja con Nosotros</Link></li>
            </ul>
          </div>

          {/* Información */}
          <div className="footer-col">
            <h4>Información</h4>
            <ul>
              <li><Link href="/pages/legal/faq">Preguntas Frecuentes</Link></li>
              <li><Link href="/pages/legal/devoluciones">Devoluciones</Link></li>
              <li><Link href="/pages/legal/envios">Políticas de Entrega</Link></li>
              <li><Link href="/pages/legal/privacidad">Política de Privacidad</Link></li>
              <li><Link href="/pages/legal/terminos">Términos y Condiciones</Link></li>
            </ul>
          </div>

          {/* Contáctanos */}
          <div className="footer-col">
            <h4>Contáctanos</h4>
            <ul>
              <li>
                <a href="https://wa.me/573204829244" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-whatsapp"></i> 320 482 9244
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/petfyservice___/" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i> @petfyservice___
                </a>
              </li>
              <li>
                <a href="https://www.facebook.com/share/195h52699J/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook"></i> Petfy Service
                </a>
              </li>
              <li>
                <a href="mailto:petfyservice@gmail.com">
                  <i className="fas fa-envelope"></i> petfyservice@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Métodos de Pago y Redes Sociales */}
          <div className="footer-col footer-col-payments">
            <h4>Métodos de Pago</h4>
            <div className="payment-methods">
              <i className="fab fa-cc-visa" title="Visa"></i>
              <i className="fab fa-cc-mastercard" title="Mastercard"></i>
              <i className="fab fa-cc-amex" title="American Express"></i>
              <i className="fab fa-cc-paypal" title="PayPal"></i>
            </div>
            <div className="footer-social">
              <span>Síguenos</span>
              <a href="https://www.instagram.com/petfyservice___/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://wa.me/573204829244" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <i className="fab fa-whatsapp"></i>
              </a>
              <a href="https://www.facebook.com/share/195h52699J/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fab fa-facebook"></i>
              </a>
            </div>
          </div>
        </div>

        {/* Barra inferior: logo + copyright */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            {/* Contenedor para el isotipo y el texto */}
            <div className="footer-logo-group">
              <Image
                src="/assets/img/Logo-Petfy-renovado.png" 
                alt="Petfy Isotipo"
                width={40}
                height={40}
                className="footer-logo-isotipo"
              />
              <Image
                src="/assets/img/Nombre-Petfy-Beige.png"
                alt="Petfy Texto"
                width={100}
                height={30}
                className="footer-logo-texto"
              />
            </div>
            <p>&copy; 2024 Petfy. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}