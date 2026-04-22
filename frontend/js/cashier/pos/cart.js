(function () {
    const ns = window.CashierPOS = window.CashierPOS || {};
    const state = ns.state;

    function scheduleQuoteRefresh() {
        if (!state.sesionCajaId) return;
        if (state.quoteRefreshTimer) clearTimeout(state.quoteRefreshTimer);
        state.quoteRefreshTimer = setTimeout(() => {
            state.quoteRefreshTimer = null;
            if (typeof window.refreshQuote === 'function') {
                window.refreshQuote();
            }
        }, 250);
    }

    function toggleQuoteBreakdown() {
        state.quoteBreakdownVisible = !state.quoteBreakdownVisible;
        renderQuoteBreakdown();
    }

    function renderQuoteBreakdown() {
        const container = document.getElementById('quote-breakdown');
        const body = document.getElementById('quote-breakdown-body');
        if (!container || !body) return;

        const quoteCache = state.quoteCache;
        const cartKey = ns.base.getCartKey();
        if (!quoteCache || state.quoteCartKey !== cartKey || !Array.isArray(quoteCache.lines) || quoteCache.lines.length === 0) {
            container.style.display = 'none';
            body.innerHTML = '';
            return;
        }

        if (!state.quoteBreakdownVisible) {
            container.style.display = 'block';
            body.innerHTML = '';
            const btn = container.querySelector('button');
            if (btn) btn.textContent = 'Mostrar';
            return;
        }

        container.style.display = 'block';
        const btn = container.querySelector('button');
        if (btn) btn.textContent = 'Ocultar';

        const nameById = new Map((state.carrito || []).map(i => [Number(i.id_producto), i.nombre]));
        const grouped = new Map();
        quoteCache.lines.forEach(ln => {
            const key = `${ln.producto_id}|${ln.lote_id}|${ln.precio_unitario}`;
            if (!grouped.has(key)) {
                grouped.set(key, { producto_id: Number(ln.producto_id), lote_id: Number(ln.lote_id), precio_unitario: Number(ln.precio_unitario), cantidad: 0, subtotal: 0 });
            }
            const row = grouped.get(key);
            row.cantidad += Number(ln.cantidad);
            row.subtotal += Number(ln.subtotal);
        });

        body.innerHTML = '';
        Array.from(grouped.values())
            .sort((a, b) => (a.producto_id - b.producto_id) || (a.lote_id - b.lote_id))
            .forEach(r => {
                const productName = nameById.get(r.producto_id) || `Producto #${r.producto_id}`;
                const line = document.createElement('div');
                line.style.display = 'flex';
                line.style.justifyContent = 'space-between';
                line.style.gap = '10px';
                line.innerHTML = `
                    <div style="display:flex; flex-direction:column;">
                        <span style="font-weight:600; color:#111827; font-size:0.9rem;">${productName}</span>
                        <span style="font-size:0.78rem; color:#6b7280;">Lote: #${r.lote_id} · ${r.cantidad} × $${r.precio_unitario.toLocaleString('es-CO')}</span>
                    </div>
                    <div style="font-weight:700; color:#111827;">$${Math.round(r.subtotal).toLocaleString('es-CO')}</div>
                `;
                body.appendChild(line);
            });
    }

    function abrirModalLotes(productoId, productoNombre) {
        state.loteModalProductoId = Number(productoId);
        const modal = document.getElementById('modal-lotes');
        const subtitle = document.getElementById('modal-lotes-subtitle');
        const tbody = document.getElementById('modal-lotes-body');
        const search = document.getElementById('modal-lotes-search');

        if (subtitle) subtitle.textContent = productoNombre ? String(productoNombre) : `Producto #${productoId}`;
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="padding:14px; text-align:center; color:#6b7280;">Cargando...</td></tr>';
        if (search) {
            search.value = '';
            search.oninput = () => renderModalLotes();
            setTimeout(() => search.focus(), 50);
        }
        if (modal) modal.style.display = 'flex';
    }

    function cerrarModalLotes() {
        const modal = document.getElementById('modal-lotes');
        if (modal) modal.style.display = 'none';
        state.loteModalProductoId = null;
        state.loteModalDisponibles = [];
    }

    function renderModalLotes() {
        const tbody = document.getElementById('modal-lotes-body');
        const search = document.getElementById('modal-lotes-search');
        if (!tbody) return;

        const term = (search?.value || '').trim().toLowerCase();
        const list = (state.loteModalDisponibles || []).filter(l => {
            if (!term) return true;
            const idTxt = String(l.id_lote ?? '').toLowerCase();
            const numTxt = String(l.numero_lote ?? '').toLowerCase();
            return idTxt.includes(term) || numTxt.includes(term);
        });

        tbody.innerHTML = '';
        if (!list || list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding:14px; text-align:center; color:#6b7280;">No hay lotes disponibles.</td></tr>';
            return;
        }

        const fifoRow = document.createElement('tr');
        fifoRow.innerHTML = `
            <td colspan="4" style="padding:10px 12px; border-top:1px solid var(--border-color); background:#f8fafc;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                    <div>
                        <div style="font-weight:700; color:#111827;">Automático (FIFO)</div>
                        <div style="font-size:12px; color:#6b7280;">Usa los lotes por orden de antigüedad según disponibilidad.</div>
                    </div>
                    <button type="button" class="btn-qty" style="padding:6px 10px;" onclick="seleccionarLoteModal(null)">Usar FIFO</button>
                </div>
            </td>
        `;
        tbody.appendChild(fifoRow);

        list.forEach(l => {
            const idLote = Number(l.id_lote);
            const disponible = Number(l.cantidad_disponible || 0);
            const precio = Number(l.precio_venta || 0);
            const numero = l.numero_lote ? String(l.numero_lote) : null;
            const label = numero ? `${numero} (#${idLote})` : `#${idLote}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:10px 12px; border-top:1px solid var(--border-color);">
                    <div style="font-weight:700; color:#111827;">${label}</div>
                </td>
                <td style="padding:10px 12px; text-align:right; border-top:1px solid var(--border-color); font-weight:600;">${disponible}</td>
                <td style="padding:10px 12px; text-align:right; border-top:1px solid var(--border-color); font-weight:700; color: var(--primary-color);">$${precio.toLocaleString('es-CO')}</td>
                <td style="padding:10px 12px; text-align:right; border-top:1px solid var(--border-color);">
                    <button type="button" class="btn-qty" style="padding:6px 10px;" onclick="seleccionarLoteModal(${idLote})">Elegir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function seleccionarLoteModal(loteId) {
        const pid = Number(state.loteModalProductoId);
        if (!(pid > 0)) return;
        const item = state.carrito.find(p => Number(p.id_producto) === pid);
        if (!item) {
            cerrarModalLotes();
            return;
        }

        if (loteId === null) {
            item.lote_id = null;
            item.lote_numero = null;
            item.lote_disponible = null;
        } else {
            const selectedId = Number(loteId);
            if (!Number.isFinite(selectedId) || selectedId <= 0) return;
            const found = (state.loteModalDisponibles || []).find(l => Number(l.id_lote) === selectedId);
            if (!found) return;
            item.lote_id = selectedId;
            item.lote_numero = found.numero_lote ? String(found.numero_lote) : ('#' + selectedId);
            item.lote_disponible = Number(found.cantidad_disponible || 0);
        }

        ns.base.saveCart();
        actualizarCarritoUI();
        scheduleQuoteRefresh();
        cerrarModalLotes();
    }

    function agregarAlCarrito(producto) {
        const existente = state.carrito.find(item => item.id_producto === producto.id_producto);
        if (existente) {
            if (existente.cantidad < producto.stock_actual) {
                existente.cantidad++;
            } else {
                alert('Stock máximo alcanzado para este producto.');
                return;
            }
        } else {
            state.carrito.push({
                id_producto: producto.id_producto,
                nombre: producto.nombre,
                precio: parseFloat(producto.precio_venta),
                cantidad: 1,
                max_stock: producto.stock_actual,
                imagen: producto.imagen,
                lote_id: null
            });
        }
        ns.base.saveCart();
        actualizarCarritoUI();
        scheduleQuoteRefresh();
    }

    function cambiarCantidad(id, delta) {
        const item = state.carrito.find(p => p.id_producto === id);
        if (!item) return;

        const nuevaCantidad = item.cantidad + delta;
        const limiteLote = item.lote_id ? Number(item.lote_disponible || 0) : null;

        if (nuevaCantidad > 0 && nuevaCantidad <= item.max_stock && (!item.lote_id || nuevaCantidad <= limiteLote)) {
            item.cantidad = nuevaCantidad;
        } else if (nuevaCantidad <= 0) {
            eliminarDelCarrito(id);
            return;
        } else if (item.lote_id && limiteLote !== null && nuevaCantidad > limiteLote) {
            ns.base.showToastPOS(`El lote seleccionado solo permite ${limiteLote} unidades. Cambia a FIFO o elige otro lote.`, 'warning');
            return;
        } else {
            alert('No hay suficiente stock disponible.');
            return;
        }
        ns.base.saveCart();
        actualizarCarritoUI();
        scheduleQuoteRefresh();
    }

    function eliminarDelCarrito(id) {
        state.carrito = state.carrito.filter(p => p.id_producto !== id);
        ns.base.saveCart();
        actualizarCarritoUI();
        scheduleQuoteRefresh();
    }

    async function seleccionarLotePreferido(productoId) {
        const item = state.carrito.find(p => p.id_producto === productoId);
        if (!item) return;

        try {
            const response = await fetch(`${state.API_URL}/products/${productoId}/lots`, { headers: ns.base.getAuthHeaders(false) });
            const json = await response.json();
            const lots = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
            const disponibles = lots.filter(l => Number(l.cantidad_disponible || 0) > 0 && (l.estado || 'activo') === 'activo');

            state.loteModalDisponibles = disponibles;
            abrirModalLotes(productoId, item.nombre);
            renderModalLotes();
        } catch (e) {
            console.error(e);
            ns.base.showToastPOS('Error consultando lotes.', 'error');
        }
    }

    function actualizarCarritoUI() {
        const tbody = document.getElementById('carrito-body');
        const subtotalSpan = document.getElementById('summary-subtotal');
        const totalSpan = document.getElementById('summary-total');
        if (!tbody || !subtotalSpan || !totalSpan) return;

        tbody.innerHTML = '';
        let total = 0;

        if (state.carrito.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Carrito vacío</td></tr>';
            subtotalSpan.innerText = '$0';
            totalSpan.innerText = '$0';
            const montoRecibido = document.getElementById('monto-recibido');
            const textoCambio = document.getElementById('texto-cambio');
            if (montoRecibido) montoRecibido.value = '';
            if (textoCambio) textoCambio.innerText = '$0';
            return;
        }

        state.carrito.forEach(item => {
            const subtotalItem = item.precio * item.cantidad;
            total += subtotalItem;

            let imgHtml = '';
            if (item.imagen && item.imagen.trim() !== '') {
                const imgSrc = item.imagen.startsWith('http') ? item.imagen : `../../${item.imagen}`;
                imgHtml = `<img src="${imgSrc}" class="cart-thumb" onerror="this.src='../../assets/no-image.png'">`;
            } else {
                imgHtml = `<div class="cart-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📦</div>`;
            }

            const tr = document.createElement('tr');
            const loteLabel = item.lote_id ? `Lote: ${item.lote_numero || ('#' + item.lote_id)}` : 'Lote: FIFO';
            const loteModo = item.lote_id ? 'Modo: solo este lote' : 'Modo: automático';
            tr.innerHTML = `
                <td>${imgHtml}</td>
                <td>
                    <div style="font-weight:600; font-size:0.9rem;">${item.nombre}</div>
                    <div style="color:#666; font-size:0.8rem;">$${item.precio.toLocaleString('es-CO')}</div>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:4px; font-size:0.75rem; color:#666;">
                        <span>${loteLabel}</span>
                        <span>${loteModo}</span>
                        <button class="btn-qty" style="padding:2px 8px; font-size:0.75rem;" onclick="event.stopPropagation(); seleccionarLotePreferido(${item.id_producto})">Cambiar</button>
                    </div>
                    <div class="cart-qty-control" style="margin-top:4px;">
                        <button class="btn-qty" onclick="cambiarCantidad(${item.id_producto}, -1)">-</button>
                        <div class="cart-qty-val">${item.cantidad}</div>
                        <button class="btn-qty" onclick="cambiarCantidad(${item.id_producto}, 1)">+</button>
                    </div>
                </td>
                <td style="text-align:right; font-weight:600;">$${subtotalItem.toLocaleString('es-CO')}</td>
                <td style="text-align:center;">
                    <button class="btn-delete-item" onclick="eliminarDelCarrito(${item.id_producto})">
                        <svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        if (state.quoteCache && state.quoteCartKey === ns.base.getCartKey() && Number(state.quoteCache.total || 0) > 0) {
            total = Number(state.quoteCache.total || 0);
            renderQuoteBreakdown();
        }

        subtotalSpan.innerText = '$' + total.toLocaleString('es-CO', { maximumFractionDigits: 0 });
        totalSpan.innerText = '$' + total.toLocaleString('es-CO', { maximumFractionDigits: 0 });

        if (typeof window.calcularCambio === 'function') {
            window.calcularCambio(total);
        }
    }

    function filtrarProductos() {
        const texto = document.getElementById('buscador').value.toLowerCase();
        const filtrados = state.productosGlobal.filter(p => {
            const nombre = (p.nombre || '').toLowerCase();
            const codigo = (p.codigo || '').toLowerCase();
            return nombre.includes(texto) || codigo.includes(texto);
        });
        if (typeof window.renderizarCatalogo === 'function') {
            window.renderizarCatalogo(filtrados);
        }
    }

    function init() {
        ns.base.loadCartFromStorage();
        actualizarCarritoUI();

        window.toggleQuoteBreakdown = toggleQuoteBreakdown;
        window.cerrarModalLotes = cerrarModalLotes;
        window.seleccionarLoteModal = seleccionarLoteModal;
        window.agregarAlCarrito = agregarAlCarrito;
        window.cambiarCantidad = cambiarCantidad;
        window.eliminarDelCarrito = eliminarDelCarrito;
        window.seleccionarLotePreferido = seleccionarLotePreferido;
        window.actualizarCarritoUI = actualizarCarritoUI;
        window.filtrarProductos = filtrarProductos;
    }

    ns.cart = {
        init,
        scheduleQuoteRefresh,
        toggleQuoteBreakdown,
        renderQuoteBreakdown,
        abrirModalLotes,
        cerrarModalLotes,
        renderModalLotes,
        seleccionarLoteModal,
        agregarAlCarrito,
        cambiarCantidad,
        eliminarDelCarrito,
        seleccionarLotePreferido,
        actualizarCarritoUI,
        filtrarProductos
    };
})();
