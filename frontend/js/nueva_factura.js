const API_URL = window.location.origin + '/proyecto_final/backend';

let itemsFactura = [];
let productosFacturaGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarProductosFactura();
    setupClienteSearch();
});

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
        alert(`No hay suficiente stock disponible. Stock actual: ${stockDisponible}`);
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
        alert(`No puedes agregar más unidades. Stock disponible: ${item.stock_max}`);
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
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    const formatCurrency = val => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

    const subEl = document.getElementById('subtotalFactura');
    const ivaEl = document.getElementById('ivaFactura');
    const totalEl = document.getElementById('totalFactura');

    if (subEl) subEl.textContent = formatCurrency(subtotal);
    if (ivaEl) ivaEl.textContent = formatCurrency(iva);
    if (totalEl) totalEl.textContent = formatCurrency(total);
}

async function generarFacturaManual() {
    // Validar si la caja está abierta (variable global desde caja.js)
    if (typeof cajaSesion === 'undefined' || !cajaSesion) {
        alert('Debe abrir la caja antes de generar una factura.');
        if (typeof window.mostrarAperturaCaja === 'function') {
            window.mostrarAperturaCaja();
        }
        return;
    }

    if (itemsFactura.length === 0) {
        alert('Agrega al menos un producto.');
        return;
    }

    const nombre = document.getElementById('clienteNombre').value.trim();
    const cedula = document.getElementById('clienteCedula').value.trim();
    const direccion = document.getElementById('clienteDireccion').value.trim();
    const telefono = document.getElementById('clienteTelefono').value.trim();
    const metodoPagoSelect = document.getElementById('metodoPagoFactura');
    const metodoPago = metodoPagoSelect ? metodoPagoSelect.value : 'efectivo';

    const usuarioId = localStorage.getItem('usuario_id');

    const subtotal = itemsFactura.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    const data = {
        items: itemsFactura.map(i => ({
            producto_id: i.id_producto,
            cantidad: i.cantidad,
            precio_unitario: i.precio
        })),
        total: total,
        metodo_pago: metodoPago,
        cliente_id: null,
        usuario_id: usuarioId || null
    };

    try {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            mostrarBannerFactura(result.id_factura || result.numero_factura);
        } else {
            // Manejar error de caja cerrada desde backend
            if (response.status === 400 && result.message && result.message.toLowerCase().includes('caja')) {
                alert(result.message);
                if (typeof window.mostrarAperturaCaja === 'function') {
                    window.mostrarAperturaCaja();
                }
            } else {
                alert(result.message || 'Error al generar factura.');
            }
        }
    } catch (error) {
        console.error('Error generando factura manual:', error);
        alert('Error de conexión al generar factura.');
    }
}

let ultimaFacturaId = null;

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
        alert('No hay factura reciente.');
        return;
    }
    if (tipo === 'print' || tipo === 'pdf') {
        window.open(`factura.html?id=${ultimaFacturaId}`, '_blank');
    } else if (tipo === 'excel') {
        alert('Función de Excel pendiente de implementación.');
    } else if (tipo === 'whatsapp') {
        alert('Envío por WhatsApp pendiente de implementación.');
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
