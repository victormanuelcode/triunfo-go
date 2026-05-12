const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));
let facturasGlobal = [];

function authHeaders(json = false) {
    const token = localStorage.getItem('token');
    const h = {};
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (json) h['Content-Type'] = 'application/json';
    return h;
}

/** Fecha Y-m-d en calendario local (evita desfase UTC al filtrar). */
function parseFechaLocalYmd(ymd) {
    if (!ymd || typeof ymd !== 'string') return null;
    const p = ymd.split('-').map(Number);
    if (p.length !== 3 || p.some(n => !Number.isFinite(n))) return null;
    return new Date(p[0], p[1] - 1, p[2], 0, 0, 0, 0);
}

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('sesion_activa')) {
        window.location.href = '../auth/login.html';
        return;
    }

    loadHistory();

    const modal = document.getElementById("detailModal");
    const span = document.getElementsByClassName("close")[0];
    
    span.onclick = function() {
        modal.style.display = "none";
    };
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
});

async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/invoices?limit=10000&page=1`, { headers: authHeaders() });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        let json;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            json = await response.json();
        } else {
            throw new Error('Respuesta no es JSON');
        }

        facturasGlobal = Array.isArray(json) ? json : (json.data || []);
        if (!Array.isArray(facturasGlobal)) facturasGlobal = [];
        
        renderTablaFacturas(facturasGlobal);
        actualizarKPIs(facturasGlobal);
    } catch (error) {
        console.error('Error cargando historial:', error);
        facturasGlobal = [];
        renderTablaFacturas([]);
        showAdminToast('Error al cargar el historial de ventas.', 'error');
    }
}

function renderTablaFacturas(lista) {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay facturas registradas</td></tr>';
        return;
    }

    lista.forEach(inv => {
        const tr = document.createElement('tr');
        const fecha = inv.fecha ? new Date(inv.fecha).toLocaleString() : '';
        const total = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(inv.total || 0);
        const estado = (inv.estado || '').toLowerCase();
        const itemsCount = Array.isArray(inv.detalles) ? inv.detalles.length : (inv.items || 0);

        let badgeClass = '';
        let badgeText = '';
        if (estado === 'pagada') {
            badgeClass = 'badge-status badge-success';
            badgeText = 'Pagada';
        } else if (estado === 'pendiente') {
            badgeClass = 'badge-status badge-warning';
            badgeText = 'Pendiente';
        } else if (estado === 'vencida') {
            badgeClass = 'badge-status badge-danger';
            badgeText = 'Vencida';
        } else if (estado === 'anulada') {
            badgeClass = 'badge-status badge-secondary'; // Gris para anulada
            badgeText = 'Anulada';
        } else {
            badgeClass = 'badge-status';
            badgeText = estado || 'N/A';
        }

        tr.innerHTML = `
            <td>${inv.numero_factura}</td>
            <td>${inv.cliente_nombre || 'Cliente General'}</td>
            <td>${fecha}</td>
            <td>${total}</td>
            <td><span class="${badgeClass}">${badgeText}</span></td>
            <td>${itemsCount}</td>
            <td>
                <div class="table-actions">
                    <button class="btn-icon" title="Ver" onclick="viewDetail(${inv.id_factura})">👁</button>
                    <div class="dropdown">
                        <button class="btn-icon dropdown-toggle" type="button" aria-haspopup="true" aria-label="Más opciones">⋮</button>
                        <div class="dropdown-menu">
                            ${estado !== 'anulada' ? `<button type="button" onclick="anularFactura(${inv.id_factura})">Anular</button>` : ''}
                            <button type="button" onclick="accionFactura('pdf', ${inv.id_factura})">Descargar PDF</button>
                            <button type="button" onclick="accionFactura('excel', ${inv.id_factura})">Descargar Excel</button>
                            <button type="button" onclick="accionFactura('print', ${inv.id_factura})">Imprimir</button>
                            <button type="button" onclick="accionFactura('whatsapp', ${inv.id_factura})">WhatsApp</button>
                        </div>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function anularFactura(id) {
    if (!confirm('¿Está seguro de anular esta factura? Esta acción revertirá el stock de los productos.')) return;

    try {
        const response = await fetch(`${API_URL}/invoices/${id}/annul`, {
            method: 'POST',
            headers: authHeaders(true)
        });

        const result = await response.json();

        if (response.ok) {
            showAdminToast('Factura anulada correctamente.', 'success');
            loadHistory(); // Recargar tabla
        } else {
            showAdminToast('Error: ' + (result.message || 'Error desconocido'), 'error');
        }
    } catch (error) {
        console.error(error);
        showAdminToast('Error al conectar con el servidor.', 'error');
    }
}

function actualizarKPIs(lista) {
    const hoy = new Date().toISOString().slice(0, 10);

    let facturasHoy = 0;
    let totalHoy = 0;
    let pendientes = 0;
    let vencidas = 0;

    lista.forEach(inv => {
        const fecha = inv.fecha ? new Date(inv.fecha) : null;
        const fechaStr = fecha ? fecha.toISOString().slice(0, 10) : '';
        const estado = (inv.estado || '').toLowerCase();

        if (fechaStr === hoy) {
            facturasHoy++;
            totalHoy += Number(inv.total) || 0;
        }

        if (estado === 'pendiente') pendientes++;
        if (estado === 'vencida') vencidas++;
    });

    const formatCurrency = val => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

    const elFactHoy = document.getElementById('kpiFacturasHoy');
    const elTotalHoy = document.getElementById('kpiTotalHoy');
    const elPend = document.getElementById('kpiPendientes');
    const elVenc = document.getElementById('kpiVencidas');

    if (elFactHoy) elFactHoy.textContent = facturasHoy;
    if (elTotalHoy) elTotalHoy.textContent = formatCurrency(totalHoy);
    if (elPend) elPend.textContent = pendientes;
    if (elVenc) elVenc.textContent = vencidas;
}

function filtrarFacturas() {
    const texto = (document.getElementById('buscadorFacturas')?.value || '').toLowerCase();
    const estado = (document.getElementById('filtroEstadoFactura')?.value || '').toLowerCase();
    const desde = document.getElementById('filtroFechaDesde')?.value || '';
    const hasta = document.getElementById('filtroFechaHasta')?.value || '';

    let filtradas = facturasGlobal.slice();

    if (texto) {
        filtradas = filtradas.filter(inv => {
            const num = (inv.numero_factura || '').toString().toLowerCase();
            const cli = (inv.cliente_nombre || '').toLowerCase();
            const doc = (inv.cliente_documento || '').toString().toLowerCase();
            return num.includes(texto) || cli.includes(texto) || doc.includes(texto);
        });
    }

    if (estado) {
        filtradas = filtradas.filter(inv => (String(inv.estado || '').trim().toLowerCase()) === estado);
    }

    if (desde) {
        const d = parseFechaLocalYmd(desde);
        if (d) filtradas = filtradas.filter(inv => inv.fecha && new Date(inv.fecha) >= d);
    }

    if (hasta) {
        const h = parseFechaLocalYmd(hasta);
        if (h) {
            h.setHours(23, 59, 59, 999);
            filtradas = filtradas.filter(inv => inv.fecha && new Date(inv.fecha) <= h);
        }
    }

    renderTablaFacturas(filtradas);
}

async function viewDetail(id) {
    try {
        const response = await fetch(`${API_URL}/invoices/${id}`, { headers: authHeaders() });
        if (!response.ok) throw new Error('Error fetching detail');
        
        const invoice = await response.json();
        
        const modal = document.getElementById("detailModal");
        const modalInfo = document.getElementById("modalInfo");
        const tbody = document.querySelector('#modalTable tbody');
        
        modalInfo.innerHTML = `
            <div><strong>N° Factura:</strong> ${invoice.numero_factura}</div>
            <div><strong>Fecha:</strong> ${new Date(invoice.fecha).toLocaleString()}</div>
            <div><strong>Cliente:</strong> ${invoice.cliente_nombre || 'General'}</div>
            <div><strong>Vendedor:</strong> ${invoice.usuario_nombre || 'Desconocido'}</div>
            <div><strong>Método Pago:</strong> ${invoice.metodo_pago}</div>
            <div style="grid-column: 1 / -1;"><strong>Observaciones:</strong> ${invoice.observaciones || '-'}</div>
            <div style="grid-column: 1 / -1; font-size: 1.2em; margin-top: 10px;"><strong>Total: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoice.total)}</strong></div>
        `;

        tbody.innerHTML = '';
        (invoice.detalles || []).forEach(item => {
            const tr = document.createElement('tr');
            const esPeso = ((item?.producto_tipo_venta || item?.tipo_venta || '').toString().toLowerCase() === 'peso')
                || ((item?.producto_unidad_base || item?.unidad_base || '').toString().toLowerCase() === 'kg');
            const precioBase = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precio_unitario);
            const precio = esPeso ? `${precioBase} /kg` : precioBase;
            const subtotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.subtotal);
            const loteTxt = item.lote_id ? (item.lote_numero ? item.lote_numero : ('#' + item.lote_id)) : '-';
            const cantidad = esPeso ? `${Number(item.cantidad || 0).toFixed(3)} kg` : `${item.cantidad}`;
            
            tr.innerHTML = `
                <td>${item.producto_nombre}</td>
                <td>${loteTxt}</td>
                <td>${cantidad}</td>
                <td>${precio}</td>
                <td>${subtotal}</td>
            `;
            tbody.appendChild(tr);
        });

        modal.style.display = "block";

    } catch (error) {
        console.error('Error:', error);
        showAdminToast('No se pudo cargar el detalle de la venta.', 'error');
    }
}

function accionFactura(tipo, id) {
    if (tipo === 'print' || tipo === 'pdf') {
        // Abrir la vista de factura imprimible
        // Como estamos en /views/admin/, la ruta relativa es directa
        window.open(`factura.html?id=${id}`, '_blank');
        return;
    }

    if (tipo === 'excel') {
        exportarFacturaCsv(id);
        return;
    }

    if (tipo === 'whatsapp') {
        enviarFacturaWhatsApp(id);
    }
}

function showAdminToast(message, type = 'info') {
    const el = document.getElementById('admin-toast');
    if (!el) return;
    el.textContent = message;
    el.style.background = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : type === 'warning' ? '#92400e' : '#111827';
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, 3000);
}

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
    const response = await fetch(`${API_URL}/invoices/${idFactura}`, { headers: authHeaders() });
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
        const esPeso = ((d?.producto_tipo_venta || d?.tipo_venta || '').toString().toLowerCase() === 'peso')
            || ((d?.producto_unidad_base || d?.unidad_base || '').toString().toLowerCase() === 'kg');
        const cant = Number(d.cantidad || 0);
        const cantTxt = esPeso ? `${cant.toFixed(3)} kg` : `${cant}`;
        return `- ${nombre}${loteTxt ? ` (Lote: ${loteTxt})` : ''} x${cantTxt}: ${subTxt}`;
    }).join('\n');
    return `${header}${items ? (items + '\n') : ''}Gracias por su compra.`;
}

function exportarFacturaCsv(idFactura) {
    fetchFacturaDetalle(idFactura)
        .then(factura => {
            const csv = buildFacturaCsv(factura);
            const filename = `factura_${(factura.numero_factura || idFactura)}.csv`;
            downloadCsv(filename, csv);
        })
        .catch(e => {
            console.error(e);
            alert('No se pudo exportar la factura.');
        });
}

function enviarFacturaWhatsApp(idFactura) {
    fetchFacturaDetalle(idFactura)
        .then(factura => {
            const telefonoSan = sanitizePhoneForWa(factura.cliente_telefono || '') || sanitizePhoneForWa(prompt('Ingrese el número de WhatsApp (ej: 573001234567):') || '');
            if (!telefonoSan) return;
            const mensaje = buildWhatsappMessage(factura);
            const url = `https://wa.me/${telefonoSan}?text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        })
        .catch(e => {
            console.error(e);
            alert('No se pudo preparar el mensaje de WhatsApp.');
        });
}
