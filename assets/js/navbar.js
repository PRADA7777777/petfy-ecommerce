// ========== PETFY - NAVBAR ==========

/**
 * Inicializar menú de navegación
 */
function initNavbar() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navMenu = document.querySelector('.nav-menu');
    
    if (!mobileMenuBtn || !navLinks) return;
    
    // Toggle menú móvil
    mobileMenuBtn.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        if (navMenu) navMenu.classList.toggle('active');
        
        const icon = this.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
            document.body.style.overflow = 'hidden';
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
            document.body.style.overflow = '';
        }
    });
    
    // Cerrar al hacer clic en un enlace
    navLinks.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => cerrarMenuMovil(mobileMenuBtn, navLinks, navMenu));
    });
    
    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active')) {
            if (!e.target.closest('.nav-links') && !e.target.closest('.mobile-menu-btn') && !e.target.closest('.nav-menu')) {
                cerrarMenuMovil(mobileMenuBtn, navLinks, navMenu);
            }
        }
    });
    
    // Cerrar con tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            cerrarMenuMovil(mobileMenuBtn, navLinks, navMenu);
        }
    });
    
    // Marcar enlace activo según página actual
    marcarEnlaceActivo();
    
    // Dropdown en hover (desktop)
    initDropdowns();
}

/**
 * Cerrar menú móvil
 */
function cerrarMenuMovil(btn, navLinks, navMenu) {
    navLinks.classList.remove('active');
    if (navMenu) navMenu.classList.remove('active');
    const icon = btn.querySelector('i');
    icon.classList.remove('fa-times');
    icon.classList.add('fa-bars');
    document.body.style.overflow = '';
}

/**
 * Marcar enlace activo según URL actual
 */
function marcarEnlaceActivo() {
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'index.html';
    const currentFolder = path.split('/').filter(p => p).slice(-2, -1)[0];
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href') || '';
        
        if (currentPage === 'index.html' && (href === 'index.html' || href === '../index.html' || href === './' || href === '/')) {
            link.classList.add('active');
        } else if (currentFolder && href.includes(currentFolder)) {
            link.classList.add('active');
        } else if (href.includes(currentPage.replace('.html', ''))) {
            link.classList.add('active');
        }
    });
}

/**
 * Inicializar dropdowns
 */
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown-trigger');
    
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-link');
        if (!link) return;
        
        // En desktop, mostrar dropdown al hacer hover
        if (window.innerWidth > 1024) {
            dropdown.addEventListener('mouseenter', () => {
                link.style.color = 'var(--primary)';
            });
            
            dropdown.addEventListener('mouseleave', () => {
                if (!link.classList.contains('active')) {
                    link.style.color = '';
                }
            });
        }
    });
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initNavbar);

// Reinicializar en resize
window.addEventListener('resize', () => {
    const navLinks = document.querySelector('.nav-links');
    if (navLinks && window.innerWidth > 1024) {
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
        const icon = document.querySelector('.mobile-menu-btn i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
});

console.log('✅ Navbar cargado');