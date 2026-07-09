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
// ==================== SERVICIOS: CARRUSEL 3D + PLANES + FORMULARIO + PAGO ====================

var planesData = [
    { id: 'unico', emoji: '⚡', nombre: 'Paseo Único', tag: 'tag-ahorro', tagText: 'Sin suscripción', precio: 10990, periodo: 'por paseo', diasPermitidos: 1, features: ['45 min', 'GPS en vivo', '5 fotos'] },
    { id: '3dias', emoji: '🌟', nombre: '3 Días/Semana', tag: 'tag-popular', tagText: 'Más Popular', precio: 89990, periodo: '/mes', diasPermitidos: 3, features: ['1h por sesión', 'Paseador fijo', 'Seguro incluido'] },
    { id: '5dias', emoji: '🔥', nombre: '5 Días/Semana', tag: 'tag-premium', tagText: 'Recomendado', precio: 129990, periodo: '/mes', diasPermitidos: 5, features: ['1h por sesión', 'Fotos + video', 'Seguro incluido'] },
    { id: 'full', emoji: '💎', nombre: 'Full 7 Días', tag: 'tag-premium', tagText: 'VIP', precio: 159990, periodo: '/mes', diasPermitidos: 7, features: ['1h por sesión', 'Paseador VIP', 'Parque + socialización'] }
];

var currentIndex = 0;
var planSeleccionado = null;
var mascotaSel = null;

// ========== CARRUSEL ==========
function initCarousel() {
    var track = document.getElementById('carouselTrack3D');
    if (!track) return;
    track.innerHTML = '';
    planesData.forEach(function(p, i) {
        track.innerHTML += crearCard(i);
    });
    actualizarClases();
}

function crearCard(i) {
    var p = planesData[i];
    var feats = '';
    p.features.forEach(function(f) {
        feats += '<li><i class="fas fa-check-circle"></i> ' + f + '</li>';
    });
    return '<div class="plan-card-3d" id="card3d-' + i + '" onclick="if(this.classList.contains(\'center\')) elegirPlan(\'' + p.id + '\')"><div class="plan-emoji">' + p.emoji + '</div><h3>' + p.nombre + '</h3><span class="plan-tag ' + p.tag + '">' + p.tagText + '</span><div class="plan-precio">$' + p.precio.toLocaleString() + '<small>' + p.periodo + '</small></div><ul class="plan-features">' + feats + '</ul><button class="plan-btn-elegir" onclick="elegirPlan(\'' + p.id + '\')">Elegir este Plan →</button></div>';
}

function actualizarClases() {
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
    actualizarClases();
}

// ========== ELEGIR PLAN ==========
function elegirPlan(planId) {
    planSeleccionado = planesData.find(function(p) { return p.id === planId; });
    if (!planSeleccionado) return;
    
    document.getElementById('stickyBar').classList.add('active');
    actualizarSticky();
    
    var acordeon = document.getElementById('acordeonAgendar');
    acordeon.classList.add('active');
    acordeon.innerHTML = generarAcordeon(planSeleccionado);
    acordeon.scrollIntoView({ behavior: 'smooth' });
}

function cerrarAcordeon() {
    document.getElementById('acordeonAgendar').classList.remove('active');
    document.getElementById('stickyBar').classList.remove('active');
    planSeleccionado = null;
}

// ========== GENERAR FORMULARIO ==========
function generarAcordeon(plan) {
    var logueado = localStorage.getItem('petfyLogged') === 'true';
    var u = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    
    var quien = logueado
        ? '<div class="badge-logeado"><i class="fas fa-check-circle"></i> ' + u.nombre + ' (datos cargados)</div>'
        : '<div class="form-row"><div class="form-group"><label>Nombre *</label><input type="text" id="wizNombre" required></div><div class="form-group"><label>Apellido *</label><input type="text" id="wizApellido" required></div></div><div class="form-row"><div class="form-group"><label>Teléfono *</label><input type="tel" id="wizTelefono" required></div><div class="form-group"><label>Email *</label><input type="email" id="wizEmail" required></div></div>';
    
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var h = '';
    mascotas.forEach(function(m, i) {
        h += '<div class="mascota-circle" onclick="selMascota(' + i + ',this)"><span style="font-size:1.5rem">🐕</span><span>' + m.nombre + '</span></div>';
    });
    h += '<div class="mascota-circle add-new" onclick="nuevaMascota()">➕</div>';
    
    // Días de la semana (lógica inteligente)
    var diasHTML = '';
    if (plan.diasPermitidos > 1) {
        var diasSemana = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        var bloqueados = plan.diasPermitidos === 7;
        diasHTML = '<div class="dias-block"><span class="dias-block-label">📆 Días de la semana (máx ' + plan.diasPermitidos + ')</span><div class="dias-checkboxes" id="diasCheckboxes">';
        diasSemana.forEach(function(d) {
            var checked = bloqueados ? ' checked' : '';
            var disabled = bloqueados ? ' disabled' : '';
            diasHTML += '<label class="dia-cb' + (bloqueados ? ' bloqueado' : '') + '"><input type="checkbox" value="' + d + '"' + checked + disabled + ' onchange="validarDias()"> ' + d.charAt(0).toUpperCase() + d.slice(1) + '</label>';
        });
        diasHTML += '</div><p class="aviso-dias" id="avisoDias">Solo puedes seleccionar ' + plan.diasPermitidos + ' días</p></div>';
    }
    
    return '<div class="form-section"><h4><span>👤</span> Datos del Dueño</h4>' + quien + '</div><div class="form-section"><h4><span>🐕</span> Tu Mascota</h4><div class="form-row"><div class="form-group"><label>Nombre *</label><input type="text" id="wizPerroNombre" required></div><div class="form-group"><label>Raza *</label><input type="text" id="wizPerroRaza" required></div></div><div class="form-row-3"><div class="form-group"><label>Edad</label><input type="text" id="wizPerroEdad"></div><div class="form-group"><label>Peso (kg)</label><input type="text" id="wizPerroPeso"></div><div class="form-group"><label>Comportamiento</label><select id="wizPerroComp"><option>Sociable</option><option>Tímido</option></select></div></div><div class="form-row"><div class="form-group"><label>📸 Foto del perro</label><div class="file-upload" onclick="document.getElementById(\'fotoPerro\').click()"><span>🐕</span><p>Click para subir</p><input type="file" id="fotoPerro" accept="image/*" onchange="preview(this,\'prevPerro\')"></div><img id="prevPerro" class="preview-img"></div><div class="form-group"><label>💉 Carné vacunación</label><div class="file-upload" onclick="document.getElementById(\'fotoVacuna\').click()"><span>📋</span><p>Click para subir</p><input type="file" id="fotoVacuna" accept="image/*" onchange="preview(this,\'prevVacuna\')"></div><img id="prevVacuna" class="preview-img"></div></div><div style="display:flex;gap:.75rem;overflow-x:auto;padding:.5rem 0;margin-top:.5rem">' + h + '</div></div><div class="form-section"><h4><span>📅</span> Agenda y Dirección</h4><div class="form-row"><div class="form-group"><label>Dirección *</label><input type="text" id="wizDireccion" required></div><div class="form-group"><label>Torre / Apto</label><input type="text" id="wizTorreApto"></div></div><div class="form-group"><label>Fecha y Hora *</label><input type="datetime-local" class="input-datetime" id="wizFechaHora" required onchange="actualizarSticky()"></div>' + diasHTML + '</div><span class="btn-cerrar-acordeon" onclick="cerrarAcordeon()">← Ver todos los planes</span>';
}

// ========== VALIDACIÓN DE DÍAS ==========
function validarDias() {
    if (!planSeleccionado) return;
    var maxDias = planSeleccionado.diasPermitidos;
    var checkboxes = document.querySelectorAll('#diasCheckboxes input[type="checkbox"]');
    var marcados = document.querySelectorAll('#diasCheckboxes input[type="checkbox"]:checked');
    var aviso = document.getElementById('avisoDias');
    
    if (marcados.length > maxDias) {
        aviso.style.display = 'block';
        aviso.textContent = '⚠️ Solo puedes seleccionar ' + maxDias + ' días para este plan';
        event.target.checked = false;
    } else {
        aviso.style.display = 'none';
    }
    
    checkboxes.forEach(function(cb) {
        var label = cb.closest('.dia-cb');
        if (cb.checked) label.classList.add('marcado');
        else label.classList.remove('marcado');
    });
    actualizarSticky();
}

function selMascota(i, el) {
    mascotaSel = i;
    document.querySelectorAll('.mascota-circle').forEach(function(c) {
        c.style.borderColor = '#F0EBE5';
        c.style.boxShadow = 'none';
    });
    el.style.borderColor = '#E0633F';
    el.style.boxShadow = '0 0 0 3px rgba(224,99,63,0.2)';
}

function nuevaMascota() {
    var n = prompt('Nombre de tu perro:');
    if (!n) return;
    var r = prompt('Raza:') || 'Mestizo';
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    mascotas.push({ nombre: n, raza: r });
    localStorage.setItem('petfyMascotas', JSON.stringify(mascotas));
    elegirPlan(planSeleccionado.id);
}

function preview(input, previewId) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            var img = document.getElementById(previewId);
            img.src = e.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ========== STICKY BAR Y PAGO ==========
function actualizarSticky() {
    if (!planSeleccionado) return;
    document.getElementById('stickyPlan').textContent = planSeleccionado.nombre;
    document.getElementById('stickyPrecio').textContent = '$' + planSeleccionado.precio.toLocaleString();
}

function iniciarPago() {
    if (!planSeleccionado) {
        alert('Selecciona un plan');
        return;
    }
    var u = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    var nombre = u.nombre || document.getElementById('wizNombre')?.value;
    if (!nombre) {
        alert('Completa tus datos');
        return;
    }
    var email = u.email || document.getElementById('wizEmail')?.value || 'cliente@petfy.com';
    var ref = 'PETFY-' + Date.now();
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var perro = mascotaSel !== null && mascotas[mascotaSel] ? mascotas[mascotaSel].nombre : 'Mascota';
    
    var checkout = new WidgetCheckout({
        currency: 'COP',
        amountInCents: planSeleccionado.precio * 100,
        reference: ref,
        publicKey: 'pub_test_xxxxxxxxxxxxx',
        redirectUrl: window.location.origin + '/servicios/confirmacion.html',
        customerData: {
            fullName: nombre,
            email: email
        },
        products: [{
            name: planSeleccionado.nombre + ' - ' + perro,
            price: planSeleccionado.precio * 100,
            quantity: 1
        }]
    });
    
    checkout.open(function(result) {
        if (result.transaction.status === 'APPROVED') {
            alert('✅ Pago exitoso!');
            location.reload();
        } else {
            alert('❌ Pago no aprobado');
        }
    });
}

// ========== MOSTRAR SERVICIO ==========
function mostrarServicio(servicio, btn) {
    document.querySelectorAll('.servicio-nav-btn').forEach(function(x) {
        x.classList.remove('active');
    });
    btn.classList.add('active');
    document.querySelectorAll('.servicio-panel').forEach(function(x) {
        x.classList.remove('active');
    });
    document.getElementById('panel-' + servicio).classList.add('active');
}

// ========== INICIAR CARRUSEL ==========
document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
    setInterval(function() {
        girarCarousel(1);
    }, 5000);
});