// ========== PETFY - COOKIES + OFERTA COMPONENT ==========
var cookiesHTML = `
<div class="modal-overlay" id="cookiesModal" style="display:flex;align-items:flex-end;background:rgba(0,0,0,0.3);">
    <div class="cookies-banner">
        <div class="container" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
            <div style="flex:1;min-width:250px;">
                <h4 style="font-family:'Fredoka One',cursive;">🍪 Cookies y Privacidad</h4>
                <p style="font-size:0.85rem;color:var(--text-light);margin:0;">
                    Usamos cookies. Al continuar, aceptas nuestros 
                    <a href="${getBasePath()}legal/terminos.html" style="color:var(--primary);">Términos</a> y 
                    <a href="${getBasePath()}legal/privacidad.html" style="color:var(--primary);">Privacidad</a>.
                </p>
            </div>
            <div style="display:flex;gap:0.5rem;">
                <button onclick="rechazarCookies()" class="btn-cookie-outline">Solo necesarias</button>
                <button onclick="aceptarCookies()" class="btn-cookie-primary">Aceptar todo</button>
            </div>
        </div>
    </div>
</div>`;

var ofertaHTML = `
<div class="modal-overlay" id="ofertaModal">
    <div class="modal-container" style="text-align:center;max-width:480px;">
        <button class="modal-close-btn" onclick="cerrarOferta()">&times;</button>
        <div style="font-size:4rem;">🎉</div>
        <h2>¡Bienvenido a Petfy!</h2>
        <p style="color:var(--text-light);margin:1rem 0;">Oferta exclusiva para nuevos clientes</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0;">
            <div style="background:linear-gradient(135deg,#FFF0E8,#FFE0D0);padding:1.5rem;border-radius:16px;">
                <div style="font-size:2.5rem;">🛍️</div>
                <div style="font-size:2rem;font-family:'Fredoka One',cursive;color:var(--primary);">50%</div>
                <div style="font-weight:700;">DESCUENTO</div>
            </div>
            <div style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);padding:1.5rem;border-radius:16px;">
                <div style="font-size:2.5rem;">🐕</div>
                <div style="font-size:2rem;font-family:'Fredoka One',cursive;color:#059669;">1</div>
                <div style="font-weight:700;">PASEO GRATIS</div>
            </div>
        </div>
        <button onclick="reclamarOferta()" class="modal-btn">🎁 Crear Cuenta y Reclamar</button>
        <button onclick="cerrarOferta()" style="background:none;border:none;color:var(--text-muted);margin-top:0.75rem;cursor:pointer;font-family:'Nunito',sans-serif;font-size:0.85rem;">No gracias</button>
    </div>
</div>`;

function inicializarCookies() {
    document.body.insertAdjacentHTML('beforeend', cookiesHTML + ofertaHTML);
    
    if (localStorage.getItem('cookiesAceptadas')) {
        document.getElementById('cookiesModal').style.display = 'none';
    }
    if (localStorage.getItem('ofertaVista') || localStorage.getItem('petfyLogged') === 'true') {
        var oferta = document.getElementById('ofertaModal');
        if (oferta) oferta.style.display = 'none';
    }
}

function aceptarCookies() {
    localStorage.setItem('cookiesAceptadas', 'true');
    document.getElementById('cookiesModal').style.display = 'none';
    if (!localStorage.getItem('ofertaVista') && localStorage.getItem('petfyLogged') !== 'true') {
        setTimeout(function() { document.getElementById('ofertaModal').classList.add('active'); }, 1000);
    }
}
function rechazarCookies() {
    localStorage.setItem('cookiesAceptadas', 'minimas');
    document.getElementById('cookiesModal').style.display = 'none';
}
function cerrarOferta() {
    document.getElementById('ofertaModal').classList.remove('active');
    localStorage.setItem('ofertaVista', 'true');
}
function reclamarOferta() {
    document.getElementById('ofertaModal').classList.remove('active');
    document.getElementById('registroRapidoModal').classList.add('active');
}

document.addEventListener('DOMContentLoaded', inicializarCookies);