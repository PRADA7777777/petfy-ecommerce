// ================================================================
// PETFY - MAIN SCRIPTS v3.0 FINAL (LIMPIO)
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
            if (icon) { icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times'); }
        };
    }
    
    // ========== BREADCRUMB ==========
    generarBreadcrumb();
    
    // ========== BOTÓN CUENTA ==========
    var btn = document.getElementById('btnCuenta');
    if (btn) {
        btn.onclick = function(e) {
            e.preventDefault();
            localStorage.getItem('petfyLogged') === 'true' ? abrirSidebar() : abrirModal();
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
    
    console.log('✅ Petfy v3.0 Limpio inicializado');
});

// ============================================================
// SIDEBAR DEL PERFIL
// ============================================================
function abrirSidebar() {
    var sidebar = document.getElementById('profileSidebar');
    var overlay = document.getElementById('profileOverlay');
    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
    actualizarKPIs();
}

function cerrarSidebar() {
    var sidebar = document.getElementById('profileSidebar');
    var overlay = document.getElementById('profileOverlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function actualizarKPIs() {
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var kpiPaseos = document.getElementById('kpiPaseos');
    var kpiMascotas = document.getElementById('kpiMascotas');
    if (kpiPaseos) kpiPaseos.textContent = paseos.length;
    if (kpiMascotas) kpiMascotas.textContent = mascotas.length;
}

// ============================================================
// MODAL LOGIN/REGISTRO
// ============================================================
function abrirModal() {
    var m = document.getElementById('loginModal');
    if (m) m.classList.add('active');
}

function cerrarModal() {
    var m = document.getElementById('loginModal');
    if (m) m.classList.remove('active');
}

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
    var email = document.getElementById('modalEmail')?.value?.trim();
    var pw = document.getElementById('modalPassword')?.value?.trim();
    if (email && pw && pw.length >= 4) {
        var user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
        user.email = email;
        user.nombre = user.nombre || email.split('@')[0];
        localStorage.setItem('petfyUser', JSON.stringify(user));
        localStorage.setItem('petfyLogged', 'true');
        actualizarUI(user);
        cerrarModal();
    }
    return false;
}

function registroModal(e) {
    e.preventDefault();
    var nombre = document.getElementById('regModalNombre')?.value?.trim();
    var email = document.getElementById('regModalEmail')?.value?.trim();
    var pw = document.getElementById('regModalPassword')?.value?.trim();
    
    if (!nombre || !email || !pw) { alert('⚠️ Completa todos los campos'); return false; }
    if (pw.length < 8) { alert('⚠️ La contraseña debe tener mínimo 8 caracteres'); return false; }
    
    var user = {
        nombre: nombre,
        apellido: '',
        email: email,
        telefono: '',
        tipoDoc: 'CC',
        numDoc: '',
        dirFactura: ''
    };
    localStorage.setItem('petfyUser', JSON.stringify(user));
    localStorage.setItem('petfyLogged', 'true');
    actualizarUI(user);
    cerrarModal();
    mostrarLogin();
    alert('✅ ¡Cuenta creada! Ahora puedes agendar tu primer paseo GRATIS.');
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
    localStorage.removeItem('petfyLogged');
    window.location.href = '../index.html';
}

// ============================================================
// OFERTA BIENVENIDA
// ============================================================
function cerrarOferta() {
    var o = document.getElementById('ofertaModal');
    if (o) o.classList.remove('active');
    localStorage.setItem('ofertaVista', 'true');
}

function reclamarOferta() {
    cerrarOferta();
    abrirModal();
    mostrarRegistro();
}

// ============================================================
// CARRUSEL DE BANNERS (INDEX)
// ============================================================
function iniciarCarruselBanners() {
    var track = document.getElementById('carouselTrack');
    var dots = document.querySelectorAll('#mainCarousel .dot');
    if (!track || !dots.length) return;
    
    var currentIndex = 0;
    var totalSlides = 4;
    var interval;
    
    function go(n) {
        currentIndex = (n + totalSlides) % totalSlides;
        track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
        dots.forEach(function(d, i) { d.classList.toggle('active', i === currentIndex); });
    }
    
    function next() { go(currentIndex + 1); }
    function prev() { go(currentIndex - 1); }
    function start() { stop(); interval = setInterval(next, 5000); }
    function stop() { clearInterval(interval); }
    
    var prevBtn = document.querySelector('#mainCarousel .carousel-prev');
    var nextBtn = document.querySelector('#mainCarousel .carousel-next');
    if (prevBtn) prevBtn.addEventListener('click', function() { prev(); start(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { next(); start(); });
    
    dots.forEach(function(d) {
        d.addEventListener('click', function() {
            go(parseInt(this.getAttribute('data-index')));
            start();
        });
    });
    
    var container = document.getElementById('mainCarousel');
    if (container) {
        container.addEventListener('mouseenter', stop);
        container.addEventListener('mouseleave', start);
    }
    
    go(0);
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
        var name = page.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, function(l) { return l.toUpperCase(); });
        list.innerHTML = '<li class="breadcrumb-item"><a href="' + base + 'index.html" class="breadcrumb-link"><i class="fas fa-home"></i> Inicio</a></li><li class="breadcrumb-separator"><i class="fas fa-chevron-right"></i></li><li class="breadcrumb-item active"><span class="breadcrumb-current"><i class="fas fa-file"></i> ' + name + '</span></li>';
    }
}

// ============================================================
// ESC PARA CERRAR MODALES
// ============================================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        cerrarSidebar();
        cerrarModal();
        cerrarResumen();
    }
});

// ================================================================
// ==================== SISTEMA DE PLANES ====================
// ================================================================

/**
 * CONFIGURACIÓN DE PLANES
 * ID: 001, 002, 003
 * Precios en COP
 */
var planesData = [
    {
        id: '001',
        emoji: '⚡',
        nombre: 'Paseo Único',
        tag: 'tag-ahorro',
        tagText: 'Sin suscripción',
        precio: 19990,
        periodo: 'por paseo',
        diasPermitidos: 1,
        duracion: '1 hora',
        duracionLetra: '55 minutos',
        features: ['1 hora de paseo', 'GPS en vivo', '5 fotos', 'Paseador certificado']
    },
    {
        id: '002',
        emoji: '🌟',
        nombre: '3 Días/Semana',
        tag: 'tag-popular',
        tagText: 'Más Popular',
        precio: 189990,
        periodo: '/mes',
        diasPermitidos: 3,
        duracion: '1 hora',
        duracionLetra: '55 minutos',
        features: ['1h por sesión', 'Paseador fijo', 'GPS en vivo', 'Fotos', 'Seguro incluido']
    },
    {
        id: '003',
        emoji: '🔥',
        nombre: '5 Días/Semana',
        tag: 'tag-premium',
        tagText: 'Recomendado',
        precio: 299990,
        periodo: '/mes',
        diasPermitidos: 5,
        duracion: '1 hora',
        duracionLetra: '55 minutos',
        features: ['1h por sesión', 'Paseador VIP', 'GPS en vivo', 'Fotos + video', 'Seguro incluido']
    }
];

var currentIndex = 0;
var planSeleccionado = null;

// ========== DETECTAR TIPO DE CLIENTE ==========
function detectarTipoCliente() {
    var paseoGratisUsado = localStorage.getItem('petfyPaseoGratisUsado') === 'true';
    return {
        esNuevo: !paseoGratisUsado,
        paseoGratisUsado: paseoGratisUsado,
        puedeTenerPrueba: !paseoGratisUsado
    };
}

// ========== CARRUSEL 3D ==========
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
    return '<div class="plan-card-3d" id="card3d-' + i + '" onclick="if(this.classList.contains(\'center\')) elegirPlan(\'' + p.id + '\')"><div class="plan-emoji">' + p.emoji + '</div><h3>' + p.nombre + '</h3><span class="plan-tag ' + p.tag + '">' + p.tagText + '</span><div class="plan-precio">$' + p.precio.toLocaleString() + '<small>' + p.periodo + '</small></div><ul class="plan-features">' + feats + '</ul><p style="font-size:0.7rem;color:var(--text-muted);">*Duración: ' + p.duracionLetra + '</p><button class="plan-btn-elegir" onclick="elegirPlan(\'' + p.id + '\')">Elegir este Plan →</button></div>';
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
    
    document.getElementById('stickyBar').classList.add('active');
    actualizarSticky();
    
    var acordeon = document.getElementById('acordeonAgendar');
    acordeon.classList.add('active');
    acordeon.innerHTML = generarFormulario(planSeleccionado);
    acordeon.scrollIntoView({ behavior: 'smooth' });
}

function cerrarAcordeon() {
    document.getElementById('acordeonAgendar').classList.remove('active');
    document.getElementById('stickyBar').classList.remove('active');
    document.getElementById('btnPagar').style.display = 'none';
    planSeleccionado = null;
}

// ================================================================
// ==================== FORMULARIO 3 FASES ====================
// ================================================================

function generarFormulario(plan) {
    var cliente = detectarTipoCliente();
    var user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    var logueado = localStorage.getItem('petfyLogged') === 'true';
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var ultimaMascota = mascotas.length > 0 ? mascotas[mascotas.length - 1] : null;
    var ultimaDir = JSON.parse(localStorage.getItem('petfyUltimaDireccion') || '{}');
    var datosPrecargados = (logueado || !cliente.esNuevo);
    
    // ========== FASE 1: CLIENTE ==========
    var fase1 = '' +
    '<div class="form-section" id="fase1-cliente">' +
        '<h4><span>👤</span> Datos del Responsable y Facturación</h4>' +
        '<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem;">Datos del responsable de la mascota y para facturación del servicio</p>' +
        '<div class="form-row">' +
            '<div class="form-group"><label>Nombre *</label><input type="text" id="wizNombre" name="cliente_nombre" placeholder="Nombres" value="' + (datosPrecargados ? user.nombre || '' : '') + '" required></div>' +
            '<div class="form-group"><label>Apellido *</label><input type="text" id="wizApellido" name="cliente_apellido" placeholder="Apellidos" value="' + (datosPrecargados ? user.apellido || '' : '') + '" required></div>' +
        '</div>' +
        '<div class="form-group"><label>Correo Electrónico *</label><input type="email" id="wizEmail" name="cliente_email" placeholder="tu@email.com" value="' + (datosPrecargados ? user.email || '' : '') + '" required></div>' +
        '<div class="form-row">' +
            '<div class="form-group"><label>Tipo de Documento *</label><select id="wizTipoDoc" name="cliente_tipo_documento" required><option value="">Seleccionar</option><option value="CC"' + (datosPrecargados && user.tipoDoc === 'CC' ? ' selected' : '') + '>Cédula de Ciudadanía (CC)</option><option value="CE"' + (datosPrecargados && user.tipoDoc === 'CE' ? ' selected' : '') + '>Cédula de Extranjería (CE)</option><option value="NIT">NIT</option><option value="PP">Pasaporte</option></select></div>' +
            '<div class="form-group"><label>Número de Documento *</label><input type="text" id="wizNumDoc" name="cliente_numero_documento" placeholder="Ej: 1234567890" value="' + (datosPrecargados ? user.numDoc || '' : '') + '" required></div>' +
        '</div>' +
        '<div class="form-group"><label>Dirección de Facturación *</label><input type="text" id="wizDirFactura" name="cliente_direccion_factura" placeholder="Dirección para facturación" value="' + (datosPrecargados ? user.dirFactura || '' : '') + '" required></div>' +
    '</div>';
    
    // ========== FASE 2: MASCOTA ==========
    var fase2 = '' +
    '<div class="form-section" id="fase2-perro">' +
        '<h4><span>🐕</span> Datos de tu Perro</h4>' +
        '<div class="form-row">' +
            '<div class="form-group"><label>Nombre de la Mascota *</label><input type="text" id="wizPerroNombre" name="mascota_nombre" placeholder="Nombre de tu perro" value="' + (ultimaMascota ? ultimaMascota.nombre || '' : '') + '" required></div>' +
            '<div class="form-group"><label>Raza *</label><select id="wizPerroRaza" name="mascota_raza" required><option value="">Seleccionar raza</option>' + generarListaRazas(ultimaMascota ? ultimaMascota.raza : '') + '</select></div>' +
        '</div>' +
        '<div class="form-row-3">' +
            '<div class="form-group"><label>Edad *</label><input type="text" id="wizPerroEdad" name="mascota_edad" placeholder="Ej: 2 años" value="' + (ultimaMascota ? ultimaMascota.edad || '' : '') + '" required></div>' +
            '<div class="form-group"><label>Peso (kg) *</label><input type="text" id="wizPerroPeso" name="mascota_peso" placeholder="Ej: 15" value="' + (ultimaMascota ? ultimaMascota.peso || '' : '') + '" required></div>' +
            '<div class="form-group"><label>Comportamiento *</label><select id="wizPerroComp" name="mascota_comportamiento" required onchange="toggleOtro(\'wizPerroCompOtro\',this.value)"><option value="">Seleccionar</option><option value="sociable"' + (ultimaMascota && ultimaMascota.comportamiento === 'sociable' ? ' selected' : '') + '>Sociable</option><option value="nervioso"' + (ultimaMascota && ultimaMascota.comportamiento === 'nervioso' ? ' selected' : '') + '>Nervioso</option><option value="agresivo"' + (ultimaMascota && ultimaMascota.comportamiento === 'agresivo' ? ' selected' : '') + '>Agresivo</option><option value="otro">Otro</option></select><input type="text" id="wizPerroCompOtro" name="mascota_comportamiento_otro" placeholder="Especificar" style="display:none;margin-top:0.5rem;"></div>' +
        '</div>' +
        '<div class="form-group"><label>Condiciones Médicas</label><select id="wizPerroCondMed" name="mascota_condiciones_medicas" onchange="toggleOtro(\'wizPerroCondMedOtro\',this.value)"><option value="ninguna">No tiene</option><option value="alergias">Alergias</option><option value="cardiaco">Problemas cardíacos</option><option value="otro">Otra</option></select><input type="text" id="wizPerroCondMedOtro" name="mascota_condiciones_medicas_otro" placeholder="Especificar" style="display:none;margin-top:0.5rem;"></div>' +
        '<div class="form-group"><label>Otras Indicaciones</label><textarea id="wizPerroInfo" name="mascota_indicaciones" rows="2" placeholder="Información adicional">' + (ultimaMascota ? ultimaMascota.indicaciones || '' : '') + '</textarea></div>' +
        '<div class="form-row">' +
            '<div class="form-group"><label>📸 Foto del Perro *</label><div class="file-upload" onclick="document.getElementById(\'fotoPerro\').click()"><span>🐕</span><p>Click para subir</p><input type="file" id="fotoPerro" name="mascota_foto" accept="image/*" onchange="preview(this,\'prevPerro\')" required></div><img id="prevPerro" class="preview-img"></div>' +
            '<div class="form-group"><label>💉 Carné Vacunación *</label><div class="file-upload" onclick="document.getElementById(\'fotoVacuna\').click()"><span>📋</span><p>Click para subir</p><input type="file" id="fotoVacuna" name="mascota_vacuna" accept="image/*" onchange="preview(this,\'prevVacuna\')" required></div><img id="prevVacuna" class="preview-img"></div>' +
        '</div>' +
    '</div>';
    
    // ========== FASE 3: AGENDA ==========
    var hoy = new Date();
    var fechaMinima = hoy.toISOString().split('T')[0];
    if (hoy.getDay() === 0) { hoy.setDate(hoy.getDate() + 1); fechaMinima = hoy.toISOString().split('T')[0]; }
    
    var fase3 = '' +
    '<div class="form-section" id="fase3-servicio">' +
        '<h4><span>📅</span> Agenda del Servicio</h4>' +
        '<div class="form-group"><label>📍 Dirección de Recogida *</label></div>' +
        '<div class="form-row">' +
            '<div class="form-group"><label>Ciudad *</label><select id="wizCiudad" name="servicio_ciudad" required><option value="">Seleccionar</option><option value="bogota" selected>Bogotá</option><option value="medellin" disabled>Medellín (Próx.)</option><option value="cali" disabled>Cali (Próx.)</option></select></div>' +
            '<div class="form-group"><label>Localidad *</label><select id="wizLocalidad" name="servicio_localidad" required><option value="">Seleccionar</option>' + generarListaLocalidades() + '</select></div>' +
        '</div>' +
        '<div class="form-row">' +
            '<div class="form-group"><label>Tipo de Vía *</label><select id="wizTipoVia" name="servicio_tipo_via" required><option value="">Seleccionar</option><option value="calle"' + ((ultimaDir.tipoVia || '') === 'calle' ? ' selected' : '') + '>Calle</option><option value="carrera"' + ((ultimaDir.tipoVia || '') === 'carrera' ? ' selected' : '') + '>Carrera</option><option value="diagonal">Diagonal</option><option value="transversal">Transversal</option><option value="avenida">Avenida</option></select></div>' +
            '<div class="form-group"><label>Número *</label><input type="text" id="wizNumVia" name="servicio_numero_via" placeholder="Ej: 155a #7-87" value="' + (ultimaDir.numeroVia || '') + '" required></div>' +
        '</div>' +
        '<div class="form-group"><label>Complemento</label><input type="text" id="wizComplemento" name="servicio_complemento" placeholder="Ej: Edificio Palmetto" value="' + (ultimaDir.complemento || '') + '"></div>' +
        '<div class="form-group"><label>¿Es un conjunto? *</label><select id="wizEsConjunto" name="servicio_es_conjunto" required onchange="toggleConjunto(this.value)"><option value="">Seleccionar</option><option value="si"' + ((ultimaDir.esConjunto || '') === 'si' ? ' selected' : '') + '>Sí</option><option value="no"' + ((ultimaDir.esConjunto || '') === 'no' ? ' selected' : '') + '>No</option></select></div>' +
        '<div id="datosConjunto" style="display:' + ((ultimaDir.esConjunto || '') === 'si' ? 'block' : 'none') + ';">' +
            '<div class="form-row"><div class="form-group"><label>Torre *</label><input type="text" id="wizTorre" name="servicio_torre" value="' + (ultimaDir.torre || '') + '"></div><div class="form-group"><label>Apto *</label><input type="text" id="wizApto" name="servicio_apto" value="' + (ultimaDir.apto || '') + '"></div></div>' +
        '</div>' +
        
        // PASEO DE PRUEBA (SOLO NUEVOS)
        (cliente.puedeTenerPrueba ? '' +
        '<div style="border-top:2px dashed #E8E0D8;margin:1.5rem 0;padding-top:1.5rem;">' +
            '<div style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border:2px solid #059669;padding:1.5rem;border-radius:15px;margin-bottom:1rem;text-align:center;">' +
                '<span style="font-size:2.5rem;">🎁</span>' +
                '<h4 style="font-family:\'Fredoka One\',cursive;color:#059669;">¡Paseo de Prueba GRATIS!</h4>' +
                '<p style="color:#047857;">Visita de conocimiento + paseo (1 hora). Sin costo.</p>' +
            '</div>' +
            '<div class="form-row">' +
                '<div class="form-group"><label>📅 Fecha Paseo de Prueba *</label><input type="date" id="wizFechaPrueba" name="prueba_fecha" min="' + fechaMinima + '" required onchange="validarFechaNoDomingo(this)"></div>' +
                '<div class="form-group"><label>⏰ Hora *</label><select id="wizHoraPrueba" name="prueba_hora" required><option value="">Seleccionar</option>' + generarHorarios() + '</select></div>' +
            '</div>' +
        '</div>' : '') +
        
        // SERVICIO REGULAR
        '<div style="border-top:2px dashed #E8E0D8;margin:1.5rem 0;padding-top:1.5rem;">' +
            '<h4 style="font-family:\'Fredoka One\',cursive;color:var(--primary);margin-bottom:1rem;">📆 Servicio Contratado: ' + plan.nombre + '</h4>' +
            (plan.diasPermitidos === 1 ?
                '<div class="form-row">' +
                    '<div class="form-group"><label>📅 Fecha del Paseo *</label><input type="date" id="wizFechaServicio" name="servicio_fecha" min="' + fechaMinima + '" required onchange="validarFechaNoDomingo(this)"></div>' +
                    '<div class="form-group"><label>⏰ Hora *</label><select id="wizHoraServicio" name="servicio_hora" required><option value="">Seleccionar</option>' + generarHorarios() + '</select></div>' +
                '</div>'
            :
                '<div class="form-row">' +
                    '<div class="form-group"><label>📅 Fecha de Inicio *</label><input type="date" id="wizFechaInicio" name="servicio_fecha_inicio" min="' + fechaMinima + '" required onchange="validarFechaNoDomingo(this)"><small style="color:var(--text-muted);">Primer día del servicio</small></div>' +
                    '<div class="form-group"><label>⏰ Hora *</label><select id="wizHoraServicio" name="servicio_hora" required><option value="">Seleccionar</option>' + generarHorarios() + '</select><small style="color:var(--text-muted);">Misma hora todos los días</small></div>' +
                '</div>' +
                '<div class="form-group"><label>📆 Días (selecciona ' + plan.diasPermitidos + ')</label><div class="dias-checkboxes" id="diasCheckboxes">' +
                ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map(function(d) {
                    return '<label class="dia-cb"><input type="checkbox" name="dias_semana[]" value="' + d + '" onchange="validarDias(event)"> ' + d.charAt(0).toUpperCase() + d.slice(1) + '</label>';
                }).join('') +
                '</div><p style="color:var(--danger);font-size:0.8rem;">No domingos ni festivos.</p><p class="aviso-dias" id="avisoDias">Selecciona ' + plan.diasPermitidos + ' días</p></div>'
            ) +
            '<p style="font-size:0.75rem;color:var(--text-muted);">*Duración del servicio: ' + plan.duracionLetra + '</p>' +
        '</div>' +
        '<div class="form-group"><label>📝 Notas (opcional)</label><textarea id="wizNotasPaseo" name="servicio_notas" rows="2" placeholder="Preferencias, indicaciones..."></textarea></div>' +
    '</div>';
    
    document.getElementById('btnPagar').style.display = 'block';
    
    return fase1 + fase2 + fase3 + '<span class="btn-cerrar-acordeon" onclick="cerrarAcordeon()">← Ver todos los planes</span>';
}

// ============================================================
// LISTAS Y HORARIOS
// ============================================================
function generarListaRazas(seleccionada) {
    var razas = [
        'Affenpinscher', 'Akita', 'Beagle', 'Bichón Frisé', 'Border Collie', 'Boxer',
        'Bulldog Francés', 'Bulldog Inglés', 'Caniche', 'Chihuahua', 'Chow Chow',
        'Cocker Spaniel', 'Criollo (Mestizo)', 'Dálmata', 'Doberman', 'Golden Retriever',
        'Husky Siberiano', 'Labrador Retriever', 'Pastor Alemán', 'Pitbull', 'Pomerania',
        'Pug', 'Rottweiler', 'Schnauzer', 'Shih Tzu', 'Yorkshire Terrier', 'Otra'
    ];
    return razas.map(function(r) {
        var v = r.toLowerCase().replace(/\s+/g, '-');
        return '<option value="' + v + '"' + (seleccionada === v ? ' selected' : '') + '>' + r + '</option>';
    }).join('');
}

function generarListaLocalidades() {
    var locs = [
        { v: 'usaquen', l: 'Usaquén', e: true },
        { v: 'chapinero', l: 'Chapinero', e: false },
        { v: 'suba', l: 'Suba', e: false },
        { v: 'kennedy', l: 'Kennedy', e: false },
        { v: 'fontibon', l: 'Fontibón', e: false },
        { v: 'engativa', l: 'Engativá', e: false },
        { v: 'teusaquillo', l: 'Teusaquillo', e: false }
    ];
    return locs.map(function(l) {
        return '<option value="' + l.v + '"' + (l.e ? '' : ' disabled') + '>' + l.l + (l.e ? '' : ' (Próx.)') + '</option>';
    }).join('');
}

function generarHorarios() {
    var horas = [
        '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ];
    return horas.map(function(h) {
        return '<option value="' + h + '">' + h + '</option>';
    }).join('');
}

// ============================================================
// TOGGLES Y VALIDACIONES
// ============================================================
function toggleOtro(id, valor) {
    var el = document.getElementById(id);
    if (el) {
        el.style.display = valor === 'otro' ? 'block' : 'none';
        if (valor !== 'otro') el.value = '';
    }
}

function toggleConjunto(valor) {
    var d = document.getElementById('datosConjunto');
    var t = document.getElementById('wizTorre');
    var a = document.getElementById('wizApto');
    if (d) d.style.display = valor === 'si' ? 'block' : 'none';
    if (t) t.required = valor === 'si';
    if (a) a.required = valor === 'si';
}

function validarFechaNoDomingo(input) {
    if (!input.value) return;
    var f = new Date(input.value + 'T00:00:00');
    if (f.getDay() === 0) {
        alert('⚠️ No se agendan servicios los domingos.');
        input.value = '';
        return false;
    }
    var festivos = ['2024-01-01', '2024-05-01', '2024-07-20', '2024-08-07', '2024-12-25', '2025-01-01', '2025-05-01'];
    if (festivos.includes(input.value)) {
        alert('⚠️ La fecha es un día festivo.');
        input.value = '';
        return false;
    }
    return true;
}

function validarDias(event) {
    if (!planSeleccionado) return;
    var max = planSeleccionado.diasPermitidos;
    var marcados = document.querySelectorAll('#diasCheckboxes input:checked');
    var aviso = document.getElementById('avisoDias');
    
    if (marcados.length > max) {
        if (aviso) aviso.style.display = 'block';
        if (event && event.target) event.target.checked = false;
    } else {
        if (aviso) aviso.style.display = 'none';
    }
    
    document.querySelectorAll('#diasCheckboxes input').forEach(function(cb) {
        var l = cb.closest('.dia-cb');
        if (l) l.classList.toggle('marcado', cb.checked);
    });
    
    actualizarSticky();
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
    document.getElementById('stickyPlan').textContent = planSeleccionado.nombre;
    document.getElementById('stickyPrecio').textContent = '$' + planSeleccionado.precio.toLocaleString();
}

// ============================================================
// RESUMEN DE CONTRATACIÓN
// ============================================================
function mostrarResumen() {
    if (!planSeleccionado) { alert('⚠️ Selecciona un plan primero'); return; }
    
    var campos = [
        { id: 'wizNombre', msg: 'Nombre' },
        { id: 'wizPerroNombre', msg: 'Nombre de la mascota' },
        { id: 'wizNumVia', msg: 'Dirección' }
    ];
    
    for (var i = 0; i < campos.length; i++) {
        var el = document.getElementById(campos[i].id);
        if (!el || !el.value) { alert('⚠️ Completa: ' + campos[i].msg); return; }
    }
    
    var cliente = detectarTipoCliente();
    var resumen = '' +
    '<div style="background:#FAFAF8;border-radius:15px;padding:1.5rem;">' +
        '<h4 style="font-family:\'Fredoka One\',cursive;color:var(--primary);">🐾 ' + planSeleccionado.nombre + '</h4>' +
        '<p><strong>Mascota:</strong> ' + (document.getElementById('wizPerroNombre')?.value || '') + '</p>' +
        '<p><strong>Duración:</strong> ' + planSeleccionado.duracion + ' (' + planSeleccionado.duracionLetra + ')</p>';
    
    if (cliente.puedeTenerPrueba) {
        resumen += '' +
        '<div style="background:#ECFDF5;padding:1rem;border-radius:10px;margin:1rem 0;">' +
            '<p><strong>🎁 Paseo de Prueba GRATIS</strong></p>' +
            '<p>📅 ' + (document.getElementById('wizFechaPrueba')?.value || '') + ' ⏰ ' + (document.getElementById('wizHoraPrueba')?.value || '') + '</p>' +
            '<p style="color:#059669;">Costo: $0</p>' +
        '</div>';
    }
    
    var fechaServ = planSeleccionado.diasPermitidos === 1 ?
        document.getElementById('wizFechaServicio')?.value :
        document.getElementById('wizFechaInicio')?.value;
    var horaServ = document.getElementById('wizHoraServicio')?.value;
    
    resumen += '' +
        '<p><strong>📅 Fecha inicio:</strong> ' + (fechaServ || '') + '</p>' +
        '<p><strong>⏰ Hora:</strong> ' + (horaServ || '') + '</p>';
    
    if (planSeleccionado.diasPermitidos > 1) {
        var diasMarcados = document.querySelectorAll('#diasCheckboxes input:checked');
        var diasArr = [];
        diasMarcados.forEach(function(cb) { diasArr.push(cb.value.charAt(0).toUpperCase() + cb.value.slice(1)); });
        resumen += '<p><strong>📆 Días:</strong> ' + (diasArr.length > 0 ? diasArr.join(', ') : 'No seleccionados') + '</p>';
        
        var fechaInicio = new Date(document.getElementById('wizFechaInicio')?.value + 'T00:00:00');
        var proximoPago = new Date(fechaInicio);
        proximoPago.setMonth(proximoPago.getMonth() + 1);
        resumen += '<p><strong>💰 Próximo pago:</strong> ' + proximoPago.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) + '</p>';
    }
    
    resumen += '' +
        '<div style="background:var(--primary-light);padding:1rem;border-radius:10px;margin-top:1rem;text-align:center;">' +
            '<p style="font-size:1.5rem;font-family:\'Fredoka One\',cursive;color:var(--primary);">Total: $' + planSeleccionado.precio.toLocaleString() + '</p>' +
            '<p style="font-size:0.8rem;">' + planSeleccionado.periodo + '</p>' +
        '</div>' +
    '</div>';
    
    document.getElementById('resumenContenido').innerHTML = resumen;
    document.getElementById('resumenModal').classList.add('active');
}

function cerrarResumen() {
    document.getElementById('resumenModal').classList.remove('active');
}

// ============================================================
// PAGO Y ENVÍO A BACKEND
// ============================================================
function iniciarPago() {
    cerrarResumen();
    
    if (!planSeleccionado) { alert('⚠️ Selecciona un plan'); return; }
    
    var cliente = detectarTipoCliente();
    var nombre = document.getElementById('wizNombre')?.value;
    var apellido = document.getElementById('wizApellido')?.value || '';
    var email = document.getElementById('wizEmail')?.value;
    var perro = document.getElementById('wizPerroNombre')?.value;
    
    if (!nombre || !email || !perro) { alert('⚠️ Completa todos los campos requeridos'); return; }
    
    if (cliente.puedeTenerPrueba) {
        if (!document.getElementById('wizFechaPrueba')?.value || !document.getElementById('wizHoraPrueba')?.value) {
            alert('⚠️ Completa fecha y hora del paseo de prueba'); return;
        }
    }
    
    var fechaServ = planSeleccionado.diasPermitidos === 1 ?
        document.getElementById('wizFechaServicio')?.value :
        document.getElementById('wizFechaInicio')?.value;
    var horaServ = document.getElementById('wizHoraServicio')?.value;
    
    if (!fechaServ || !horaServ) { alert('⚠️ Completa fecha y hora del servicio'); return; }
    
    if (planSeleccionado.diasPermitidos > 1) {
        var diasMarcados = document.querySelectorAll('#diasCheckboxes input:checked');
        if (diasMarcados.length !== planSeleccionado.diasPermitidos) {
            alert('⚠️ Selecciona ' + planSeleccionado.diasPermitidos + ' días'); return;
        }
    }
    
    var tipoVia = document.getElementById('wizTipoVia')?.value || '';
    var numVia = document.getElementById('wizNumVia')?.value || '';
    var complemento = document.getElementById('wizComplemento')?.value || '';
    var esConjunto = document.getElementById('wizEsConjunto')?.value || 'no';
    var torre = document.getElementById('wizTorre')?.value || '';
    var apto = document.getElementById('wizApto')?.value || '';
    var dirCompleta = tipoVia + ' ' + numVia +
        (complemento ? ', ' + complemento : '') +
        (esConjunto === 'si' && torre ? ' - ' + torre : '') +
        (esConjunto === 'si' && apto ? ' - ' + apto : '');
    
    var fechaInicioObj = new Date(fechaServ + 'T00:00:00');
    var proximoPago = new Date(fechaInicioObj);
    proximoPago.setMonth(proximoPago.getMonth() + 1);
    
    var ref = 'PETFY-' + Date.now();
    
    var datosBackend = {
        referencia: ref,
        plan_id: planSeleccionado.id,
        plan_nombre: planSeleccionado.nombre,
        plan_precio: planSeleccionado.precio,
        cliente_nombre: nombre,
        cliente_apellido: apellido,
        cliente_email: email,
        cliente_tipo_documento: document.getElementById('wizTipoDoc')?.value,
        cliente_numero_documento: document.getElementById('wizNumDoc')?.value,
        cliente_direccion_factura: document.getElementById('wizDirFactura')?.value,
        mascota_nombre: perro,
        mascota_raza: document.getElementById('wizPerroRaza')?.value,
        mascota_edad: document.getElementById('wizPerroEdad')?.value,
        mascota_peso: document.getElementById('wizPerroPeso')?.value,
        mascota_comportamiento: document.getElementById('wizPerroComp')?.value,
        mascota_condiciones_medicas: document.getElementById('wizPerroCondMed')?.value,
        mascota_indicaciones: document.getElementById('wizPerroInfo')?.value || '',
        paseo_prueba: cliente.puedeTenerPrueba ? {
            fecha: document.getElementById('wizFechaPrueba')?.value,
            hora: document.getElementById('wizHoraPrueba')?.value,
            costo: 0,
            tipo: 'visita_conocimiento'
        } : null,
        servicio_fecha_inicio: fechaServ,
        servicio_hora: horaServ,
        servicio_dias_semana: planSeleccionado.diasPermitidos > 1 ?
            Array.from(document.querySelectorAll('#diasCheckboxes input:checked')).map(function(cb) { return cb.value; }) : [],
        servicio_direccion: dirCompleta,
        servicio_notas: document.getElementById('wizNotasPaseo')?.value || '',
        facturacion: {
            precio_original: planSeleccionado.precio,
            precio_final: planSeleccionado.precio,
            fecha_primer_pago: new Date().toISOString().split('T')[0],
            fecha_proximo_pago: planSeleccionado.diasPermitidos > 1 ? proximoPago.toISOString().split('T')[0] : null,
            frecuencia: planSeleccionado.diasPermitidos > 1 ? 'mensual' : 'unica'
        }
    };
    
    // Guardar historial
    var historial = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    historial.push({
        referencia: ref,
        plan: planSeleccionado.nombre,
        fecha: fechaServ,
        precio: planSeleccionado.precio,
        fecha_agendamiento: new Date().toISOString()
    });
    localStorage.setItem('petfyHistorialPaseos', JSON.stringify(historial));
    
    // Marcar paseo gratis usado
    if (cliente.puedeTenerPrueba) {
        localStorage.setItem('petfyPaseoGratisUsado', 'true');
    }
    
    // Guardar para confirmación
    localStorage.setItem('petfyUltimoPedido', JSON.stringify(datosBackend));
    
    // Guardar dirección para futuros servicios
    localStorage.setItem('petfyUltimaDireccion', JSON.stringify({
        ciudad: document.getElementById('wizCiudad')?.value,
        localidad: document.getElementById('wizLocalidad')?.value,
        tipoVia: tipoVia,
        numeroVia: numVia,
        complemento: complemento,
        esConjunto: esConjunto,
        torre: torre,
        apto: apto
    }));
    
    console.log('📦 Datos para backend:', datosBackend);
    
    // ========== CONECTAR A BACKEND AQUÍ ==========
    /*
    fetch('https://tu-api.com/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosBackend)
    })
    .then(r => r.json())
    .then(data => window.location.href = 'confirmacion.html')
    .catch(err => alert('❌ Error'));
    */
    
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

console.log('✅ Petfy v3.0 Limpio - Cargado completamente');