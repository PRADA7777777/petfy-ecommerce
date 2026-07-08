// ========== PETFY - CATÁLOGO DE PRODUCTOS ==========
var Catalogo = {
    productos: [
        {
            id: 'prod-01',
            nombre: 'Royal Canin Adult Raza Pequeña 2kg',
            marca: 'Royal Canin',
            precio: 19999,
            precioOriginal: 25000,
            descuento: 20,
            categoria: 'alimentacion',
            mascota: 'perros',
            stock: 50,
            rating: 4.8,
            resenas: 128,
            imagen: 'assets/img/productos/producto-01.jpg',
            descripcion: 'Alimento premium para perros adultos de razas pequeñas (1-10 kg).'
        },
        {
            id: 'prod-02',
            nombre: 'Cama Ortopédica Memory Foam Grande',
            marca: 'PetStyle',
            precio: 45990,
            categoria: 'hogar',
            mascota: 'perros',
            stock: 25,
            rating: 5.0,
            resenas: 95,
            imagen: 'assets/img/productos/producto-02.jpg',
            descripcion: 'Cama ortopédica con espuma memory foam de alta densidad.'
        },
        {
            id: 'prod-03',
            nombre: 'Pro Plan Adulto Raza Mediana 3kg',
            marca: 'Pro Plan',
            precio: 35990,
            categoria: 'alimentacion',
            mascota: 'perros',
            stock: 30,
            rating: 4.5,
            resenas: 67,
            imagen: 'assets/img/productos/producto-03.jpg',
            descripcion: 'Alimento balanceado para perros adultos de raza mediana.'
        },
        {
            id: 'prod-04',
            nombre: 'Juguete Kong Classic Rojo',
            marca: 'Kong',
            precio: 25990,
            categoria: 'accesorios',
            mascota: 'perros',
            stock: 40,
            rating: 4.9,
            resenas: 210,
            imagen: 'assets/img/productos/producto-04.jpg',
            descripcion: 'Juguete resistente de caucho natural.'
        },
        {
            id: 'prod-05',
            nombre: 'Shampoo Hipoalergénico 500ml',
            marca: 'PetStyle',
            precio: 18990,
            categoria: 'higiene',
            mascota: 'perros',
            stock: 35,
            rating: 4.3,
            resenas: 45,
            imagen: 'assets/img/productos/producto-05.jpg',
            descripcion: 'Shampoo hipoalergénico para pieles sensibles.'
        }
    ],
    
    getAll: function() {
        return this.productos;
    },
    
    getById: function(id) {
        return this.productos.find(function(p) { return p.id === id; });
    },
    
    getByCategoria: function(categoria) {
        return this.productos.filter(function(p) { return p.categoria === categoria; });
    },
    
    search: function(query) {
        var q = query.toLowerCase();
        return this.productos.filter(function(p) {
            return p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q);
        });
    },
    
    getDestacados: function(limit) {
        return this.productos.sort(function(a, b) { return b.rating - a.rating; }).slice(0, limit || 4);
    }
};

console.log('✅ Catálogo cargado: ' + Catalogo.productos.length + ' productos');