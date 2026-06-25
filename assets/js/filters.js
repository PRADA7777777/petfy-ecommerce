// ========== PETFY - FILTROS ==========

/**
 * Aplicar filtros a productos
 */
function aplicarFiltros() {
    const checkboxes = document.querySelectorAll('.filter-option input[type="checkbox"]:checked');
    const categoriasSeleccionadas = Array.from(checkboxes).map(cb => cb.value);
    const precioMin = document.getElementById('priceMin')?.value || 0;
    const precioMax = document.getElementById('priceMax')?.value || Infinity;
    
    const productos = document.querySelectorAll('.product-card:not(.product-placeholder)');
    let visibles = 0;
    
    productos.forEach(producto => {
        const categoria = producto.dataset.categoria;
        const precio = parseFloat(producto.dataset.precio) || 0;
        
        const cumpleCategoria = categoriasSeleccionadas.length === 0 || 
                                categoriasSeleccionadas.includes(categoria);
        const cumplePrecio = precio >= precioMin && (precioMax === Infinity || precio <= precioMax);
        
        if (cumpleCategoria && cumplePrecio) {
            producto.style.display = 'block';
            visibles++;
        } else {
            producto.style.display = 'none';
        }
    });
    
    // Actualizar contador
    const resultsCount = document.querySelector('.results-count strong');
    if (resultsCount) {
        resultsCount.textContent = visibles;
    }
}

/**
 * Limpiar todos los filtros
 */
function limpiarFiltros() {
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    const precioMin = document.getElementById('priceMin');
    const precioMax = document.getElementById('priceMax');
    if (precioMin) precioMin.value = '';
    if (precioMax) precioMax.value = '';
    
    aplicarFiltros();
    mostrarToast('Filtros limpiados', 'info');
}

/**
 * Ordenar productos
 * @param {string} criterio - Criterio de ordenamiento
 */
function ordenarProductos(criterio) {
    const grid = document.querySelector('.shop-grid, .products-grid');
    if (!grid) return;
    
    const productos = Array.from(grid.querySelectorAll('.product-card:not(.product-placeholder)'));
    
    productos.sort((a, b) => {
        const precioA = parseFloat(a.dataset.precio) || 0;
        const precioB = parseFloat(b.dataset.precio) || 0;
        const nombreA = a.querySelector('.product-title')?.textContent || '';
        const nombreB = b.querySelector('.product-title')?.textContent || '';
        
        switch(criterio) {
            case 'price-asc': return precioA - precioB;
            case 'price-desc': return precioB - precioA;
            case 'name-asc': return nombreA.localeCompare(nombreB);
            case 'name-desc': return nombreB.localeCompare(nombreA);
            default: return 0;
        }
    });
    
    productos.forEach(p => grid.appendChild(p));
}

// Inicializar eventos
document.addEventListener('DOMContentLoaded', () => {
    // Botón aplicar filtros
    const btnAplicar = document.querySelector('.btn-filter, .btn-primary');
    if (btnAplicar && btnAplicar.textContent.includes('Filtro')) {
        btnAplicar.addEventListener('click', aplicarFiltros);
    }
    
    // Select de ordenamiento
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            const criterio = value === 'Precio: Menor a Mayor' ? 'price-asc' :
                            value === 'Precio: Mayor a Menor' ? 'price-desc' :
                            value === 'A-Z' ? 'name-asc' : 'name-desc';
            ordenarProductos(criterio);
        });
    }
});

console.log('✅ Filters cargado');