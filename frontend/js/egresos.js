const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));

let egresosGlobal = [];
let currentPage = 1;
let itemsPerPage = 10;

function formatCurrency(val) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(val || 0));
}

function parseDateToLocalString(dateStr) {
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return String(dateStr || '-');
        return d.toLocaleString('es-CO');
    } catch (_) {
        return String(dateStr || '-');
    }
}

function isAdmin() {
    return String(localStorage.getItem('usuario_rol') || '') === '1';
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    cargarSesionesCajaEnSelect();
    cargarEgresos();
});

function setupEventListeners() {
    const perPageEl = document.getElementById('items-per-page');
    if (perPageEl) {
        perPageEl.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value, 10);
            currentPage = 1;
            renderizarTabla();
        });
    }

    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    if (btnPrev) btnPrev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderizarTabla(); } });
    if (btnNext) btnNext.addEventListener('click', () => {
        const totalPages = Math.ceil((egresosGlobal?.length || 0) / itemsPerPage);
        if (currentPage < totalPages) { currentPage++; renderizarTabla(); }
    });

    const ids = ['filtro-busqueda', 'filtro-fecha-desde', 'filtro-fecha-hasta'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') aplicarFiltrosEgresos();
        });
        if (el.type === 'date') el.addEventListener('change', aplicarFiltrosEgresos);
    });

    const metodo = document.getElementById('filtro-metodo');
    if (metodo) metodo.addEventListener('change', aplicarFiltrosEgresos);
}

async function cargarSesionesCajaEnSelect() {
    const select = document.getElementById('egreso-sesion');
    if (!select) return;

    // Mantener opciones base
    const baseOptions = `
        <option value="">Automático (caja abierta si existe)</option>
        <option value="__none__">Sin caja</option>
    `;
    select.innerHTML = baseOptions;

    // Para mantenerlo simple y sin endpoint adicional: solo intentamos usar la sesión abierta actual del usuario
    // (si existe, la mostramos como opción rápida)
    const usuarioId = Number(localStorage.getItem('usuario_id') || 0);
    if (!(usuarioId > 0)) return;

    try {
        const res = await fetch(`${API_URL}/box/status?usuario_id=${usuarioId}`, { headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (!res.ok) return;
        if (data && data.id_sesion) {
            const opt = document.createElement('option');
            opt.value = String(data.id_sesion);
            opt.textContent = `Caja abierta (#${data.id_sesion})`;
            select.appendChild(opt);
        }
    } catch (_) {}
}

async function cargarEgresos() {
    try {
        const search = (document.getElementById('filtro-busqueda')?.value || '').trim();
        const metodo = (document.getElementById('filtro-metodo')?.value || '').trim();
        const from = (document.getElementById('filtro-fecha-desde')?.value || '').trim();
        const to = (document.getElementById('filtro-fecha-hasta')?.value || '').trim();

        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (metodo) params.append('metodo_pago', metodo);
        if (from) params.append('from', from);
        if (to) params.append('to', to);

        const url = `${API_URL}/expenses?${params.toString()}`;
        const response = await fetch(url, { headers: { 'Content-Type': 'application/json' } });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || 'Error cargando egresos');

        egresosGlobal = Array.isArray(data) ? data : [];
        currentPage = 1;
        renderizarTabla();
        renderKPIs();
    } catch (error) {
        console.error('Error cargando egresos:', error);
        egresosGlobal = [];
        renderizarTabla();
        renderKPIs();
    }
}

function aplicarFiltrosEgresos() {
    cargarEgresos();
}

function renderKPIs() {
    const total = (egresosGlobal || []).reduce((acc, e) => acc + Number(e.monto || 0), 0);
    const totalEl = document.getElementById('kpi-total-egresos');
    if (totalEl) totalEl.textContent = formatCurrency(total);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayKey = `${yyyy}-${mm}-${dd}`;

    const egHoy = (egresosGlobal || []).reduce((acc, e) => {
        const fecha = String(e.fecha || '');
        return acc + (fecha.startsWith(todayKey) ? Number(e.monto || 0) : 0);
    }, 0);
    const hoyEl = document.getElementById('kpi-egresos-hoy');
    if (hoyEl) hoyEl.textContent = formatCurrency(egHoy);

    const monthKey = `${yyyy}-${mm}`;
    const egMes = (egresosGlobal || []).reduce((acc, e) => {
        const fecha = String(e.fecha || '');
        return acc + (fecha.startsWith(monthKey) ? Number(e.monto || 0) : 0);
    }, 0);
    const mesEl = document.getElementById('kpi-egresos-mes');
    if (mesEl) mesEl.textContent = formatCurrency(egMes);

    const filtroEl = document.getElementById('kpi-egresos-filtro');
    if (filtroEl) filtroEl.textContent = formatCurrency(total);
}

function renderizarTabla() {
    const tbody = document.getElementById('tabla-egresos');
    const emptyState = document.getElementById('empty-state');
    const tableContainer = document.querySelector('.table-responsive');
    const paginationContainer = document.querySelector('.pagination-container');

    const infoInicio = document.getElementById('info-inicio');
    const infoFin = document.getElementById('info-fin');
    const infoTotal = document.getElementById('info-total');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    if (!tbody) return;
    tbody.innerHTML = '';

    if (!egresosGlobal || egresosGlobal.length === 0) {
        if (tableContainer) tableContainer.style.display = 'none';
        if (paginationContainer) paginationContainer.style.display = 'none';
        if (emptyState) {
            emptyState.classList.remove('d-none');
            emptyState.style.display = 'flex';
            emptyState.style.flexDirection = 'column';
            emptyState.style.alignItems = 'center';
            emptyState.style.padding = '40px';
        }
        if (infoInicio) infoInicio.textContent = '0';
        if (infoFin) infoFin.textContent = '0';
        if (infoTotal) infoTotal.textContent = '0';
        return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (paginationContainer) paginationContainer.style.display = 'flex';
    if (emptyState) {
        emptyState.classList.add('d-none');
        emptyState.style.display = 'none';
    }

    const totalItems = egresosGlobal.length;
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
    const items = egresosGlobal.slice(startIdx, endIdx);

    if (infoInicio) infoInicio.textContent = String(startIdx + 1);
    if (infoFin) infoFin.textContent = String(endIdx);
    if (infoTotal) infoTotal.textContent = String(totalItems);
    if (btnPrev) btnPrev.disabled = currentPage === 1;
    if (btnNext) btnNext.disabled = currentPage >= Math.ceil(totalItems / itemsPerPage);

    items.forEach(e => {
        const tr = document.createElement('tr');
        const method = String(e.metodo_pago || '-');
        const methodLabel = ({
            efectivo: 'EFECTIVO',
            transferencia: 'TRANSFERENCIA',
            tarjeta: 'TARJETA',
            otros: 'OTROS'
        })[method] || method.toUpperCase();

        const badgeStyle = (function() {
            if (method === 'efectivo') return 'background-color:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;';
            if (method === 'transferencia') return 'background-color:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd;';
            if (method === 'tarjeta') return 'background-color:#ede9fe;color:#6d28d9;border:1px solid #c4b5fd;';
            return 'background-color:#f3f4f6;color:#374151;border:1px solid #e5e7eb;';
        })();

        const actions = [];
        actions.push(`
            <button class="btn-icon" onclick="editarEgreso(${Number(e.id_egreso)})" title="Editar">
                <i class="fas fa-pen"></i>
            </button>
        `);
        if (isAdmin()) {
            actions.push(`
                <button class="btn-icon" style="color:#b91c1c;border-color:#fecaca;" onclick="eliminarEgreso(${Number(e.id_egreso)})" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            `);
        }

        tr.innerHTML = `
            <td><span style="font-family: monospace; color: #6b7280; font-weight: 500;">#${e.id_egreso}</span></td>
            <td>
                <div style="display:flex;flex-direction:column;">
                    <span style="font-weight:500;color:#111827;">${parseDateToLocalString(e.fecha)}</span>
                </div>
            </td>
            <td>
                <div style="display:flex;flex-direction:column;gap:2px;">
                    <div style="font-weight:700;color:#111827;">${e.concepto || '-'}</div>
                    <div style="font-size:12px;color:#6b7280;">${e.descripcion || ''}</div>
                </div>
            </td>
            <td><span style="${badgeStyle} padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">${methodLabel}</span></td>
            <td style="font-weight:800;color:#111827;">${formatCurrency(e.monto)}</td>
            <td>${e.usuario_nombre || '—'}</td>
            <td>${e.sesion_id ? ('#' + e.sesion_id) : '—'}</td>
            <td><div class="table-actions">${actions.join('')}</div></td>
        `;
        tbody.appendChild(tr);
    });
}

function abrirModalEgreso() {
    const modal = document.getElementById('modalEgreso');
    if (!modal) return;

    document.getElementById('egresoModalTitle').textContent = 'Nuevo Egreso';
    document.getElementById('egreso-id').value = '';
    document.getElementById('form-egreso')?.reset();
    cargarSesionesCajaEnSelect();

    modal.style.display = 'block';
    modal.classList.add('show');
    document.body.classList.add('modal-open');

    let backdrop = document.querySelector('.modal-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
}

function cerrarModalEgreso() {
    const modal = document.getElementById('modalEgreso');
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('show');
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
}

async function editarEgreso(id) {
    try {
        const res = await fetch(`${API_URL}/expenses/${id}`, { headers: { 'Content-Type': 'application/json' } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'No se pudo cargar el egreso');

        abrirModalEgreso();
        document.getElementById('egresoModalTitle').textContent = `Editar Egreso #${id}`;
        document.getElementById('egreso-id').value = String(data.id_egreso || id);

        // datetime-local requiere formato YYYY-MM-DDTHH:mm
        const fecha = data.fecha ? String(data.fecha).replace(' ', 'T').slice(0, 16) : '';
        const fechaEl = document.getElementById('egreso-fecha');
        if (fechaEl) fechaEl.value = fecha;

        document.getElementById('egreso-concepto').value = data.concepto || '';
        document.getElementById('egreso-descripcion').value = data.descripcion || '';
        document.getElementById('egreso-metodo').value = data.metodo_pago || 'efectivo';
        document.getElementById('egreso-monto').value = data.monto || '';

        const sesionSelect = document.getElementById('egreso-sesion');
        if (sesionSelect) {
            await cargarSesionesCajaEnSelect();
            if (data.sesion_id) {
                const v = String(data.sesion_id);
                // Si no existe la opción, la agregamos
                if (![...sesionSelect.options].some(o => o.value === v)) {
                    const opt = document.createElement('option');
                    opt.value = v;
                    opt.textContent = `Caja (#${v})`;
                    sesionSelect.appendChild(opt);
                }
                sesionSelect.value = v;
            } else {
                sesionSelect.value = '__none__';
            }
        }
    } catch (e) {
        console.error(e);
        alert(e.message || 'Error al editar');
    }
}

async function guardarEgreso() {
    const id = (document.getElementById('egreso-id')?.value || '').trim();
    const fechaRaw = (document.getElementById('egreso-fecha')?.value || '').trim();
    const concepto = (document.getElementById('egreso-concepto')?.value || '').trim();
    const descripcion = (document.getElementById('egreso-descripcion')?.value || '').trim();
    const metodo = (document.getElementById('egreso-metodo')?.value || 'efectivo').trim();
    const monto = Number(document.getElementById('egreso-monto')?.value || 0);
    const sesionVal = (document.getElementById('egreso-sesion')?.value || '').trim();

    if (!concepto || !(monto > 0)) {
        alert('Concepto y monto (>0) son obligatorios.');
        return;
    }

    const payload = {
        concepto,
        descripcion: descripcion || null,
        metodo_pago: metodo,
        monto
    };

    if (fechaRaw) {
        payload.fecha = fechaRaw.replace('T', ' ') + ':00';
    }

    if (sesionVal === '__none__') {
        payload.sesion_id = null;
    } else if (sesionVal) {
        payload.sesion_id = Number(sesionVal);
    }

    try {
        const url = id ? `${API_URL}/expenses/${id}` : `${API_URL}/expenses`;
        const method = id ? 'PUT' : 'POST';
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'No se pudo guardar el egreso');

        cerrarModalEgreso();
        await cargarEgresos();
        alert(id ? 'Egreso actualizado.' : 'Egreso registrado.');
    } catch (e) {
        console.error(e);
        alert(e.message || 'Error guardando egreso');
    }
}

async function eliminarEgreso(id) {
    if (!isAdmin()) {
        alert('No tienes permisos para eliminar egresos.');
        return;
    }
    if (!confirm('¿Eliminar este egreso?')) return;
    try {
        const res = await fetch(`${API_URL}/expenses/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'No se pudo eliminar');
        await cargarEgresos();
    } catch (e) {
        console.error(e);
        alert(e.message || 'Error eliminando');
    }
}

