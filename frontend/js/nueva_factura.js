const API_URL = window.location.origin + '/proyecto_final/backend';

let itemsFactura = [];
let productosFacturaGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarProductosFactura();
});

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
        lista = lista.filter(p => (p.nombre || '').toLowerCase().includes(texto));
    }
    renderProductosFactura(lista);
}

function abrirSelectorProductos() {
    alert('Búsqueda avanzada de productos pendiente de implementación. Por ahora, escribe el nombre y presiona Enter para agregar.');
}

function renderProductosFactura(lista) {
    const grid = document.getElementById('productos-factura-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (!lista || lista.length === 0) {
        grid.innerHTML = '<div class="loading-spinner">No se encontraron productos.</div>';
        return;
    }

    lista.forEach(prod => {
        const imgSrc = prod.imagen ? `${API_URL}/${prod.imagen}` : 'https://via.placeholder.com/150?text=Sin+Imagen';
        const card = document.createElement('div');
        card.className = 'card-producto';
        card.onclick = () => agregarItemFactura(prod);
        card.innerHTML = `
            <div class="card-img-wrapper">
                <img src="${imgSrc}" alt="${prod.nombre}">
            </div>
            <div class="card-body">
                <h3 class="card-title">${prod.nombre}</h3>
                <p class="card-desc">${prod.descripcion || 'Sin descripción'}</p>
                <p class="price-tag">$${parseFloat(prod.precio_venta).toLocaleString()}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function agregarItemFactura(prod) {
    const existente = itemsFactura.find(i => i.id_producto === prod.id_producto);
    if (existente) {
        existente.cantidad += 1;
    } else {
        itemsFactura.push({
            id_producto: prod.id_producto,
            nombre: prod.nombre,
            precio: parseFloat(prod.precio_venta),
            cantidad: 1
        });
    }
    renderItemsFactura();
}

function cambiarCantidadItem(index, delta) {
    const item = itemsFactura[index];
    if (!item) return;
    const nuevaCant = item.cantidad + delta;
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
            alert(result.message || 'Error al generar factura.');
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
    if (tipo === 'print') {
        window.open(`${API_URL}/invoices/${ultimaFacturaId}/print`, '_blank');
    } else if (tipo === 'pdf') {
        window.open(`${API_URL}/invoices/${ultimaFacturaId}/pdf`, '_blank');
    } else if (tipo === 'excel') {
        window.open(`${API_URL}/invoices/${ultimaFacturaId}/excel`, '_blank');
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
