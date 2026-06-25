// ========== PETFY - NEWSLETTER ==========

/**
 * Inicializar formularios de newsletter
 */
function initNewsletter() {
    const newsletterForms = document.querySelectorAll('.newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput?.value?.trim();
            
            if (!email) {
                mostrarAlertaNewsletter('Por favor ingresa tu email', 'error');
                return;
            }
            
            if (!validarEmailNewsletter(email)) {
                mostrarAlertaNewsletter('Ingresa un email válido', 'error');
                return;
            }
            
            // Simular suscripción
            suscribirNewsletter(email, this);
        });
    });
    
    // Popup de newsletter (opcional)
    initNewsletterPopup();
}

/**
 * Validar email
 */
function validarEmailNewsletter(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Suscribir al newsletter
 */
function suscribirNewsletter(email, form) {
    // Obtener suscriptores existentes
    const suscriptores = JSON.parse(localStorage.getItem('petfySubscribers')) || [];
    
    // Verificar si ya está suscrito
    if (suscriptores.includes(email)) {
        mostrarAlertaNewsletter('Ya estás suscrito 🎉', 'info');
        form.reset();
        return;
    }
    
    // Agregar nuevo suscriptor
    suscriptores.push(email);
    localStorage.setItem('petfySubscribers', JSON.stringify(suscriptores));
    
    // Feedback
    mostrarAlertaNewsletter('✅ ¡Suscrito con éxito! Revisa tu email', 'success');
    form.reset();
    
    // Tracking (placeholder)
    console.log('📧 Nueva suscripción:', email);
    console.log('📊 Total suscriptores:', suscriptores.length);
}

/**
 * Mostrar alerta del newsletter
 */
function mostrarAlertaNewsletter(mensaje, tipo = 'success') {
    const colores = {
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B'
    };
    
    // Buscar o crear contenedor de alerta
    let alerta = document.querySelector('.newsletter-alert');
    if (!alerta) {
        alerta = document.createElement('div');
        alerta.className = 'newsletter-alert';
        alerta.style.cssText = `
            padding: 0.75rem 1rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 500;
            margin-top: 0.75rem;
            transition: all 0.3s ease;
            animation: fadeIn 0.3s ease;
        `;
        
        // Insertar después del formulario
        const form = document.querySelector('.newsletter-form');
        if (form) {
            form.parentNode.insertBefore(alerta, form.nextSibling);
        }
    }
    
    alerta.style.background = colores[tipo] + '20';
    alerta.style.color = colores[tipo];
    alerta.style.border = `1px solid ${colores[tipo]}40`;
    alerta.textContent = mensaje;
    
    // Ocultar después de 4 segundos
    setTimeout(() => {
        alerta.style.opacity = '0';
        setTimeout(() => alerta.remove(), 300);
    }, 4000);
}

/**
 * Popup de newsletter (aparece después de 30 segundos)
 */
function initNewsletterPopup() {
    const yaMostrado = sessionStorage.getItem('newsletterPopupShown');
    if (yaMostrado) return;
    
    setTimeout(() => {
        const popup = document.createElement('div');
        popup.className = 'newsletter-popup';
        popup.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 30px;
            background: var(--white);
            padding: 1.5rem;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            z-index: 999;
            max-width: 350px;
            animation: slideUp 0.5s ease;
            border: 2px solid var(--primary-light);
        `;
        
        popup.innerHTML = `
            <button onclick="this.parentElement.remove()" style="position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--gray-400);">&times;</button>
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🐾</div>
            <h4 style="margin-bottom: 0.5rem; color: var(--dark);">¡No te pierdas nada!</h4>
            <p style="font-size: 0.85rem; color: var(--gray-500); margin-bottom: 1rem;">Recibe ofertas exclusivas y novedades para tu mascota.</p>
            <form class="newsletter-popup-form" style="display: flex; gap: 0.5rem;">
                <input type="email" placeholder="Tu email" style="flex: 1; padding: 0.6rem; border: 2px solid var(--gray-200); border-radius: 8px; font-family: inherit;">
                <button type="submit" style="background: var(--primary); color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600;">Suscribir</button>
            </form>
        `;
        
        document.body.appendChild(popup);
        
        // Manejar submit del popup
        popup.querySelector('.newsletter-popup-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input').value;
            if (validarEmailNewsletter(email)) {
                suscribirNewsletter(email, this);
                popup.remove();
            }
        });
        
        sessionStorage.setItem('newsletterPopupShown', 'true');
    }, 30000); // 30 segundos
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initNewsletter);

console.log('✅ Newsletter cargado');