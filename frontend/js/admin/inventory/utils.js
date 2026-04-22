(function () {
    const ns = window.AdminInventory = window.AdminInventory || {};
    ns.state = ns.state || {
        API_URL: (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php'))),
        productosAdminGlobal: [],
        productoLotesActualId: null,
        regularizacionCandidates: [],
        detalleLoteTimelineCache: [],
        detalleLoteTimelineFilter: 'todos'
    };

    function getProductoAdminById(id) {
        const pid = Number(id);
        return (ns.state.productosAdminGlobal || []).find(p => Number(p.id_producto) === pid) || null;
    }

    function formatCurrency(value) {
        return `$${Number(value || 0).toLocaleString('es-CO')}`;
    }

    function formatDateTime(value) {
        if (!value) return 'Sin fecha';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString('es-CO');
    }

    function getLotStatusMeta(estado) {
        const value = String(estado || '').toLowerCase();
        if (value === 'agotado') return { label: 'Agotado', className: 'lot-badge lot-badge--warning' };
        if (value === 'bloqueado') return { label: 'Bloqueado', className: 'lot-badge lot-badge--danger' };
        if (value === 'cuarentena') return { label: 'Cuarentena', className: 'lot-badge lot-badge--warning' };
        if (value === 'vencido') return { label: 'Vencido', className: 'lot-badge lot-badge--danger' };
        if (value === 'inactivo') return { label: 'Inactivo', className: 'lot-badge lot-badge--danger' };
        return { label: 'Activo', className: 'lot-badge lot-badge--success' };
    }

    function setLotIdentityFieldsLocked(locked) {
        const numeroEl = document.getElementById('editLoteNumero');
        const proveedorEl = document.getElementById('editLoteProveedorId');
        const costoEl = document.getElementById('editLoteCostoUnitario');
        const noticeEl = document.getElementById('editLoteIdentityLockNotice');
        const numeroHelp = numeroEl?.parentElement?.querySelector('.form-help');

        if (numeroEl) numeroEl.readOnly = !!locked;
        if (proveedorEl) proveedorEl.disabled = !!locked;
        if (costoEl) costoEl.readOnly = !!locked;
        if (noticeEl) noticeEl.classList.toggle('hidden', !locked);
        if (numeroHelp) numeroHelp.classList.toggle('hidden', !!locked);
    }

    function actualizarResumenLotes(lots) {
        const total = Array.isArray(lots) ? lots.length : 0;
        const activos = (lots || []).filter(l => String(l.estado || '').toLowerCase() === 'activo').length;
        const disponibles = (lots || []).reduce((acc, l) => acc + Number(l.cantidad_disponible || 0), 0);

        const totalEl = document.getElementById('lotesResumenTotal');
        const activosEl = document.getElementById('lotesResumenActivos');
        const disponiblesEl = document.getElementById('lotesResumenDisponibles');

        if (totalEl) totalEl.textContent = String(total);
        if (activosEl) activosEl.textContent = String(activos);
        if (disponiblesEl) disponiblesEl.textContent = String(disponibles);
    }

    function copiarOpcionesSelect(origenId, destinoId) {
        const origen = document.getElementById(origenId);
        const destino = document.getElementById(destinoId);
        if (!origen || !destino) return;
        destino.innerHTML = origen.innerHTML;
    }

    async function cargarProveedoresEnSelect(selectId) {
        const select = document.getElementById(selectId);
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione un proveedor</option>';
        try {
            const response = await fetch(`${ns.state.API_URL}/suppliers`);
            const proveedores = await response.json();
            (proveedores || []).forEach(p => {
                select.innerHTML += `<option value="${p.id_proveedor}">${p.nombre}</option>`;
            });
        } catch (err) {
            console.error(err);
        }
    }

    function getLotHistoryCategoryMeta(category) {
        const value = String(category || '').toLowerCase();
        if (value === 'venta') return { label: 'Venta', bg: '#fef3c7', color: '#92400e' };
        if (value === 'ajuste') return { label: 'Ajuste', bg: '#dbeafe', color: '#1d4ed8' };
        if (value === 'estado') return { label: 'Estado', bg: '#fee2e2', color: '#b91c1c' };
        if (value === 'anulacion') return { label: 'Anulación', bg: '#ede9fe', color: '#6d28d9' };
        if (value === 'regularizacion') return { label: 'Regularización', bg: '#dcfce7', color: '#166534' };
        if (value === 'creacion') return { label: 'Creación', bg: '#dcfce7', color: '#166534' };
        return { label: 'Movimiento', bg: '#f3f4f6', color: '#374151' };
    }

    function renderDetalleLoteTimeline() {
        const timelineEl = document.getElementById('detalleLoteTimeline');
        if (!timelineEl) return;

        const timeline = Array.isArray(ns.state.detalleLoteTimelineCache) ? ns.state.detalleLoteTimelineCache : [];
        const filter = String(ns.state.detalleLoteTimelineFilter || 'todos');
        const filtered = filter === 'todos'
            ? timeline
            : timeline.filter(item => String(item.categoria || '').toLowerCase() === filter);

        if (!filtered.length) {
            timelineEl.innerHTML = '<div class="inventory-empty-state">No hay eventos para el filtro seleccionado.</div>';
            return;
        }

        timelineEl.innerHTML = filtered.map(item => {
            const meta = getLotHistoryCategoryMeta(item.categoria);
            const facturaInfo = item.numero_factura
                ? `<div style="font-size:12px; color:#4b5563;">Factura: ${item.numero_factura}${item.factura_estado ? ` (${item.factura_estado})` : ''}</div>`
                : '';
            const referenciaInfo = item.referencia
                ? `<div style="font-size:12px; color:#6b7280;">Referencia: ${item.referencia}</div>`
                : '';
            const saldoInfo = `<div style="font-size:12px; color:#111827; font-weight:600;">Saldo resultante: ${Number(item.saldo_resultante || 0)} unidad(es)</div>`;
            return `
                <article class="lot-card" style="margin-bottom:10px;">
                    <div class="lot-card-head">
                        <div>
                            <div class="lot-card-number">${item.descripcion || meta.label}</div>
                            <div class="lot-card-subtitle">${formatDateTime(item.fecha)} | ${item.tipo === 'entrada' ? 'Entrada' : 'Salida'} de ${Number(item.cantidad || 0)} unidad(es)</div>
                        </div>
                        <span style="padding:4px 10px; border-radius:999px; background:${meta.bg}; color:${meta.color}; font-size:12px; font-weight:700;">${meta.label}</span>
                    </div>
                    <div>${saldoInfo}${facturaInfo}${referenciaInfo}</div>
                </article>
            `;
        }).join('');
    }

    ns.utils = {
        getProductoAdminById,
        formatCurrency,
        formatDateTime,
        getLotStatusMeta,
        setLotIdentityFieldsLocked,
        actualizarResumenLotes,
        copiarOpcionesSelect,
        cargarProveedoresEnSelect,
        getLotHistoryCategoryMeta,
        renderDetalleLoteTimeline
    };
})();
