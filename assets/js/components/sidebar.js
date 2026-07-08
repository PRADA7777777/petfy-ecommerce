// ========== PETFY - SIDEBAR COMPONENT ==========
var sidebarHTML = `
<div class="profile-overlay" id="profileOverlay" onclick="cerrarSidebar()"></div>
<div class="profile-sidebar" id="profileSidebar">
    <div class="profile-panel-header">
        <button class="profile-panel-close" onclick="cerrarSidebar()">&times;</button>
        <div class="profile-avatar-large">🐾</div>
        <h3 id="sidebarNombre">Usuario</h3>
        <p id="sidebarEmail">usuario@email.com</p>
        <span class="profile-badge-vip">⭐ Cliente VIP</span>
    </div>
    <div class="profile-kpis">
        <div class="profile-kpi"><span class="profile-kpi-number">5</span><span class="profile-kpi-label">Pedidos</span></div>
        <div class="profile-kpi"><span class="profile-kpi-number">3</span><span class="profile-kpi-label">Paseos</span></div>
        <div class="profile-kpi"><span class="profile-kpi-number">2</span><span class="profile-kpi-label">Mascotas</span></div>
    </div>
    <div class="profile-rewards">
        <div class="profile-points">💰 1,250 Puntos<small>Próximo nivel: 2,000</small></div>
        <div class="profile-coupons">🎁 2 Cupones</div>
    </div>
    <div class="profile-notification"><i class="fas fa-truck"></i> Tu pedido #2024001 fue entregado ✅</div>
    <div class="profile-menu">
        <a href="${getBasePath()}cuenta/perfil.html" class="profile-menu-item"><i class="fas fa-user"></i> Mi Perfil</a>
        <a href="${getBasePath()}cuenta/perfil.html#tab-pedidos" class="profile-menu-item"><i class="fas fa-shopping-bag"></i> Mis Pedidos<span class="badge-count">5</span></a>
        <a href="${getBasePath()}cuenta/perfil.html#tab-paseos" class="profile-menu-item"><i class="fas fa-calendar"></i> Mis Paseos<span class="badge-count">3</span></a>
        <a href="${getBasePath()}cuenta/perfil.html#tab-mascotas" class="profile-menu-item"><i class="fas fa-paw"></i> Mis Mascotas</a>
        <div class="profile-menu-divider"></div>
        <button class="profile-menu-item logout" onclick="cerrarSesion()"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</button>
    </div>
</div>`;

function inicializarSidebar() {
    document.body.insertAdjacentHTML('beforeend', sidebarHTML);
}

function abrirSidebar() {
    document.getElementById('profileSidebar').classList.add('active');
    document.getElementById('profileOverlay').classList.add('active');
}
function cerrarSidebar() {
    document.getElementById('profileSidebar').classList.remove('active');
    document.getElementById('profileOverlay').classList.remove('active');
}
function cerrarSesion() {
    localStorage.clear();
    window.location.href = getBasePath() + 'index.html';
}
function actualizarUI(user) {
    var btn = document.getElementById('btnCuenta');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-user-check" style="color:#10B981;"></i>';
        btn.setAttribute('data-logged', 'true');
    }
    document.getElementById('sidebarNombre').textContent = user.nombre;
    document.getElementById('sidebarEmail').textContent = user.email;
}

document.addEventListener('DOMContentLoaded', inicializarSidebar);