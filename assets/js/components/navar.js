
// ========== PETFY - NAVBAR COMPONENT ==========
function inicializarNavbar() {
    // Header sticky
    window.addEventListener('scroll', function() {
        var header = document.getElementById('mainHeader');
        if (header) header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Menú móvil
    var mobileBtn = document.querySelector('.mobile-menu-btn');
    if (mobileBtn) {
        mobileBtn.onclick = function() {
            var nav = document.querySelector('.nav-links');
            if (nav) nav.classList.toggle('active');
        };
    }
}

document.addEventListener('DOMContentLoaded', inicializarNavbar);