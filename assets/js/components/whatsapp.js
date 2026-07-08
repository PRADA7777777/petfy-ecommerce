// ========== PETFY - WHATSAPP COMPONENT ==========
var whatsappHTML = `
<a href="https://wa.me/573204829244?text=Hola%20Petfy%20%F0%9F%90%BE%20Necesito%20informaci%C3%B3n" 
   target="_blank" class="whatsapp-float" aria-label="Chat por WhatsApp">
    <i class="fab fa-whatsapp"></i>
</a>`;

function inicializarWhatsApp() {
    document.body.insertAdjacentHTML('beforeend', whatsappHTML);
}

document.addEventListener('DOMContentLoaded', inicializarWhatsApp);