// ==================== PETFY - MAIN SCRIPTS ====================

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
    
    console.log('✅ Petfy inicializado');
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
// CARRUSEL DE BANNERS (INDEX) - CORREGIDO
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
    
    function nextSlide() {
        goToSlide(currentIndex + 1);
    }
    
    function prevSlide() {
        goToSlide(currentIndex - 1);
    }
    
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
    
    // Iniciar
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

// ============================================================
// ==================== SERVICIOS: CARRUSEL 3D ====================
// ============================================================

var planesData = [
    { id: 'unico', emoji: '⚡', nombre: 'Paseo Único', tag: 'tag-ahorro', tagText: 'Sin suscripción', precio: 10990, periodo: 'por paseo', diasPermitidos: 1, features: ['45 min', 'GPS en vivo', '5 fotos'] },
    { id: '3dias', emoji: '🌟', nombre: '3 Días/Semana', tag: 'tag-popular', tagText: 'Más Popular', precio: 89990, periodo: '/mes', diasPermitidos: 3, features: ['1h por sesión', 'Paseador fijo', 'Seguro incluido'] },
    { id: '5dias', emoji: '🔥', nombre: '5 Días/Semana', tag: 'tag-premium', tagText: 'Recomendado', precio: 129990, periodo: '/mes', diasPermitidos: 5, features: ['1h por sesión', 'Fotos + video', 'Seguro incluido'] },
    { id: 'full', emoji: '💎', nombre: 'Full 7 Días', tag: 'tag-premium', tagText: 'VIP', precio: 159990, periodo: '/mes', diasPermitidos: 7, features: ['1h por sesión', 'Paseador VIP', 'Parque + socialización'] }
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
    
    // Auto-giro cada 5 segundos
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
        acordeon.innerHTML = generarAcordeon(planSeleccionado);
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
    
    // Días de la semana
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

// ========== STICKY BAR ==========
function actualizarSticky() {
    if (!planSeleccionado) return;
    var planEl = document.getElementById('stickyPlan');
    var precioEl = document.getElementById('stickyPrecio');
    if (planEl) planEl.textContent = planSeleccionado.nombre;
    if (precioEl) precioEl.textContent = '$' + planSeleccionado.precio.toLocaleString();
}

// ========== INICIAR PAGO Y REDIRIGIR A CONFIRMACIÓN ==========
function iniciarPago() {
    if (!planSeleccionado) {
        alert('⚠️ Selecciona un plan primero');
        return;
    }
    
    var u = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    var nombre = u.nombre || document.getElementById('wizNombre')?.value;
    var apellido = document.getElementById('wizApellido')?.value || '';
    var telefono = document.getElementById('wizTelefono')?.value || '';
    var email = u.email || document.getElementById('wizEmail')?.value || 'cliente@petfy.com';
    
    if (!nombre) {
        alert('⚠️ Completa tus datos personales');
        return;
    }
    
    var perroNombre = document.getElementById('wizPerroNombre')?.value;
    if (!perroNombre) {
        alert('⚠️ Ingresa el nombre de tu mascota');
        return;
    }
    
    var fechaHora = document.getElementById('wizFechaHora')?.value;
    if (!fechaHora) {
        alert('⚠️ Selecciona una fecha y hora');
        return;
    }
    
    var direccion = document.getElementById('wizDireccion')?.value;
    if (!direccion) {
        alert('⚠️ Ingresa la dirección del servicio');
        return;
    }
    
    if (planSeleccionado.diasPermitidos > 1) {
        var diasMarcados = document.querySelectorAll('#diasCheckboxes input[type="checkbox"]:checked');
        if (diasMarcados.length === 0) {
            alert('⚠️ Selecciona al menos un día de la semana');
            return;
        }
        if (diasMarcados.length > planSeleccionado.diasPermitidos) {
            alert('⚠️ Solo puedes seleccionar ' + planSeleccionado.diasPermitidos + ' días');
            return;
        }
    }
    
    var nombreCompleto = nombre + (apellido ? ' ' + apellido : '');
    var ref = 'PETFY-' + Date.now();
    var torreApto = document.getElementById('wizTorreApto')?.value || '';
    var direccionCompleta = direccion + (torreApto ? ' - ' + torreApto : '');
    
    var fechaObj = new Date(fechaHora);
    var opcionesFecha = { year: 'numeric', month: 'long', day: 'numeric' };
    var opcionesHora = { hour: '2-digit', minute: '2-digit' };
    var fechaFormateada = fechaObj.toLocaleDateString('es-CO', opcionesFecha);
    var horaFormateada = fechaObj.toLocaleTimeString('es-CO', opcionesHora);
    
    var diasSeleccionados = [];
    if (planSeleccionado.diasPermitidos > 1) {
        var diasMarcados = document.querySelectorAll('#diasCheckboxes input[type="checkbox"]:checked');
        diasMarcados.forEach(function(cb) {
            diasSeleccionados.push(cb.value.charAt(0).toUpperCase() + cb.value.slice(1));
        });
    }
    
    var pedido = {
        referencia: ref,
        plan: planSeleccionado.nombre,
        mascota: perroNombre,
        fecha: fechaFormateada,
        hora: horaFormateada,
        fechaCompleta: fechaHora,
        direccion: direccionCompleta,
        dias: diasSeleccionados.length > 0 ? diasSeleccionados.join(', ') : 'Único',
        cliente: nombreCompleto,
        email: email,
        telefono: telefono,
        precio: planSeleccionado.precio
    };
    
    localStorage.setItem('petfyUltimoPedido', JSON.stringify(pedido));
    
    if (typeof WidgetCheckout !== 'undefined') {
        var checkout = new WidgetCheckout({
            currency: 'COP',
            amountInCents: planSeleccionado.precio * 100,
            reference: ref,
            publicKey: 'pub_test_xxxxxxxxxxxxx',
            redirectUrl: window.location.origin + '/servicios/confirmacion.html',
            customerData: {
                fullName: nombreCompleto,
                email: email
            },
            products: [{
                name: planSeleccionado.nombre + ' - ' + perroNombre,
                price: planSeleccionado.precio * 100,
                quantity: 1
            }]
        });
        
        checkout.open(function(result) {
            if (result.transaction && result.transaction.status === 'APPROVED') {
                window.location.href = 'confirmacion.html';
            } else {
                alert('❌ Pago no aprobado. Intenta de nuevo.');
            }
        });
    } else {
        alert('✅ ¡Servicio agendado con éxito!');
        window.location.href = 'confirmacion.html';
    }
}

// ========== MOSTRAR SERVICIO ==========
function mostrarServicio(servicio, btn) {
    document.querySelectorAll('.servicio-nav-btn').forEach(function(x) {
        x.classList.remove('active');
    });
    if (btn) btn.classList.add('active');
    
    document.querySelectorAll('.servicio-panel').forEach(function(x) {
        x.classList.remove('active');
    });
    
    var panel = document.getElementById('panel-' + servicio);
    if (panel) panel.classList.add('active');
}

console.log('✅ main.js cargado completamente');