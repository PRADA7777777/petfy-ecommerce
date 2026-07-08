// ========== PETFY - VALIDATORS ==========
var Validators = {
    // Validar email
    email: function(email) {
        var regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    // Validar teléfono colombiano
    telefono: function(telefono) {
        var regex = /^(\+57)?[3][0-9]{9}$/;
        return regex.test(telefono.replace(/\s/g, ''));
    },
    
    // Validar contraseña (mín 8 caracteres)
    password: function(password) {
        return password && password.length >= 8;
    },
    
    // Validar nombre (mín 2 caracteres)
    nombre: function(nombre) {
        return nombre && nombre.trim().length >= 2;
    },
    
    // Validar formulario completo
    form: function(data) {
        var errors = [];
        if (!this.email(data.email)) errors.push('Email inválido');
        if (data.password && !this.password(data.password)) errors.push('Contraseña muy corta (mín 8)');
        if (data.nombre && !this.nombre(data.nombre)) errors.push('Nombre muy corto');
        if (data.telefono && !this.telefono(data.telefono)) errors.push('Teléfono inválido');
        return { valid: errors.length === 0, errors: errors };
    },
    
    // Mostrar errores en formulario
    showErrors: function(errors, container) {
        if (!container) return;
        container.innerHTML = errors.map(function(e) { return '<p style="color:#EF4444;font-size:0.85rem;">⚠️ ' + e + '</p>'; }).join('');
    }
};

console.log('✅ Validators cargado');