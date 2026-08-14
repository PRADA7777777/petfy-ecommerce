// ============================================================
// ========== PERFIL DE USUARIO - FUNCIONES COMPLETAS ==========
// ============================================================

// ========== DROPDOWN DEL PERFIL ==========
function toggleDropdown(event, id) {
    event.preventDefault();
    event.stopPropagation();
    
    // Cerrar otros dropdowns
    document.querySelectorAll('.dropdown-menu-perfil').forEach(function(d) {
        if (d.id !== id) d.classList.remove('show');
    });
    
    // Toggle del dropdown actual
    document.getElementById(id).classList.toggle('show');
}

// ========== MOSTRAR SERVICIO DESDE DROPDOWN ==========
function mostrarServicioPerfil(vista, titulo, link) {
    // Cerrar dropdown
    document.querySelectorAll('.dropdown-menu-perfil').forEach(function(d) {
        d.classList.remove('show');
    });
    
    // Quitar active de todos los nav links
    document.querySelectorAll('.perfil-nav-link').forEach(function(n) {
        n.classList.remove('active');
    });
    
    // Marcar el dropdown como activo
    var dropdownLink = link.closest('.dropdown-perfil').querySelector('.perfil-nav-link');
    if (dropdownLink) dropdownLink.classList.add('active');
    
    // Mostrar la vista
    mostrarVista(vista);
}

// ========== MOSTRAR VISTA ==========
function mostrarVista(id) {
    // Ocultar todas las vistas
    document.querySelectorAll('.perfil-vista').forEach(function(v) {
        v.classList.remove('active');
    });
    
    // Mostrar la vista seleccionada
    var vista = document.getElementById(id);
    if (vista) vista.classList.add('active');
    
    // Cargar datos según la vista
    if (id === 'vista-mascotas') cargarMascotas();
    if (id === 'vista-facturacion') cargarFacturacion();
    if (id === 'vista-paseos') cargarServiciosPaseos();
    if (id === 'vista-datos') cargarDatosPerfil();
}

// ========== CARGAR PERFIL COMPLETO ==========
function cargarPerfil() {
    var user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    
    // Topbar
    if (document.getElementById('topbarNombre')) {
        document.getElementById('topbarNombre').textContent = user.nombre || 'Usuario';
    }
    
    // KPIs
    cargarKPIs();
    
    // Datos del formulario
    cargarDatosPerfil();
    
    // Dirección
    cargarDireccionPerfil();
    
    // Mascotas
    cargarMascotas();
    
    // Facturación
    cargarFacturacion();
    
    // Servicios
    cargarServiciosPaseos();
}

// ========== KPIs ==========
function cargarKPIs() {
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var activos = servicios.filter(function(p) { return p.estado === 'activo'; });
    
    if (document.getElementById('kpiServiciosActivos')) {
        document.getElementById('kpiServiciosActivos').textContent = activos.length;
    }
    
    if (document.getElementById('kpiMascotas')) {
        document.getElementById('kpiMascotas').textContent = mascotas.length;
    }
    
    // Plan activo
    var planActivo = activos.length > 0 ? activos[0].plan : '-';
    if (document.getElementById('kpiPlanActivo')) {
        document.getElementById('kpiPlanActivo').textContent = planActivo;
    }
    
    // Próximo pago
    var proximoPago = '-';
    if (activos.length > 0 && activos[0].proximoPago) {
        proximoPago = activos[0].proximoPago;
    }
    if (document.getElementById('kpiProximoPago')) {
        document.getElementById('kpiProximoPago').textContent = proximoPago;
    }
}

// ========== CARGAR SERVICIOS DE PASEOS ==========
function cargarServiciosPaseos() {
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activos = servicios.filter(function(p) { 
        return p.estado === 'activo'; 
    });
    
    var html = '';
    if (activos.length === 0) {
        html = '<div class="perfil-empty"><i class="fas fa-calendar"></i><p>No tienes servicios de paseo activos</p></div>';
    } else {
        activos.forEach(function(p) {
            html += crearCardPaseo(p);
        });
    }
    
    var contenedor = document.getElementById('listaServiciosPaseos');
    if (contenedor) contenedor.innerHTML = html;
}

// ========== CREAR CARD DE PASEO ==========
function crearCardPaseo(p) {
    var dias = '';
    if (p.dias && p.dias.length > 0) {
        dias = '<div><i class="fas fa-calendar-week"></i> ' + p.dias.map(function(d) {
            return d.charAt(0).toUpperCase() + d.slice(1);
        }).join(', ') + '</div>';
    }
    
    return '<div class="paseo-card">' +
        '<div class="paseo-card-header">' +
            '<span class="paseo-card-plan">' + (p.plan || 'Servicio') + '</span>' +
            '<span class="paseo-card-status status-activo">Activo</span>' +
        '</div>' +
        '<div class="paseo-card-body">' +
            '<div><i class="fas fa-dog"></i> ' + (p.mascota || '') + '</div>' +
            '<div><i class="fas fa-calendar"></i> ' + (p.fecha || '') + '</div>' +
            '<div><i class="fas fa-clock"></i> ' + (p.hora || '') + '</div>' +
            '<div><i class="fas fa-map-marker-alt"></i> ' + (p.direccion ? p.direccion.substring(0, 25) + '...' : '') + '</div>' +
            dias +
        '</div>' +
        '<div class="paseo-card-footer">' +
            '<span class="paseo-card-precio">$' + (p.precio || 0).toLocaleString() + '</span>' +
            '<div class="paseo-card-acciones">' +
                '<a href="https://wa.me/573204829244" target="_blank" class="btn-paseo btn-contactar"><i class="fab fa-whatsapp"></i></a>' +
                '<button class="btn-paseo btn-cancelar" onclick="cancelarServicio(\'' + p.referencia + '\')"><i class="fas fa-times"></i></button>' +
            '</div>' +
        '</div>' +
    '</div>';
}

// ========== CANCELAR SERVICIO ==========
function cancelarServicio(ref) {
    if (!confirm('¿Estás seguro de cancelar este servicio?')) return;
    
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var idx = servicios.findIndex(function(p) { return p.referencia === ref; });
    
    if (idx >= 0) {
        servicios[idx].estado = 'cancelado';
        localStorage.setItem('petfyHistorialPaseos', JSON.stringify(servicios));
        cargarPerfil();
        alert('✅ Servicio cancelado');
    }
}

// ========== DATOS PERSONALES ==========
function cargarDatosPerfil() {
    var user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    
    if (document.getElementById('editNombre')) {
        document.getElementById('editNombre').value = user.nombre || '';
    }
    if (document.getElementById('editApellido')) {
        document.getElementById('editApellido').value = user.apellido || '';
    }
    if (document.getElementById('editEmail')) {
        document.getElementById('editEmail').value = user.email || '';
    }
    if (document.getElementById('editTipoDoc')) {
        document.getElementById('editTipoDoc').value = user.tipoDoc || 'CC';
    }
    if (document.getElementById('editNumDoc')) {
        document.getElementById('editNumDoc').value = user.numDoc || '';
    }
    if (document.getElementById('editTelefono')) {
        document.getElementById('editTelefono').value = user.telefono || '';
    }
    if (document.getElementById('editDirFactura')) {
        document.getElementById('editDirFactura').value = user.dirFactura || '';
    }
}

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
    alert('✅ Datos guardados correctamente');
    return false;
}

// ========== DIRECCIÓN DE SERVICIO ==========
function cargarDireccionPerfil() {
    var dir = JSON.parse(localStorage.getItem('petfyDireccionServicio') || '{}');
    
    if (document.getElementById('editCiudad')) {
        document.getElementById('editCiudad').value = dir.ciudad || 'Bogotá';
    }
    if (document.getElementById('editLocalidad')) {
        document.getElementById('editLocalidad').value = dir.localidad || 'Usaquén';
    }
    if (document.getElementById('editTipoVia')) {
        document.getElementById('editTipoVia').value = dir.tipoVia || 'calle';
    }
    if (document.getElementById('editNumVia')) {
        document.getElementById('editNumVia').value = dir.numeroVia || '';
    }
    if (document.getElementById('editComplemento')) {
        document.getElementById('editComplemento').value = dir.complemento || '';
    }
    if (document.getElementById('editEsConjunto')) {
        document.getElementById('editEsConjunto').value = dir.esConjunto || 'no';
    }
    if (document.getElementById('editTorre')) {
        document.getElementById('editTorre').value = dir.torre || '';
    }
    if (document.getElementById('editApto')) {
        document.getElementById('editApto').value = dir.apto || '';
    }
    
    toggleConjuntoPerfil();
}

function guardarDireccion(e) {
    e.preventDefault();
    
    var dir = {
        ciudad: 'Bogotá',
        localidad: 'Usaquén',
        tipoVia: document.getElementById('editTipoVia').value,
        numeroVia: document.getElementById('editNumVia').value,
        complemento: document.getElementById('editComplemento').value,
        esConjunto: document.getElementById('editEsConjunto').value,
        torre: document.getElementById('editTorre').value,
        apto: document.getElementById('editApto').value
    };
    
    localStorage.setItem('petfyDireccionServicio', JSON.stringify(dir));
    localStorage.setItem('petfyUltimaDireccion', JSON.stringify(dir));
    alert('✅ Dirección guardada correctamente');
    return false;
}

function toggleConjuntoPerfil() {
    var esConjunto = document.getElementById('editEsConjunto').value;
    var datos = document.getElementById('datosConjuntoPerfil');
    if (datos) {
        datos.style.display = esConjunto === 'si' ? 'block' : 'none';
    }
}

// ========== MASCOTAS ==========
function cargarMascotas() {
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var html = '';
    
    if (mascotas.length === 0) {
        html = '<div class="perfil-empty"><i class="fas fa-paw"></i><p>No tienes mascotas registradas</p></div>';
    } else {
        mascotas.forEach(function(m, i) {
            html += '<div class="mascota-card">' +
                '<div class="mascota-card-avatar">🐕</div>' +
                '<div class="mascota-card-info">' +
                    '<strong>' + m.nombre + '</strong>' +
                    '<p>' + (m.raza || '') + ' • ' + (m.edad || '') + ' • ' + (m.peso || '') + ' kg</p>' +
                '</div>' +
                '<div class="mascota-card-actions">' +
                    '<button class="btn-icon btn-edit" onclick="editarMascota(' + i + ')"><i class="fas fa-pen"></i></button>' +
                    '<button class="btn-icon btn-delete" onclick="eliminarMascota(' + i + ')"><i class="fas fa-trash"></i></button>' +
                '</div>' +
            '</div>';
        });
    }
    
    var contenedor = document.getElementById('listaMascotas');
    if (contenedor) contenedor.innerHTML = html;
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
    
    if (!m.nombre || !m.raza) {
        alert('⚠️ Nombre y raza son obligatorios');
        return;
    }
    
    if (i >= 0) {
        mascotas[i] = m;
    } else {
        mascotas.push(m);
    }
    
    localStorage.setItem('petfyMascotas', JSON.stringify(mascotas));
    document.getElementById('formMascota').style.display = 'none';
    cargarMascotas();
    cargarKPIs();
}

function cancelarFormMascota() {
    document.getElementById('formMascota').style.display = 'none';
}

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
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activo = servicios.filter(function(p) { return p.estado === 'activo'; })[0];
    
    // Resumen plan activo
    var htmlResumen = '';
    if (activo) {
        htmlResumen = '<div class="factura-card">' +
            '<div><strong>' + activo.plan + '</strong></div>' +
            '<div>$' + (activo.precio || 0).toLocaleString() + '/mes</div>' +
            '<div>Inicio: ' + (activo.fecha || '') + '</div>' +
            '<div>Próximo pago: ' + (activo.proximoPago || 'Pendiente') + '</div>' +
            '<button class="btn-perfil btn-primary" onclick="abrirModalPagoProximo()" style="margin-top:0.5rem;">💳 Pagar Próximo Mes</button>' +
        '</div>';
    } else {
        htmlResumen = '<div class="perfil-empty"><i class="fas fa-credit-card"></i><p>No tienes un plan activo</p></div>';
    }
    
    var contenedorResumen = document.getElementById('resumenPlanActivo');
    if (contenedorResumen) contenedorResumen.innerHTML = htmlResumen;
    
    // Historial de pagos
    var htmlPagos = '';
    if (pagos.length === 0) {
        htmlPagos = '<div class="perfil-empty"><i class="fas fa-receipt"></i><p>Sin historial de pagos</p></div>';
    } else {
        pagos.reverse().forEach(function(p) {
            htmlPagos += '<div class="historial-row">' +
                '<span>' + (p.fecha || '') + '</span>' +
                '<span>$' + (p.monto || 0).toLocaleString() + '</span>' +
                '<span>' + (p.referencia || '') + '</span>' +
                '<span class="status-completado" style="padding:0.15rem 0.5rem;border-radius:10px;font-size:0.55rem;font-weight:800;">✅ Pagado</span>' +
            '</div>';
        });
    }
    
    var contenedorPagos = document.getElementById('listaHistorialPagos');
    if (contenedorPagos) contenedorPagos.innerHTML = htmlPagos;
}

// ========== MODAL PAGO PRÓXIMO MES ==========
function abrirModalPagoProximo() {
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activo = servicios.filter(function(p) { return p.estado === 'activo'; })[0];
    
    if (!activo) {
        alert('No tienes un plan activo');
        return;
    }
    
    document.getElementById('detallePagoProximo').innerHTML = 
        '<p><span>Plan:</span> <strong>' + activo.plan + '</strong></p>' +
        '<p><span>Mascota:</span> <strong>' + (activo.mascota || '') + '</strong></p>' +
        '<p><span>Período:</span> <strong>' + (activo.proximoPago || 'Próximo mes') + '</strong></p>';
    
    document.getElementById('totalPagoProximo').textContent = '$' + (activo.precio || 0).toLocaleString();
    document.getElementById('modalPagoProximo').classList.add('active');
}

function cerrarModalPagoProximo() {
    document.getElementById('modalPagoProximo').classList.remove('active');
}

function confirmarPagoProximo() {
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activo = servicios.filter(function(p) { return p.estado === 'activo'; })[0];
    
    if (!activo) return;
    
    // Agregar pago
    var pagos = JSON.parse(localStorage.getItem('petfyHistorialPagos') || '[]');
    pagos.push({
        referencia: 'PAGO-' + Date.now(),
        servicio_ref: activo.referencia,
        fecha: new Date().toISOString().split('T')[0],
        monto: activo.precio,
        estado: 'pagado'
    });
    localStorage.setItem('petfyHistorialPagos', JSON.stringify(pagos));
    
    // Actualizar próximo pago
    var idx = servicios.findIndex(function(p) { return p.referencia === activo.referencia; });
    if (idx >= 0) {
        var fecha = new Date();
        fecha.setMonth(fecha.getMonth() + 1);
        servicios[idx].proximoPago = fecha.toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        localStorage.setItem('petfyHistorialPaseos', JSON.stringify(servicios));
    }
    
    cerrarModalPagoProximo();
    cargarPerfil();
    alert('✅ Pago realizado con éxito');
}

// ========== CERRAR DROPDOWN AL HACER CLIC FUERA ==========
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-perfil')) {
        document.querySelectorAll('.dropdown-menu-perfil').forEach(function(d) {
            d.classList.remove('show');
        });
    }
});

// ========== INICIAR PERFIL ==========
if (document.querySelector('.perfil-page')) {
    document.addEventListener('DOMContentLoaded', function() {
        cargarPerfil();
    });
}

console.log('✅ Perfil de usuario cargado');