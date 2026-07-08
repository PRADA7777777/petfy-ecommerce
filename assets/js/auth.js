// ========== PETFY - AUTH ==========
var Auth = {
    // Verificar si hay sesión activa
    isLogged: function() {
        return localStorage.getItem('petfyLogged') === 'true';
    },
    
    // Obtener usuario actual
    getUser: function() {
        return JSON.parse(localStorage.getItem('petfyUser') || '{}');
    },
    
    // Guardar usuario
    saveUser: function(user) {
        localStorage.setItem('petfyUser', JSON.stringify(user));
        localStorage.setItem('petfyLogged', 'true');
    },
    
    // Login
    login: function(email, password) {
        if (!email || password.length < 4) {
            return { success: false, message: 'Credenciales inválidas' };
        }
        var user = {
            nombre: email.split('@')[0],
            apellido: '',
            email: email,
            telefono: '',
            beneficios: {}
        };
        this.saveUser(user);
        return { success: true, user: user };
    },
    
    // Registro
    registro: function(nombre, email, password) {
        if (!nombre || !email || password.length < 8) {
            return { success: false, message: 'Datos inválidos' };
        }
        var user = {
            nombre: nombre,
            apellido: '',
            email: email,
            telefono: '',
            beneficios: {
                descuento50: true,
                paseoGratis: true,
                codigoDescuento: 'BIENVENIDO50',
                codigoPaseo: 'PASEOGRATIS1'
            }
        };
        this.saveUser(user);
        return { success: true, user: user };
    },
    
    // Logout
    logout: function() {
        localStorage.removeItem('petfyLogged');
        localStorage.removeItem('petfyUser');
        window.location.href = 'index.html';
    },
    
    // Actualizar perfil
    updateProfile: function(data) {
        var user = this.getUser();
        Object.assign(user, data);
        this.saveUser(user);
        return user;
    }
};

console.log('✅ Auth cargado');