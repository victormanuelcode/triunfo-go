const API_URL = 'http://localhost/proyecto_final/backend';

document.addEventListener('DOMContentLoaded', () => {
    console.log('App iniciada');
    cargarProductos();
    cargarCategoriasSelect();
    cargarUnidadesSelect();
    cargarProveedoresSelect();
    
    // Configurar modales
    setupModal();
    setupUnidadesModal(); 
    
    // Listener global para cerrar modales al hacer click fuera
    window.onclick = function(event) {
        const modalProductos = document.getElementById('productoModal');
        const modalUnidades = document.getElementById('unidadesModal');
        
        if (modalProductos && event.target == modalProductos) {
            modalProductos.style.display = "none";
        }
        if (modalUnidades && event.target == modalUnidades) {
            modalUnidades.style.display = "none";
            cargarUnidadesSelect(); 
        }
    };
});

// Cargar unidades en el select del modal
async function cargarUnidadesSelect() {
    const select = document.getElementById('unidad_medida_id');
    try {
        const response = await fetch(`${API_URL}/units`);
        const unidades = await response.json();
        
        select.innerHTML = '<option value="">Seleccione una unidad</option>';
        unidades.forEach(uni => {
            select.innerHTML += `<option value="${uni.id_unidad}">${uni.nombre} (${uni.abreviatura})</option>`;
        });
    } catch (error) {
        console.error('Error cargando unidades:', error);
    }
}

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

// Cargar proveedores en el select del modal
async function cargarProveedoresSelect() {
    const select = document.getElementById('proveedor_id');
    try {
        const response = await fetch(`${API_URL}/suppliers`);
        const proveedores = await response.json();
        
        select.innerHTML = '<option value="">Seleccione un proveedor</option>';
        proveedores.forEach(prov => {
            select.innerHTML += `<option value="${prov.id_proveedor}">${prov.nombre}</option>`;
        });
    } catch (error) {
        console.error('Error cargando proveedores:', error);
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
            // El backend guarda 'uploads/products/xxx.jpg'. 
            // API_URL es '.../backend'.
            // La imagen está en '.../backend/uploads/products/xxx.jpg'.
            // Entonces: API_URL + '/' + prod.imagen debería ser correcto si prod.imagen no tiene slash inicial.
            const imgSrc = prod.imagen ? `${API_URL}/${prod.imagen}` : 'https://via.placeholder.com/150?text=Sin+Imagen';
            
            const card = `
                <div class="card-producto">
                    <div class="card-img-wrapper" style="height: 150px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f0f0f0;">
                        <img src="${imgSrc}" alt="${prod.nombre}" style="max-width: 100%; max-height: 100%; object-fit: cover;">
                    </div>
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

// Lógica del Modal de Gestión de Unidades
function setupUnidadesModal() {
    const modal = document.getElementById('unidadesModal');
    const btnGestionar = document.getElementById('btnGestionarUnidades');
    const spanClose = document.getElementsByClassName('close-modal-unidades')[0];
    const btnClose = document.getElementsByClassName('close-modal-unidades-btn')[0];
    const btnGuardar = document.getElementById('btnGuardarUnidad');
    const tbody = document.getElementById('tablaUnidadesBody');

    // Abrir modal
    if (btnGestionar) {
        btnGestionar.onclick = function() {
            console.log('Abriendo modal unidades');
            if(modal) {
                modal.style.display = "block";
                cargarTablaUnidades();
            } else {
                console.error('Modal unidades no encontrado');
            }
        }
    } else {
        console.error('Botón gestionar unidades no encontrado');
    }

    // Cerrar modal
    function closeModal() {
        modal.style.display = "none";
        // Recargar select de unidades en el formulario de producto
        cargarUnidadesSelect();
    }

    spanClose.onclick = closeModal;
    btnClose.onclick = closeModal;

    // Clic fuera del modal (Manejado globalmente en DOMContentLoaded)
    /*
    window.onclick = function(event) {
        const modalProductos = document.getElementById('productoModal');
        const modalUnidades = document.getElementById('unidadesModal');
        
        if (event.target == modalProductos) {
            modalProductos.style.display = "none";
        }
        if (event.target == modalUnidades) {
            modalUnidades.style.display = "none";
            cargarUnidadesSelect(); // Recargar al cerrar
        }
    }
    */

    // Cargar tabla de unidades
    async function cargarTablaUnidades() {
        tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';
        try {
            const response = await fetch(`${API_URL}/units`);
            const unidades = await response.json();
            
            tbody.innerHTML = '';
            if (unidades.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3">No hay unidades registradas.</td></tr>';
                return;
            }

            unidades.forEach(uni => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${uni.nombre}</td>
                    <td>${uni.abreviatura}</td>
                    <td>
                        <button class="btn-danger btn-sm" onclick="eliminarUnidadDesdeModal(${uni.id_unidad})">Eliminar</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="3" style="color:red">Error al cargar unidades.</td></tr>';
        }
    }

    // Guardar nueva unidad
    btnGuardar.onclick = async function() {
        const nombre = document.getElementById('nuevaUnidadNombre').value;
        const abrev = document.getElementById('nuevaUnidadAbrev').value;

        if (!nombre || !abrev) {
            alert('Por favor complete ambos campos.');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/units`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nombre, abreviatura: abrev })
            });

            if (response.ok) {
                document.getElementById('nuevaUnidadNombre').value = '';
                document.getElementById('nuevaUnidadAbrev').value = '';
                cargarTablaUnidades();
            } else {
                alert('Error al guardar unidad.');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión.');
        }
    }

    // Función global para eliminar (necesaria para el onclick en el HTML generado)
    window.eliminarUnidadDesdeModal = async function(id) {
        if (!confirm('¿Eliminar esta unidad?')) return;
        
        try {
            const response = await fetch(`${API_URL}/units/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                cargarTablaUnidades();
            } else {
                alert('No se puede eliminar (posiblemente en uso).');
            }
        } catch (error) {
            console.error(error);
            alert('Error al eliminar.');
        }
    }
}

// Lógica del Modal Producto (setupModal existente)
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
    
    // Clic fuera del modal (Manejado globalmente)
    /*
    window.onclick = function(event) {
        // Manejado globalmente en setupUnidadesModal o unificado abajo
    }
    */

    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const id = document.getElementById('productoId').value;
        const nombre = document.getElementById('nombre').value;
        const descripcion = document.getElementById('descripcion').value;
        const categoria_id = document.getElementById('categoria_id').value;
        const unidad_medida_id = document.getElementById('unidad_medida_id').value;
        const proveedor_id = document.getElementById('proveedor_id').value;
        const precio = document.getElementById('precio_venta').value;
        const stock = document.getElementById('stock_actual').value;
        const imagenInput = document.getElementById('imagen');

        const hasImage = imagenInput.files.length > 0;
        let url = `${API_URL}/products`;
        let options;

        if (!id) {
            if (hasImage) {
                const formData = new FormData();
                formData.append('nombre', nombre);
                formData.append('descripcion', descripcion);
                formData.append('categoria_id', categoria_id);
                formData.append('unidad_medida_id', unidad_medida_id);
                formData.append('proveedor_id', proveedor_id);
                formData.append('precio_venta', precio);
                formData.append('stock_actual', stock);
                formData.append('estado', 'activo');
                formData.append('imagen', imagenInput.files[0]);
                options = { method: 'POST', body: formData };
            } else {
                const payload = {
                    nombre,
                    descripcion,
                    categoria_id,
                    unidad_medida_id,
                    proveedor_id,
                    precio_venta: precio,
                    stock_actual: stock,
                    estado: 'activo'
                };
                options = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                };
            }
        } else {
            url = `${API_URL}/products/${id}`;
            if (hasImage) {
                const formData = new FormData();
                formData.append('nombre', nombre);
                formData.append('descripcion', descripcion);
                formData.append('categoria_id', categoria_id);
                formData.append('unidad_medida_id', unidad_medida_id);
                formData.append('proveedor_id', proveedor_id);
                formData.append('precio_venta', precio);
                formData.append('stock_actual', stock);
                formData.append('estado', 'activo');
                formData.append('imagen', imagenInput.files[0]);
                options = { method: 'POST', body: formData };
            } else {
                const payload = {
                    nombre,
                    descripcion,
                    categoria_id,
                    unidad_medida_id,
                    proveedor_id,
                    precio_venta: precio,
                    stock_actual: stock,
                    estado: 'activo'
                };
                options = {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                };
            }
        }

        try {
            const response = await fetch(url, options);

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
        document.getElementById('descripcion').value = prod.descripcion || '';
        document.getElementById('categoria_id').value = prod.categoria_id;
        document.getElementById('unidad_medida_id').value = prod.unidad_medida_id;
        document.getElementById('proveedor_id').value = prod.proveedor_id || '';
        document.getElementById('precio_venta').value = prod.precio_venta;
        document.getElementById('stock_actual').value = prod.stock_actual;
        
        // Limpiar input file
        document.getElementById('imagen').value = '';

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
