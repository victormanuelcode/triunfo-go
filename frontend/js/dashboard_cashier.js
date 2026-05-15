const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));

function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatCop(n) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(n) || 0);
}

function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function isSameLocalDay(isoOrDateStr) {
    if (!isoOrDateStr) return false;
    const d = new Date(isoOrDateStr);
    if (Number.isNaN(d.getTime())) return false;
    const t0 = startOfToday();
    const t1 = new Date(d);
    return t0.getFullYear() === t1.getFullYear()
        && t0.getMonth() === t1.getMonth()
        && t0.getDate() === t1.getDate();
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }

    const usuarioDatos = JSON.parse(localStorage.getItem('usuario_datos') || '{}');
    const nombre = usuarioDatos.nombre || localStorage.getItem('usuario_nombre') || 'Cajero';
    const sub = document.getElementById('cashierSubtitle');
    if (sub) {
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        sub.textContent = `${new Date().toLocaleDateString('es-ES', opts)} · ${nombre}`;
    }

    await Promise.all([
        loadBoxSummary(),
        loadTodayMetrics(),
        loadLowStockSample(),
        loadRecentInvoices()
    ]);
});

async function loadBoxSummary() {
    const pill = document.getElementById('boxStatusPill');
    const metricTurno = document.getElementById('metricTurno');
    const usuarioId = localStorage.getItem('usuario_id');
    if (!usuarioId) return;

    try {
        const res = await fetch(`${API_URL}/box/status?usuario_id=${encodeURIComponent(usuarioId)}`, {
            headers: { ...authHeaders() }
        });
        const data = await res.json();

        if (data && data.estado === 'abierta') {
            if (pill) {
                pill.textContent = 'Caja abierta';
                pill.className = 'badge-status badge-success';
            }
            if (metricTurno) metricTurno.textContent = formatCop(data.total_ventas || 0);
        } else {
            if (pill) {
                pill.textContent = 'Caja cerrada';
                pill.className = 'badge-status badge-secondary';
            }
            if (metricTurno) metricTurno.textContent = formatCop(0);
        }
    } catch (e) {
        console.error(e);
        if (pill) pill.textContent = 'Caja: error';
    }
}

async function loadTodayMetrics() {
    const usuarioId = localStorage.getItem('usuario_id');
    const elCount = document.getElementById('metricVentasHoy');
    const elTotal = document.getElementById('metricTotalHoy');
    if (!usuarioId) return;

    try {
        const url = new URL(`${API_URL}/invoices`, window.location.origin);
        url.searchParams.set('usuario_id', usuarioId);
        url.searchParams.set('limit', '200');
        url.searchParams.set('page', '1');

        const res = await fetch(url.toString(), { headers: { ...authHeaders() } });
        const json = await res.json();
        const rows = Array.isArray(json) ? json : (json.data || []);

        let count = 0;
        let sum = 0;
        rows.forEach((r) => {
            if (!isSameLocalDay(r.fecha)) return;
            count += 1;
            sum += Number(r.total) || 0;
        });

        if (elCount) elCount.textContent = String(count);
        if (elTotal) elTotal.textContent = formatCop(sum);
    } catch (e) {
        console.error(e);
        if (elCount) elCount.textContent = '—';
        if (elTotal) elTotal.textContent = '—';
    }
}

async function loadLowStockSample() {
    const el = document.getElementById('metricStockBajo');
    if (!el) return;

    try {
        const url = new URL(`${API_URL}/products`, window.location.origin);
        url.searchParams.set('limit', '300');
        url.searchParams.set('page', '1');

        const res = await fetch(url.toString(), { headers: { ...authHeaders() } });
        const json = await res.json();
        const rows = Array.isArray(json) ? json : (json.data || []);

        const low = (rows || []).filter((p) => {
            const s = Number(p.stock_actual);
            const m = Number(p.stock_minimo);
            if (!Number.isFinite(s) || !Number.isFinite(m)) return false;
            return s <= m;
        });

        el.textContent = String(low.length);
    } catch (e) {
        console.error(e);
        el.textContent = '—';
    }
}

async function loadRecentInvoices() {
    const tbody = document.querySelector('#tablaUltimasVentas tbody');
    const usuarioId = localStorage.getItem('usuario_id');
    if (!tbody || !usuarioId) return;

    try {
        const url = new URL(`${API_URL}/invoices`, window.location.origin);
        url.searchParams.set('usuario_id', usuarioId);
        url.searchParams.set('limit', '5');
        url.searchParams.set('page', '1');

        const res = await fetch(url.toString(), { headers: { ...authHeaders() } });
        const json = await res.json();
        const rows = Array.isArray(json) ? json : (json.data || []);

        tbody.innerHTML = '';

        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Sin ventas aún</td></tr>';
            return;
        }

        rows.forEach((v) => {
            const fecha = v.fecha ? new Date(v.fecha).toLocaleString('es-CO') : '';
            const total = formatCop(v.total || 0);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${(v.numero_factura ?? v.id_factura ?? '').toString()}</td>
                <td>${fecha}</td>
                <td>${(v.cliente_nombre || '—').toString()}</td>
                <td>${total}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No se pudieron cargar las ventas</td></tr>';
    }
}
