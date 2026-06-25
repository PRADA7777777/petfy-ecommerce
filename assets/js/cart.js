// ========== PETFY - CARRITO DE COMPRAS ==========

const CART_KEY = 'petfyCart';

/**
 * Obtener carrito completo
 * @returns {Array} Items del carrito
 */
function obtenerCarrito() {
    return obtenerLocal(CART_KEY, []);
}

/**
 * Guardar carrito
 * @param {Array} cart - Items del carrito
 */
function guardarCarrito(cart) {
    guardarLocal(CART_KEY, cart);
    actualizarContadorCarrito();
    actualizarCarritoUI();
}

/**
 * Agregar producto al carrito
 * @param {string} id - ID del producto
 * @param {string} name - Nombre
 * @param {string} price - Precio
 * @param {string} image - URL de imagen
 * @param {number} quantity - Cantidad
 */
function agregarAlCarrito(id, name, price, image, quantity = 1) {
    let cart = obtenerCarrito();
    
    const existingIndex = cart.findIndex(item => item.id === id);
    
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({
            id,
            name,
            price,
            image,
            quantity
        });
    }
    
    guardarCarrito(cart);
    mostrarToast(`✅ "${name}" añadido al carrito`, 'success');
}

/**
 * Eliminar producto del carrito
 * @param {string} id - ID del producto
 */
function eliminarDelCarrito(id) {
    let cart = obtenerCarrito();
    cart = cart.filter(item => item.id !== id);
    guardarCarrito(cart);
    mostrarToast('Producto eliminado del carrito', 'info');
}

/**
 * Actualizar cantidad de un producto
 * @param {string} id - ID del producto
 * @param {number} quantity - Nueva cantidad
 */
function actualizarCantidad(id, quantity) {
    let cart = obtenerCarrito();
    const item = cart.find(item => item.id === id);
    
    if (item) {
        item.quantity = Math.max(1, Math.min(99, quantity));
        guardarCarrito(cart);
    }
}

/**
 * Calcular total del carrito
 * @returns {number} Total
 */
function calcularTotalCarrito() {
    const cart = obtenerCarrito();
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, '')) || 0;
        return total + (price * item.quantity);
    }, 0);
}

/**
 * Contar items totales
 * @returns {number} Total de items
 */
function contarItemsCarrito() {
    const cart = obtenerCarrito();
    return cart.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Actualizar contador visual del carrito
 */
function actualizarContadorCarrito() {
    const total = contarItemsCarrito();
    
    document.querySelectorAll('.cart-count').forEach(contador => {
        contador.textContent = total;
        contador.style.display = total > 0 ? 'flex' : 'none';
    });
}

/**
 * Actualizar UI del carrito (si existe en la página)
 */
function actualizarCarritoUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    
    if (!cartItemsContainer) return;
    
    const cart = obtenerCarrito();
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; color: var(--gray-300); display: block; margin-bottom: 1rem;"></i>
                    <p style="color: var(--gray-500);">Tu carrito está vacío</p>
                    <a href="tienda/" class="btn btn-primary mt-4">Ir a la Tienda</a>
                </td>
            </tr>
        `;
        if (cartTotalContainer) cartTotalContainer.textContent = 'Total: $0';
        return;
    }
    
    let html = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, '')) || 0;
        const subtotal = price * item.quantity;
        total += subtotal;
        
        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        <span>${item.name}</span>
                    </div>
                </td>
                <td>${item.price}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <button onclick="actualizarCantidad('${item.id}', ${item.quantity - 1})" style="width: 30px; height: 30px; border: 1px solid var(--gray-200); background: white; border-radius: 4px; cursor: pointer;">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="actualizarCantidad('${item.id}', ${item.quantity + 1})" style="width: 30px; height: 30px; border: 1px solid var(--gray-200); background: white; border-radius: 4px; cursor: pointer;">+</button>
                    </div>
                </td>
                <td><strong>$${subtotal.toFixed(0)}</strong></td>
                <td>
                    <button onclick="eliminarDelCarrito('${item.id}')" style="background: none; border: none; color: var(--danger); cursor: pointer; font-size: 1.1rem;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    cartItemsContainer.innerHTML = html;
    if (cartTotalContainer) cartTotalContainer.textContent = `Total: $${total.toFixed(0)}`;
}

/**
 * Vaciar carrito
 */
function vaciarCarrito() {
    if (confirm('¿Estás seguro de vaciar el carrito?')) {
        guardarCarrito([]);
        mostrarToast('Carrito vaciado', 'info');
    }
}

/**
 * Ir al checkout
 */
function irACheckout() {
    const cart = obtenerCarrito();
    if (cart.length === 0) {
        mostrarToast('Agrega productos al carrito primero', 'warning');
        return;
    }
    window.location.href = 'checkout.html';
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito();
    actualizarCarritoUI();
});

console.log('✅ Cart cargado');