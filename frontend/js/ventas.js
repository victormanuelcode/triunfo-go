const API_URL = '/proyecto_final/backend';
let carrito = [];
let productosGlobal = [];
let ultimaVenta = null; // Para guardar los datos de la última venta exitosa
let sesionCajaId = null;
let metodoPagoSeleccionado = 'efectivo'; // Default
let quoteCache = null;
let quoteCartKey = null;
let quoteRefreshTimer = null;
let quoteBreakdownVisible = true;

function getAuthHeaders(includeJson = false) {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (includeJson) headers['Content-Type'] = 'application/json';
    return headers;
}

function getCartKey() {
    const items = (carrito || [])
        .map(i => ({ p: Number(i.id_producto), q: Number(i.cantidad), l: i.lote_id ? Number(i.lote_id) : null }))
        .sort((a, b) => (a.p - b.p) || ((a.l ?? 0) - (b.l ?? 0)));
    return JSON.stringify(items);
}

function scheduleQuoteRefresh() {
    if (quoteRefreshTimer) clearTimeout(quoteRefreshTimer);
    quoteRefreshTimer = setTimeout(() => {
        quoteRefreshTimer = null;
        refreshQuote();
    }, 250);
}

function toggleQuoteBreakdown() {
    quoteBreakdownVisible = !quoteBreakdownVisible;
    renderQuoteBreakdown();
}

window.toggleQuoteBreakdown = toggleQuoteBreakdown;

async function refreshQuote() {
    const breakdown = document.getElementById('quote-breakdown');
    const body = document.getElementById('quote-breakdown-body');

    if (!sesionCajaId) {
        quoteCache = null;
        quoteCartKey = null;
        if (breakdown) breakdown.style.display = 'none';
        if (body) body.innerHTML = '';
        actualizarCarritoUI();
        return;
    }

    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId || !carrito || carrito.length === 0) {
        quoteCache = null;
        quoteCartKey = null;
        if (breakdown) breakdown.style.display = 'none';
        if (body) body.innerHTML = '';
        actualizarCarritoUI();
        return;
    }

    const cartKey = getCartKey();
    try {
        const itemsQuote = carrito.map(item => ({
            producto_id: item.id_producto,
            cantidad: item.cantidad,
            lote_id: item.lote_id || null
        }));

        const response = await fetch(`${API_URL}/invoices/quote`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: JSON.stringify({ usuario_id: usuarioId, items: itemsQuote })
        });
        const json = await response.json();
        if (!response.ok) {
            quoteCache = null;
            quoteCartKey = null;
            if (breakdown) breakdown.style.display = 'none';
            if (body) body.innerHTML = '';
            actualizarCarritoUI();
            return;
        }

        if (cartKey !== getCartKey()) return;

        quoteCache = json;
        quoteCartKey = cartKey;
        renderQuoteBreakdown();
        actualizarCarritoUI();
    } catch (e) {
        quoteCache = null;
        quoteCartKey = null;
        if (breakdown) breakdown.style.display = 'none';
        if (body) body.innerHTML = '';
        actualizarCarritoUI();
    }
}

function renderQuoteBreakdown() {
    const container = document.getElementById('quote-breakdown');
    const body = document.getElementById('quote-breakdown-body');
    if (!container || !body) return;

    if (!quoteCache || quoteCartKey !== getCartKey() || !Array.isArray(quoteCache.lines) || quoteCache.lines.length === 0) {
        container.style.display = 'none';
        body.innerHTML = '';
        return;
    }

    if (!quoteBreakdownVisible) {
        container.style.display = 'block';
        body.innerHTML = '';
        const btn = container.querySelector('button');
        if (btn) btn.textContent = 'Mostrar';
        return;
    }

    container.style.display = 'block';
    const btn = container.querySelector('button');
    if (btn) btn.textContent = 'Ocultar';

    const nameById = new Map((carrito || []).map(i => [Number(i.id_producto), i.nombre]));
    const grouped = new Map();
    quoteCache.lines.forEach(ln => {
        const key = `${ln.producto_id}|${ln.lote_id}|${ln.precio_unitario}`;
        if (!grouped.has(key)) {
            grouped.set(key, { producto_id: Number(ln.producto_id), lote_id: Number(ln.lote_id), precio_unitario: Number(ln.precio_unitario), cantidad: 0, subtotal: 0 });
        }
        const row = grouped.get(key);
        row.cantidad += Number(ln.cantidad);
        row.subtotal += Number(ln.subtotal);
    });

    body.innerHTML = '';
    Array.from(grouped.values())
        .sort((a, b) => (a.producto_id - b.producto_id) || (a.lote_id - b.lote_id))
        .forEach(r => {
            const productName = nameById.get(r.producto_id) || `Producto #${r.producto_id}`;
            const line = document.createElement('div');
            line.style.display = 'flex';
            line.style.justifyContent = 'space-between';
            line.style.gap = '10px';
            line.innerHTML = `
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:600; color:#111827; font-size:0.9rem;">${productName}</span>
                    <span style="font-size:0.78rem; color:#6b7280;">Lote: #${r.lote_id} · ${r.cantidad} × $${r.precio_unitario.toLocaleString('es-CO')}</span>
                </div>
                <div style="font-weight:700; color:#111827;">$${Math.round(r.subtotal).toLocaleString('es-CO')}</div>
            `;
            body.appendChild(line);
        });
}

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
    
    // Inicializar UI de pago
    seleccionarMetodoPago('efectivo');
});

// Función auxiliar para persistir el carrito
function guardarCarrito() {
    localStorage.setItem('pos_carrito', JSON.stringify(carrito));
}

// --- Gestión de Sesión de Caja ---
async function verificarEstadoCaja() {
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

    try {
        const response = await fetch(`${API_URL}/box/status?usuario_id=${usuarioId}`, { headers: getAuthHeaders(false) });
        const sesion = await response.json();

        if (sesion && sesion.estado === 'abierta') {
            sesionCajaId = sesion.id_sesion;
            localStorage.setItem('sesion_actual', JSON.stringify(sesion));
            actualizarBotonCaja(true);
            scheduleQuoteRefresh();
        } else {
            sesionCajaId = null;
            actualizarBotonCaja(false);
            quoteCache = null;
            quoteCartKey = null;
            renderQuoteBreakdown();
            // Si no hay caja abierta, podríamos bloquear la interfaz o mostrar aviso
            // Por ahora solo el botón cambia
        }
    } catch (error) {
        console.error('Error verificando caja:', error);
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
            headers: getAuthHeaders(true),
            body: JSON.stringify({
                usuario_id: usuarioId,
                monto_apertura: monto
            })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Caja abierta correctamente.');
            cerrarModalApertura();
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

    const sesion = JSON.parse(localStorage.getItem('sesion_actual') || '{}');
    
    // Actualizar total ventas consultando API
    fetch(`${API_URL}/box/status?usuario_id=${localStorage.getItem('usuario_id')}`, { headers: getAuthHeaders(false) })
        .then(res => res.json())
        .then(data => {
            if (data) {
                const inicial = parseFloat(data.monto_apertura || 0);
                const ventas = parseFloat(data.total_ventas || 0);
                const efectivo = parseFloat(data.total_efectivo || 0);
                const tarjeta = parseFloat(data.total_tarjeta || 0);
                const transf = parseFloat(data.total_transferencia || 0);
                
                // Total esperado en caja física = Inicial + Ventas Efectivo
                const esperadoEnCaja = inicial + efectivo;

                const format = (val) => '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0 });

                document.getElementById('cierre-inicial').innerText = format(inicial);
                document.getElementById('cierre-ventas').innerText = format(ventas);
                document.getElementById('cierre-efectivo').innerText = format(efectivo);
                document.getElementById('cierre-tarjeta').innerText = format(tarjeta);
                document.getElementById('cierre-transferencia').innerText = format(transf);
                document.getElementById('cierre-esperado').innerText = format(esperadoEnCaja);

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
            headers: getAuthHeaders(true),
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
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filtrados = productosGlobal.filter(p => {
        const nombre = (p.nombre || '').toLowerCase();
        const codigo = (p.codigo || '').toLowerCase(); // Si existe código
        return nombre.includes(texto) || codigo.includes(texto);
    });
    renderizarCatalogo(filtrados);
}

// --- Lógica del Carrito ---
function agregarAlCarrito(producto) {
    const existente = carrito.find(item => item.id_producto === producto.id_producto);

    if (existente) {
        if (existente.cantidad < producto.stock_actual) {
            existente.cantidad++;
        } else {
            alert('Stock máximo alcanzado para este producto.');
            return;
        }
    } else {
        carrito.push({
            id_producto: producto.id_producto,
            nombre: producto.nombre,
            precio: parseFloat(producto.precio_venta),
            cantidad: 1,
            max_stock: producto.stock_actual,
            imagen: producto.imagen,
            lote_id: null
        });
    }
    guardarCarrito();
    actualizarCarritoUI();
    scheduleQuoteRefresh();
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
        alert('No hay suficiente stock disponible.');
        return;
    }
    guardarCarrito();
    actualizarCarritoUI();
    scheduleQuoteRefresh();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.id_producto !== id);
    guardarCarrito();
    actualizarCarritoUI();
    scheduleQuoteRefresh();
}

async function seleccionarLotePreferido(productoId) {
    const item = carrito.find(p => p.id_producto === productoId);
    if (!item) return;

    try {
        const response = await fetch(`${API_URL}/products/${productoId}/lots`, { headers: getAuthHeaders(false) });
        const json = await response.json();
        const lots = Array.isArray(json?.data) ? json.data : [];
        const disponibles = lots.filter(l => Number(l.cantidad_disponible || 0) > 0 && (l.estado || 'activo') === 'activo');

        if (disponibles.length === 0) {
            alert('No hay lotes disponibles. Se usará FIFO.');
            item.lote_id = null;
            guardarCarrito();
            actualizarCarritoUI();
            return;
        }

        const listado = disponibles
            .map(l => `#${l.id_lote} | disp: ${l.cantidad_disponible} | $${Number(l.precio_venta || 0).toLocaleString('es-CO')}`)
            .join('\n');

        const input = prompt(`Seleccione un lote (vacío = FIFO)\n${listado}`, item.lote_id ? String(item.lote_id) : '');
        if (input === null) return;
        const trimmed = input.trim();
        if (trimmed === '') {
            item.lote_id = null;
        } else {
            const selectedId = Number(trimmed);
            if (!Number.isFinite(selectedId) || selectedId <= 0) {
                alert('ID de lote inválido.');
                return;
            }
            const found = disponibles.find(l => Number(l.id_lote) === selectedId);
            if (!found) {
                alert('El lote seleccionado no está disponible.');
                return;
            }
            item.lote_id = selectedId;
        }

        guardarCarrito();
        actualizarCarritoUI();
        scheduleQuoteRefresh();
    } catch (e) {
        console.error(e);
        alert('Error consultando lotes.');
    }
}

function actualizarCarritoUI() {
    const tbody = document.getElementById('carrito-body');
    const subtotalSpan = document.getElementById('summary-subtotal');
    const ivaSpan = document.getElementById('summary-iva');
    const totalSpan = document.getElementById('summary-total');

    tbody.innerHTML = '';
    let total = 0;

    if (carrito.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Carrito vacío</td></tr>';
        subtotalSpan.innerText = '$0';
        ivaSpan.innerText = '$0';
        totalSpan.innerText = '$0';
        document.getElementById('monto-recibido').value = '';
        document.getElementById('texto-cambio').innerText = '$0';
        return;
    }

    carrito.forEach(item => {
        const subtotalItem = item.precio * item.cantidad;
        total += subtotalItem;

        // Imagen miniatura
        let imgHtml = '';
        if (item.imagen && item.imagen.trim() !== '') {
            const imgSrc = item.imagen.startsWith('http') ? item.imagen : `../../${item.imagen}`;
            imgHtml = `<img src="${imgSrc}" class="cart-thumb" onerror="this.src='../../assets/no-image.png'">`;
        } else {
            imgHtml = `<div class="cart-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📦</div>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${imgHtml}</td>
            <td>
                <div style="font-weight:600; font-size:0.9rem;">${item.nombre}</div>
                <div style="color:#666; font-size:0.8rem;">$${item.precio.toLocaleString('es-CO')}</div>
                <div style="display:flex; align-items:center; gap:8px; margin-top:4px; font-size:0.75rem; color:#666;">
                    <span>${item.lote_id ? `Lote: #${item.lote_id}` : 'Lote: FIFO'}</span>
                    <button class="btn-qty" style="padding:2px 8px; font-size:0.75rem;" onclick="event.stopPropagation(); seleccionarLotePreferido(${item.id_producto})">Cambiar</button>
                </div>
                <div class="cart-qty-control" style="margin-top:4px;">
                    <button class="btn-qty" onclick="cambiarCantidad(${item.id_producto}, -1)">-</button>
                    <div class="cart-qty-val">${item.cantidad}</div>
                    <button class="btn-qty" onclick="cambiarCantidad(${item.id_producto}, 1)">+</button>
                </div>
            </td>
            <td style="text-align:right; font-weight:600;">$${subtotalItem.toLocaleString('es-CO')}</td>
            <td style="text-align:center;">
                <button class="btn-delete-item" onclick="eliminarDelCarrito(${item.id_producto})">
                    <svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (quoteCache && quoteCartKey === getCartKey() && Number(quoteCache.total || 0) > 0) {
        total = Number(quoteCache.total || 0);
        renderQuoteBreakdown();
    }

    // Cálculos de Totales (Asumiendo Precios con IVA incluido)
    // Base = Total / 1.19
    // IVA = Total - Base
    const base = total / 1.19;
    const iva = total - base;

    subtotalSpan.innerText = '$' + base.toLocaleString('es-CO', { maximumFractionDigits: 0 });
    ivaSpan.innerText = '$' + iva.toLocaleString('es-CO', { maximumFractionDigits: 0 });
    totalSpan.innerText = '$' + total.toLocaleString('es-CO', { maximumFractionDigits: 0 });

    // Recalcular cambio si hay monto ingresado
    calcularCambio(total);
}

// --- Gestión de Pagos ---
function seleccionarMetodoPago(metodo) {
    metodoPagoSeleccionado = metodo;
    
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
    if (metodoPagoSeleccionado !== 'efectivo') return;

    // Obtener total si no se pasa como arg
    let total = totalActual;
    if (total === null) {
        // Recalcular total desde carrito
        total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
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

// --- Procesar Venta ---
async function procesarVenta() {
    if (carrito.length === 0) {
        alert('El carrito está vacío.');
        return;
    }

    if (!sesionCajaId) {
        alert('Debe ABRIR CAJA antes de realizar una venta.');
        mostrarModalAperturaCaja();
        return;
    }

    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) {
        alert('Sesión inválida. Inicie sesión nuevamente.');
        return;
    }

    let quote = null;
    try {
        const itemsQuote = carrito.map(item => ({
            producto_id: item.id_producto,
            cantidad: item.cantidad,
            lote_id: item.lote_id || null
        }));
        const responseQuote = await fetch(`${API_URL}/invoices/quote`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: JSON.stringify({
                usuario_id: usuarioId,
                items: itemsQuote
            })
        });
        quote = await responseQuote.json();
        if (!responseQuote.ok) {
            alert('Error al calcular total: ' + (quote.message || 'Desconocido'));
            return;
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión al calcular total.');
        return;
    }

    const totalVenta = parseFloat(quote.total || 0);
    if (!(totalVenta > 0)) {
        alert('No se pudo calcular el total de la venta.');
        return;
    }
    
    // Validaciones de Pago
    if (metodoPagoSeleccionado === 'efectivo') {
        const recibido = parseFloat(document.getElementById('monto-recibido').value) || 0;
        if (recibido < totalVenta) {
            alert('El monto recibido es insuficiente.');
            document.getElementById('monto-recibido').focus();
            return;
        }
    }

    if (!confirm('¿Confirmar venta por $' + totalVenta.toLocaleString('es-CO') + '?')) return;

    const grouped = new Map();
    (quote.lines || []).forEach(line => {
        const pid = Number(line.producto_id);
        if (!grouped.has(pid)) grouped.set(pid, []);
        grouped.get(pid).push({ lote_id: Number(line.lote_id), cantidad: Number(line.cantidad) });
    });
    const itemsVenta = Array.from(grouped.entries()).map(([producto_id, lotes]) => ({ producto_id, lotes }));

    const clienteId = document.getElementById('cliente-select').value;
    const data = {
        items: itemsVenta,
        total: totalVenta,
        metodo_pago: metodoPagoSeleccionado,
        cliente_id: clienteId || null,
        usuario_id: usuarioId,
        sesion_id: sesionCajaId
    };

    try {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // Éxito
            ultimaVenta = {
                id_factura: result.id_factura,
                numero_factura: result.numero_factura,
                total: parseFloat(result.total || totalVenta),
                cliente_nombre: document.getElementById('cliente-select').options[document.getElementById('cliente-select').selectedIndex].text,
                fecha: new Date().toLocaleString(),
                metodo_pago: metodoPagoSeleccionado
            };

            mostrarModalExito();
            limpiarDespuesDeVenta();
        } else {
            alert('Error al procesar venta: ' + result.message);
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión.');
    }
}

function limpiarDespuesDeVenta() {
    carrito = [];
    localStorage.removeItem('pos_carrito');
    quoteCache = null;
    quoteCartKey = null;
    actualizarCarritoUI();
    document.getElementById('monto-recibido').value = '';
    document.getElementById('texto-cambio').innerText = '$0';
    cargarCatalogo(); // Actualizar stock visual
}

// --- Funciones del Modal de Éxito ---
function mostrarModalExito() {
    if (!ultimaVenta) return;
    document.getElementById('success-invoice-number').innerText = ultimaVenta.numero_factura;
    document.getElementById('success-client').innerText = ultimaVenta.cliente_nombre;
    document.getElementById('success-total').innerText = '$' + ultimaVenta.total.toLocaleString('es-CO');
    const modal = document.getElementById('modal-exito-venta');
    modal.style.display = 'flex';
}

function nuevaVenta() {
    document.getElementById('modal-exito-venta').style.display = 'none';
    ultimaVenta = null;
    document.getElementById('buscador').focus();
}

function imprimirTicketDirecto() {
    if (ultimaVenta && ultimaVenta.id_factura) {
        // Ajustar ruta si es necesario
        window.open(`ticket.html?id=${ultimaVenta.id_factura}`, '_blank', 'width=350,height=500');
    }
}

function descargarPDF() {
    imprimirTicketDirecto();
}

function descargarExcel() {
    if (!ultimaVenta) return;
    const csvContent = "data:text/csv;charset=utf-8,"
        + "Factura,Cliente,Fecha,Total,MetodoPago\n"
        + `${ultimaVenta.numero_factura},${ultimaVenta.cliente_nombre},${ultimaVenta.fecha},${ultimaVenta.total},${ultimaVenta.metodo_pago}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `venta_${ultimaVenta.numero_factura}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function enviarWhatsApp() {
    if (!ultimaVenta) return;
    const telefono = prompt("Ingrese el número de WhatsApp del cliente (ej: 573001234567):");
    if (telefono) {
        const mensaje = `Hola! Gracias por tu compra en TRIUNFO GO. Tu factura es ${ultimaVenta.numero_factura} por un total de $${ultimaVenta.total.toLocaleString('es-CO')}.`;
        const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    }
}
