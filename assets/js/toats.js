// ========== PETFY - TOAST NOTIFICATIONS ==========
var Toast = {
    show: function(mensaje, tipo) {
        tipo = tipo || 'success';
        var colores = { success: '#10B981', error: '#EF4444', warning: '#F59E0B', info: '#3B82F6' };
        var iconos = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        
        var toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;bottom:30px;right:30px;background:' + colores[tipo] + ';color:white;padding:1rem 1.5rem;border-radius:12px;font-weight:600;font-size:0.9rem;z-index:9999;animation:toastIn 0.3s ease;box-shadow:0 10px 25px rgba(0,0,0,0.2);font-family:\'Nunito\',sans-serif;display:flex;align-items:center;gap:0.5rem;max-width:400px;';
        toast.innerHTML = iconos[tipo] + ' ' + mensaje;
        document.body.appendChild(toast);
        
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    },
    
    success: function(msg) { this.show(msg, 'success'); },
    error: function(msg) { this.show(msg, 'error'); },
    warning: function(msg) { this.show(msg, 'warning'); },
    info: function(msg) { this.show(msg, 'info'); }
};

console.log('✅ Toast cargado');