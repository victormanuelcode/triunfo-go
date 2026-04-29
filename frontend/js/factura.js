const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));
const BACKEND_BASE_URL = API_URL.replace('/index.php', '');
const FACTURA_FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial,sans-serif" font-size="10">Sin imagen</text></svg>')}`;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        alert('No se especificó una factura.');
        window.close();
        return;
    }

    await cargarFactura(id);
    await cargarDatosEmpresa();
});

function formatCantidadDetalle(item) {
    const tipo = (item?.producto_tipo_venta || item?.tipo_venta || '').toString().toLowerCase();
    const unidad = (item?.producto_unidad_base || item?.unidad_base || '').toString().toLowerCase();
    const raw = Number(item?.cantidad || 0);
    if (tipo === 'peso' || unidad === 'kg' || unidad === 'kilo' || unidad === 'kilogramo') {
        return `${raw.toFixed(3)} kg`;
    }
    return `${raw}`;
}

function formatPrecioUnitario(item) {
    const tipo = (item?.producto_tipo_venta || item?.tipo_venta || '').toString().toLowerCase();
    const unidad = (item?.producto_unidad_base || item?.unidad_base || '').toString().toLowerCase();
    const price = Number(item?.precio_unitario || 0);
    const base = formatMoney(price);
    if (tipo === 'peso' || unidad === 'kg' || unidad === 'kilo' || unidad === 'kilogramo') {
        return `${base} /kg`;
    }
    return base;
}

async function cargarDatosEmpresa() {
    try {
        const response = await fetch(`${API_URL}/company`);
        if (response.ok) {
            const company = await response.json();
            if (company) {
                document.getElementById('comp-dir').textContent = company.direccion || '';
                document.getElementById('comp-tel').textContent = 'Teléfono: ' + (company.telefono || '');
                document.getElementById('comp-email').textContent = 'Email: ' + (company.email || '');
                document.getElementById('comp-nit').textContent = 'NIT: ' + (company.nit || '');
            }
        }
    } catch (e) { console.error('Error cargando datos empresa', e); }
}

async function cargarFactura(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/invoices/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar la factura');

        const data = await response.json();
        renderFactura(data);

    } catch (error) {
        console.error(error);
        alert('No se pudo cargar la información de la factura.');
    }
}

function renderFactura(factura) {
    const fecha = new Date(factura.fecha);

    // Header
    document.getElementById('lbl-numero-factura').textContent = factura.numero_factura;
    document.getElementById('lbl-fecha').textContent = fecha.toLocaleDateString('es-CO', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
    document.getElementById('lbl-hora').textContent = fecha.toLocaleTimeString('es-CO', {
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    // Cliente
    document.getElementById('lbl-cliente-nombre').textContent = factura.cliente_nombre || 'Cliente General';
    document.getElementById('lbl-cliente-doc').textContent = factura.cliente_documento || '---';
    document.getElementById('lbl-cliente-dir').textContent = factura.cliente_direccion || '---';
    document.getElementById('lbl-cliente-tel').textContent = factura.cliente_telefono || '---';

    // Tabla
    const tbody = document.getElementById('tabla-items');
    tbody.innerHTML = '';

    factura.detalles.forEach(item => {
        const tr = document.createElement('tr');
        const subtotalItem = item.precio_unitario * item.cantidad;
        const loteNumero = item.lote_numero_snapshot || item.lote_numero || (item.lote_id ? ('#' + item.lote_id) : '');

        // Mejorar manejo de imagen para evitar bucles infinitos
        let imgHtml = '';
        if (item.producto_imagen) {
            const imgUrl = resolveProductImageUrl(item.producto_imagen);
            imgHtml = `<img src="${imgUrl}" class="product-img" data-fallback="${FACTURA_FALLBACK_IMAGE}" onerror="this.onerror=null;this.src=this.dataset.fallback;">`;
        } else {
            imgHtml = `<div class="product-placeholder"><i class="fas fa-box"></i></div>`;
        }

        tr.innerHTML = `
                    <td>${imgHtml}</td>
                    <td>
                        <div style="font-weight: 600;">${item.producto_nombre}</div>
                        <div style="font-size: 11px; color: #6b7280;">${item.lote_id ? (`Lote: ${loteNumero}`) : ''}</div>
                    </td>
                    <td class="col-right">${formatPrecioUnitario(item)}</td>
                    <td class="col-center">${formatCantidadDetalle(item)}</td>
                    <td class="col-right">${formatMoney(subtotalItem)}</td>
                `;
        tbody.appendChild(tr);
    });

    // Totales
    const totalFactura = parseFloat(factura.total);
    const montoRecibido = parseFloat(factura.monto_recibido || 0);
    document.getElementById('lbl-subtotal').textContent = formatMoney(totalFactura);
    document.getElementById('lbl-total').textContent = formatMoney(totalFactura);

    // Pago
    const metodo = factura.metodo_pago || 'efectivo';
    document.getElementById('lbl-metodo-pago').textContent = metodo.charAt(0).toUpperCase() + metodo.slice(1);
    document.getElementById('lbl-cajero').textContent = factura.usuario_nombre || 'Sistema';

    if (metodo === 'efectivo' && montoRecibido > 0) {
        document.getElementById('pago-efectivo-detalles').style.display = 'block';
        document.getElementById('lbl-monto-recibido').textContent = formatMoney(montoRecibido);
        document.getElementById('lbl-cambio').textContent = formatMoney(montoRecibido - totalFactura);
    }

    if (factura.estado === 'anulada') {
        document.getElementById('invoice-content').style.opacity = '0.6';
        document.body.style.backgroundImage = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='150px' width='150px'><text transform='translate(20, 120) rotate(-45)' fill='rgba(255,0,0,0.15)' font-size='30' font-weight='bold'>ANULADA</text></svg>\")";
    }
}

function resolveProductImageUrl(imagePath) {
    if (!imagePath) return FACTURA_FALLBACK_IMAGE;
    if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:')) return imagePath;
    const normalizedPath = String(imagePath).replace(/^\/+/, '');
    return `${BACKEND_BASE_URL}/${normalizedPath}`;
}

function formatMoney(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

function cerrarFactura() {
    // Si la ventana fue abierta como popup (window.open)
    if (window.opener || window.history.length === 1) {
        window.close();
    } else {
        // Si está en la misma pestaña, volver atrás o al historial
        window.location.href = 'historial.html';
    }
}

function exportarPDF() {
    const element = document.getElementById('invoice-content');
    const opt = {
        margin: 0,
        filename: `Factura_${document.getElementById('lbl-numero-factura').textContent}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
}
