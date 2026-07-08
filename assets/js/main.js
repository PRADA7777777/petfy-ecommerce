// ========== PETFY - MAIN SCRIPTS ==========

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== HEADER STICKY ==========
    window.addEventListener('scroll', function() {
        var h = document.getElementById('mainHeader');
        if (h) h.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    // ========== MENÚ MÓVIL ==========
    var mb = document.querySelector('.mobile-menu-btn');
    var nl = document.querySelector('.nav-links');
    if (mb && nl) { mb.onclick = function() { nl.classList.toggle('active'); }; }
    
    // ========== BREADCRUMB ==========
    generarBreadcrumb();
    
    // ========== CARRITO ==========
    actualizarContadorCarrito();
    document.querySelectorAll('.btn-add-cart').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var card = this.closest('.product-card');
            if (!card) return;
            var id = card.dataset.productId || Date.now().toString();
            var name = card.querySelector('.product-title')?.textContent?.trim() || 'Producto';
            var price = card.querySelector('.current-price')?.textContent?.trim() || '$0';
            var image = card.querySelector('.product-image img')?.src || '';
            agregarAlCarrito(id, name, price, image, 1);
        });
    });
    
    // ========== BOTÓN CUENTA (LOGIN/SIDEBAR) ==========
    var btn = document.getElementById('btnCuenta');
    if (btn) {
        btn.onclick = function(e) {
            e.preventDefault();
            if (localStorage.getItem('petfyLogged') === 'true') {
                abrirSidebar();
            } else {
                abrirModal();
            }
            return false;
        };
    }
    
    // ========== OFERTA BIENVENIDA ==========
    if (!localStorage.getItem('ofertaVista') && localStorage.getItem('petfyLogged') !== 'true') {
        setTimeout(function() {
            var oferta = document.getElementById('ofertaModal');
            if (oferta) oferta.classList.add('active');
        }, 3000);
    }
    
    // ========== ESTADO INICIAL ==========
    if (localStorage.getItem('petfyLogged') === 'true') {
        var u = JSON.parse(localStorage.getItem('petfyUser') || '{}');
        if (u.nombre) actualizarUI(u);
    }
    
    // ========== CARRUSEL ==========
    iniciarCarrusel();
    
    // ========== NEWSLETTER ==========
    var nlForm = document.querySelector('.newsletter-form');
    if (nlForm) {
        nlForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = this.querySelector('input[type="email"]').value;
            if (email) { alert('✅ ¡Suscrito con éxito!'); this.reset(); }
        });
    }
    
    console.log('✅ Petfy inicializado');
});

// ============================================================
// SIDEBAR
// ============================================================
function abrirSidebar() {
    document.getElementById('profileSidebar').classList.add('active');
    document.getElementById('profileOverlay').classList.add('active');
}
function cerrarSidebar() {
    document.getElementById('profileSidebar').classList.remove('active');
    document.getElementById('profileOverlay').classList.remove('active');
}

// ============================================================
// MODAL LOGIN/REGISTRO
// ============================================================
function abrirModal() { document.getElementById('loginModal').classList.add('active'); }
function cerrarModal() { document.getElementById('loginModal').classList.remove('active'); }
function mostrarRegistro() {
    document.getElementById('formLogin').style.display = 'none';
    document.getElementById('formRegistro').style.display = 'block';
}
function mostrarLogin() {
    document.getElementById('formRegistro').style.display = 'none';
    document.getElementById('formLogin').style.display = 'block';
}
function loginModal(e) {
    e.preventDefault();
    var email = document.getElementById('modalEmail').value.trim();
    var pw = document.getElementById('modalPassword').value.trim();
    if (email && pw.length >= 4) {
        var user = { nombre: email.split('@')[0], apellido: '', email: email, telefono: '' };
        localStorage.setItem('petfyUser', JSON.stringify(user));
        localStorage.setItem('petfyLogged', 'true');
        actualizarUI(user);
        cerrarModal();
    }
    return false;
}
function registroModal(e) {
    e.preventDefault();
    var nombre = document.getElementById('regModalNombre').value.trim();
    var email = document.getElementById('regModalEmail').value.trim();
    var pw = document.getElementById('regModalPassword').value.trim();
    if (pw.length < 8) { alert('Mínimo 8 caracteres'); return false; }
    var user = { nombre: nombre, apellido: '', email: email, telefono: '' };
    localStorage.setItem('petfyUser', JSON.stringify(user));
    localStorage.setItem('petfyLogged', 'true');
    actualizarUI(user);
    cerrarModal();
    mostrarLogin();
    return false;
}

// ============================================================
// ACTUALIZAR UI
// ============================================================
function actualizarUI(user) {
    var btn = document.getElementById('btnCuenta');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-user-check" style="color:#10B981;"></i>';
        btn.title = 'Mi Perfil';
    }
    var sn = document.getElementById('sidebarNombre');
    var se = document.getElementById('sidebarEmail');
    if (sn) sn.textContent = user.nombre;
    if (se) se.textContent = user.email;
}
function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// ============================================================
// OFERTA
// ============================================================
function cerrarOferta() {
    document.getElementById('ofertaModal').classList.remove('active');
    localStorage.setItem('ofertaVista', 'true');
}
function reclamarOferta() {
    document.getElementById('ofertaModal').classList.remove('active');
    abrirModal();
    mostrarRegistro();
}

// ============================================================
// CARRITO
// ============================================================
function obtenerCarrito() { return JSON.parse(localStorage.getItem('petfyCart')) || []; }
function actualizarContadorCarrito() {
    var cart = obtenerCarrito();
    var total = cart.reduce(function(s, i) { return s + (i.quantity || 1); }, 0);
    document.querySelectorAll('.cart-count').forEach(function(el) {
        el.textContent = total;
        el.style.display = total > 0 ? 'flex' : 'none';
    });
}
function agregarAlCarrito(id, name, price, image, qty) {
    qty = qty || 1;
    var cart = obtenerCarrito();
    var idx = cart.findIndex(function(i) { return i.id === id; });
    if (idx > -1) { cart[idx].quantity += qty; }
    else { cart.push({ id: id, name: name, price: price, image: image, quantity: qty }); }
    localStorage.setItem('petfyCart', JSON.stringify(cart));
    actualizarContadorCarrito();
    alert('✅ Añadido al carrito');
}

// ============================================================
// CARRUSEL
// ============================================================
function iniciarCarrusel() {
    var container = document.getElementById('mainCarousel');
    if (!container) return;
    var track = document.getElementById('carouselTrack');
    var dots = document.querySelectorAll('.carousel-dots .dot');
    var current = 0, total = 4, interval;
    
    function go(n) {
        current = (n + total) % total;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        dots.forEach(function(d, i) { d.classList.toggle('active', i === current); });
    }
    function next() { go(current + 1); }
    function prev() { go(current - 1); }
    function start() { stop(); interval = setInterval(next, 5000); }
    function stop() { clearInterval(interval); }
    
    var prevBtn = container.querySelector('.carousel-prev');
    var nextBtn = container.querySelector('.carousel-next');
    if (prevBtn) prevBtn.onclick = function() { prev(); start(); };
    if (nextBtn) nextBtn.onclick = function() { next(); start(); };
    
    dots.forEach(function(d, i) { d.onclick = function() { go(i); start(); }; });
    
    container.addEventListener('mouseenter', stop);
    container.addEventListener('mouseleave', start);
    start();
}

// ============================================================
// BREADCRUMB
// ============================================================
function generarBreadcrumb() {
    var list = document.getElementById('breadcrumbList');
    if (!list) return;
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    var depth = path.split('/').filter(function(p) { return p; }).length;
    var base = depth > 1 ? '../'.repeat(depth - 1) : '';
    
    if (page === 'index.html' || page === '') {
        list.innerHTML = '<li class="breadcrumb-item active"><span class="breadcrumb-current"><i class="fas fa-home"></i> Inicio</span></li>';
    } else {
        var name = page.replace('.html','').replace(/-/g,' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
        list.innerHTML = '<li class="breadcrumb-item"><a href="' + base + 'index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li><li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li><li class="breadcrumb-item active"><span class="breadcrumb-current"><i class="fas fa-file"></i> ' + name + '</span></li>';
    }
}

// ============================================================
// ESC PARA CERRAR
// ============================================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        cerrarSidebar();
        cerrarModal();
    }
});

console.log('✅ main.js cargado');