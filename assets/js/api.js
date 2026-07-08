// ========== PETFY - API ==========
var API = {
    baseURL: 'https://api.petfy.com/v1',
    token: null,
    
    // Configurar headers
    headers: function() {
        var headers = { 'Content-Type': 'application/json' };
        if (this.token) headers['Authorization'] = 'Bearer ' + this.token;
        return headers;
    },
    
    // GET
    get: async function(endpoint) {
        try {
            var response = await fetch(this.baseURL + endpoint, { headers: this.headers() });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { status: 'error', message: error.message };
        }
    },
    
    // POST
    post: async function(endpoint, data) {
        try {
            var response = await fetch(this.baseURL + endpoint, {
                method: 'POST',
                headers: this.headers(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { status: 'error', message: error.message };
        }
    },
    
    // PUT
    put: async function(endpoint, data) {
        try {
            var response = await fetch(this.baseURL + endpoint, {
                method: 'PUT',
                headers: this.headers(),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { status: 'error', message: error.message };
        }
    },
    
    // DELETE
    delete: async function(endpoint) {
        try {
            var response = await fetch(this.baseURL + endpoint, {
                method: 'DELETE',
                headers: this.headers()
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { status: 'error', message: error.message };
        }
    },
    
    // Productos
    getProductos: function(params) { return this.get('/productos' + (params || '')); },
    getProducto: function(id) { return this.get('/productos/' + id); },
    
    // Servicios
    getServicios: function() { return this.get('/servicios'); },
    crearReserva: function(data) { return this.post('/reservas', data); },
    
    // Usuarios
    login: function(data) { return this.post('/usuarios/login', data); },
    registro: function(data) { return this.post('/usuarios/registro', data); },
    getPerfil: function() { return this.get('/usuarios/perfil'); },
    
    // Pedidos
    crearPedido: function(data) { return this.post('/pedidos', data); },
    getPedidos: function() { return this.get('/pedidos'); },
    
    // Contacto
    enviarContacto: function(data) { return this.post('/contacto', data); },
    
    // Pagos
    crearPago: function(data) { return this.post('/pagos/wompi', data); }
};

console.log('✅ API cargada');