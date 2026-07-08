// ========== PETFY - MODAL LOGIN COMPONENT ==========
var modalHTML = `
<div class="modal-overlay" id="loginModal">
    <div class="modal-container">
        <button class="modal-close-btn" onclick="cerrarModal()">&times;</button>
        <div id="formLogin">
            <div class="modal-icon">🐾</div>
            <h2>Iniciar Sesión</h2>
            <p class="modal-sub">Bienvenido de vuelta a Petfy</p>
            <form onsubmit="return loginModal(event)">
                <div class="modal-input-group"><input type="email" id="modalEmail" placeholder="tu@email.com" required></div>
                <div class="modal-input-group"><input type="password" id="modalPassword" placeholder="Contraseña" required></div>
                <button type="submit" class="modal-btn">Iniciar Sesión</button>
            </form>
            <p class="modal-switch">¿No tienes cuenta? <a href="#" onclick="mostrarRegistro()">Crear cuenta</a></p>
        </div>
        <div id="formRegistro" style="display:none;">
            <div class="modal-icon">🐾</div>
            <h2>Crear Cuenta</h2>
            <p class="modal-sub">Únete a la familia Petfy</p>
            <form onsubmit="return registroModal(event)">
                <div class="modal-input-group"><input type="text" id="regModalNombre" placeholder="Nombre" required></div>
                <div class="modal-input-group"><input type="email" id="regModalEmail" placeholder="Email" required></div>
                <div class="modal-input-group"><input type="password" id="regModalPassword" placeholder="Contraseña (mín 8)" required></div>
                <button type="submit" class="modal-btn">Crear Cuenta</button>
            </form>
            <p class="modal-switch">¿Ya tienes cuenta? <a href="#" onclick="mostrarLogin()">Iniciar Sesión</a></p>
        </div>
    </div>
</div>`;

function inicializarModal() {
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

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
    var password = document.getElementById('modalPassword').value.trim();
    if (email && password.length >= 4) {
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
    var password = document.getElementById('regModalPassword').value.trim();
    if (password.length < 8) { alert('Mínimo 8 caracteres'); return false; }
    var user = { nombre: nombre, apellido: '', email: email, telefono: '' };
    localStorage.setItem('petfyUser', JSON.stringify(user));
    localStorage.setItem('petfyLogged', 'true');
    actualizarUI(user);
    cerrarModal();
    return false;
}

document.addEventListener('DOMContentLoaded', inicializarModal);