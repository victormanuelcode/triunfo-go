const API_URL = '/proyecto_final/backend';
let carrito = [];
let productosGlobal = [];

let sesionCajaId = null;

document.addEventListener('DOMContentLoaded', () => {
    // Cargar carrito desde localStorage
    const carritoGuardado = localStorage.getItem('pos_carrito');
    if (carritoGuardado) {
        try {
            carrito = JSON.parse(carritoGuardado);
            actualizarCarritoUI();
        } catch (e) {
            console.error('Error cargando carrito guardado', e);
            carrito = [];
        }
    }

    verificarEstadoCaja();
    cargarCatalogo();
    cargarClientes();
});

// Función auxiliar para persistir el carrito
function guardarCarrito() {
    localStorage.setItem('pos_carrito', JSON.stringify(carrito));
}

async function verificarEstadoCaja() {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

    try {
        const response = await fetch(`${API_URL}/box/status?usuario_id=${usuarioId}`);
        const sesion = await response.json();

        if (sesion && sesion.estado === 'abierta') {
            sesionCajaId = sesion.id_sesion;
            // document.getElementById('modal-apertura-caja').style.display = 'none'; // Ya no es bloqueante
            // Guardar datos sesión para el cierre
            localStorage.setItem('sesion_actual', JSON.stringify(sesion));
            actualizarBotonCaja(true);
        } else {
            sesionCajaId = null;
            // document.getElementById('modal-apertura-caja').style.display = 'flex'; // ELIMINADO: Ya no bloqueamos la pantalla
            actualizarBotonCaja(false);
        }
    } catch (error) {
        console.error('Error verificando caja:', error);
        // alert('Error verificando estado de caja. Revise conexión.'); // Silencioso para no molestar
    }
}

function actualizarBotonCaja(estaAbierta) {
    const btnCaja = document.getElementById('btn-gestion-caja');
    if (btnCaja) {
        if (estaAbierta) {
            btnCaja.innerText = "Cerrar Caja";
            btnCaja.onclick = mostrarModalCierreCaja;
        } else {
            btnCaja.innerText = "Abrir Caja";
            btnCaja.onclick = mostrarModalAperturaCaja;
        }
    }
}

function mostrarModalAperturaCaja() {
    document.getElementById('modal-apertura-caja').style.display = 'flex';
}

function cerrarModalApertura() {
    document.getElementById('modal-apertura-caja').style.display = 'none';
}

async function abrirCaja() {
    const monto = document.getElementById('monto-apertura').value;
    const usuarioId = localStorage.getItem('usuario_id');

    if (monto === '') {
        alert('Ingrese un monto inicial (0 si está vacía).');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/box/open`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: usuarioId,
                monto_apertura: monto
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Caja abierta correctamente.');
            document.getElementById('modal-apertura-caja').style.display = 'none'; // Cerrar modal al éxito
            verificarEstadoCaja();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión al abrir caja.');
    }
}

function mostrarModalCierreCaja() {
    if (!sesionCajaId) {
        alert('No hay caja abierta.');
        return;
    }

    const sesion = JSON.parse(localStorage.getItem('sesion_actual'));
    // Actualizar total ventas consultando API nuevamente para tener dato fresco
    fetch(`${API_URL}/box/status?usuario_id=${localStorage.getItem('usuario_id')}`)
        .then(res => res.json())
        .then(data => {
            if(data) {
                const inicial = parseFloat(data.monto_apertura);
                const ventas = parseFloat(data.total_ventas);
                const total = inicial + ventas;

                document.getElementById('cierre-inicial').innerText = `$${inicial.toLocaleString()}`;
                document.getElementById('cierre-ventas').innerText = `$${ventas.toLocaleString()}`;
                document.getElementById('cierre-esperado').innerText = `$${total.toLocaleString()}`;
                
                document.getElementById('modal-cierre-caja').style.display = 'flex';
            }
        });
}

function cerrarModalCierre() {
    document.getElementById('modal-cierre-caja').style.display = 'none';
}

async function procesarCierreCaja() {
    const montoCierre = document.getElementById('monto-cierre').value;

    if (montoCierre === '') {
        alert('Ingrese el monto real en caja.');
        return;
    }

    if (!confirm('¿Seguro que desea cerrar la caja? Esta acción no se puede deshacer.')) return;

    try {
        const response = await fetch(`${API_URL}/box/close`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_sesion: sesionCajaId,
                monto_cierre: montoCierre
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Caja cerrada correctamente. Se cerrará la sesión.');
            logout();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error(error);
        alert('Error al cerrar caja.');
    }
}

async function cargarClientes() {
    const select = document.getElementById('cliente-select');
    try {
        const response = await fetch(`${API_URL}/clients`);
        const clientes = await response.json();
        
        select.innerHTML = '<option value="">Cliente General (Público)</option>';
        
        clientes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id_cliente;
            option.textContent = c.nombre + (c.documento ? ` - ${c.documento}` : '');
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando clientes:', error);
        select.innerHTML = '<option value="">Error al cargar clientes</option>';
    }
}

// Cargar productos disponibles
async function cargarCatalogo() {
    const container = document.getElementById('productos-catalogo');
    try {
        const response = await fetch(`${API_URL}/products`);
        const json = await response.json();

        // Adaptar a la respuesta paginada del backend { data: [...], meta: {...} }
        productosGlobal = Array.isArray(json) ? json : (json.data || []);
        
        renderizarCatalogo(productosGlobal);
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p style="text-align:center; color:red">Error de conexión</p>';
    }
}

function renderizarCatalogo(productos) {
    const container = document.getElementById('productos-catalogo');
    container.innerHTML = '';

    if (productos.length === 0) {
        container.innerHTML = '<p>No hay productos.</p>';
        return;
    }

    productos.forEach(prod => {
        // Solo mostrar productos con stock > 0
        if (prod.stock_actual > 0) {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.onclick = () => agregarAlCarrito(prod);
            item.innerHTML = `
                <h4>${prod.nombre}</h4>
                <div class="desc" style="font-size: 12px; color: #666; margin: 4px 0;">${(prod.descripcion || '').substring(0, 80)}${(prod.descripcion && prod.descripcion.length > 80) ? '…' : ''}</div>
                <div class="price">$${parseFloat(prod.precio_venta).toLocaleString()}</div>
                <div class="stock">Stock: ${prod.stock_actual}</div>
            `;
            container.appendChild(item);
        }
    });
}

function filtrarProductos() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filtrados = productosGlobal.filter(p => {
        const nombre = (p.nombre || '').toLowerCase();
        const desc = (p.descripcion || '').toLowerCase();
        return nombre.includes(texto) || desc.includes(texto);
    });
    renderizarCatalogo(filtrados);
}

// Lógica del Carrito
function agregarAlCarrito(producto) {
    const existente = carrito.find(item => item.id_producto === producto.id_producto);

    if (existente) {
        if (existente.cantidad < producto.stock_actual) {
            existente.cantidad++;
        } else {
            alert('No hay más stock disponible');
        }
    } else {
        carrito.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio: parseFloat(producto.precio_venta),
            cantidad: 1,
            max_stock: producto.stock_actual
        });
    }
    guardarCarrito();
    actualizarCarritoUI();
}

function cambiarCantidad(id, delta) {
    const item = carrito.find(p => p.id_producto === id);
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad > 0 && nuevaCantidad <= item.max_stock) {
        item.cantidad = nuevaCantidad;
    } else if (nuevaCantidad <= 0) {
        eliminarDelCarrito(id);
        return;
    } else {
        alert('Stock máximo alcanzado');
    }
    guardarCarrito();
    actualizarCarritoUI();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.id_producto !== id);
    guardarCarrito();
    actualizarCarritoUI();
}

function actualizarCarritoUI() {
    const container = document.getElementById('carrito-items');
    const totalSpan = document.getElementById('total-amount');
    
    container.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        container.innerHTML = '<div class="empty-cart-msg">El carrito está vacío</div>';
        totalSpan.innerText = '$0';
        return;
    }

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="item-info">
                <h5>${item.nombre}</h5>
                <small>$${item.precio.toLocaleString()} x ${item.cantidad}</small>
            </div>
            <div class="item-controls">
                <button class="btn-qty" onclick="cambiarCantidad(${item.id_producto}, -1)">-</button>
                <span>${item.cantidad}</span>
                <button class="btn-qty" onclick="cambiarCantidad(${item.id_producto}, 1)">+</button>
                <button class="btn-remove" onclick="eliminarDelCarrito(${item.id_producto})">&times;</button>
            </div>
        `;
        container.appendChild(div);
    });

    totalSpan.innerText = `$${total.toLocaleString()}`;
}

async function procesarVenta() {
    if (carrito.length === 0) {
        alert('Agrega productos al carrito primero.');
        return;
    }

    if (!confirm('¿Confirmar venta?')) return;

    // Preparar datos para el backend
    const itemsVenta = carrito.map(item => ({
        producto_id: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio
    }));

    const totalVenta = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const clienteId = document.getElementById('cliente-select').value;
    const metodoPago = document.getElementById('metodo-pago-select').value; // Nuevo selector
    const usuarioId = localStorage.getItem('usuario_id'); // Obtener ID del usuario actual

    const data = {
        items: itemsVenta,
        total: totalVenta,
        metodo_pago: metodoPago,
        cliente_id: clienteId || null, // Si es vacío envía null
        usuario_id: usuarioId, // Enviar usuario responsable
        sesion_id: sesionCajaId
    };

    try {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Venta exitosa! Factura: ${result.numero_factura}`);
            carrito = []; // Vaciar carrito
            localStorage.removeItem('pos_carrito'); // Limpiar persistencia
            actualizarCarritoUI();
            cargarCatalogo(); // Recargar stock
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión al procesar venta.');
    }
}
