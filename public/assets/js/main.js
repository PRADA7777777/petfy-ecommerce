// ================================================================
// PETFY - MAIN SCRIPTS v3.0 FINAL (LIMPIO)
// ================================================================

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== HEADER STICKY ==========
    window.addEventListener('scroll', function() {
        var h = document.getElementById('mainHeader');
        if (h) h.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    // ========== MENÚ MÓVIL (CORREGIDO) ==========
    var mb = document.querySelector('.mobile-menu-btn');
    var nl = document.querySelector('.nav-links');
    if (mb && nl) {
        mb.onclick = function() {
            nl.classList.toggle('open'); // <--- CAMBIADO DE 'active' A 'open'
            var icon = this.querySelector('i');
            if (icon) { icon.classList.toggle('fa-bars'); icon.classList.toggle('fa-times'); }
        };
    }
    
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
    setTimeout(function() {
        var track = document.getElementById('carouselTrack3D');
        if (!track) {
            console.warn('❌ No se encontró #carouselTrack3D');
            return;
        }
        console.log('✅ Construyendo carrusel 3D');
        track.innerHTML = '';
        planesData.forEach(function(p, i) {
            track.innerHTML += crearCard3D(i);
        });
        actualizarClases3D();
    }, 100);
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
// ============================================================
// CARGAR PLANES EN EL INDEX
// ============================================================
function cargarPlanesIndex() {
    var grid = document.getElementById('planesGrid');
    if (!grid) return;
    
    var planesIndex = [
        { icono: '⚡', nombre: 'Paseo Único', precio: '19.990', periodo: '/paseo', duracion: '55 minutos', destacado: false, features: ['1 hora de paseo', 'GPS en vivo', '5 fotos', 'Sin suscripción', 'Paseador certificado'] },
        { icono: '🌟', nombre: '3 Días/Semana', precio: '189.990', periodo: '/mes', duracion: '55 minutos', destacado: true, features: ['1 hora por sesión', 'Paseador fijo', 'GPS en vivo', 'Fotos', 'Seguro incluido'] },
        { icono: '🔥', nombre: '5 Días/Semana', precio: '299.990', periodo: '/mes', duracion: '55 minutos', destacado: false, features: ['1 hora por sesión', 'Paseador VIP', 'GPS en vivo', 'Fotos + video', 'Seguro incluido'] }
    ];
    
    var html = '';
    planesIndex.forEach(function(p) {
        var feats = '';
        p.features.forEach(function(f) {
            feats += '<li><i class="fas fa-check-circle"></i> ' + f + '</li>';
        });
        
        html += '' +
        '<div class="plan-card' + (p.destacado ? ' destacado' : '') + '">' +
            (p.destacado ? '<div class="plan-badge">MÁS POPULAR</div>' : '') +
            '<div class="plan-icono">' + p.icono + '</div>' +
            '<h3 class="plan-nombre">' + p.nombre + '</h3>' +
            '<div class="plan-precio">$' + p.precio + '<small>' + p.periodo + '</small></div>' +
            '<p class="plan-duracion">*Duración: ' + p.duracion + '</p>' +
            '<ul class="plan-features">' + feats + '</ul>' +
            '<a href="servicios/" class="plan-btn' + (p.destacado ? '' : ' outline') + '">Elegir Plan <i class="fas fa-arrow-right"></i></a>' +
        '</div>';
    });
    
    grid.innerHTML = html;
}

// Agregar al DOMContentLoaded:
document.addEventListener('DOMContentLoaded', function() {
    cargarPlanesIndex();
});
// ============================================================
// PERFIL DE USUARIO
// ============================================================

function cargarPerfil() {
    var user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    document.getElementById('perfilNombre').textContent = user.nombre || 'Usuario';
    
    document.getElementById('editNombre').value = user.nombre || '';
    document.getElementById('editApellido').value = user.apellido || '';
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('editTipoDoc').value = user.tipoDoc || 'CC';
    document.getElementById('editNumDoc').value = user.numDoc || '';
    document.getElementById('editTelefono').value = user.telefono || '';
    document.getElementById('editDirFactura').value = user.dirFactura || '';
    
    cargarKPIs();
    cargarDireccion();
    cargarPaseosActivos();
    cargarHistorialPaseos();
    cargarMascotas();
    cargarFacturacion();
    generarHorarios();
}

// ========== KPIs ==========
function cargarKPIs() {
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var activos = paseos.filter(function(p) { return p.estado === 'activo'; });
    
    document.getElementById('kpiPaseosActivos').textContent = activos.length;
    document.getElementById('kpiMascotas').textContent = mascotas.length;
    document.getElementById('kpiPlanActivo').textContent = activos.length > 0 ? activos[0].plan : '-';
    document.getElementById('kpiProximoPago').textContent = activos.length > 0 && activos[0].proximoPago ? activos[0].proximoPago : '-';
}

// ========== TABS ==========
function mostrarTabPerfil(tab, btn) {
    document.querySelectorAll('.perfil-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.perfil-tab-content').forEach(function(c) { c.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

// ========== DATOS PERSONALES ==========
function guardarDatos(e) {
    e.preventDefault();
    var user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    user.nombre = document.getElementById('editNombre').value;
    user.apellido = document.getElementById('editApellido').value;
    user.tipoDoc = document.getElementById('editTipoDoc').value;
    user.numDoc = document.getElementById('editNumDoc').value;
    user.telefono = document.getElementById('editTelefono').value;
    user.dirFactura = document.getElementById('editDirFactura').value;
    localStorage.setItem('petfyUser', JSON.stringify(user));
    cargarPerfil();
    alert('✅ Datos guardados');
    return false;
}

// ========== DIRECCIÓN ==========
function cargarDireccion() {
    var dir = JSON.parse(localStorage.getItem('petfyDireccionServicio') || JSON.parse(localStorage.getItem('petfyUltimaDireccion') || '{}'));
    document.getElementById('editCiudad').value = dir.ciudad || 'Bogotá';
    document.getElementById('editLocalidad').value = dir.localidad || 'Usaquén';
    document.getElementById('editTipoVia').value = dir.tipoVia || 'calle';
    document.getElementById('editNumVia').value = dir.numeroVia || '';
    document.getElementById('editComplemento').value = dir.complemento || '';
    document.getElementById('editEsConjunto').value = dir.esConjunto || 'no';
    document.getElementById('editTorre').value = dir.torre || '';
    document.getElementById('editApto').value = dir.apto || '';
    toggleConjuntoPerfil();
}

function guardarDireccion(e) {
    e.preventDefault();
    var dir = {
        ciudad: 'Bogotá', localidad: 'Usaquén',
        tipoVia: document.getElementById('editTipoVia').value,
        numeroVia: document.getElementById('editNumVia').value,
        complemento: document.getElementById('editComplemento').value,
        esConjunto: document.getElementById('editEsConjunto').value,
        torre: document.getElementById('editTorre').value,
        apto: document.getElementById('editApto').value
    };
    localStorage.setItem('petfyDireccionServicio', JSON.stringify(dir));
    localStorage.setItem('petfyUltimaDireccion', JSON.stringify(dir));
    alert('✅ Dirección guardada');
    return false;
}

function toggleConjuntoPerfil() {
    var es = document.getElementById('editEsConjunto').value;
    document.getElementById('datosConjuntoPerfil').style.display = es === 'si' ? 'block' : 'none';
}

// ========== PASEOS ACTIVOS ==========
function cargarPaseosActivos() {
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activos = paseos.filter(function(p) { return p.estado === 'activo'; });
    var html = '';
    
    if (activos.length === 0) {
        html = '<div class="perfil-empty"><i class="fas fa-calendar"></i><p>No tienes paseos activos</p></div>';
    } else {
        activos.forEach(function(p) {
            var dias = p.dias && p.dias.length > 0 ? p.dias.map(function(d) { return d.charAt(0).toUpperCase() + d.slice(1); }).join(', ') : '';
            html += '<div class="paseo-card">' +
                '<div class="paseo-card-header"><span class="paseo-card-plan">' + (p.plan || '') + '</span><span class="paseo-card-status status-activo">Activo</span></div>' +
                '<div class="paseo-card-body"><div><i class="fas fa-dog"></i> ' + (p.mascota || '') + '</div><div><i class="fas fa-calendar"></i> ' + (p.fecha || '') + '</div><div><i class="fas fa-clock"></i> ' + (p.hora || '') + '</div>' + (dias ? '<div><i class="fas fa-calendar-week"></i> ' + dias + '</div>' : '') + '<div><i class="fas fa-map-marker-alt"></i> ' + (p.direccion || '') + '</div></div>' +
                '<div class="paseo-card-footer"><span class="paseo-card-precio">$' + (p.precio || 0).toLocaleString() + '</span><div class="paseo-card-acciones"><a href="https://wa.me/573204829244" target="_blank" class="btn-paseo btn-contactar"><i class="fab fa-whatsapp"></i></a><button class="btn-paseo btn-cancelar" onclick="cancelarPaseo(\'' + p.referencia + '\')"><i class="fas fa-times"></i></button></div></div></div>';
        });
    }
    document.getElementById('listaPaseosActivos').innerHTML = html;
}

function cancelarPaseo(ref) {
    if (!confirm('¿Cancelar este paseo?')) return;
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var idx = paseos.findIndex(function(p) { return p.referencia === ref; });
    if (idx >= 0) { paseos[idx].estado = 'cancelado'; localStorage.setItem('petfyHistorialPaseos', JSON.stringify(paseos)); cargarPerfil(); }
}

// ========== HISTORIAL ==========
function cargarHistorialPaseos() {
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var historial = paseos.filter(function(p) { return p.estado !== 'activo'; });
    var html = '';
    if (historial.length === 0) {
        html = '<div class="perfil-empty"><i class="fas fa-history"></i><p>Sin historial</p></div>';
    } else {
        historial.reverse().forEach(function(p) {
            html += '<div class="historial-row"><span>' + (p.plan || '') + '</span><span>' + (p.fecha || '') + '</span><span>$' + (p.precio || 0).toLocaleString() + '</span><span class="status-' + (p.estado || 'completado') + '">' + (p.estado || '') + '</span></div>';
        });
    }
    document.getElementById('listaHistorialPaseos').innerHTML = html;
}

// ========== MASCOTAS ==========
function cargarMascotas() {
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var html = '';
    if (mascotas.length === 0) {
        html = '<div class="perfil-empty"><i class="fas fa-paw"></i><p>No tienes mascotas</p></div>';
    } else {
        mascotas.forEach(function(m, i) {
            html += '<div class="mascota-card"><div class="mascota-card-avatar">🐕</div><div class="mascota-card-info"><strong>' + m.nombre + '</strong><p>' + (m.raza || '') + '</p></div><div class="mascota-card-actions"><button class="btn-icon btn-edit" onclick="editarMascota(' + i + ')"><i class="fas fa-pen"></i></button><button class="btn-icon btn-delete" onclick="eliminarMascota(' + i + ')"><i class="fas fa-trash"></i></button></div></div>';
        });
    }
    document.getElementById('listaMascotas').innerHTML = html;
}

function mostrarFormMascota() {
    document.getElementById('formMascota').style.display = 'block';
    document.getElementById('formMascotaTitulo').textContent = 'Nueva Mascota';
    document.getElementById('mascotaIndex').value = '-1';
    document.getElementById('mascotaNombre').value = '';
    document.getElementById('mascotaRaza').value = '';
    document.getElementById('mascotaEdad').value = '';
    document.getElementById('mascotaPeso').value = '';
}

function editarMascota(i) {
    var m = JSON.parse(localStorage.getItem('petfyMascotas') || '[]')[i];
    document.getElementById('formMascota').style.display = 'block';
    document.getElementById('formMascotaTitulo').textContent = 'Editar Mascota';
    document.getElementById('mascotaIndex').value = i;
    document.getElementById('mascotaNombre').value = m.nombre;
    document.getElementById('mascotaRaza').value = m.raza;
    document.getElementById('mascotaEdad').value = m.edad || '';
    document.getElementById('mascotaPeso').value = m.peso || '';
}

function guardarMascota() {
    var i = parseInt(document.getElementById('mascotaIndex').value);
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var m = {
        nombre: document.getElementById('mascotaNombre').value,
        raza: document.getElementById('mascotaRaza').value,
        edad: document.getElementById('mascotaEdad').value,
        peso: document.getElementById('mascotaPeso').value,
        comportamiento: document.getElementById('mascotaComportamiento').value
    };
    if (!m.nombre || !m.raza) { alert('⚠️ Nombre y raza son obligatorios'); return; }
    if (i >= 0) { mascotas[i] = m; } else { mascotas.push(m); }
    localStorage.setItem('petfyMascotas', JSON.stringify(mascotas));
    document.getElementById('formMascota').style.display = 'none';
    cargarMascotas();
    cargarKPIs();
}

function cancelarFormMascota() { document.getElementById('formMascota').style.display = 'none'; }

function eliminarMascota(i) {
    if (!confirm('¿Eliminar esta mascota?')) return;
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    mascotas.splice(i, 1);
    localStorage.setItem('petfyMascotas', JSON.stringify(mascotas));
    cargarMascotas();
    cargarKPIs();
}

// ========== FACTURACIÓN ==========
function cargarFacturacion() {
    var pagos = JSON.parse(localStorage.getItem('petfyHistorialPagos') || '[]');
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activo = paseos.filter(function(p) { return p.estado === 'activo'; })[0];
    
    var html = '';
    if (activo) {
        html = '<div class="factura-card"><div><strong>' + activo.plan + '</strong></div><div>$' + (activo.precio || 0).toLocaleString() + '/mes</div><div>Inicio: ' + (activo.fecha || '') + '</div><div>Próximo pago: ' + (activo.proximoPago || 'Pendiente') + '</div><button class="btn-perfil btn-primary" onclick="abrirModalPagoProximo()" style="margin-top:0.5rem;">💳 Pagar Próximo Mes</button></div>';
    } else {
        html = '<div class="perfil-empty"><i class="fas fa-credit-card"></i><p>No tienes un plan activo</p></div>';
    }
    document.getElementById('resumenPlanActivo').innerHTML = html;
    
    var htmlPagos = '';
    if (pagos.length === 0) {
        htmlPagos = '<div class="perfil-empty"><i class="fas fa-receipt"></i><p>Sin historial de pagos</p></div>';
    } else {
        pagos.reverse().forEach(function(p) {
            htmlPagos += '<div class="historial-row"><span>' + (p.fecha || '') + '</span><span>$' + (p.monto || 0).toLocaleString() + '</span><span>' + (p.referencia || '') + '</span><span class="status-completado">✅ Pagado</span></div>';
        });
    }
    document.getElementById('listaHistorialPagos').innerHTML = htmlPagos;
}

// ========== MODAL PAGO PRÓXIMO MES ==========
function abrirModalPagoProximo() {
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activo = paseos.filter(function(p) { return p.estado === 'activo'; })[0];
    if (!activo) { alert('No tienes un plan activo'); return; }
    
    document.getElementById('detallePagoProximo').innerHTML = '<p><strong>Plan:</strong> ' + activo.plan + '</p><p><strong>Mascota:</strong> ' + (activo.mascota || '') + '</p><p><strong>Período:</strong> ' + (activo.proximoPago || 'Próximo mes') + '</p>';
    document.getElementById('totalPagoProximo').textContent = '$' + (activo.precio || 0).toLocaleString();
    document.getElementById('modalPagoProximo').classList.add('active');
}

function cerrarModalPagoProximo() { document.getElementById('modalPagoProximo').classList.remove('active'); }

function confirmarPagoProximo() {
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activo = paseos.filter(function(p) { return p.estado === 'activo'; })[0];
    if (!activo) return;
    
    var pagos = JSON.parse(localStorage.getItem('petfyHistorialPagos') || '[]');
    pagos.push({ referencia: 'PAGO-' + Date.now(), servicio_ref: activo.referencia, fecha: new Date().toISOString().split('T')[0], monto: activo.precio, estado: 'pagado' });
    localStorage.setItem('petfyHistorialPagos', JSON.stringify(pagos));
    
    var idx = paseos.findIndex(function(p) { return p.referencia === activo.referencia; });
    if (idx >= 0) {
        var fecha = new Date(); fecha.setMonth(fecha.getMonth() + 1);
        paseos[idx].proximoPago = fecha.toLocaleDateString('es-CO', {year:'numeric',month:'long',day:'numeric'});
        localStorage.setItem('petfyHistorialPaseos', JSON.stringify(paseos));
    }
    cerrarModalPagoProximo();
    cargarPerfil();
    alert('✅ Pago realizado con éxito');
}

// ========== MODAL PASEO ADICIONAL ==========
function generarHorarios() {
    var select = document.getElementById('paseoAdicionalHora');
    if (!select) return;
    var horas = ['07:00 AM','08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM','06:00 PM'];
    select.innerHTML = '<option value="">Seleccionar hora</option>' + horas.map(function(h) { return '<option value="'+h+'">'+h+'</option>'; }).join('');
}

function abrirModalPaseoAdicional() {
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    document.getElementById('paseoAdicionalMascota').innerHTML = '<option value="">Seleccionar mascota</option>' + mascotas.map(function(m) { return '<option value="'+m.nombre+'">'+m.nombre+'</option>'; }).join('');
    
    var dir = JSON.parse(localStorage.getItem('petfyDireccionServicio') || '{}');
    document.getElementById('paseoAdicionalDireccion').value = (dir.tipoVia||'') + ' ' + (dir.numeroVia||'') + (dir.complemento ? ', ' + dir.complemento : '') || 'No configurada';
    
    var hoy = new Date(); hoy.setDate(hoy.getDate() + 1);
    document.getElementById('paseoAdicionalFecha').min = hoy.toISOString().split('T')[0];
    document.getElementById('modalPaseoAdicional').classList.add('active');
}

function cerrarModalPaseoAdicional() { document.getElementById('modalPaseoAdicional').classList.remove('active'); }

function confirmarPaseoAdicional() {
    var mascota = document.getElementById('paseoAdicionalMascota').value;
    var fecha = document.getElementById('paseoAdicionalFecha').value;
    var hora = document.getElementById('paseoAdicionalHora').value;
    if (!mascota || !fecha || !hora) { alert('⚠️ Completa todos los campos'); return; }
    
    var f = new Date(fecha + 'T00:00:00');
    if (f.getDay() === 0) { alert('⚠️ No se agendan servicios los domingos'); return; }
    
    var ref = 'PETFY-AD-' + Date.now();
    var paseos = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    paseos.push({ referencia: ref, plan: 'Paseo Único', mascota: mascota, fecha: fecha, hora: hora, precio: 19990, direccion: document.getElementById('paseoAdicionalDireccion').value, estado: 'activo', fechaAgendamiento: new Date().toISOString() });
    localStorage.setItem('petfyHistorialPaseos', JSON.stringify(paseos));
    
    var pagos = JSON.parse(localStorage.getItem('petfyHistorialPagos') || '[]');
    pagos.push({ referencia: 'PAGO-' + Date.now(), servicio_ref: ref, fecha: new Date().toISOString().split('T')[0], monto: 19990, estado: 'pagado' });
    localStorage.setItem('petfyHistorialPagos', JSON.stringify(pagos));
    
    cerrarModalPaseoAdicional();
    cargarPerfil();
    alert('✅ Paseo adicional agendado con éxito');
}

// Iniciar perfil
if (document.querySelector('.perfil-page')) {
    document.addEventListener('DOMContentLoaded', function() {
        cargarPerfil();
    });
}