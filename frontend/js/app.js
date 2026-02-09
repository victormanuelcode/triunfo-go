const API_URL = 'http://localhost/proyecto_final/backend';

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    cargarCategoriasSelect(); // Nueva función
    setupModal();
});

// Cargar categorías en el select del modal
async function cargarCategoriasSelect() {
    const select = document.getElementById('categoria_id');
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categorias = await response.json();
        
        select.innerHTML = '<option value="">Seleccione una categoría</option>';
        categorias.forEach(cat => {
            select.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre}</option>`;
        });
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function cargarProductos() {
    const container = document.getElementById('productos-container');
    
    try {
        const response = await fetch(`${API_URL}/products`);
        const productos = await response.json();

        container.innerHTML = '';

        if (productos.length === 0) {
            container.innerHTML = '<div class="loading-spinner">No hay productos registrados.</div>';
            return;
        }

        productos.forEach(prod => {
            const card = `
                <div class="card-producto">
                    <span class="stock-badge ${prod.stock_actual <= prod.stock_minimo ? 'stock-low' : ''}">
                        Stock: ${prod.stock_actual}
                    </span>
                    <div class="card-body">
                        <h3 class="card-title">${prod.nombre}</h3>
                        <p class="card-desc">${prod.descripcion || 'Sin descripción'}</p>
                        <p class="price-tag">$${parseFloat(prod.precio_venta).toLocaleString()}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn-edit" onclick="editarProducto(${prod.id_producto})">Editar</button>
                        <button class="btn-danger" onclick="eliminarProducto(${prod.id_producto})">Eliminar</button>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

    } catch (error) {
        console.error('Error cargando productos:', error);
        container.innerHTML = '<div class="loading-spinner" style="color:red">Error al conectar con el servidor.</div>';
    }
}

// Lógica del Modal
function setupModal() {
    const modal = document.getElementById('productoModal');
    const btnNuevo = document.getElementById('btnNuevoProducto');
    const spanClose = document.getElementsByClassName('close-modal')[0];
    const btnCancel = document.getElementsByClassName('close-modal-btn')[0];
    const form = document.getElementById('productoForm');

    // Abrir modal para crear
    btnNuevo.onclick = function() {
        form.reset();
        document.getElementById('productoId').value = ''; 
        modal.style.display = "block";
    }

    // Cerrar modal
    function closeModal() {
        modal.style.display = "none";
    }

    spanClose.onclick = closeModal;
    btnCancel.onclick = closeModal;
    
    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    // Manejar envío del formulario
    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const id = document.getElementById('productoId').value;
        const nombre = document.getElementById('nombre').value;
        const categoria_id = document.getElementById('categoria_id').value;
        const precio = document.getElementById('precio_venta').value;
        const stock = document.getElementById('stock_actual').value;

        const data = {
            nombre: nombre,
            categoria_id: categoria_id,
            precio_venta: precio,
            stock_actual: stock,
            // Valores por defecto
            estado: 'activo'
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                closeModal();
                cargarProductos();
            } else {
                const res = await response.json();
                alert('Error al guardar: ' + (res.message || 'Desconocido'));
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    }
}

// Funciones globales para que el HTML las acceda
window.editarProducto = async function(id) {
    try {
        const response = await fetch(`${API_URL}/products/${id}`);
        const prod = await response.json();

        // Llenar formulario
        document.getElementById('productoId').value = prod.id_producto;
        document.getElementById('nombre').value = prod.nombre;
        document.getElementById('categoria_id').value = prod.categoria_id; // Cargar categoría
        document.getElementById('precio_venta').value = prod.precio_venta;
        document.getElementById('stock_actual').value = prod.stock_actual;

        // Abrir modal
        document.getElementById('productoModal').style.display = "block";
    } catch (error) {
        console.error(error);
        alert('Error al cargar datos del producto');
    }
}

window.eliminarProducto = async function(id) {
    if(confirm('¿Estás seguro de eliminar este producto?')) {
        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE'
            });
            cargarProductos(); 
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar producto');
        }
    }
}
