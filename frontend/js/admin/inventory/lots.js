(function () {
    const ns = window.AdminInventory = window.AdminInventory || {};
    const state = ns.state;

    function setupLotesModals() {
        const utils = ns.utils;
        const API_URL = state.API_URL;
        const lotesModal = document.getElementById('lotesModal');
        const crearLoteModal = document.getElementById('crearLoteModal');
        const editarLoteModal = document.getElementById('editarLoteModal');
        const detalleLoteModal = document.getElementById('detalleLoteModal');
        const detalleLoteFiltro = document.getElementById('detalleLoteFiltro');
        if (!lotesModal || !crearLoteModal) return;

        const closeLotes = () => { lotesModal.style.display = 'none'; };
        const closeCrear = () => { crearLoteModal.style.display = 'none'; };
        const closeEditar = () => {
            if (editarLoteModal) editarLoteModal.style.display = 'none';
            utils.setLotIdentityFieldsLocked(false);
        };
        const closeDetalle = () => {
            if (detalleLoteModal) detalleLoteModal.style.display = 'none';
        };

        const spanCloseLotes = document.getElementsByClassName('close-modal-lotes')[0];
        const btnCloseLotes = document.getElementsByClassName('close-modal-lotes-btn')[0];
        if (spanCloseLotes) spanCloseLotes.onclick = closeLotes;
        if (btnCloseLotes) btnCloseLotes.onclick = closeLotes;

        const spanCloseCrear = document.getElementsByClassName('close-modal-crear-lote')[0];
        const btnCloseCrear = document.getElementsByClassName('close-modal-crear-lote-btn')[0];
        if (spanCloseCrear) spanCloseCrear.onclick = closeCrear;
        if (btnCloseCrear) btnCloseCrear.onclick = closeCrear;

        const spanCloseEditar = document.getElementsByClassName('close-modal-editar-lote')[0];
        const btnCloseEditar = document.getElementsByClassName('close-modal-editar-lote-btn')[0];
        if (spanCloseEditar) spanCloseEditar.onclick = closeEditar;
        if (btnCloseEditar) btnCloseEditar.onclick = closeEditar;

        const spanCloseDetalle = document.getElementsByClassName('close-modal-detalle-lote')[0];
        const btnCloseDetalle = document.getElementsByClassName('close-modal-detalle-lote-btn')[0];
        if (spanCloseDetalle) spanCloseDetalle.onclick = closeDetalle;
        if (btnCloseDetalle) btnCloseDetalle.onclick = closeDetalle;

        if (detalleLoteFiltro) {
            detalleLoteFiltro.onchange = function () {
                state.detalleLoteTimelineFilter = this.value || 'todos';
                utils.renderDetalleLoteTimeline();
            };
        }

        const btnNuevaEntrada = document.getElementById('btnNuevaEntradaLote');
        if (btnNuevaEntrada) {
            btnNuevaEntrada.onclick = () => {
                if (!state.productoLotesActualId) return;
                window.abrirCrearLoteModal(state.productoLotesActualId);
            };
        }

        const form = document.getElementById('crearLoteForm');
        if (form) {
            form.onsubmit = async function (e) {
                e.preventDefault();

                const productoId = Number(document.getElementById('loteProductoId').value || 0);
                const cantidad = Number(document.getElementById('loteCantidad').value || 0);
                const precioVenta = Number(document.getElementById('lotePrecioVenta').value || 0);
                const costoUnitario = Number(document.getElementById('loteCostoUnitario').value || 0);
                const proveedorIdRaw = (document.getElementById('loteProveedorId').value || '').trim();
                const proveedorId = proveedorIdRaw ? Number(proveedorIdRaw) : null;
                if (!(productoId > 0) || !(cantidad > 0) || !(precioVenta > 0)) {
                    alert('Producto, cantidad y precio de venta son obligatorios.');
                    return;
                }

                try {
                    const payload = {
                        producto_id: productoId,
                        cantidad: cantidad,
                        precio_venta: precioVenta,
                        costo_unitario: costoUnitario
                    };
                    if (proveedorId) payload.proveedor_id = proveedorId;

                    const response = await fetch(`${API_URL}/lots`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const res = await response.json();
                    if (!response.ok) {
                        alert(res.message || 'Error creando lote.');
                        return;
                    }

                    closeCrear();
                    await window.cargarProductos();
                    if (state.productoLotesActualId && Number(state.productoLotesActualId) === productoId) {
                        await window.verLotesProducto(productoId);
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error de conexión creando lote.');
                }
            };
        }

        const editForm = document.getElementById('editarLoteForm');
        if (editForm) {
            editForm.onsubmit = async function (e) {
                e.preventDefault();
                const loteId = Number(document.getElementById('editLoteId').value || 0);
                const numero = (document.getElementById('editLoteNumero').value || '').trim();
                const proveedorIdRaw = (document.getElementById('editLoteProveedorId').value || '').trim();
                const proveedorId = proveedorIdRaw ? Number(proveedorIdRaw) : null;
                const precioVenta = Number(document.getElementById('editLotePrecioVenta').value || 0);
                const costoUnitario = Number(document.getElementById('editLoteCostoUnitario').value || 0);
                const estado = (document.getElementById('editLoteEstado').value || 'activo').trim();
                const fechaVencimiento = (document.getElementById('editLoteFechaVencimiento').value || '').trim();
                const motivoEstado = (document.getElementById('editLoteMotivoEstado').value || '').trim();
                const identityLocked = document.getElementById('editLoteNumero').readOnly;
                if (!(loteId > 0) || !(precioVenta > 0)) {
                    alert('Precio de venta es obligatorio.');
                    return;
                }
                if (['bloqueado', 'cuarentena', 'vencido'].includes(estado) && !motivoEstado) {
                    alert('Debes indicar un motivo para el estado seleccionado.');
                    return;
                }
                if (estado === 'vencido' && !fechaVencimiento) {
                    alert('Debes indicar una fecha de vencimiento para marcar el lote como vencido.');
                    return;
                }
                try {
                    const payload = {
                        precio_venta: precioVenta,
                        estado,
                        fecha_vencimiento: fechaVencimiento || null,
                        motivo_estado: motivoEstado || null
                    };
                    if (!identityLocked) {
                        payload.costo_unitario = costoUnitario;
                        if (proveedorId) payload.proveedor_id = proveedorId;
                        else payload.proveedor_id = null;
                        payload.numero_lote = numero || null;
                    }
                    const resp = await fetch(`${API_URL}/lots/${loteId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const json = await resp.json();
                    if (!resp.ok) {
                        alert(json.message || 'No se pudo actualizar el lote.');
                        return;
                    }
                    closeEditar();
                    await window.cargarProductos();
                    if (state.productoLotesActualId) await window.verLotesProducto(state.productoLotesActualId);
                } catch (err) {
                    console.error(err);
                    alert('Error de conexión actualizando lote.');
                }
            };
        }

        window.verLotesProducto = async function (productoId) {
            state.productoLotesActualId = Number(productoId);
            const prod = utils.getProductoAdminById(state.productoLotesActualId);
            const nombre = prod?.nombre || `Producto #${state.productoLotesActualId}`;
            const nombreEl = document.getElementById('lotesProductoNombre');
            if (nombreEl) nombreEl.textContent = nombre;

            const tbody = document.getElementById('tablaLotesBody');
            if (tbody) tbody.innerHTML = '<div class="inventory-empty-state">Cargando lotes...</div>';
            utils.actualizarResumenLotes([]);
            lotesModal.style.display = 'block';

            try {
                const response = await fetch(`${API_URL}/products/${state.productoLotesActualId}/lots`);
                const json = await response.json();
                const lots = Array.isArray(json) ? json : (json.data || []);

                if (!tbody) return;
                tbody.innerHTML = '';
                if (!lots || lots.length === 0) {
                    utils.actualizarResumenLotes([]);
                    tbody.innerHTML = '<div class="inventory-empty-state">No hay lotes para este producto.</div>';
                    return;
                }

                utils.actualizarResumenLotes(lots);
                lots.forEach(l => {
                    const fecha = l.fecha_creacion ? new Date(l.fecha_creacion).toLocaleString('es-CO') : '';
                    const precio = Number(l.precio_venta || 0);
                    const costo = Number(l.costo_unitario || 0);
                    const disponible = Number(l.cantidad_disponible || 0);
                    const numero = l.numero_lote ? String(l.numero_lote) : `L-${l.id_lote}`;
                    const status = utils.getLotStatusMeta(l.estado);
                    const item = document.createElement('article');
                    item.className = 'lot-card';
                    item.innerHTML = `
                        <div class="lot-card-head">
                            <div>
                                <div class="lot-card-number">${numero}</div>
                                <div class="lot-card-subtitle">Lote #${l.id_lote} creado el ${fecha || 'Sin fecha'}</div>
                            </div>
                            <span class="${status.className}">${status.label}</span>
                        </div>
                        <div class="lot-card-grid">
                            <div class="lot-card-metric">
                                <span class="lot-card-label">Disponible</span>
                                <strong>${disponible}</strong>
                            </div>
                            <div class="lot-card-metric">
                                <span class="lot-card-label">Precio venta</span>
                                <strong>${utils.formatCurrency(precio)}</strong>
                            </div>
                            <div class="lot-card-metric">
                                <span class="lot-card-label">Costo unitario</span>
                                <strong>${utils.formatCurrency(costo)}</strong>
                            </div>
                        </div>
                        <div class="lot-card-actions">
                            <button class="btn-secondary btn-sm" type="button" onclick="verDetalleLote(${l.id_lote})">Detalle</button>
                            <button class="btn-light btn-sm" type="button" onclick="editarLote(${l.id_lote})">Editar</button>
                            <button class="btn-danger-outline btn-sm" type="button" onclick="eliminarLote(${l.id_lote})">Inactivar</button>
                        </div>
                    `;
                    tbody.appendChild(item);
                });
            } catch (err) {
                console.error(err);
                utils.actualizarResumenLotes([]);
                if (tbody) tbody.innerHTML = '<div class="inventory-empty-state text-danger">Error cargando lotes.</div>';
            }
        };

        window.abrirCrearLoteModal = async function (productoId) {
            const pid = Number(productoId);
            const prod = utils.getProductoAdminById(pid);

            const formEl = document.getElementById('crearLoteForm');
            if (formEl) formEl.reset();

            document.getElementById('loteProductoId').value = String(pid);
            document.getElementById('loteProductoNombre').textContent = prod?.nombre || `Producto #${pid}`;
            document.getElementById('loteCostoUnitario').value = '0';
            document.getElementById('lotePrecioVenta').value = prod?.precio_venta ? String(prod.precio_venta) : '';

            await utils.cargarProveedoresEnSelect('loteProveedorId');
            crearLoteModal.style.display = 'block';
        };

        window.verDetalleLote = async function (loteId) {
            const id = Number(loteId);
            if (!(id > 0) || !detalleLoteModal) return;

            const timelineEl = document.getElementById('detalleLoteTimeline');
            if (timelineEl) timelineEl.innerHTML = '<div class="inventory-empty-state">Cargando historial...</div>';

            try {
                const resp = await fetch(`${API_URL}/lots/${id}/detail`);
                const detail = await resp.json();
                if (!resp.ok) {
                    alert(detail.message || 'No se pudo cargar el detalle del lote.');
                    return;
                }

                const status = utils.getLotStatusMeta(detail.estado);
                document.getElementById('detalleLoteNumero').textContent = detail.numero_lote || `#${detail.id_lote}`;
                document.getElementById('detalleLoteEstado').textContent = status.label;
                document.getElementById('detalleLoteDisponible').textContent = String(Number(detail.cantidad_disponible || 0));
                document.getElementById('detalleLoteVendidas').textContent = String(Number(detail.cantidad_vendida || 0));
                document.getElementById('detalleLoteProducto').textContent = detail.producto_nombre || `Producto #${detail.producto_id}`;
                document.getElementById('detalleLoteProveedor').textContent = detail.proveedor_nombre || 'Sin proveedor';
                document.getElementById('detalleLoteFecha').textContent = utils.formatDateTime(detail.fecha_creacion);
                document.getElementById('detalleLoteInicial').textContent = String(Number(detail.cantidad_inicial || 0));
                document.getElementById('detalleLotePrecio').textContent = utils.formatCurrency(detail.precio_venta || 0);
                document.getElementById('detalleLoteCosto').textContent = utils.formatCurrency(detail.costo_unitario || 0);
                document.getElementById('detalleLoteFechaVencimiento').textContent = detail.fecha_vencimiento || 'No definida';
                document.getElementById('detalleLoteMotivoEstado').textContent = detail.motivo_estado || 'Sin motivo';

                state.detalleLoteTimelineCache = Array.isArray(detail.timeline) ? detail.timeline : [];
                state.detalleLoteTimelineFilter = 'todos';
                if (detalleLoteFiltro) detalleLoteFiltro.value = 'todos';
                if (timelineEl) {
                    if (!state.detalleLoteTimelineCache.length) {
                        timelineEl.innerHTML = '<div class="inventory-empty-state">No hay historial registrado para este lote.</div>';
                    } else {
                        utils.renderDetalleLoteTimeline();
                    }
                }

                detalleLoteModal.style.display = 'block';
            } catch (err) {
                console.error(err);
                alert('Error cargando detalle del lote.');
            }
        };

        window.editarLote = async function (loteId) {
            const id = Number(loteId);
            if (!(id > 0)) return;
            try {
                const resp = await fetch(`${API_URL}/products/${state.productoLotesActualId}/lots`);
                const json = await resp.json();
                const lots = Array.isArray(json) ? json : (json.data || []);
                const lot = (lots || []).find(x => Number(x.id_lote) === id);
                if (!lot) {
                    alert('Lote no encontrado.');
                    return;
                }
                const prod = utils.getProductoAdminById(Number(lot.producto_id));
                const identityLocked = Boolean(lot.identidad_bloqueada);
                document.getElementById('editLoteId').value = String(id);
                document.getElementById('editLoteProductoNombre').textContent = prod?.nombre || `Producto #${lot.producto_id}`;
                document.getElementById('editLoteNumero').value = lot.numero_lote || '';
                document.getElementById('editLotePrecioVenta').value = lot.precio_venta || '';
                document.getElementById('editLoteCostoUnitario').value = lot.costo_unitario || 0;
                document.getElementById('editLoteEstado').value = lot.estado || 'activo';
                document.getElementById('editLoteFechaVencimiento').value = lot.fecha_vencimiento || '';
                document.getElementById('editLoteMotivoEstado').value = lot.motivo_estado || '';
                await utils.cargarProveedoresEnSelect('editLoteProveedorId');
                document.getElementById('editLoteProveedorId').value = lot.proveedor_id || '';
                utils.setLotIdentityFieldsLocked(identityLocked);
                if (editarLoteModal) editarLoteModal.style.display = 'block';
            } catch (err) {
                console.error(err);
                alert('Error cargando datos del lote.');
            }
        };

        window.eliminarLote = async function (loteId) {
            const id = Number(loteId);
            if (!(id > 0)) return;
            if (!confirm('¿Inactivar este lote? Esto dejará el disponible en 0 y evitará su uso en ventas.')) return;
            try {
                const resp = await fetch(`${API_URL}/lots/${id}`, { method: 'DELETE' });
                const json = await resp.json();
                if (!resp.ok) {
                    alert(json.message || 'No se pudo eliminar el lote.');
                    return;
                }
                await window.cargarProductos();
                if (state.productoLotesActualId) await window.verLotesProducto(state.productoLotesActualId);
            } catch (err) {
                console.error(err);
                alert('Error de conexión eliminando lote.');
            }
        };
    }

    ns.lots = {
        setupLotesModals
    };
})();
