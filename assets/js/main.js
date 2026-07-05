// ========== PETFY - MAIN SCRIPTS (VERSIÓN FINAL) ==========

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== INICIALIZAR MÓDULOS ==========
    generarBreadcrumb();
    actualizarContadorCarrito();
    
    // ========== MENÚ MÓVIL ==========
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            const icon = this.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                navLinks.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
        
        document.addEventListener('click', function(e) {
            if (navLinks.classList.contains('active')) {
                if (!e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn')) {
                    navLinks.classList.remove('active');
                    const icon = mobileMenuBtn.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
    
    // ========== CARRITO ==========
    document.querySelectorAll('.btn-add-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.product-card');
            if (!card) return;
            
            const productId = card.dataset.productId || Date.now().toString();
            const productName = card.querySelector('.product-title')?.textContent?.trim() || 'Producto';
            const productPrice = card.querySelector('.current-price')?.textContent?.trim() || '$0';
            const productImage = card.querySelector('.product-image img')?.src || '';
            
            agregarAlCarrito(productId, productName, productPrice, productImage, 1);
        });
    });
    
    // ========== SCROLL SUAVE ==========
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // ========== NEWSLETTER ==========
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            if (email) {
                mostrarFeedback('✅ ¡Suscrito con éxito!');
                this.reset();
            }
        });
    }
    
    console.log('✅ Petfy inicializado correctamente');
});

// ========== BREADCRUMB DINÁMICO ==========
function generarBreadcrumb() {
    const breadcrumbList = document.getElementById('breadcrumbList');
    if (!breadcrumbList) return;
    
    const path = window.location.pathname;
    const pageName = path.split('/').pop() || 'index.html';
    
    // Detectar profundidad para rutas relativas
    const depth = path.split('/').filter(p => p).length;
    const basePath = depth > 1 ? '../'.repeat(depth - 1) : '';
    
    // Mapeo de páginas
    const paginas = {
        '': { nombre: 'Inicio', icono: 'fa-home', categoria: 'inicio' },
        'index.html': { nombre: 'Inicio', icono: 'fa-home', categoria: 'inicio' },
        'tienda.html': { nombre: 'Tienda', icono: 'fa-store', categoria: 'tienda' },
        'producto.html': { nombre: 'Producto', icono: 'fa-box', categoria: 'tienda' },
        'carrito.html': { nombre: 'Carrito de Compras', icono: 'fa-shopping-cart', categoria: 'tienda' },
        'checkout.html': { nombre: 'Finalizar Compra', icono: 'fa-credit-card', categoria: 'tienda' },
        'confirmacion.html': { nombre: 'Confirmación', icono: 'fa-check-circle', categoria: 'tienda' },
        'wishlist.html': { nombre: 'Lista de Deseos', icono: 'fa-heart', categoria: 'tienda' },
        'comparar.html': { nombre: 'Comparar', icono: 'fa-balance-scale', categoria: 'tienda' },
        'servicios.html': { nombre: 'Servicios', icono: 'fa-hand-holding-heart', categoria: 'servicios' },
        'paseos.html': { nombre: 'Paseos', icono: 'fa-dog', categoria: 'servicios' },
        'guarderia.html': { nombre: 'Guardería', icono: 'fa-home', categoria: 'servicios' },
        'banos.html': { nombre: 'Baños', icono: 'fa-shower', categoria: 'servicios' },
        'veterinaria.html': { nombre: 'Veterinaria', icono: 'fa-stethoscope', categoria: 'servicios' },
        'entrenamiento.html': { nombre: 'Entrenamiento', icono: 'fa-graduation-cap', categoria: 'servicios' },
        'contacto.html': { nombre: 'Contacto', icono: 'fa-envelope', categoria: 'principal' },
        'gracias.html': { nombre: 'Gracias', icono: 'fa-heart', categoria: 'contacto' },
        'nosotros.html': { nombre: 'Nosotros', icono: 'fa-users', categoria: 'principal' },
        'equipo.html': { nombre: 'Equipo', icono: 'fa-user-tie', categoria: 'nosotros' },
        'trabaja.html': { nombre: 'Trabaja con Nosotros', icono: 'fa-briefcase', categoria: 'nosotros' },
        'login.html': { nombre: 'Iniciar Sesión', icono: 'fa-sign-in-alt', categoria: 'cuenta' },
        'registro.html': { nombre: 'Crear Cuenta', icono: 'fa-user-plus', categoria: 'cuenta' },
        'perfil.html': { nombre: 'Mi Perfil', icono: 'fa-user-circle', categoria: 'cuenta' },
        'pedidos.html': { nombre: 'Mis Pedidos', icono: 'fa-receipt', categoria: 'cuenta' },
        'direcciones.html': { nombre: 'Mis Direcciones', icono: 'fa-map-marked-alt', categoria: 'cuenta' },
        'terminos.html': { nombre: 'Términos y Condiciones', icono: 'fa-file-contract', categoria: 'legal' },
        'privacidad.html': { nombre: 'Privacidad', icono: 'fa-shield-alt', categoria: 'legal' },
        'cookies.html': { nombre: 'Cookies', icono: 'fa-cookie-bite', categoria: 'legal' },
        'devoluciones.html': { nombre: 'Devoluciones', icono: 'fa-undo', categoria: 'legal' },
        'envios.html': { nombre: 'Envíos', icono: 'fa-truck', categoria: 'legal' }
    };
    
    const paginaActual = paginas[pageName] || {
        nombre: formatearNombrePagina(pageName),
        icono: 'fa-file',
        categoria: 'otra'
    };
    
    let html = '';
    
    // INICIO
    if (paginaActual.categoria === 'inicio') {
        html = `
            <li class="breadcrumb-item active" aria-current="page">
                <span class="breadcrumb-current"><i class="fas fa-home"></i> Inicio</span>
            </li>
        `;
    }
    // TIENDA
    else if (paginaActual.categoria === 'tienda') {
        html = `
            <li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item"><a href="${basePath}tienda/" class="breadcrumb-link"><i class="fas fa-store"></i> Tienda</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ${paginaActual.icono}"></i> ${paginaActual.nombre}</span></li>
        `;
    }
    // SERVICIOS
    else if (paginaActual.categoria === 'servicios') {
        html = `
            <li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item"><a href="${basePath}servicios/" class="breadcrumb-link"><i class="fas fa-hand-holding-heart"></i> Servicios</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ${paginaActual.icono}"></i> ${paginaActual.nombre}</span></li>
        `;
    }
    // NOSOTROS
    else if (paginaActual.categoria === 'nosotros') {
        html = `
            <li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item"><a href="${basePath}nosotros/" class="breadcrumb-link"><i class="fas fa-users"></i> Nosotros</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ${paginaActual.icono}"></i> ${paginaActual.nombre}</span></li>
        `;
    }
    // CONTACTO
    else if (paginaActual.categoria === 'contacto') {
        html = `
            <li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ${paginaActual.icono}"></i> ${paginaActual.nombre}</span></li>
        `;
    }
    // CUENTA
    else if (paginaActual.categoria === 'cuenta') {
        html = `
            <li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item"><a href="${basePath}cuenta/perfil.html" class="breadcrumb-link"><i class="fas fa-user"></i> Mi Cuenta</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ${paginaActual.icono}"></i> ${paginaActual.nombre}</span></li>
        `;
    }
    // LEGAL
    else if (paginaActual.categoria === 'legal') {
        html = `
            <li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ${paginaActual.icono}"></i> ${paginaActual.nombre}</span></li>
        `;
    }
    // PRINCIPAL (servicios, contacto, nosotros como índice)
    else if (paginaActual.categoria === 'principal') {
        html = `
            <li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ${paginaActual.icono}"></i> ${paginaActual.nombre}</span></li>
        `;
    }
    // GENÉRICO
    else {
        html = `
            <li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>
            <li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>
            <li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas fa-file"></i> ${paginaActual.nombre}</span></li>
        `;
    }
    
    breadcrumbList.innerHTML = html;
}

// ========== FORMATEAR NOMBRE DE PÁGINA ==========
function formatearNombrePagina(nombreArchivo) {
    if (!nombreArchivo || nombreArchivo === '') return 'Página';
    
    return nombreArchivo
        .replace('.html', '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

// ========== CARRITO DE COMPRAS ==========
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('petfyCart')) || [];
}

function guardarCarrito(cart) {
    localStorage.setItem('petfyCart', JSON.stringify(cart));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const cart = obtenerCarrito();
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    document.querySelectorAll('.cart-count').forEach(contador => {
        contador.textContent = totalItems;
        contador.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

function agregarAlCarrito(id, name, price, image, quantity = 1) {
    let cart = obtenerCarrito();
    
    const existingIndex = cart.findIndex(item => item.id === id);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ id, name, price, image, quantity });
    }
    
    guardarCarrito(cart);
    mostrarFeedback('✅ Producto añadido al carrito');
}

function eliminarDelCarrito(id) {
    let cart = obtenerCarrito();
    cart = cart.filter(item => item.id !== id);
    guardarCarrito(cart);
    mostrarFeedback('🗑️ Producto eliminado');
}

function vaciarCarrito() {
    guardarCarrito([]);
    mostrarFeedback('🛒 Carrito vaciado');
}

// ========== FEEDBACK TOAST ==========
function mostrarFeedback(mensaje) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #10B981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        font-weight: 600;
        font-size: 0.9rem;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        font-family: 'Inter', sans-serif;
    `;
    toast.textContent = mensaje;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ========== ANIMACIONES ==========
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ========== PLACEHOLDERS FUTUROS ==========
function processPayment(paymentData) {
    console.log('💳 Procesando pago:', paymentData);
}

function searchProducts(query) {
    console.log('🔍 Buscando:', query);
}

function loadProducts(category = null, page = 1) {
    console.log('📦 Cargando productos:', { category, page });
}

console.log('✅ main.js cargado correctamente');
// ========== MODAL DE LOGIN ==========
document.addEventListener('DOMContentLoaded', function() {
    
    // Abrir modal al hacer clic en el icono de usuario
    const btnCuenta = document.querySelector('.icon-link[title="Mi cuenta"], #btnCuenta');
    if (btnCuenta) {
        btnCuenta.addEventListener('click', function(e) {
            e.preventDefault(); // Evita que # aparezca en la URL
            const modal = document.getElementById('loginModal');
            if (modal) {
                modal.classList.add('active');
            }
        });
    }

    // Cerrar modal con botón X
    const closeBtn = document.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('loginModal').classList.remove('active');
        });
    }

    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }

    // Cerrar con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('loginModal');
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
            }
        }
    });

    // Si ya está logueado, actualizar navbar
    if (localStorage.getItem('petfyLogged') === 'true') {
        const user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
        if (user.nombre) {
            actualizarNavbarUsuario(user.nombre);
        }
    }
});

// Cambiar a registro
function mostrarRegistro() {
    document.getElementById('formLogin').style.display = 'none';
    document.getElementById('formRegistro').style.display = 'block';
    document.getElementById('modalError').style.display = 'none';
    document.getElementById('modalSuccess').style.display = 'none';
}

// Cambiar a login
function mostrarLogin() {
    document.getElementById('formRegistro').style.display = 'none';
    document.getElementById('formLogin').style.display = 'block';
    document.getElementById('modalError').style.display = 'none';
    document.getElementById('modalSuccess').style.display = 'none';
}

// Login desde modal
function loginModal(e) {
    e.preventDefault();
    const email = document.getElementById('modalEmail').value.trim();
    const password = document.getElementById('modalPassword').value.trim();

    if (email && password.length >= 4) {
        const usuario = {
            nombre: email.split('@')[0],
            apellido: '',
            email: email,
            telefono: ''
        };
        localStorage.setItem('petfyUser', JSON.stringify(usuario));
        localStorage.setItem('petfyLogged', 'true');
        actualizarNavbarUsuario(usuario.nombre);
        document.getElementById('loginModal').classList.remove('active');
        document.getElementById('modalError').style.display = 'none';
    } else {
        document.getElementById('modalError').style.display = 'block';
    }
    return false;
}

// Registro desde modal
function registroModal(e) {
    e.preventDefault();
    const nombre = document.getElementById('regModalNombre').value.trim();
    const email = document.getElementById('regModalEmail').value.trim();
    const password = document.getElementById('regModalPassword').value.trim();

    if (password.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres');
        return false;
    }

    const usuario = {
        nombre: nombre,
        apellido: '',
        email: email,
        telefono: ''
    };
    localStorage.setItem('petfyUser', JSON.stringify(usuario));
    localStorage.setItem('petfyLogged', 'true');

    document.getElementById('modalSuccess').style.display = 'block';
    setTimeout(() => {
        actualizarNavbarUsuario(nombre);
        document.getElementById('loginModal').classList.remove('active');
        mostrarLogin();
    }, 1500);
    return false;
}

// Actualizar navbar después de login
function actualizarNavbarUsuario(nombre) {
    const userLinks = document.querySelectorAll('.icon-link[title="Mi cuenta"], #btnCuenta');
    userLinks.forEach(link => {
        link.href = '#';
        link.title = 'Mi Perfil (' + nombre + ')';
        link.innerHTML = '<i class="fas fa-user-check" style="color:#10B981;"></i>';
    });
}

// Cerrar sesión (se llama desde perfil)
function cerrarSesion() {
    localStorage.removeItem('petfyLogged');
    localStorage.removeItem('petfyUser');
    window.location.href = '../index.html';
}