// ========== PETFY - UTILIDADES ==========

/**
 * Formatear precio a pesos colombianos
 * @param {number} precio - Precio a formatear
 * @returns {string} Precio formateado
 */
function formatearPrecio(precio) {
    return '$' + new Intl.NumberFormat('es-CO').format(precio);
}

/**
 * Obtener parámetro de la URL
 * @param {string} param - Nombre del parámetro
 * @returns {string|null} Valor del parámetro
 */
function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Formatear nombre de página desde el nombre del archivo
 * @param {string} nombreArchivo - Nombre del archivo
 * @returns {string} Nombre formateado
 */
function formatearNombrePagina(nombreArchivo) {
    if (!nombreArchivo || nombreArchivo === '') return 'Página';
    
    return nombreArchivo
        .replace('.html', '')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

/**
 * Obtener la ruta base según ubicación actual
 * @returns {string} Ruta base relativa
 */
function getBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length;
    
    if (path.endsWith('/') || path.endsWith('index.html')) {
        return '../'.repeat(Math.max(0, depth - 1));
    }
    
    return '../'.repeat(Math.max(0, depth - 1));
}

/**
 * Mostrar notificación toast
 * @param {string} mensaje - Texto de la notificación
 * @param {string} tipo - 'success', 'error', 'warning', 'info'
 */
function mostrarToast(mensaje, tipo = 'success') {
    const colores = {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
    };
    
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: ${colores[tipo]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.9rem;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        font-family: 'Inter', sans-serif;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 400px;
    `;
    
    toast.innerHTML = `<i class="fas ${iconos[tipo]}"></i> ${mensaje}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Debounce para optimizar eventos
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle para limitar frecuencia de ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite en ms
 * @returns {Function} Función con throttle
 */
function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Guardar en localStorage
 * @param {string} key - Clave
 * @param {*} value - Valor
 */
function guardarLocal(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Error al guardar en localStorage:', e);
    }
}

/**
 * Obtener de localStorage
 * @param {string} key - Clave
 * @param {*} defaultValue - Valor por defecto
 * @returns {*} Valor almacenado
 */
function obtenerLocal(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Error al leer de localStorage:', e);
        return defaultValue;
    }
}

/**
 * Eliminar de localStorage
 * @param {string} key - Clave
 */
function eliminarLocal(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error('Error al eliminar de localStorage:', e);
    }
}

/**
 * Validar email
 * @param {string} email - Email a validar
 * @returns {boolean} Es válido
 */
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Validar teléfono colombiano
 * @param {string} telefono - Teléfono a validar
 * @returns {boolean} Es válido
 */
function validarTelefono(telefono) {
    const regex = /^(\+57)?[3][0-9]{9}$/;
    return regex.test(telefono.replace(/\s/g, ''));
}

/**
 * Truncar texto
 * @param {string} texto - Texto a truncar
 * @param {number} longitud - Longitud máxima
 * @returns {string} Texto truncado
 */
function truncarTexto(texto, longitud = 100) {
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
}

/**
 * Capitalizar primera letra
 * @param {string} texto - Texto
 * @returns {string} Texto capitalizado
 */
function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Generar ID único
 * @returns {string} ID único
 */
function generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Obtener fecha actual formateada
 * @returns {string} Fecha formateada
 */
function fechaActual() {
    return new Date().toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Exportar para uso global
window.utils = {
    formatearPrecio,
    getUrlParam,
    formatearNombrePagina,
    getBasePath,
    mostrarToast,
    debounce,
    throttle,
    guardarLocal,
    obtenerLocal,
    eliminarLocal,
    validarEmail,
    validarTelefono,
    truncarTexto,
    capitalizar,
    generarId,
    fechaActual
};

console.log('✅ Utils cargado');