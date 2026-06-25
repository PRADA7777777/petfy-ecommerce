// ========== PETFY - BÚSQUEDA ==========

/**
 * Inicializar búsqueda
 */
function initSearch() {
    const searchInputs = document.querySelectorAll('.search-bar input');
    const searchButtons = document.querySelectorAll('.search-bar button');
    
    searchButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const query = searchInputs[index]?.value?.trim();
            if (query) {
                realizarBusqueda(query);
            }
        });
    });
    
    searchInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    realizarBusqueda(query);
                }
            }
        });
    });
}

/**
 * Realizar búsqueda
 * @param {string} query - Término de búsqueda
 */
function realizarBusqueda(query) {
    if (!query || query.length < 2) {
        mostrarToast('Ingresa al menos 2 caracteres', 'warning');
        return;
    }
    
    // Redirigir a la tienda con el parámetro de búsqueda
    const basePath = getBasePath();
    window.location.href = `${basePath}tienda/?search=${encodeURIComponent(query)}`;
}

/**
 * Filtrar productos en la página actual
 * @param {string} query - Término de búsqueda
 */
function filtrarProductosLocales(query) {
    const productos = document.querySelectorAll('.product-card:not(.product-placeholder)');
    let encontrados = 0;
    
    productos.forEach(producto => {
        const titulo = producto.querySelector('.product-title')?.textContent?.toLowerCase() || '';
        const marca = producto.querySelector('.product-brand')?.textContent?.toLowerCase() || '';
        const coincide = titulo.includes(query.toLowerCase()) || marca.includes(query.toLowerCase());
        
        producto.style.display = coincide ? 'block' : 'none';
        if (coincide) encontrados++;
    });
    
    return encontrados;
}

// Inicializar
document.addEventListener('DOMContentLoaded', initSearch);

console.log('✅ Search cargado');