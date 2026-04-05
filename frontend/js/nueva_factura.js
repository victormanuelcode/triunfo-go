const API_URL = window.location.origin + '/proyecto_final/backend';

let itemsFactura = [];
let productosFacturaGlobal = [];
let toastTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    cargarProductosFactura();
    setupClienteSearch();
});

function showAdminToast(message, type = 'info') {
    const el = document.getElementById('admin-toast');
    if (!el) {
        alert(message);
        return;
    }
    el.textContent = message;
    el.style.background = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : type === 'warning' ? '#92400e' : '#111827';
    el.style.display = 'block';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function setupClienteSearch() {
    const inputBusqueda = document.getElementById('clienteBusqueda');
    const resultadosDiv = document.getElementById('resultadosBusquedaCliente');
    let debounceTimer;

    if (!inputBusqueda || !resultadosDiv) return;

    inputBusqueda.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const term = e.target.value.trim();
        
        if (term.length < 2) {
            resultadosDiv.style.display = 'none';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`${API_URL}/clients?search=${encodeURIComponent(term)}`);
                if (!response.ok) throw new Error('Error buscando clientes');
                const clientes = await response.json();
                
                renderResultadosClientes(clientes, resultadosDiv, inputBusqueda);
            } catch (error) {
                console.error('Error:', error);
            }
        }, 300);
    });

    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!inputBusqueda.contains(e.target) && !resultadosDiv.contains(e.target)) {
            resultadosDiv.style.display = 'none';
        }
    });
}

function renderResultadosClientes(clientes, container, inputBusqueda) {
    container.innerHTML = '';
    if (clientes.length === 0) {
        container.style.display = 'none';
        return;
    }

    clientes.forEach(cliente => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.style.padding = '8px 12px';
        div.style.cursor = 'pointer';
        div.style.borderBottom = '1px solid #f3f4f6';
        div.innerHTML = `
            <div style="font-weight: 500; font-size: 14px;">${cliente.nombre}</div>
            <div style="font-size: 12px; color: #6b7280;">CC: ${cliente.documento || 'N/A'}</div>
        `;
        
        div.addEventListener('mouseover', () => {
            div.style.backgroundColor = '#f9fafb';
        });
        div.addEventListener('mouseout', () => {
            div.style.backgroundColor = 'white';
        });

        div.addEventListener('click', () => {
            seleccionarCliente(cliente);
            container.style.display = 'none';
            if(inputBusqueda) inputBusqueda.value = '';
        });
        
        container.appendChild(div);
    });

    container.style.display = 'block';
}

function seleccionarCliente(cliente) {
    document.getElementById('clienteId').value = cliente.id_cliente;
    document.getElementById('clienteNombre').value = cliente.nombre;
    document.getElementById('clienteCedula').value = cliente.documento || '';
    document.getElementById('clienteDireccion').value = cliente.direccion || '';
    document.getElementById('clienteTelefono').value = cliente.telefono || '';
}

async function cargarProductosFactura() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const json = await response.json();
        productosFacturaGlobal = Array.isArray(json) ? json : (json.data || []);
        renderProductosFactura(productosFacturaGlobal);
    } catch (error) {
        console.error('Error cargando productos para factura:', error);
    }
}

function filtrarProductosFactura() {
    const texto = (document.getElementById('buscadorProductosFactura')?.value || '').toLowerCase();
    let lista = productosFacturaGlobal.slice();
    if (texto) {
        lista = lista.filter(p => 
            (p.nombre || '').toLowerCase().includes(texto) ||
            (p.sku || '').toLowerCase().includes(texto)
        );
    }
    renderProductosFactura(lista);
}

function abrirSelectorProductos() {
    // Si ya existe un modal abierto, no abrir otro
    if (document.querySelector('.modal-productos')) return;

    // Crear modal dinámicamente
    const modal = document.createElement('div');
    modal.className = 'modal-productos';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
    modal.style.zIndex = '2000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';

    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 12px; width: 80%; max-width: 800px; max-height: 80vh; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Búsqueda Avanzada de Productos</h3>
                <button onclick="cerrarSelectorProductos()" style="border: none; background: transparent; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <input type="text" id="buscadorAvanzadoInput" placeholder="Buscar por nombre, SKU, categoría..." style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 15px;">
            <div id="gridProductosAvanzado" style="flex: 1; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; padding: 5px;">
                <!-- Productos aquí -->
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Renderizar productos iniciales
    renderProductosAvanzado(productosFacturaGlobal);

    // Event listener para búsqueda en tiempo real
    document.getElementById('buscadorAvanzadoInput').addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtrados = productosFacturaGlobal.filter(p => 
            (p.nombre || '').toLowerCase().includes(term) ||
            (p.sku || '').toLowerCase().includes(term) ||
            (p.categoria || '').toLowerCase().includes(term)
        );
        renderProductosAvanzado(filtrados);
    });
}

function cerrarSelectorProductos() {
    const modal = document.querySelector('.modal-productos');
    if (modal) modal.remove();
}

function renderProductosAvanzado(lista) {
    const grid = document.getElementById('gridProductosAvanzado');
    grid.innerHTML = '';
    
    lista.forEach(prod => {
        const stock = parseInt(prod.stock_actual || 0);
        const card = document.createElement('div');
        card.style.border = '1px solid #eee';
        card.style.borderRadius = '8px';
        card.style.padding = '10px';
        card.style.cursor = stock > 0 ? 'pointer' : 'not-allowed';
        card.style.opacity = stock > 0 ? '1' : '0.6';
        card.style.transition = 'box-shadow 0.2s';
        
        card.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 5px;">${prod.nombre}</div>
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">SKU: ${prod.sku || 'N/A'}</div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; color: #16A34A;">$${parseFloat(prod.precio_venta).toLocaleString()}</span>
                <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: ${stock > 5 ? '#dcfce7' : '#fee2e2'}; color: ${stock > 5 ? '#166534' : '#991b1b'};">
                    Stock: ${stock}
                </span>
            </div>
        `;

        if (stock > 0) {
            card.addEventListener('click', () => {
                agregarItemFactura(prod);
                cerrarSelectorProductos();
            });
            card.addEventListener('mouseenter', () => card.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)');
            card.addEventListener('mouseleave', () => card.style.boxShadow = 'none');
        }

        grid.appendChild(card);
    });
}

function agregarItemFactura(prod) {
    const stockDisponible = parseInt(prod.stock_actual || 0);
    const itemExistente = itemsFactura.find(i => i.id_producto === prod.id_producto);
    const cantidadActual = itemExistente ? itemExistente.cantidad : 0;

    if (cantidadActual + 1 > stockDisponible) {
        showAdminToast(`No hay suficiente stock disponible. Stock actual: ${stockDisponible}`, 'warning');
        return;
    }

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        itemsFactura.push({
            id_producto: prod.id_producto,
            nombre: prod.nombre,
            precio: parseFloat(prod.precio_venta),
            cantidad: 1,
            stock_max: stockDisponible // Guardamos el stock máximo para validaciones posteriores
        });
    }
    renderItemsFactura();
}

function cambiarCantidadItem(index, delta) {
    const item = itemsFactura[index];
    if (!item) return;
    
    const nuevaCant = item.cantidad + delta;
    
    if (nuevaCant > item.stock_max) {
        showAdminToast(`No puedes agregar más unidades. Stock disponible: ${item.stock_max}`, 'warning');
        return;
    }

    if (nuevaCant <= 0) {
        itemsFactura.splice(index, 1);
    } else {
        item.cantidad = nuevaCant;
    }
    renderItemsFactura();
}

function eliminarItemFactura(index) {
    itemsFactura.splice(index, 1);
    renderItemsFactura();
}

function renderItemsFactura() {
    const tbody = document.querySelector('#tablaItemsFactura tbody');
    tbody.innerHTML = '';

    if (itemsFactura.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#9CA3AF;">No hay productos agregados</td></tr>';
    } else {
        itemsFactura.forEach((item, idx) => {
            const subtotal = item.precio * item.cantidad;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nombre}</td>
                <td>
                    <button class="btn-qty" onclick="cambiarCantidadItem(${idx}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-qty" onclick="cambiarCantidadItem(${idx}, 1)">+</button>
                </td>
                <td>$${item.precio.toLocaleString()}</td>
                <td>$${subtotal.toLocaleString()}</td>
                <td><button class="btn-remove" onclick="eliminarItemFactura(${idx})">&times;</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    recalcularTotalesFactura();
}

function recalcularTotalesFactura() {
    let subtotal = 0;
    itemsFactura.forEach(i => {
        subtotal += i.precio * i.cantidad;
    });
    const total = subtotal;

    const formatCurrency = val => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

    const subEl = document.getElementById('subtotalFactura');
    const totalEl = document.getElementById('totalFactura');

    if (subEl) subEl.textContent = formatCurrency(subtotal);
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

async function generarFacturaManual() {
    // Validar si la caja está abierta (variable global desde caja.js)
    if (typeof cajaSesion === 'undefined' || !cajaSesion) {
        showAdminToast('Debe abrir la caja antes de generar una factura.', 'warning');
        if (typeof window.mostrarAperturaCaja === 'function') {
            window.mostrarAperturaCaja();
        }
        return;
    }

    if (itemsFactura.length === 0) {
        showAdminToast('Agrega al menos un producto.', 'warning');
        return;
    }

    const nombre = document.getElementById('clienteNombre').value.trim();
    const cedula = document.getElementById('clienteCedula').value.trim();
    const direccion = document.getElementById('clienteDireccion').value.trim();
    const telefono = document.getElementById('clienteTelefono').value.trim();
    const metodoPagoSelect = document.getElementById('metodoPagoFactura');
    const metodoPago = metodoPagoSelect ? metodoPagoSelect.value : 'efectivo';

    const usuarioId = localStorage.getItem('usuario_id');
    const token = localStorage.getItem('token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    let quote = null;
    try {
        const itemsQuote = itemsFactura.map(i => ({
            producto_id: i.id_producto,
            cantidad: i.cantidad
        }));
        const responseQuote = await fetch(`${API_URL}/invoices/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify({
                usuario_id: usuarioId || null,
                items: itemsQuote
            })
        });
        quote = await responseQuote.json();
        if (!responseQuote.ok) {
            showAdminToast(quote.message || 'No se pudo calcular el total.', 'error');
            return;
        }
    } catch (error) {
        console.error('Error calculando total:', error);
        showAdminToast('Error de conexión al calcular total.', 'error');
        return;
    }

    const total = parseFloat(quote.total || 0);
    if (!(total > 0)) {
        showAdminToast('No se pudo calcular el total de la factura.', 'error');
        return;
    }

    const grouped = new Map();
    (quote.lines || []).forEach(line => {
        const pid = Number(line.producto_id);
        if (!grouped.has(pid)) grouped.set(pid, []);
        grouped.get(pid).push({ lote_id: Number(line.lote_id), cantidad: Number(line.cantidad) });
    });

    const data = {
        items: Array.from(grouped.entries()).map(([producto_id, lotes]) => ({ producto_id, lotes })),
        total: total,
        metodo_pago: metodoPago,
        cliente_id: null,
        usuario_id: usuarioId || null
    };

    try {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            mostrarBannerFactura(result.id_factura || result.numero_factura);
        } else {
            // Manejar error de caja cerrada desde backend
            if (response.status === 400 && result.message && result.message.toLowerCase().includes('caja')) {
                showAdminToast(result.message, 'warning');
                if (typeof window.mostrarAperturaCaja === 'function') {
                    window.mostrarAperturaCaja();
                }
            } else {
                showAdminToast(result.message || 'Error al generar factura.', 'error');
            }
        }
    } catch (error) {
        console.error('Error generando factura manual:', error);
        showAdminToast('Error de conexión al generar factura.', 'error');
    }
}

let ultimaFacturaId = null;

function sanitizePhoneForWa(value) {
    const raw = (value || '').toString().trim();
    const digits = raw.replace(/[^\d]/g, '');
    return digits;
}

function downloadCsv(filename, csvText) {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function fetchFacturaDetalle(idFactura) {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_URL}/invoices/${idFactura}`, { headers });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'No se pudo cargar la factura');
    return json;
}

function buildFacturaCsv(factura) {
    const esc = (val) => {
        const s = (val ?? '').toString();
        const needs = /[",\n]/.test(s);
        const clean = s.replace(/"/g, '""');
        return needs ? `"${clean}"` : clean;
    };

    const lines = [];
    lines.push(['Numero', 'Fecha', 'Cliente', 'Documento', 'Telefono', 'Metodo', 'Total'].map(esc).join(','));
    lines.push([
        factura.numero_factura,
        factura.fecha,
        factura.cliente_nombre || 'Cliente General',
        factura.cliente_documento || '',
        factura.cliente_telefono || '',
        factura.metodo_pago || '',
        factura.total || 0
    ].map(esc).join(','));
    lines.push('');
    lines.push(['Producto', 'Lote', 'Cantidad', 'PrecioUnitario', 'Subtotal'].map(esc).join(','));

    (factura.detalles || []).forEach(d => {
        const loteTxt = d.lote_id ? (d.lote_numero ? d.lote_numero : ('#' + d.lote_id)) : '';
        lines.push([
            d.producto_nombre || '',
            loteTxt,
            d.cantidad || 0,
            d.precio_unitario || 0,
            d.subtotal || 0
        ].map(esc).join(','));
    });

    return lines.join('\n');
}

function buildWhatsappMessage(factura) {
    const total = Number(factura.total || 0);
    const totalTxt = '$' + total.toLocaleString('es-CO', { maximumFractionDigits: 0 });
    const header = `TRIUNFO GO\nFactura: ${factura.numero_factura}\nTotal: ${totalTxt}\n`;
    const items = (factura.detalles || []).map(d => {
        const loteTxt = d.lote_id ? (d.lote_numero ? d.lote_numero : ('#' + d.lote_id)) : '';
        const sub = Number(d.subtotal || 0);
        const subTxt = '$' + sub.toLocaleString('es-CO', { maximumFractionDigits: 0 });
        const nombre = d.producto_nombre || 'Item';
        const cant = d.cantidad || 0;
        return `- ${nombre}${loteTxt ? ` (Lote: ${loteTxt})` : ''} x${cant}: ${subTxt}`;
    }).join('\n');
    return `${header}${items ? (items + '\n') : ''}Gracias por su compra.`;
}

function mostrarBannerFactura(idFactura) {
    ultimaFacturaId = idFactura;
    const banner = document.getElementById('bannerFactura');
    if (!banner) return;
    banner.classList.add('show');
}

function ocultarBannerFactura() {
    const banner = document.getElementById('bannerFactura');
    if (!banner) return;
    banner.classList.remove('show');
}

function accionFacturaBanner(tipo) {
    if (!ultimaFacturaId) {
        showAdminToast('No hay factura reciente.', 'warning');
        return;
    }
    if (tipo === 'print' || tipo === 'pdf') {
        window.open(`factura.html?id=${ultimaFacturaId}`, '_blank');
        return;
    }

    if (tipo === 'excel') {
        fetchFacturaDetalle(ultimaFacturaId)
            .then(factura => {
                const csv = buildFacturaCsv(factura);
                const filename = `factura_${(factura.numero_factura || ultimaFacturaId)}.csv`;
                downloadCsv(filename, csv);
            })
            .catch(e => {
                console.error(e);
                showAdminToast('No se pudo exportar la factura.', 'error');
            });
        return;
    }

    if (tipo === 'whatsapp') {
        fetchFacturaDetalle(ultimaFacturaId)
            .then(factura => {
                const telefonoPreferido = factura.cliente_telefono || document.getElementById('clienteTelefono')?.value || '';
                const telefonoSan = sanitizePhoneForWa(telefonoPreferido) || sanitizePhoneForWa(prompt('Ingrese el número de WhatsApp (ej: 573001234567):') || '');
                if (!telefonoSan) return;
                const mensaje = buildWhatsappMessage(factura);
                const url = `https://wa.me/${telefonoSan}?text=${encodeURIComponent(mensaje)}`;
                window.open(url, '_blank');
            })
            .catch(e => {
                console.error(e);
                showAdminToast('No se pudo preparar el mensaje de WhatsApp.', 'error');
            });
    }
}

function crearNuevaFactura() {
    ocultarBannerFactura();
    itemsFactura = [];
    renderItemsFactura();
    document.getElementById('clienteNombre').value = '';
    document.getElementById('clienteCedula').value = '';
    document.getElementById('clienteDireccion').value = '';
    document.getElementById('clienteTelefono').value = '';
}
