const API_URL = window.location.origin + '/proyecto_final/backend';
let facturasGlobal = [];

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
        const response = await fetch(`${API_URL}/invoices`);
        const json = await response.json();

        facturasGlobal = Array.isArray(json) ? json : (json.data || []);
        
        renderTablaFacturas(facturasGlobal);
        actualizarKPIs(facturasGlobal);
    } catch (error) {
        console.error('Error cargando historial:', error);
        alert('Error al cargar el historial de ventas.');
    }
}

function renderTablaFacturas(lista) {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay facturas registradas</td></tr>';
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
                        <button class="btn-icon dropdown-toggle">⋮</button>
                        <div class="dropdown-menu">
                            <button onclick="accionFactura('pdf', ${inv.id_factura})">Descargar PDF</button>
                            <button onclick="accionFactura('excel', ${inv.id_factura})">Descargar Excel</button>
                            <button onclick="accionFactura('print', ${inv.id_factura})">Imprimir</button>
                            <button onclick="accionFactura('whatsapp', ${inv.id_factura})">WhatsApp</button>
                        </div>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
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
            return num.includes(texto) || cli.includes(texto);
        });
    }

    if (estado) {
        filtradas = filtradas.filter(inv => (inv.estado || '').toLowerCase() === estado);
    }

    if (desde) {
        const d = new Date(desde);
        filtradas = filtradas.filter(inv => inv.fecha && new Date(inv.fecha) >= d);
    }

    if (hasta) {
        const h = new Date(hasta);
        h.setHours(23,59,59,999);
        filtradas = filtradas.filter(inv => inv.fecha && new Date(inv.fecha) <= h);
    }

    renderTablaFacturas(filtradas);
}

async function viewDetail(id) {
    try {
        const response = await fetch(`${API_URL}/invoices/${id}`);
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
            const precio = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precio_unitario);
            const subtotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.subtotal);
            
            tr.innerHTML = `
                <td>${item.producto_nombre}</td>
                <td>${item.cantidad}</td>
                <td>${precio}</td>
                <td>${subtotal}</td>
            `;
            tbody.appendChild(tr);
        });

        modal.style.display = "block";

    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo cargar el detalle de la venta.');
    }
}

function accionFactura(tipo, id) {
    if (tipo === 'print') {
        window.open(`${API_URL}/invoices/${id}/print`, '_blank');
    } else if (tipo === 'pdf') {
        window.open(`${API_URL}/invoices/${id}/pdf`, '_blank');
    } else if (tipo === 'excel') {
        window.open(`${API_URL}/invoices/${id}/excel`, '_blank');
    } else if (tipo === 'whatsapp') {
        alert('Función de WhatsApp pendiente de implementación.');
    }
}
