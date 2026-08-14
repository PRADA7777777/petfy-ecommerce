// ========== PETFY - BREADCRUMB ==========

/**
 * Generar breadcrumb dinámico según la página actual
 */
function generarBreadcrumb() {
    const breadcrumbList = document.getElementById('breadcrumbList');
    if (!breadcrumbList) return;
    
    const path = window.location.pathname;
    const pageName = path.split('/').pop() || 'index.html';
    
    // Detectar profundidad para rutas relativas
    const segments = path.split('/').filter(p => p && p !== 'index.html');
    const depth = segments.length;
    const basePath = depth > 0 ? '../'.repeat(depth) : '';
    
    // Mapeo completo de páginas
    const paginas = {
        '': { nombre: 'Inicio', icono: 'fa-home', categoria: 'inicio' },
        'index.html': { nombre: 'Inicio', icono: 'fa-home', categoria: 'inicio' },
        'tienda.html': { nombre: 'Tienda', icono: 'fa-store', categoria: 'tienda' },
        'producto.html': { nombre: 'Producto', icono: 'fa-box', categoria: 'tienda' },
        'carrito.html': { nombre: 'Carrito', icono: 'fa-shopping-cart', categoria: 'tienda' },
        'checkout.html': { nombre: 'Checkout', icono: 'fa-credit-card', categoria: 'tienda' },
        'confirmacion.html': { nombre: 'Confirmación', icono: 'fa-check-circle', categoria: 'tienda' },
        'wishlist.html': { nombre: 'Favoritos', icono: 'fa-heart', categoria: 'tienda' },
        'servicios.html': { nombre: 'Servicios', icono: 'fa-hand-holding-heart', categoria: 'servicios' },
        'paseos.html': { nombre: 'Paseos', icono: 'fa-dog', categoria: 'servicios' },
        'guarderia.html': { nombre: 'Guardería', icono: 'fa-house-chimney', categoria: 'servicios' },
        'banos.html': { nombre: 'Baños', icono: 'fa-shower', categoria: 'servicios' },
        'veterinaria.html': { nombre: 'Veterinaria', icono: 'fa-stethoscope', categoria: 'servicios' },
        'entrenamiento.html': { nombre: 'Entrenamiento', icono: 'fa-graduation-cap', categoria: 'servicios' },
        'contacto.html': { nombre: 'Contacto', icono: 'fa-envelope', categoria: 'contacto' },
        'gracias.html': { nombre: 'Gracias', icono: 'fa-heart', categoria: 'contacto' },
        'nosotros.html': { nombre: 'Nosotros', icono: 'fa-users', categoria: 'nosotros' },
        'equipo.html': { nombre: 'Equipo', icono: 'fa-user-tie', categoria: 'nosotros' },
        'trabaja.html': { nombre: 'Trabaja con Nosotros', icono: 'fa-briefcase', categoria: 'nosotros' },
        'login.html': { nombre: 'Iniciar Sesión', icono: 'fa-sign-in-alt', categoria: 'cuenta' },
        'registro.html': { nombre: 'Registro', icono: 'fa-user-plus', categoria: 'cuenta' },
        'perfil.html': { nombre: 'Mi Perfil', icono: 'fa-user-circle', categoria: 'cuenta' },
        'pedidos.html': { nombre: 'Mis Pedidos', icono: 'fa-receipt', categoria: 'cuenta' },
        'direcciones.html': { nombre: 'Direcciones', icono: 'fa-map-marked-alt', categoria: 'cuenta' },
        'terminos.html': { nombre: 'Términos', icono: 'fa-file-contract', categoria: 'legal' },
        'privacidad.html': { nombre: 'Privacidad', icono: 'fa-shield-alt', categoria: 'legal' },
        'cookies.html': { nombre: 'Cookies', icono: 'fa-cookie-bite', categoria: 'legal' },
        'devoluciones.html': { nombre: 'Devoluciones', icono: 'fa-undo', categoria: 'legal' },
        'envios.html': { nombre: 'Envíos', icono: 'fa-truck', categoria: 'legal' }
    };
    
    const paginaActual = paginas[pageName] || {
        nombre: pageName.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icono: 'fa-file',
        categoria: 'otra'
    };
    
    let html = '';
    const inicio = `<li class="breadcrumb-item"><a href="${basePath}index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li>`;
    const sep = `<li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li>`;
    const actual = `<li class="breadcrumb-item active" aria-current="page"><span class="breadcrumb-current"><i class="fas ${paginaActual.icono}"></i> ${paginaActual.nombre}</span></li>`;
    
    switch(paginaActual.categoria) {
        case 'inicio':
            html = actual;
            break;
            
        case 'tienda':
            html = inicio + sep + `<li class="breadcrumb-item"><a href="${basePath}tienda/" class="breadcrumb-link"><i class="fas fa-store"></i> Tienda</a></li>` + sep + actual;
            break;
            
        case 'servicios':
            if (pageName === 'servicios.html') {
                html = inicio + sep + actual;
            } else {
                html = inicio + sep + `<li class="breadcrumb-item"><a href="${basePath}servicios/" class="breadcrumb-link"><i class="fas fa-hand-holding-heart"></i> Servicios</a></li>` + sep + actual;
            }
            break;
            
        case 'nosotros':
            if (pageName === 'nosotros.html') {
                html = inicio + sep + actual;
            } else {
                html = inicio + sep + `<li class="breadcrumb-item"><a href="${basePath}nosotros/" class="breadcrumb-link"><i class="fas fa-users"></i> Nosotros</a></li>` + sep + actual;
            }
            break;
            
        case 'cuenta':
            html = inicio + sep + `<li class="breadcrumb-item"><a href="${basePath}cuenta/perfil.html" class="breadcrumb-link"><i class="fas fa-user"></i> Mi Cuenta</a></li>` + sep + actual;
            break;
            
        case 'contacto':
        case 'legal':
        default:
            html = inicio + sep + actual;
            break;
    }
    
    breadcrumbList.innerHTML = html;
}

console.log('✅ Breadcrumb cargado');