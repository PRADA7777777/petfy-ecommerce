// ========== PETFY - MAIN SCRIPTS ==========

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== INICIALIZAR MÓDULOS ==========
    generarBreadcrumb();
    actualizarContadorCarrito();
    inicializarUI();
    
    // ========== HEADER STICKY ==========
    window.addEventListener('scroll', function() {
        var header = document.getElementById('mainHeader');
        if (header) header.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    // ========== MENÚ MÓVIL ==========
    var mobileBtn = document.querySelector('.mobile-menu-btn');
    var navLinks = document.querySelector('.nav-links');
    
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            var icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        });
        
        // Cerrar al hacer clic en un enlace
        navLinks.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                var icon = mobileBtn.querySelector('i');
                if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
            });
        });
        
        // Cerrar al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (navLinks.classList.contains('active')) {
                if (!e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn')) {
                    navLinks.classList.remove('active');
                    var icon = mobileBtn.querySelector('i');
                    if (icon) { icon.classList.remove('fa-times'); icon.classList.add('fa-bars'); }
                }
            }
        });
    }
    
    // ========== BOTÓN DE CUENTA (LOGIN/SIDEBAR) ==========
    var btnCuenta = document.querySelector('#btnCuenta');
    if (btnCuenta) {
        btnCuenta.addEventListener('click', function(e) {
            e.preventDefault();
            if (localStorage.getItem('petfyLogged') === 'true') {
                abrirSidebar();
            } else {
                abrirModal();
            }
        });
    }
    
    // ========== CERRAR CON ESC ==========
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarSidebar();
            cerrarModal();
        }
    });
    
    // ========== CARRITO ==========
    document.querySelectorAll('.btn-add-cart').forEach(function(button) {
        button.addEventListener('click', function(e) {
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
    
    // ========== SCROLL SUAVE ==========
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href === '#') return;
            e.preventDefault();
            var target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
    
    // ========== NEWSLETTER ==========
    var newsletter = document.querySelector('.newsletter-form');
    if (newsletter) {
        newsletter.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = this.querySelector('input[type="email"]').value;
            if (email) {
                mostrarFeedback('✅ ¡Suscrito con éxito!');
                this.reset();
            }
        });
    }
    
    console.log('✅ Petfy inicializado correctamente');
});

// ========== INICIALIZAR UI ==========
function inicializarUI() {
    if (localStorage.getItem('petfyLogged') === 'true') {
        var user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
        if (user.nombre) actualizarUI(user);
    }
}

// ============================================================
// BREADCRUMB DINÁMICO
// ============================================================
function generarBreadcrumb() {
    var breadcrumbList = document.getElementById('breadcrumbList');
    if (!breadcrumbList) return;
    
    var path = window.location.pathname;
    var pageName = path.split('/').pop() || 'index.html';
    var depth = path.split('/').filter(function(p) { return p; }).length;
    var basePath = depth > 1 ? '../'.repeat(depth - 1) : '';
    
    var paginas = {
        '': { nombre: 'Inicio', icono: 'fa-home', categoria: 'inicio' },
        'index.html': { nombre: 'Inicio', icono: 'fa-home', categoria: 'inicio' },
        'tienda.html': { nombre: 'Tienda', icono: 'fa-store', categoria: 'tienda' },
        'producto.html': { nombre: 'Producto', icono: 'fa-box', categoria: 'tienda' },
        'carrito.html': { nombre: 'Carrito', icono: 'fa-shopping-cart', categoria: 'tienda' },
        'checkout.html': { nombre: 'Checkout', icono: 'fa-credit-card', categoria: 'tienda' },
        'servicios.html': { nombre: 'Servicios', icono: 'fa-hand-holding-heart', categoria: 'servicios' },
        'paseos.html': { nombre: 'Paseos', icono: 'fa-dog', categoria: 'servicios' },
        'guarderia.html': { nombre: 'Guardería', icono: 'fa-home', categoria: 'servicios' },
        'banos.html': { nombre: 'Baños', icono: 'fa-shower', categoria: 'servicios' },
        'veterinaria.html': { nombre: 'Veterinaria', icono: 'fa-stethoscope', categoria: 'servicios' },
        'entrenamiento.html': { nombre: 'Entrenamiento', icono: 'fa-graduation-cap', categoria: 'servicios' },
        'contacto.html': { nombre: 'Contacto', icono: 'fa-envelope', categoria: 'principal' },
        'nosotros.html': { nombre: 'Nosotros', icono: 'fa-users', categoria: 'principal' },
        'perfil.html': { nombre: 'Mi Perfil', icono: 'fa-user-circle', categoria: 'cuenta' },
        'terminos.html': { nombre: 'Términos', icono: 'fa-file-contract', categoria: 'legal' },
        'privacidad.html': { nombre: 'Privacidad', icono: 'fa-shield-alt', categoria: 'legal' }
    };
    
    var paginaActual = paginas[pageName] || {
        nombre: formatearNombrePagina(pageName),
        icono: 'fa-file',
        categoria: 'otra'
    };
    
    var html = '';
    var inicio = '<li class="breadcrumb-item"><a href="' + basePath + 'index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>';
    var sep = '<li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>';
    var actual = '<li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ' + paginaActual.icono + '"></i> ' + paginaActual.nombre + '</span></li>';
    
    if (paginaActual.categoria === 'inicio') {
        html = actual;
    } else if (paginaActual.categoria === 'tienda') {
        html = inicio + sep + '<li class="breadcrumb-item"><a href="' + basePath + 'tienda/" class="breadcrumb-link"><i class="fas fa-store"></i> Tienda</a></li>' + sep + actual;
    } else if (paginaActual.categoria === 'servicios') {
        if (pageName === 'servicios.html') html = inicio + sep + actual;
        else html = inicio + sep + '<li class="breadcrumb-item"><a href="' + basePath + 'servicios/" class="breadcrumb-link"><i class="fas fa-hand-holding-heart"></i> Servicios</a></li>' + sep + actual;
    } else if (paginaActual.categoria === 'cuenta') {
        html = inicio + sep + '<li class="breadcrumb-item"><a href="' + basePath + 'cuenta/perfil.html" class="breadcrumb-link"><i class="fas fa-user"></i> Mi Cuenta</a></li>' + sep + actual;
    } else {
        html = inicio + sep + actual;
    }
    
    breadcrumbList.innerHTML = html;
}

function formatearNombrePagina(nombre) {
    if (!nombre) return 'Página';
    return nombre.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); }).trim();
}

// ============================================================
// SIDEBAR PROFILE
// ============================================================
function abrirSidebar() {
    var sidebar = document.getElementById('profileSidebar');
    var overlay = document.getElementById('profileOverlay');
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarSidebar() {
    var sidebar = document.getElementById('profileSidebar');
    var overlay = document.getElementById('profileOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// ============================================================
// MODAL LOGIN/REGISTRO
// ============================================================
function abrirModal() {
    var modal = document.getElementById('loginModal');
    if (modal) modal.classList.add('active');
}

function cerrarModal() {
    var modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('active');
}

function mostrarRegistro() {
    document.getElementById('formLogin').style.display = 'none';
    document.getElementById('formRegistro').style.display = 'block';
    document.getElementById('modalError').style.display = 'none';
    document.getElementById('modalSuccess').style.display = 'none';
}

function mostrarLogin() {
    document.getElementById('formRegistro').style.display = 'none';
    document.getElementById('formLogin').style.display = 'block';
    document.getElementById('modalError').style.display = 'none';
    document.getElementById('modalSuccess').style.display = 'none';
}

function loginModal(e) {
    e.preventDefault();
    var email = document.getElementById('modalEmail').value.trim();
    var password = document.getElementById('modalPassword').value.trim();
    
    if (email && password.length >= 4) {
        var user = { nombre: email.split('@')[0], apellido: '', email: email, telefono: '' };
        localStorage.setItem('petfyUser', JSON.stringify(user));
        localStorage.setItem('petfyLogged', 'true');
        actualizarUI(user);
        cerrarModal();
    } else {
        document.getElementById('modalError').style.display = 'block';
    }
    return false;
}

function registroModal(e) {
    e.preventDefault();
    var nombre = document.getElementById('regModalNombre').value.trim();
    var email = document.getElementById('regModalEmail').value.trim();
    var password = document.getElementById('regModalPassword').value.trim();
    
    if (password.length < 8) { alert('Mínimo 8 caracteres'); return false; }
    
    var user = { nombre: nombre, apellido: '', email: email, telefono: '' };
    localStorage.setItem('petfyUser', JSON.stringify(user));
    localStorage.setItem('petfyLogged', 'true');
    
    document.getElementById('modalSuccess').style.display = 'block';
    setTimeout(function() {
        actualizarUI(user);
        cerrarModal();
        mostrarLogin();
    }, 1500);
    return false;
}

// ============================================================
// ACTUALIZAR UI DESPUÉS DE LOGIN
// ============================================================
function actualizarUI(user) {
    var btn = document.getElementById('btnCuenta');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-user-check" style="color:#10B981;"></i>';
        btn.title = 'Mi Perfil';
        btn.setAttribute('data-logged', 'true');
        btn.removeAttribute('id');
    }
    var nombre = document.getElementById('sidebarNombre');
    var email = document.getElementById('sidebarEmail');
    if (nombre) nombre.textContent = user.nombre;
    if (email) email.textContent = user.email;
}

function cerrarSesion() {
    localStorage.removeItem('petfyLogged');
    localStorage.removeItem('petfyUser');
    window.location.href = 'index.html';
}

// ============================================================
// CARRITO DE COMPRAS
// ============================================================
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('petfyCart')) || [];
}

function guardarCarrito(cart) {
    localStorage.setItem('petfyCart', JSON.stringify(cart));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    var cart = obtenerCarrito();
    var total = cart.reduce(function(sum, item) { return sum + (item.quantity || 1); }, 0);
    document.querySelectorAll('.cart-count').forEach(function(c) {
        c.textContent = total;
        c.style.display = total > 0 ? 'flex' : 'none';
    });
}

function agregarAlCarrito(id, name, price, image, quantity) {
    quantity = quantity || 1;
    var cart = obtenerCarrito();
    var idx = cart.findIndex(function(item) { return item.id === id; });
    
    if (idx > -1) { cart[idx].quantity += quantity; }
    else { cart.push({ id: id, name: name, price: price, image: image, quantity: quantity }); }
    
    guardarCarrito(cart);
    mostrarFeedback('✅ Producto añadido al carrito');
}

// ============================================================
// FEEDBACK TOAST
// ============================================================
function mostrarFeedback(mensaje) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:30px;right:30px;background:#10B981;color:white;padding:1rem 1.5rem;border-radius:10px;font-weight:600;font-size:0.9rem;z-index:9999;animation:slideIn 0.3s ease;box-shadow:0 10px 25px rgba(0,0,0,0.2);font-family:\'Nunito\',sans-serif;';
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

// ============================================================
// PLACEHOLDERS FUTUROS
// ============================================================
function processPayment(paymentData) { console.log('💳 Procesando pago:', paymentData); }
function searchProducts(query) { console.log('🔍 Buscando:', query); }
function loadProducts(category, page) { console.log('📦 Cargando productos:', { category: category, page: page }); }

console.log('✅ main.js cargado');