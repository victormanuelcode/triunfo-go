const posNS = window.CashierPOS = window.CashierPOS || {};
posNS.state = posNS.state || {
    API_URL: '/proyecto_final/backend',
    carrito: [],
    productosGlobal: [],
    ultimaVenta: null,
    sesionCajaId: null,
    metodoPagoSeleccionado: 'efectivo',
    quoteCache: null,
    quoteCartKey: null,
    quoteRefreshTimer: null,
    quoteBreakdownVisible: true,
    cajaAbiertaUI: false,
    loteModalProductoId: null,
    loteModalDisponibles: []
};
const API_URL = posNS.state.API_URL;

function showToastPOS(message, type = 'info') {
    return posNS.base.showToastPOS(message, type);
}

function getAuthHeaders(includeJson = false) {
    return posNS.base.getAuthHeaders(includeJson);
}

function getCartKey() {
    return posNS.base.getCartKey();
}

function scheduleQuoteRefresh() {
    return posNS.cart.scheduleQuoteRefresh();
}

function toggleQuoteBreakdown() {
    return posNS.cart.toggleQuoteBreakdown();
}

window.toggleQuoteBreakdown = toggleQuoteBreakdown;
window.cerrarModalLotes = function () { return posNS.cart.cerrarModalLotes(); };
window.seleccionarLoteModal = function (loteId) { return posNS.cart.seleccionarLoteModal(loteId); };

document.addEventListener('DOMContentLoaded', () => {
    posNS.cart?.init();
    posNS.box?.init();
    posNS.checkout?.init();
    posNS.postsale?.init();
    cargarCatalogo();
    cargarClientes();
    
    // Inicializar UI de pago
    seleccionarMetodoPago('efectivo');
});

// --- Gestión de Clientes y Catálogo ---
async function cargarClientes() {
    const select = document.getElementById('cliente-select');
    try {
        const response = await fetch(`${API_URL}/clients`, { headers: getAuthHeaders(false) });
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
    }
}

async function cargarCatalogo() {
    const container = document.getElementById('productos-catalogo');
    try {
        const response = await fetch(`${API_URL}/products`, { headers: getAuthHeaders(false) });
        const json = await response.json();
        
        // Manejar estructura paginada o array directo
        posNS.state.productosGlobal = Array.isArray(json) ? json : (json.data || []);
        renderizarCatalogo(posNS.state.productosGlobal);
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p style="text-align:center; color:red">Error de conexión</p>';
    }
}
window.cargarCatalogo = cargarCatalogo;

function renderizarCatalogo(productos) {
    const container = document.getElementById('productos-catalogo');
    container.innerHTML = '';

    if (productos.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No se encontraron productos.</p>';
        return;
    }

    productos.forEach(prod => {
        if (prod.stock_actual > 0) {
            // Manejo de imagen: si no hay URL, usar ícono placeholder
            let imgHtml = '';
            if (prod.imagen && prod.imagen.trim() !== '') {
                // Asumimos que la ruta viene relativa o absoluta. Si es subida localmente, ajustar path.
                // Ajuste rápido para rutas relativas si es necesario (e.g. uploads/)
                const imgSrc = prod.imagen.startsWith('http') ? prod.imagen : `../../${prod.imagen}`;
                imgHtml = `<img src="${imgSrc}" alt="${prod.nombre}" class="product-img" onerror="this.parentElement.innerHTML='<div class=\'product-placeholder-icon\'>📦</div>'">`;
            } else {
                imgHtml = `<div class="product-placeholder-icon" style="font-size:2rem;">📦</div>`;
            }

            const item = document.createElement('div');
            item.className = 'product-item';
            
            // Verificación de stock bajo
            let stockHtml = `<div class="stock">Stock: ${prod.stock_actual}</div>`;
            if (prod.stock_minimo && prod.stock_actual <= prod.stock_minimo) {
                stockHtml = `<div class="stock" style="color: #e74c3c; font-weight: bold;">
                                ⚠️ Stock: ${prod.stock_actual} (Bajo)
                             </div>`;
                item.style.border = '1px solid #e74c3c';
            }

            item.onclick = () => agregarAlCarrito(prod); // Click en toda la tarjeta agrega
            item.innerHTML = `
                <div class="product-img-container">
                    ${imgHtml}
                </div>
                <div class="product-info">
                    <h4>${prod.nombre}</h4>
                    ${stockHtml}
                    <div class="price">$${parseFloat(prod.precio_venta).toLocaleString('es-CO')}</div>
                    <button class="btn-add-product">
                        <span>+ Agregar</span>
                    </button>
                </div>
            `;
            container.appendChild(item);
        }
    });
}

function filtrarProductos() {
    return posNS.cart.filtrarProductos();
}

// --- Lógica del Carrito ---
function agregarAlCarrito(producto) {
    return posNS.cart.agregarAlCarrito(producto);
}

function cambiarCantidad(id, delta) {
    return posNS.cart.cambiarCantidad(id, delta);
}

function eliminarDelCarrito(id) {
    return posNS.cart.eliminarDelCarrito(id);
}

async function seleccionarLotePreferido(productoId) {
    return posNS.cart.seleccionarLotePreferido(productoId);
}

function actualizarCarritoUI() {
    return posNS.cart.actualizarCarritoUI();
}

// --- Gestión de Pagos ---
function seleccionarMetodoPago(metodo) {
    posNS.state.metodoPagoSeleccionado = metodo;
    
    // Actualizar UI visual
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(`opt-${metodo}`).classList.add('selected');

    // Mostrar/Ocultar detalles de efectivo
    const cashDetails = document.getElementById('cash-details');
    if (metodo === 'efectivo') {
        cashDetails.style.display = 'block';
        setTimeout(() => document.getElementById('monto-recibido').focus(), 100);
    } else {
        cashDetails.style.display = 'none';
        document.getElementById('monto-recibido').value = '';
        document.getElementById('texto-cambio').innerText = '$0';
    }
}

function calcularCambio(totalActual = null) {
    if (posNS.state.metodoPagoSeleccionado !== 'efectivo') return;

    // Obtener total si no se pasa como arg
    let total = totalActual;
    if (total === null) {
        // Recalcular total desde carrito
        total = posNS.state.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }

    const recibido = parseFloat(document.getElementById('monto-recibido').value) || 0;
    const cambio = recibido - total;

    const cambioEl = document.getElementById('texto-cambio');
    if (cambio >= 0) {
        cambioEl.innerText = '$' + cambio.toLocaleString('es-CO');
        cambioEl.style.color = 'var(--primary-dark)';
    } else {
        cambioEl.innerText = 'Falta $' + Math.abs(cambio).toLocaleString('es-CO');
        cambioEl.style.color = 'var(--danger)';
    }
}

