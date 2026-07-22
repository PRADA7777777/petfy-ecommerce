// ================================================================
// PETFY - MAIN SCRIPTS v2.0
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== HEADER STICKY ==========
    window.addEventListener('scroll', function() {
        var h = document.getElementById('mainHeader');
        if (h) h.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    // ========== MENÚ MÓVIL ==========
    var mb = document.querySelector('.mobile-menu-btn');
    var nl = document.querySelector('.nav-links');
    if (mb && nl) {
        mb.onclick = function() {
            nl.classList.toggle('active');
            var icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars');
                icon.classList.toggle('fa-times');
            }
        };
    }
    
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
    
    // ========== BOTÓN CUENTA ==========
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
    
    // ========== CARRUSEL BANNERS ==========
    iniciarCarruselBanners();
    
    // ========== CARRUSEL 3D SERVICIOS ==========
    initCarousel3D();
    
    // ========== NEWSLETTER ==========
    var nlForm = document.querySelector('.newsletter-form');
    if (nlForm) {
        nlForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = this.querySelector('input[type="email"]').value;
            if (email) {
                alert('✅ ¡Suscrito con éxito!');
                this.reset();
            }
        });
    }
    
    console.log('✅ Petfy v2.0 inicializado');
});

// ============================================================
// SIDEBAR DEL PERFIL
// ============================================================
function abrirSidebar() {
    var sidebar = document.getElementById('profileSidebar');
    var overlay = document.getElementById('profileOverlay');
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function cerrarSidebar() {
    var sidebar = document.getElementById('profileSidebar');
    var overlay = document.getElementById('profileOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
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
    var formLogin = document.getElementById('formLogin');
    var formRegistro = document.getElementById('formRegistro');
    if (formLogin) formLogin.style.display = 'none';
    if (formRegistro) formRegistro.style.display = 'block';
}

function mostrarLogin() {
    var formRegistro = document.getElementById('formRegistro');
    var formLogin = document.getElementById('formLogin');
    if (formRegistro) formRegistro.style.display = 'none';
    if (formLogin) formLogin.style.display = 'block';
}

function loginModal(e) {
    e.preventDefault();
    var email = document.getElementById('modalEmail')?.value?.trim();
    var pw = document.getElementById('modalPassword')?.value?.trim();
    
    if (email && pw && pw.length >= 4) {
        var user = {
            nombre: email.split('@')[0],
            apellido: '',
            email: email,
            telefono: ''
        };
        localStorage.setItem('petfyUser', JSON.stringify(user));
        localStorage.setItem('petfyLogged', 'true');
        actualizarUI(user);
        cerrarModal();
    } else {
        alert('⚠️ Completa todos los campos correctamente');
    }
    return false;
}

function registroModal(e) {
    e.preventDefault();
    var nombre = document.getElementById('regModalNombre')?.value?.trim();
    var email = document.getElementById('regModalEmail')?.value?.trim();
    var pw = document.getElementById('regModalPassword')?.value?.trim();
    
    if (!nombre || !email || !pw) {
        alert('⚠️ Completa todos los campos');
        return false;
    }
    if (pw.length < 8) {
        alert('⚠️ La contraseña debe tener mínimo 8 caracteres');
        return false;
    }
    
    var user = {
        nombre: nombre,
        apellido: '',
        email: email,
        telefono: ''
    };
    localStorage.setItem('petfyUser', JSON.stringify(user));
    localStorage.setItem('petfyLogged', 'true');
    actualizarUI(user);
    cerrarModal();
    mostrarLogin();
    alert('✅ ¡Cuenta creada con éxito!');
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
    if (sn) sn.textContent = user.nombre || 'Usuario';
    if (se) se.textContent = user.email || 'usuario@email.com';
}

function cerrarSesion() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// ============================================================
// OFERTA BIENVENIDA
// ============================================================
function cerrarOferta() {
    var oferta = document.getElementById('ofertaModal');
    if (oferta) oferta.classList.remove('active');
    localStorage.setItem('ofertaVista', 'true');
}

function reclamarOferta() {
    cerrarOferta();
    abrirModal();
    mostrarRegistro();
}

// ============================================================
// CARRITO DE COMPRAS
// ============================================================
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem('petfyCart')) || [];
}

function guardarCarrito(cart) {
    localStorage.setItem('petfyCart', JSON.stringify(cart));
}

function actualizarContadorCarrito() {
    var cart = obtenerCarrito();
    var total = cart.reduce(function(s, i) {
        return s + (i.quantity || 1);
    }, 0);
    document.querySelectorAll('.cart-count').forEach(function(el) {
        el.textContent = total;
        el.style.display = total > 0 ? 'flex' : 'none';
    });
}

function agregarAlCarrito(id, name, price, image, qty) {
    qty = qty || 1;
    var cart = obtenerCarrito();
    var idx = cart.findIndex(function(i) { return i.id === id; });
    
    if (idx > -1) {
        cart[idx].quantity += qty;
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            image: image,
            quantity: qty
        });
    }
    
    guardarCarrito(cart);
    actualizarContadorCarrito();
    alert('✅ Añadido al carrito');
}

// ============================================================
// CARRUSEL DE BANNERS (INDEX)
// ============================================================
function iniciarCarruselBanners() {
    var track = document.getElementById('carouselTrack');
    var dots = document.querySelectorAll('#mainCarousel .dot');
    var prevBtn = document.querySelector('#mainCarousel .carousel-prev');
    var nextBtn = document.querySelector('#mainCarousel .carousel-next');
    
    if (!track || !dots.length) return;
    
    var currentIndex = 0;
    var totalSlides = 4;
    var autoPlayInterval;
    
    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        currentIndex = index;
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        dots.forEach(function(dot, i) {
            dot.classList.toggle('active', i === currentIndex);
        });
    }
    
    function nextSlide() { goToSlide(currentIndex + 1); }
    function prevSlide() { goToSlide(currentIndex - 1); }
    
    function startAutoPlay() {
        stopAutoPlay();
        autoPlayInterval = setInterval(nextSlide, 5000);
    }
    
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }
    
    if (prevBtn) prevBtn.addEventListener('click', function() { prevSlide(); startAutoPlay(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { nextSlide(); startAutoPlay(); });
    
    dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            var index = parseInt(this.getAttribute('data-index'));
            if (!isNaN(index)) {
                goToSlide(index);
                startAutoPlay();
            }
        });
    });
    
    var container = document.getElementById('mainCarousel');
    if (container) {
        container.addEventListener('mouseenter', stopAutoPlay);
        container.addEventListener('mouseleave', startAutoPlay);
    }
    
    goToSlide(0);
    startAutoPlay();
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
        var name = page.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, function(l) {
            return l.toUpperCase();
        });
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

// ================================================================
// ==================== SERVICIOS: PLANES Y PRECIOS ====================
// ================================================================

/**
 * CONFIGURACIÓN DE PLANES
 * Modifica aquí: precios, nombres, features, días permitidos
 */
var planesData = [
    { 
        id: 'unico', 
        emoji: '⚡', 
        nombre: 'Paseo Único', 
        tag: 'tag-ahorro', 
        tagText: 'Sin suscripción', 
        precio: 19990, 
        periodo: 'por paseo', 
        diasPermitidos: 1, 
        features: ['45 min', 'GPS en vivo', '5 fotos'] 
    },
    { 
        id: '3dias', 
        emoji: '🌟', 
        nombre: '3 Días/Semana', 
        tag: 'tag-popular', 
        tagText: 'Más Popular', 
        precio: 189990, 
        periodo: '/mes', 
        diasPermitidos: 3, 
        features: ['1h por sesión', 'Paseador fijo', 'Seguro incluido'] 
    },
    { 
        id: '5dias', 
        emoji: '🔥', 
        nombre: '5 Días/Semana', 
        tag: 'tag-premium', 
        tagText: 'Recomendado', 
        precio: 299990, 
        periodo: '/mes', 
        diasPermitidos: 5, 
        features: ['1h por sesión', 'Fotos + video', 'Seguro incluido'] 
    }
];

var currentIndex = 0;
var planSeleccionado = null;
var mascotaSel = null;

// ========== INICIAR CARRUSEL 3D ==========
function initCarousel3D() {
    var track = document.getElementById('carouselTrack3D');
    if (!track) return;
    
    track.innerHTML = '';
    planesData.forEach(function(p, i) {
        track.innerHTML += crearCard3D(i);
    });
    actualizarClases3D();
    
    setInterval(function() {
        if (document.getElementById('carouselTrack3D')) {
            girarCarousel(1);
        }
    }, 5000);
}

function crearCard3D(i) {
    var p = planesData[i];
    var feats = '';
    p.features.forEach(function(f) {
        feats += '<li><i class="fas fa-check-circle"></i> ' + f + '</li>';
    });
    return '<div class="plan-card-3d" id="card3d-' + i + '" onclick="if(this.classList.contains(\'center\')) elegirPlan(\'' + p.id + '\')"><div class="plan-emoji">' + p.emoji + '</div><h3>' + p.nombre + '</h3><span class="plan-tag ' + p.tag + '">' + p.tagText + '</span><div class="plan-precio">$' + p.precio.toLocaleString() + '<small>' + p.periodo + '</small></div><ul class="plan-features">' + feats + '</ul><button class="plan-btn-elegir" onclick="elegirPlan(\'' + p.id + '\')">Elegir este Plan →</button></div>';
}

function actualizarClases3D() {
    var cards = document.querySelectorAll('.plan-card-3d');
    var total = planesData.length;
    
    cards.forEach(function(c, i) {
        c.classList.remove('center', 'left', 'right', 'far-left', 'far-right');
        var diff = (i - currentIndex + total) % total;
        
        if (diff === 0) c.classList.add('center');
        else if (diff === 1 || diff === -(total - 1)) c.classList.add('right');
        else if (diff === total - 1 || diff === -1) c.classList.add('left');
        else if (diff === 2) c.classList.add('far-right');
        else c.classList.add('far-left');
    });
}

function girarCarousel(dir) {
    currentIndex = (currentIndex + dir + planesData.length) % planesData.length;
    actualizarClases3D();
}

// ========== ELEGIR PLAN ==========
function elegirPlan(planId) {
    planSeleccionado = planesData.find(function(p) { return p.id === planId; });
    if (!planSeleccionado) return;
    
    var stickyBar = document.getElementById('stickyBar');
    if (stickyBar) stickyBar.classList.add('active');
    actualizarSticky();
    
    var acordeon = document.getElementById('acordeonAgendar');
    if (acordeon) {
        acordeon.classList.add('active');
        acordeon.innerHTML = generarFormulario(planSeleccionado);
        acordeon.scrollIntoView({ behavior: 'smooth' });
    }
}

function cerrarAcordeon() {
    var acordeon = document.getElementById('acordeonAgendar');
    var stickyBar = document.getElementById('stickyBar');
    if (acordeon) acordeon.classList.remove('active');
    if (stickyBar) stickyBar.classList.remove('active');
    planSeleccionado = null;
}

// ================================================================
// ==================== FORMULARIO 3 FASES ====================
// ================================================================

/**
 * FORMULARIO DE AGENDAMIENTO
 * Fase 1: Datos del Cliente (Responsable y Facturación)
 * Fase 2: Datos del Perro
 * Fase 3: Datos del Servicio (Dirección, Fecha, Días)
 */
function generarFormulario(plan) {
    var logueado = localStorage.getItem('petfyLogged') === 'true';
    var u = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    
    // ========== FASE 1: DATOS DEL CLIENTE ==========
    var fase1 = '' +
    '<div class="form-section" id="fase1-cliente">' +
        '<h4><span>👤</span> Datos del Responsable y Facturación</h4>' +
        '<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem;">Estos datos son del responsable de la mascota y para facturación del servicio</p>' +
        
        (logueado ? 
            '<div class="badge-logeado"><i class="fas fa-check-circle"></i> ' + u.nombre + ' (datos cargados)</div>' +
            '<input type="hidden" id="wizNombre" name="cliente_nombre" value="' + u.nombre + '">' +
            '<input type="hidden" id="wizApellido" name="cliente_apellido" value="' + (u.apellido || '') + '">' +
            '<input type="hidden" id="wizEmail" name="cliente_email" value="' + u.email + '">'
        :
            '<div class="form-row">' +
                '<div class="form-group"><label>Nombre *</label><input type="text" id="wizNombre" name="cliente_nombre" placeholder="Nombres" required></div>' +
                '<div class="form-group"><label>Apellido *</label><input type="text" id="wizApellido" name="cliente_apellido" placeholder="Apellidos" required></div>' +
            '</div>' +
            '<div class="form-group"><label>Correo Electrónico *</label><input type="email" id="wizEmail" name="cliente_email" placeholder="tu@email.com" required></div>'
        ) +
        
        '<div class="form-row">' +
            '<div class="form-group"><label>Tipo de Documento *</label><select id="wizTipoDoc" name="cliente_tipo_documento" required><option value="">Seleccionar</option><option value="CC" selected>Cédula de Ciudadanía (CC)</option><option value="CE">Cédula de Extranjería (CE)</option><option value="NIT">NIT</option><option value="PP">Pasaporte</option></select></div>' +
            '<div class="form-group"><label>Número de Documento *</label><input type="text" id="wizNumDoc" name="cliente_numero_documento" placeholder="Ej: 1234567890" required></div>' +
        '</div>' +
        
        '<div class="form-group"><label>Dirección de Facturación *</label><input type="text" id="wizDirFactura" name="cliente_direccion_factura" placeholder="Dirección para facturación" required></div>' +
    '</div>';
    
    // ========== FASE 2: DATOS DEL PERRO ==========
    var fase2 = '' +
    '<div class="form-section" id="fase2-perro">' +
        '<h4><span>🐕</span> Datos de tu Perro</h4>' +
        
        '<div class="form-row">' +
            '<div class="form-group"><label>Nombre de la Mascota *</label><input type="text" id="wizPerroNombre" name="mascota_nombre" placeholder="Nombre de tu perro" required></div>' +
            '<div class="form-group"><label>Raza *</label><select id="wizPerroRaza" name="mascota_raza" required><option value="">Seleccionar raza</option>' + generarListaRazas() + '</select></div>' +
        '</div>' +
        
        '<div class="form-row-3">' +
            '<div class="form-group"><label>Edad *</label><input type="text" id="wizPerroEdad" name="mascota_edad" placeholder="Ej: 2 años, 6 meses" required></div>' +
            '<div class="form-group"><label>Peso (kg) *</label><input type="text" id="wizPerroPeso" name="mascota_peso" placeholder="Ej: 15" required></div>' +
            '<div class="form-group">' +
                '<label>Comportamiento con otros perros *</label>' +
                '<select id="wizPerroComp" name="mascota_comportamiento" required onchange="toggleOtroComportamiento(this.value)">' +
                    '<option value="">Seleccionar</option>' +
                    '<option value="sociable">Sociable</option>' +
                    '<option value="nervioso">Nervioso</option>' +
                    '<option value="agresivo">Agresivo</option>' +
                    '<option value="otro">Otro (especificar)</option>' +
                '</select>' +
                '<input type="text" id="wizPerroCompOtro" name="mascota_comportamiento_otro" placeholder="Especificar comportamiento" style="display:none;margin-top:0.5rem;">' +
            '</div>' +
        '</div>' +
        
        '<div class="form-group">' +
            '<label>Condiciones Médicas Especiales</label>' +
            '<select id="wizPerroCondMed" name="mascota_condiciones_medicas" onchange="toggleOtroCondMed(this.value)">' +
                '<option value="ninguna">No tiene</option>' +
                '<option value="alergias">Alergias</option>' +
                '<option value="cardiaco">Problemas cardíacos</option>' +
                '<option value="respiratorio">Problemas respiratorios</option>' +
                '<option value="articular">Problemas articulares</option>' +
                '<option value="otro">Otra (especificar)</option>' +
            '</select>' +
            '<input type="text" id="wizPerroCondMedOtro" name="mascota_condiciones_medicas_otro" placeholder="Especificar condición médica" style="display:none;margin-top:0.5rem;">' +
        '</div>' +
        
        '<div class="form-group">' +
            '<label>Otras Indicaciones o Información de la Mascota</label>' +
            '<textarea id="wizPerroInfo" name="mascota_indicaciones" rows="3" placeholder="Ej: No le gustan los gatos, prefiere parques abiertos, come a las 2pm, etc."></textarea>' +
        '</div>' +
        
        '<div class="form-row">' +
            '<div class="form-group">' +
                '<label>📸 Foto del Perro *</label>' +
                '<div class="file-upload" onclick="document.getElementById(\'fotoPerro\').click()"><span>🐕</span><p>Click para subir foto</p><input type="file" id="fotoPerro" name="mascota_foto" accept="image/*" onchange="preview(this,\'prevPerro\')" required></div>' +
                '<img id="prevPerro" class="preview-img">' +
            '</div>' +
            '<div class="form-group">' +
                '<label>💉 Carné de Vacunación *</label>' +
                '<div class="file-upload" onclick="document.getElementById(\'fotoVacuna\').click()"><span>📋</span><p>Click para subir carné</p><input type="file" id="fotoVacuna" name="mascota_vacuna" accept="image/*" onchange="preview(this,\'prevVacuna\')" required></div>' +
                '<img id="prevVacuna" class="preview-img">' +
            '</div>' +
        '</div>' +
    '</div>';
    
    // ========== FASE 3: DATOS DEL SERVICIO ==========
    var diasHTML = '';
    if (plan.diasPermitidos > 1) {
        var diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        diasHTML = '<div class="dias-block">' +
            '<span class="dias-block-label">📆 Días de la semana (selecciona ' + plan.diasPermitidos + ')</span>' +
            '<div class="dias-checkboxes" id="diasCheckboxes">';
        diasSemana.forEach(function(d) {
            diasHTML += '<label class="dia-cb"><input type="checkbox" name="dias_semana[]" value="' + d + '" onchange="validarDias(event)"> ' + d.charAt(0).toUpperCase() + d.slice(1) + '</label>';
        });
        diasHTML += '</div><p class="aviso-dias" id="avisoDias">Debes seleccionar exactamente ' + plan.diasPermitidos + ' días</p></div>';
    }
    
    var fase3 = '' +
    '<div class="form-section" id="fase3-servicio">' +
        '<h4><span>📅</span> Datos del Servicio</h4>' +
        
        '<div class="form-group">' +
            '<label>Dirección de Recogida *</label>' +
            '<p style="color:var(--text-muted);font-size:0.8rem;margin-bottom:0.5rem;">Ingresa la dirección completa donde recogeremos a tu mascota</p>' +
        '</div>' +
        
        '<div class="form-row">' +
            '<div class="form-group"><label>Ciudad *</label><select id="wizCiudad" name="servicio_ciudad" required><option value="">Seleccionar ciudad</option><option value="bogota" selected>Bogotá</option><option value="medellin" disabled>Medellín (Próximamente)</option><option value="cali" disabled>Cali (Próximamente)</option></select></div>' +
            '<div class="form-group"><label>Localidad *</label><select id="wizLocalidad" name="servicio_localidad" required><option value="">Seleccionar localidad</option>' + generarListaLocalidades() + '</select></div>' +
        '</div>' +
        
        '<div class="form-row">' +
            '<div class="form-group">' +
                '<label>Tipo de Vía *</label>' +
                '<select id="wizTipoVia" name="servicio_tipo_via" required>' +
                    '<option value="">Seleccionar</option>' +
                    '<option value="calle">Calle</option>' +
                    '<option value="carrera">Carrera</option>' +
                    '<option value="diagonal">Diagonal</option>' +
                    '<option value="transversal">Transversal</option>' +
                    '<option value="avenida">Avenida</option>' +
                    '<option value="autopista">Autopista</option>' +
                '</select>' +
            '</div>' +
            '<div class="form-group">' +
                '<label>Número *</label>' +
                '<input type="text" id="wizNumVia" name="servicio_numero_via" placeholder="Ej: 15z #7-70" required>' +
            '</div>' +
        '</div>' +
        
        '<div class="form-group">' +
            '<label>Complemento / Detalles</label>' +
            '<input type="text" id="wizComplemento" name="servicio_complemento" placeholder="Ej: Edificio Palmetto, Casa azul, Local 3, etc.">' +
        '</div>' +
        
        '<div class="form-group">' +
            '<label>¿Es un conjunto residencial? *</label>' +
            '<select id="wizEsConjunto" name="servicio_es_conjunto" required onchange="toggleConjunto(this.value)">' +
                '<option value="">Seleccionar</option>' +
                '<option value="si">Sí, es un conjunto</option>' +
                '<option value="no">No, es una casa/apto independiente</option>' +
            '</select>' +
        '</div>' +
        
        '<div id="datosConjunto" style="display:none;">' +
            '<div class="form-row">' +
                '<div class="form-group">' +
                    '<label>Torre / Bloque *</label>' +
                    '<input type="text" id="wizTorre" name="servicio_torre" placeholder="Ej: Torre 5, Bloque B">' +
                '</div>' +
                '<div class="form-group">' +
                    '<label>Apartamento / Casa # *</label>' +
                    '<input type="text" id="wizApto" name="servicio_apto" placeholder="Ej: Apto 301, Casa 12">' +
                '</div>' +
            '</div>' +
        '</div>' +
        
        '<div class="form-group">' +
            '<label>Fecha y Hora del Servicio *</label>' +
            '<input type="datetime-local" class="input-datetime" id="wizFechaHora" name="servicio_fecha_hora" required onchange="actualizarSticky()">' +
        '</div>' +
        
        diasHTML +
    '</div>';
    
    // ========== ARMAR FORMULARIO COMPLETO ==========
    return fase1 + fase2 + fase3 +
        '<span class="btn-cerrar-acordeon" onclick="cerrarAcordeon()">← Ver todos los planes</span>';
}

// ============================================================
// LISTAS DESPLEGABLES
// ============================================================

function generarListaRazas() {
    var razas = [
        'Affenpinscher', 'Afgano', 'Akita', 'Alaskan Malamute', 'American Bully', 'American Pit Bull Terrier',
        'American Staffordshire Terrier', 'Basenji', 'Basset Hound', 'Beagle', 'Bearded Collie', 'Bichón Frisé',
        'Bichón Maltés', 'Bloodhound', 'Border Collie', 'Borzoi', 'Boston Terrier', 'Boxer', 'Boyero de Berna',
        'Bulldog Francés', 'Bulldog Inglés', 'Bullmastiff', 'Bull Terrier', 'Caniche (Poodle)', 'Carlino (Pug)',
        'Chihuahua', 'Chow Chow', 'Cocker Spaniel', 'Collie', 'Corgi', 'Crestado Chino', 'Criollo (Mestizo)',
        'Dálmata', 'Doberman', 'Dogo Argentino', 'Dogo de Burdeos', 'Fila Brasileiro', 'Fox Terrier', 'Galgo',
        'Golden Retriever', 'Gran Danés', 'Husky Siberiano', 'Jack Russell Terrier', 'Labrador Retriever',
        'Lhasa Apso', 'Mastín Napolitano', 'Pastor Alemán', 'Pastor Australiano', 'Pastor Belga', 'Pekinés',
        'Pinscher Miniatura', 'Pitbull', 'Pointer', 'Pomerania', 'Rottweiler', 'San Bernardo', 'Schnauzer',
        'Scottish Terrier', 'Setter Irlandés', 'Shar Pei', 'Shiba Inu', 'Shih Tzu', 'Spaniel Bretón',
        'Terranova', 'Weimaraner', 'West Highland White Terrier', 'Yorkshire Terrier', 'Otra'
    ];
    
    var html = '';
    razas.forEach(function(raza) {
        html += '<option value="' + raza.toLowerCase().replace(/\s+/g, '-') + '">' + raza + '</option>';
    });
    return html;
}

function generarListaLocalidades() {
    var localidades = [
        { value: 'usaquen', label: 'Usaquén', enabled: true },
        { value: 'chapinero', label: 'Chapinero', enabled: false },
        { value: 'santa-fe', label: 'Santa Fe', enabled: false },
        { value: 'san-cristobal', label: 'San Cristóbal', enabled: false },
        { value: 'usme', label: 'Usme', enabled: false },
        { value: 'tunjuelito', label: 'Tunjuelito', enabled: false },
        { value: 'bosa', label: 'Bosa', enabled: false },
        { value: 'kennedy', label: 'Kennedy', enabled: false },
        { value: 'fontibon', label: 'Fontibón', enabled: false },
        { value: 'engativa', label: 'Engativá', enabled: false },
        { value: 'suba', label: 'Suba', enabled: false },
        { value: 'barrios-unidos', label: 'Barrios Unidos', enabled: false },
        { value: 'teusaquillo', label: 'Teusaquillo', enabled: false },
        { value: 'martires', label: 'Los Mártires', enabled: false },
        { value: 'antonio-narino', label: 'Antonio Nariño', enabled: false },
        { value: 'puente-aranda', label: 'Puente Aranda', enabled: false },
        { value: 'candelaria', label: 'La Candelaria', enabled: false },
        { value: 'rafael-uribe', label: 'Rafael Uribe Uribe', enabled: false },
        { value: 'ciudad-bolivar', label: 'Ciudad Bolívar', enabled: false },
        { value: 'sumapaz', label: 'Sumapaz', enabled: false }
    ];
    
    var html = '';
    localidades.forEach(function(loc) {
        var disabled = loc.enabled ? '' : ' disabled';
        var proximamente = loc.enabled ? '' : ' (Próximamente)';
        html += '<option value="' + loc.value + '"' + disabled + '>' + loc.label + proximamente + '</option>';
    });
    return html;
}

// ============================================================
// TOGGLES PARA CAMPOS CONDICIONALES
// ============================================================

function toggleOtroComportamiento(valor) {
    var otro = document.getElementById('wizPerroCompOtro');
    if (otro) {
        otro.style.display = valor === 'otro' ? 'block' : 'none';
        if (valor !== 'otro') otro.value = '';
    }
}

function toggleOtroCondMed(valor) {
    var otro = document.getElementById('wizPerroCondMedOtro');
    if (otro) {
        otro.style.display = valor === 'otro' ? 'block' : 'none';
        if (valor !== 'otro') otro.value = '';
    }
}

function toggleConjunto(valor) {
    var datos = document.getElementById('datosConjunto');
    var torre = document.getElementById('wizTorre');
    var apto = document.getElementById('wizApto');
    
    if (datos) {
        datos.style.display = valor === 'si' ? 'block' : 'none';
        if (torre) torre.required = valor === 'si';
        if (apto) apto.required = valor === 'si';
    }
}

// ============================================================
// VALIDACIÓN DE DÍAS
// ============================================================

function validarDias(event) {
    if (!planSeleccionado) return;
    var maxDias = planSeleccionado.diasPermitidos;
    var checkboxes = document.querySelectorAll('#diasCheckboxes input[type="checkbox"]');
    var marcados = document.querySelectorAll('#diasCheckboxes input[type="checkbox"]:checked');
    var aviso = document.getElementById('avisoDias');
    
    if (marcados.length > maxDias) {
        if (aviso) {
            aviso.style.display = 'block';
            aviso.textContent = '⚠️ Solo puedes seleccionar ' + maxDias + ' días para este plan';
        }
        if (event && event.target) {
            event.target.checked = false;
        }
    } else {
        if (aviso) aviso.style.display = 'none';
    }
    
    checkboxes.forEach(function(cb) {
        var label = cb.closest('.dia-cb');
        if (label) {
            if (cb.checked) label.classList.add('marcado');
            else label.classList.remove('marcado');
        }
    });
    
    actualizarSticky();
}

function selMascota(i, el) {
    mascotaSel = i;
    document.querySelectorAll('.mascota-circle').forEach(function(c) {
        c.style.borderColor = '#F0EBE5';
        c.style.boxShadow = 'none';
    });
    if (el) {
        el.style.borderColor = '#E0633F';
        el.style.boxShadow = '0 0 0 3px rgba(224,99,63,0.2)';
    }
}

function nuevaMascota() {
    var n = prompt('Nombre de tu perro:');
    if (!n) return;
    var r = prompt('Raza:') || 'Mestizo';
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    mascotas.push({ nombre: n, raza: r });
    localStorage.setItem('petfyMascotas', JSON.stringify(mascotas));
    
    if (planSeleccionado) {
        elegirPlan(planSeleccionado.id);
    }
}

function preview(input, previewId) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = document.getElementById(previewId);
            if (img) {
                img.src = e.target.result;
                img.style.display = 'block';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ============================================================
// STICKY BAR
// ============================================================

function actualizarSticky() {
    if (!planSeleccionado) return;
    var planEl = document.getElementById('stickyPlan');
    var precioEl = document.getElementById('stickyPrecio');
    if (planEl) planEl.textContent = planSeleccionado.nombre;
    if (precioEl) precioEl.textContent = '$' + planSeleccionado.precio.toLocaleString();
}

// ============================================================
// PAGO Y ENVÍO A BACKEND
// ============================================================

/**
 * RECOLECTA DATOS DEL FORMULARIO Y LOS PREPARA PARA BACKEND
 * Endpoint: POST /api/servicios
 */
function iniciarPago() {
    if (!planSeleccionado) {
        alert('⚠️ Selecciona un plan primero');
        return;
    }
    
    var u = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    var nombre = u.nombre || document.getElementById('wizNombre')?.value;
    var apellido = document.getElementById('wizApellido')?.value || '';
    
    // Validaciones
    if (!nombre) { alert('⚠️ Completa tus datos personales'); return; }
    if (!document.getElementById('wizNumDoc')?.value) { alert('⚠️ Ingresa tu número de documento'); return; }
    if (!document.getElementById('wizPerroNombre')?.value) { alert('⚠️ Ingresa el nombre de tu mascota'); return; }
    if (!document.getElementById('wizFechaHora')?.value) { alert('⚠️ Selecciona una fecha y hora'); return; }
    if (!document.getElementById('wizNumVia')?.value) { alert('⚠️ Ingresa la dirección de recogida'); return; }
    
    if (planSeleccionado.diasPermitidos > 1) {
        var diasMarcados = document.querySelectorAll('#diasCheckboxes input[type="checkbox"]:checked');
        if (diasMarcados.length === 0) { alert('⚠️ Selecciona los días de la semana'); return; }
    }
    
    var ref = 'PETFY-' + Date.now();
    var fechaHora = document.getElementById('wizFechaHora')?.value;
    var fechaObj = new Date(fechaHora);
    var fechaFormateada = fechaObj.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    var horaFormateada = fechaObj.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    
    var diasSeleccionados = [];
    if (planSeleccionado.diasPermitidos > 1) {
        document.querySelectorAll('#diasCheckboxes input[type="checkbox"]:checked').forEach(function(cb) {
            diasSeleccionados.push(cb.value.charAt(0).toUpperCase() + cb.value.slice(1));
        });
    }
    
    // Construir dirección completa
    var tipoVia = document.getElementById('wizTipoVia')?.value || '';
    var numVia = document.getElementById('wizNumVia')?.value || '';
    var complemento = document.getElementById('wizComplemento')?.value || '';
    var esConjunto = document.getElementById('wizEsConjunto')?.value || 'no';
    var torre = document.getElementById('wizTorre')?.value || '';
    var apto = document.getElementById('wizApto')?.value || '';
    
    var direccionCompleta = tipoVia + ' ' + numVia;
    if (complemento) direccionCompleta += ', ' + complemento;
    if (esConjunto === 'si') {
        if (torre) direccionCompleta += ' - ' + torre;
        if (apto) direccionCompleta += ' - ' + apto;
    }
    
    // ========== DATOS PARA BACKEND ==========
    var datosBackend = {
        referencia: ref,
        plan_id: planSeleccionado.id,
        plan_nombre: planSeleccionado.nombre,
        plan_precio: planSeleccionado.precio,
        
        // Cliente
        cliente_nombre: nombre,
        cliente_apellido: apellido,
        cliente_nombre_completo: nombre + (apellido ? ' ' + apellido : ''),
        cliente_email: u.email || document.getElementById('wizEmail')?.value,
        cliente_tipo_documento: document.getElementById('wizTipoDoc')?.value,
        cliente_numero_documento: document.getElementById('wizNumDoc')?.value,
        cliente_direccion_factura: document.getElementById('wizDirFactura')?.value,
        
        // Mascota
        mascota_nombre: document.getElementById('wizPerroNombre')?.value,
        mascota_raza: document.getElementById('wizPerroRaza')?.value,
        mascota_edad: document.getElementById('wizPerroEdad')?.value,
        mascota_peso: document.getElementById('wizPerroPeso')?.value,
        mascota_comportamiento: document.getElementById('wizPerroComp')?.value,
        mascota_comportamiento_otro: document.getElementById('wizPerroCompOtro')?.value || '',
        mascota_condiciones_medicas: document.getElementById('wizPerroCondMed')?.value,
        mascota_condiciones_medicas_otro: document.getElementById('wizPerroCondMedOtro')?.value || '',
        mascota_indicaciones: document.getElementById('wizPerroInfo')?.value || '',
        
        // Servicio
        servicio_ciudad: document.getElementById('wizCiudad')?.value,
        servicio_localidad: document.getElementById('wizLocalidad')?.value,
        servicio_tipo_via: tipoVia,
        servicio_numero_via: numVia,
        servicio_complemento: complemento,
        servicio_es_conjunto: esConjunto,
        servicio_torre: torre,
        servicio_apto: apto,
        servicio_direccion_completa: direccionCompleta,
        servicio_fecha_hora: fechaHora,
        servicio_fecha: fechaFormateada,
        servicio_hora: horaFormateada,
        servicio_dias: diasSeleccionados.length > 0 ? diasSeleccionados.join(', ') : 'Único',
        servicio_dias_array: diasSeleccionados
    };
    
    // Guardar en localStorage para página de confirmación
    localStorage.setItem('petfyUltimoPedido', JSON.stringify(datosBackend));
    
    console.log('📦 Datos para backend:', datosBackend);
    
    // ========== CONEXIÓN A BACKEND ==========
    // DESCOMENTA Y CONFIGURA TU ENDPOINT:
    /*
    fetch('https://tu-api.com/api/servicios', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer TU_TOKEN'
        },
        body: JSON.stringify(datosBackend)
    })
    .then(function(response) {
        if (!response.ok) throw new Error('Error en el servidor');
        return response.json();
    })
    .then(function(data) {
        console.log('✅ Respuesta del servidor:', data);
        window.location.href = 'confirmacion.html';
    })
    .catch(function(error) {
        console.error('❌ Error:', error);
        alert('Error al procesar el pago. Intenta de nuevo.');
    });
    */
    
    // Mientras tanto, redirigir directo
    alert('✅ ¡Servicio agendado con éxito!');
    window.location.href = 'confirmacion.html';
}

// ============================================================
// MOSTRAR SERVICIO
// ============================================================
function mostrarServicio(servicio, btn) {
    document.querySelectorAll('.servicio-nav-btn').forEach(function(x) { x.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.servicio-panel').forEach(function(x) { x.classList.remove('active'); });
    var panel = document.getElementById('panel-' + servicio);
    if (panel) panel.classList.add('active');
}

console.log('✅ Petfy v2.0 - main.js cargado completamente');