// ========== MODAL MASCOTA ==========
function abrirModalMascota() {
    document.getElementById('modalMascota').classList.add('active');
    resetFormMascota();
}

function cerrarModalMascota() {
    document.getElementById('modalMascota').classList.remove('active');
}

function resetFormMascota() {
    document.getElementById('mascotaId').value = '-1';
    document.getElementById('nombreMascota').value = '';
    document.getElementById('razaMascota').value = '';
    document.getElementById('edadMascota').value = '';
    document.getElementById('pesoMascota').value = '';
    document.getElementById('comportamientoMascota').value = '';
    document.getElementById('comportamientoOtro').value = '';
    document.getElementById('comportamientoOtro').style.display = 'none';
    document.getElementById('condicionMascota').value = 'ninguna';
    document.getElementById('condicionOtro').value = '';
    document.getElementById('condicionOtro').style.display = 'none';
    document.getElementById('indicacionesMascota').value = '';
    document.getElementById('fotoMascotaPreview').style.display = 'none';
    document.getElementById('fotoMascotaPlaceholder').style.display = 'block';
    document.getElementById('fotoVacunaPreview').style.display = 'none';
    document.getElementById('fotoVacunaPlaceholder').style.display = 'block';
    document.getElementById('fotoMascota').value = '';
    document.getElementById('fotoVacuna').value = '';
}

function toggleOtroComportamiento(valor) {
    var otro = document.getElementById('comportamientoOtro');
    otro.style.display = valor === 'otro' ? 'block' : 'none';
    if (valor !== 'otro') otro.value = '';
}

function toggleOtraCondicion(valor) {
    var otro = document.getElementById('condicionOtro');
    otro.style.display = valor === 'otra' ? 'block' : 'none';
    if (valor !== 'otra') otro.value = '';
}

function previewFotoMascota(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('fotoMascotaPreview').src = e.target.result;
            document.getElementById('fotoMascotaPreview').style.display = 'block';
            document.getElementById('fotoMascotaPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function previewFotoVacuna(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('fotoVacunaPreview').src = e.target.result;
            document.getElementById('fotoVacunaPreview').style.display = 'block';
            document.getElementById('fotoVacunaPlaceholder').style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function guardarMascota(e) {
    e.preventDefault();
    
    var id = parseInt(document.getElementById('mascotaId').value);
    var nombre = document.getElementById('nombreMascota').value.trim();
    var raza = document.getElementById('razaMascota').value;
    var edad = document.getElementById('edadMascota').value.trim();
    var peso = document.getElementById('pesoMascota').value;
    var comportamiento = document.getElementById('comportamientoMascota').value;
    var comportamientoOtro = document.getElementById('comportamientoOtro').value.trim();
    var condicion = document.getElementById('condicionMascota').value;
    var condicionOtro = document.getElementById('condicionOtro').value.trim();
    var indicaciones = document.getElementById('indicacionesMascota').value.trim();
    var foto = document.getElementById('fotoMascotaPreview').src || '';
    var vacuna = document.getElementById('fotoVacunaPreview').src || '';
    
    if (!nombre || !raza) {
        alert('⚠️ Nombre y raza son obligatorios');
        return false;
    }
    
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    
    var mascota = {
        id: id >= 0 ? id : Date.now(),
        nombre: nombre,
        raza: raza,
        edad: edad,
        peso: peso,
        comportamiento: comportamiento,
        comportamiento_otro: comportamiento === 'otro' ? comportamientoOtro : '',
        condicion: condicion,
        condicion_otro: condicion === 'otra' ? condicionOtro : '',
        indicaciones: indicaciones,
        foto: foto,
        vacuna: vacuna
    };
    
    if (id >= 0) {
        var idx = mascotas.findIndex(function(m) { return m.id === id; });
        if (idx >= 0) mascotas[idx] = mascota;
    } else {
        mascotas.push(mascota);
    }
    
    localStorage.setItem('petfyMascotas', JSON.stringify(mascotas));
    cerrarModalMascota();
    cargarMascotas();
    cargarKPIs();
    alert('✅ Mascota guardada correctamente');
    return false;
}

function editarMascota(id) {
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    var m = mascotas.find(function(x) { return x.id === id; });
    if (!m) return;
    
    document.getElementById('mascotaId').value = m.id;
    document.getElementById('nombreMascota').value = m.nombre;
    document.getElementById('razaMascota').value = m.raza;
    document.getElementById('edadMascota').value = m.edad || '';
    document.getElementById('pesoMascota').value = m.peso || '';
    document.getElementById('comportamientoMascota').value = m.comportamiento || 'sociable';
    if (m.comportamiento === 'otro') {
        document.getElementById('comportamientoOtro').style.display = 'block';
        document.getElementById('comportamientoOtro').value = m.comportamiento_otro || '';
    }
    document.getElementById('condicionMascota').value = m.condicion || 'ninguna';
    if (m.condicion === 'otra') {
        document.getElementById('condicionOtro').style.display = 'block';
        document.getElementById('condicionOtro').value = m.condicion_otro || '';
    }
    document.getElementById('indicacionesMascota').value = m.indicaciones || '';
    
    if (m.foto) {
        document.getElementById('fotoMascotaPreview').src = m.foto;
        document.getElementById('fotoMascotaPreview').style.display = 'block';
        document.getElementById('fotoMascotaPlaceholder').style.display = 'none';
    }
    if (m.vacuna) {
        document.getElementById('fotoVacunaPreview').src = m.vacuna;
        document.getElementById('fotoVacunaPreview').style.display = 'block';
        document.getElementById('fotoVacunaPlaceholder').style.display = 'none';
    }
    
    document.getElementById('modalMascota').classList.add('active');
}
// ========== CONTROL DE VISTAS (DASHBOARD VS AGENDAMIENTO) ==========

function verificarVistaPaseos() {
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activos = servicios.filter(function(p) { return p.estado === 'activo'; });
    
    if (activos.length > 0) {
        // Tiene servicios → MOSTRAR DASHBOARD
        document.getElementById('vistaDashboardPaseos').style.display = 'block';
        document.getElementById('vistaAgendamientoPaseos').style.display = 'none';
        cargarDashboardPaseos();
    } else {
        // No tiene servicios → MOSTRAR AGENDAMIENTO
        document.getElementById('vistaDashboardPaseos').style.display = 'none';
        document.getElementById('vistaAgendamientoPaseos').style.display = 'block';
        cargarPlanesAgendamiento();
    }
}

function mostrarAgendamiento() {
    document.getElementById('vistaDashboardPaseos').style.display = 'none';
    document.getElementById('vistaAgendamientoPaseos').style.display = 'block';
    cargarPlanesAgendamiento();
}

function volverDashboard() {
    document.getElementById('vistaAgendamientoPaseos').style.display = 'none';
    document.getElementById('vistaDashboardPaseos').style.display = 'block';
    cargarDashboardPaseos();
}

function cargarDashboardPaseos() {
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    var activos = servicios.filter(function(p) { return p.estado === 'activo'; });
    var historial = servicios.filter(function(p) { return p.estado !== 'activo'; });
    
    // KPIs
    var mascotas = JSON.parse(localStorage.getItem('petfyMascotas') || '[]');
    document.getElementById('kpiServiciosActivos').textContent = activos.length;
    document.getElementById('kpiMascotas').textContent = mascotas.length;
    document.getElementById('kpiPlanActivo').textContent = activos.length > 0 ? activos[0].plan : '-';
    
    // Próximo pago
    var proximoPago = '-';
    if (activos.length > 0 && activos[0].proximoPago) {
        proximoPago = activos[0].proximoPago;
    }
    document.getElementById('kpiProximoPago').textContent = proximoPago;
    
    // Lista de paseos activos
    var htmlActivos = '';
    if (activos.length === 0) {
        htmlActivos = '<div class="perfil-empty"><p>Sin paseos activos</p></div>';
    } else {
        activos.forEach(function(p) {
            var dias = p.dias && p.dias.length > 0 ? '<div><i class="fas fa-calendar-week"></i> ' + p.dias.join(', ') + '</div>' : '';
            htmlActivos += '<div class="paseo-card">' +
                '<div class="paseo-card-header"><span class="paseo-card-plan">' + (p.plan || '') + '</span><span class="paseo-card-status status-activo">Activo</span></div>' +
                '<div class="paseo-card-body">' +
                    '<div><i class="fas fa-dog"></i> ' + (p.mascota || '') + '</div>' +
                    '<div><i class="fas fa-calendar"></i> ' + (p.fecha || '') + '</div>' +
                    '<div><i class="fas fa-clock"></i> ' + (p.hora || '') + '</div>' +
                    dias +
                '</div>' +
                '<div class="paseo-card-footer">' +
                    '<span class="paseo-card-precio">$' + (p.precio || 0).toLocaleString() + '</span>' +
                '</div>' +
            '</div>';
        });
    }
    document.getElementById('listaPaseosDashboard').innerHTML = htmlActivos;
    
    // Historial
    var htmlHistorial = '';
    if (historial.length === 0) {
        htmlHistorial = '<div class="perfil-empty"><p>Sin historial</p></div>';
    } else {
        historial.reverse().forEach(function(p) {
            htmlHistorial += '<div class="historial-row">' +
                '<span>' + (p.plan || '') + '</span>' +
                '<span>' + (p.fecha || '') + '</span>' +
                '<span>$' + (p.precio || 0).toLocaleString() + '</span>' +
                '<span class="status-completado">✅</span>' +
            '</div>';
        });
    }
    document.getElementById('listaHistorialDashboard').innerHTML = htmlHistorial;
}

// ========== MODIFICAR irAlPago() PARA GUARDAR Y VOLVER AL DASHBOARD ==========
function irAlPago() {
    var fecha = document.getElementById('fechaAgendamiento').value;
    var hora = document.getElementById('horaAgendamiento').value;
    
    if (!fecha) { alert('⚠️ Selecciona la fecha'); return; }
    if (!hora) { alert('⚠️ Selecciona la hora'); return; }
    
    // Obtener días seleccionados
    var diasSeleccionados = [];
    if (planSeleccionadoAgendamiento.diasPermitidos > 1) {
        var dias = document.querySelectorAll('#agendaContenido .dia-cb input:checked');
        if (dias.length !== planSeleccionadoAgendamiento.diasPermitidos) {
            alert('⚠️ Selecciona ' + planSeleccionadoAgendamiento.diasPermitidos + ' días');
            return;
        }
        dias.forEach(function(d) {
            diasSeleccionados.push(d.value);
        });
    }
    
    // Crear registro del servicio
    var servicio = {
        referencia: 'PETFY-' + Date.now(),
        plan: planSeleccionadoAgendamiento.nombre,
        mascota: mascotaSeleccionadaAgendamiento.nombre,
        mascota_id: mascotaSeleccionadaAgendamiento.id,
        fecha: fecha,
        hora: hora,
        dias: diasSeleccionados,
        precio: planSeleccionadoAgendamiento.precio,
        estado: 'activo',
        fechaAgendamiento: new Date().toISOString()
    };
    
    // Guardar en historial
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    servicios.push(servicio);
    localStorage.setItem('petfyHistorialPaseos', JSON.stringify(servicios));
    
    // Limpiar variables
    planSeleccionadoAgendamiento = null;
    mascotaSeleccionadaAgendamiento = null;
    
    // Mostrar dashboard
    alert('✅ ¡Paseo agendado con éxito!');
    verificarVistaPaseos();
    cargarKPIs();
}

// ========== MODIFICAR mostrarVistaPerfil ==========
function mostrarVistaPerfil(id, link) {
    // ... código existente ...
    
    if (id === 'vista-paseos') {
        verificarVistaPaseos();
    }
}

// ========== INICIAR ==========
document.addEventListener('DOMContentLoaded', function() {
    var user = JSON.parse(localStorage.getItem('petfyUser') || '{}');
    document.getElementById('topbarNombre').textContent = user.nombre || 'Usuario';
    verificarVistaPaseos();
    cargarKPIs();
})
function cargarAgendaAgendamiento() {
    var dir = JSON.parse(localStorage.getItem('petfyDireccionServicio') || '{}');
    
    // Días (si aplica)
    var diasHTML = '';
    if (planSeleccionadoAgendamiento.diasPermitidos > 1) {
        var dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        diasHTML = '<div class="form-group"><label>📆 Días (' + planSeleccionadoAgendamiento.diasPermitidos + ')</label><div class="dias-checkboxes">';
        dias.forEach(function(d) {
            diasHTML += '<label class="dia-cb"><input type="checkbox" value="' + d.toLowerCase() + '"> ' + d + '</label>';
        });
        diasHTML += '</div></div>';
    }
    
    document.getElementById('agendaContenido').innerHTML = 
    
    // ========== DIRECCIÓN COMPLETA ==========
    '<div class="agenda-nota"><i class="fas fa-info-circle"></i> Completa la dirección donde recogeremos a tu mascota</div>' +
    
    '<div class="form-row">' +
        '<div class="form-group">' +
            '<label>🏙️ Ciudad *</label>' +
            '<select id="agendaCiudad">' +
                '<option value="bogota" selected>Bogotá</option>' +
                '<option value="medellin" disabled>Medellín (Próximamente)</option>' +
                '<option value="cali" disabled>Cali (Próximamente)</option>' +
                '<option value="barranquilla" disabled>Barranquilla (Próximamente)</option>' +
            '</select>' +
        '</div>' +
        '<div class="form-group">' +
            '<label>📍 Localidad *</label>' +
            '<select id="agendaLocalidad">' +
                '<option value="">Seleccionar</option>' +
                '<option value="usaquen" selected>Usaquén</option>' +
                '<option value="chapinero" disabled>Chapinero (Próx.)</option>' +
                '<option value="santa-fe" disabled>Santa Fe (Próx.)</option>' +
                '<option value="san-cristobal" disabled>San Cristóbal (Próx.)</option>' +
                '<option value="usme" disabled>Usme (Próx.)</option>' +
                '<option value="tunjuelito" disabled>Tunjuelito (Próx.)</option>' +
                '<option value="bosa" disabled>Bosa (Próx.)</option>' +
                '<option value="kennedy" disabled>Kennedy (Próx.)</option>' +
                '<option value="fontibon" disabled>Fontibón (Próx.)</option>' +
                '<option value="engativa" disabled>Engativá (Próx.)</option>' +
                '<option value="suba" disabled>Suba (Próx.)</option>' +
                '<option value="barrios-unidos" disabled>Barrios Unidos (Próx.)</option>' +
                '<option value="teusaquillo" disabled>Teusaquillo (Próx.)</option>' +
                '<option value="martires" disabled>Mártires (Próx.)</option>' +
                '<option value="antonio-narino" disabled>Antonio Nariño (Próx.)</option>' +
                '<option value="puente-aranda" disabled>Puente Aranda (Próx.)</option>' +
                '<option value="candelaria" disabled>Candelaria (Próx.)</option>' +
                '<option value="rafael-uribe" disabled>Rafael Uribe (Próx.)</option>' +
                '<option value="ciudad-bolivar" disabled>Ciudad Bolívar (Próx.)</option>' +
                '<option value="sumapaz" disabled>Sumapaz (Próx.)</option>' +
            '</select>' +
        '</div>' +
    '</div>' +
    
    '<div class="form-row">' +
        '<div class="form-group">' +
            '<label>🛣️ Tipo de Vía *</label>' +
            '<select id="agendaTipoVia">' +
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
            '<label>🔢 Número *</label>' +
            '<input type="text" id="agendaNumeroVia" placeholder="Ej: 155a #7-87">' +
        '</div>' +
    '</div>' +
    
    '<div class="form-group">' +
        '<label>📝 Información Adicional</label>' +
        '<textarea id="agendaComplemento" rows="2" placeholder="Barrio, conjunto, torre, apto, casa..."></textarea>' +
    '</div>' +
    
    '<div class="agenda-separador"></div>' +
    
    // ========== TELÉFONO DE CONTACTO ==========
    '<div class="form-group">' +
        '<label>📱 Teléfono de quien recibe a la mascota *</label>' +
        '<input type="tel" id="agendaTelefono" placeholder="Ej: 300 123 4567">' +
    '</div>' +
    
    '<div class="agenda-separador"></div>' +
    
    // ========== FECHA Y HORA ==========
    '<div class="form-row">' +
        '<div class="form-group">' +
            '<label>📅 Fecha *</label>' +
            '<input type="date" id="fechaAgendamiento">' +
        '</div>' +
        '<div class="form-group">' +
            '<label>⏰ Hora *</label>' +
            '<select id="horaAgendamiento">' +
                '<option value="">Seleccionar</option>' +
                '<option value="08:00">08:00 AM</option>' +
                '<option value="09:00">09:00 AM</option>' +
                '<option value="10:00">10:00 AM</option>' +
                '<option value="11:00">11:00 AM</option>' +
                '<option value="12:00">12:00 PM</option>' +
                '<option value="14:00">02:00 PM</option>' +
                '<option value="15:00">03:00 PM</option>' +
                '<option value="16:00">04:00 PM</option>' +
                '<option value="17:00">05:00 PM</option>' +
            '</select>' +
        '</div>' +
    '</div>' +
    diasHTML;
    
    document.getElementById('botonPago').style.display = 'block';
}
function irAlPago() {
    // Validar dirección
    var ciudad = document.getElementById('agendaCiudad').value;
    var localidad = document.getElementById('agendaLocalidad').value;
    var tipoVia = document.getElementById('agendaTipoVia').value;
    var numeroVia = document.getElementById('agendaNumeroVia').value.trim();
    var complemento = document.getElementById('agendaComplemento').value.trim();
    var telefono = document.getElementById('agendaTelefono').value.trim();
    var fecha = document.getElementById('fechaAgendamiento').value;
    var hora = document.getElementById('horaAgendamiento').value;
    
    if (!ciudad) { alert('⚠️ Selecciona ciudad'); return; }
    if (!localidad) { alert('⚠️ Selecciona localidad'); return; }
    if (!tipoVia) { alert('⚠️ Selecciona tipo de vía'); return; }
    if (!numeroVia) { alert('⚠️ Ingresa el número'); return; }
    if (!telefono) { alert('⚠️ Ingresa teléfono de contacto'); return; }
    if (!fecha) { alert('⚠️ Selecciona fecha'); return; }
    if (!hora) { alert('⚠️ Selecciona hora'); return; }
    
    // Validar días
    var diasSeleccionados = [];
    if (planSeleccionadoAgendamiento.diasPermitidos > 1) {
        var dias = document.querySelectorAll('#agendaContenido .dia-cb input:checked');
        if (dias.length !== planSeleccionadoAgendamiento.diasPermitidos) {
            alert('⚠️ Selecciona ' + planSeleccionadoAgendamiento.diasPermitidos + ' días');
            return;
        }
        dias.forEach(function(d) { diasSeleccionados.push(d.value); });
    }
    
    // Construir dirección completa
    var direccionCompleta = tipoVia + ' ' + numeroVia;
    if (complemento) direccionCompleta += ', ' + complemento;
    
    // Guardar dirección para futuros servicios
    localStorage.setItem('petfyDireccionServicio', JSON.stringify({
        ciudad: ciudad,
        localidad: localidad,
        tipoVia: tipoVia,
        numeroVia: numeroVia,
        complemento: complemento,
        telefono: telefono
    }));
    
    // Crear servicio
    var servicio = {
        referencia: 'PETFY-' + Date.now(),
        plan: planSeleccionadoAgendamiento.nombre,
        mascota: mascotaSeleccionadaAgendamiento.nombre,
        mascota_id: mascotaSeleccionadaAgendamiento.id,
        direccion: direccionCompleta,
        telefono: telefono,
        fecha: fecha,
        hora: hora,
        dias: diasSeleccionados,
        precio: planSeleccionadoAgendamiento.precio,
        estado: 'activo',
        fechaAgendamiento: new Date().toISOString()
    };
    
    var servicios = JSON.parse(localStorage.getItem('petfyHistorialPaseos') || '[]');
    servicios.push(servicio);
    localStorage.setItem('petfyHistorialPaseos', JSON.stringify(servicios));
    
    planSeleccionadoAgendamiento = null;
    mascotaSeleccionadaAgendamiento = null;
    
    alert('✅ ¡Paseo agendado con éxito!');
    verificarVistaPaseos();
    cargarKPIs();
}
// ========== DROPDOWN FUNCIONAL ==========
function toggleDropdown(event, id) {
    event.preventDefault();
    event.stopPropagation();
    
    var dropdown = document.getElementById(id);
    var todosDropdowns = document.querySelectorAll('.dropdown-menu-perfil');
    
    // Cerrar todos los dropdowns excepto el actual
    todosDropdowns.forEach(function(d) {
        if (d.id !== id) {
            d.classList.remove('show');
        }
    });
    
    // Toggle del dropdown actual
    dropdown.classList.toggle('show');
}

// Cerrar dropdown al hacer clic en cualquier parte
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown-perfil')) {
        document.querySelectorAll('.dropdown-menu-perfil').forEach(function(d) {
            d.classList.remove('show');
        });
    }
});

// Cerrar con tecla Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.dropdown-menu-perfil').forEach(function(d) {
            d.classList.remove('show');
        });
    }
});