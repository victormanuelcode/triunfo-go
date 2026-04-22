const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));

let ventasPagina = [];
let currentPage = 1;
let totalPages = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('sesion_activa')) {
        window.location.href = '../auth/login.html';
        return;
    }

    const buscador = document.getElementById('buscador');
    if (buscador) {
        buscador.addEventListener('input', () => {
            renderTabla(filtrarVentas(ventasPagina));
        });
    }

    cargarVentas(1);
});

async function cargarVentas(page) {
    const usuarioId = localStorage.getItem('usuario_id');
    const token = localStorage.getItem('token');

    try {
        const url = new URL(`${API_URL}/invoices`, window.location.origin);
        url.searchParams.set('limit', String(limit));
        url.searchParams.set('page', String(page));
        if (usuarioId) url.searchParams.set('usuario_id', String(usuarioId));

        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const response = await fetch(url.toString(), { headers });
        const json = await response.json();

        ventasPagina = Array.isArray(json) ? json : (json.data || []);
        currentPage = json?.meta?.current_page || page;
        totalPages = json?.meta?.total_pages || 1;

        renderTabla(filtrarVentas(ventasPagina));
        renderPaginacion();
    } catch (e) {
        const tbody = document.querySelector('#tabla-ventas tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#dc2626;">Error cargando ventas.</td></tr>';
        }
    }
}

function filtrarVentas(lista) {
    const term = (document.getElementById('buscador')?.value || '').trim().toLowerCase();
    if (!term) return lista;

    return (lista || []).filter(v => {
        const numero = (v.numero_factura || '').toString().toLowerCase();
        const cliente = (v.cliente_nombre || '').toString().toLowerCase();
        return numero.includes(term) || cliente.includes(term);
    });
}

function renderTabla(lista) {
    const tbody = document.querySelector('#tabla-ventas tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay ventas para mostrar</td></tr>';
        return;
    }

    lista.forEach(v => {
        const fecha = v.fecha ? new Date(v.fecha).toLocaleString('es-CO') : '';
        const total = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v.total || 0);
        const metodo = (v.metodo_pago || '').toString();

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${v.numero_factura || ('#' + v.id_factura)}</td>
            <td>${fecha}</td>
            <td>${v.cliente_nombre || 'Público General'}</td>
            <td>${total}</td>
            <td>${metodo}</td>
            <td style="display:flex; gap:6px; flex-wrap:wrap;">
                <button type="button" class="btn-print" onclick="verFactura(${v.id_factura})" style="background-color:#2563eb;">Ver factura</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPaginacion() {
    const container = document.getElementById('pagination');
    if (!container) return;

    container.innerHTML = '';

    const prev = document.createElement('button');
    prev.className = 'btn-print';
    prev.textContent = '← Anterior';
    prev.disabled = currentPage <= 1;
    prev.onclick = () => cargarVentas(currentPage - 1);

    const info = document.createElement('span');
    info.textContent = `Página ${currentPage} de ${totalPages}`;
    info.style.display = 'inline-flex';
    info.style.alignItems = 'center';

    const next = document.createElement('button');
    next.className = 'btn-print';
    next.textContent = 'Siguiente →';
    next.disabled = currentPage >= totalPages;
    next.onclick = () => cargarVentas(currentPage + 1);

    container.appendChild(prev);
    container.appendChild(info);
    container.appendChild(next);
}

/** Misma vista que admin: `views/admin/factura.html` */
window.verFactura = function (id) {
    window.open(`../admin/factura.html?id=${id}`, '_blank');
};

