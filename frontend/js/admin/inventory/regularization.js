(function () {
    const ns = window.AdminInventory = window.AdminInventory || {};
    const state = ns.state;

    function setupRegularizacionModal() {
        const utils = ns.utils;
        const API_URL = state.API_URL;
        const modal = document.getElementById('regularizacionStockModal');
        const modalForm = document.getElementById('regularizarProductoModal');
        const btnOpen = document.getElementById('btnRegularizarStock');
        const tbody = document.getElementById('tablaRegularizacionBody');
        const form = document.getElementById('regularizarProductoForm');

        if (!modal || !modalForm || !btnOpen || !tbody || !form) return;

        const closeList = () => { modal.style.display = 'none'; };
        const closeForm = () => { modalForm.style.display = 'none'; };

        const spanCloseList = document.getElementsByClassName('close-modal-regularizacion')[0];
        const btnCloseList = document.getElementsByClassName('close-modal-regularizacion-btn')[0];
        const spanCloseForm = document.getElementsByClassName('close-modal-regularizar-producto')[0];
        const btnCloseForm = document.getElementsByClassName('close-modal-regularizar-producto-btn')[0];

        if (spanCloseList) spanCloseList.onclick = closeList;
        if (btnCloseList) btnCloseList.onclick = closeList;
        if (spanCloseForm) spanCloseForm.onclick = closeForm;
        if (btnCloseForm) btnCloseForm.onclick = closeForm;

        async function cargarCandidatosRegularizacion() {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando...</td></tr>';
            try {
                const resp = await fetch(`${API_URL}/lots/regularization/candidates`);
                const json = await resp.json();
                const rows = Array.isArray(json) ? json : (json.data || []);
                state.regularizacionCandidates = rows;

                if (!rows.length) {
                    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay productos pendientes por regularizar.</td></tr>';
                    return;
                }

                tbody.innerHTML = '';
                rows.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${row.nombre}</td>
                        <td>${Number(row.stock_actual || 0)}</td>
                        <td>${row.proveedor_nombre || '-'}</td>
                        <td>${utils.formatCurrency(row.precio_venta || 0)}</td>
                        <td><button type="button" class="btn-primary btn-sm" onclick="abrirRegularizacionProducto(${Number(row.id_producto)})">Regularizar</button></td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (err) {
                console.error(err);
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error cargando productos pendientes.</td></tr>';
            }
        }

        btnOpen.onclick = async function () {
            await cargarCandidatosRegularizacion();
            modal.style.display = 'block';
        };

        window.abrirRegularizacionProducto = async function (productoId) {
            const product = state.regularizacionCandidates.find(p => Number(p.id_producto) === Number(productoId));
            if (!product) {
                alert('Producto no encontrado para regularización.');
                return;
            }

            form.reset();
            document.getElementById('regularizarProductoId').value = String(product.id_producto);
            document.getElementById('regularizarProductoNombre').textContent = product.nombre || `Producto #${product.id_producto}`;
            document.getElementById('regularizarProductoStock').textContent = String(Number(product.stock_actual || 0));
            document.getElementById('regularizarPrecioVenta').value = product.precio_venta ? String(product.precio_venta) : '';
            document.getElementById('regularizarCostoUnitario').value = product.precio_compra ? String(product.precio_compra) : '0';
            await utils.cargarProveedoresEnSelect('regularizarProveedorId');
            document.getElementById('regularizarProveedorId').value = product.proveedor_id || '';

            modalForm.style.display = 'block';
        };

        form.onsubmit = async function (e) {
            e.preventDefault();
            const productoId = Number(document.getElementById('regularizarProductoId').value || 0);
            const precioVenta = Number(document.getElementById('regularizarPrecioVenta').value || 0);
            const costoUnitario = Number(document.getElementById('regularizarCostoUnitario').value || 0);
            const proveedorIdRaw = (document.getElementById('regularizarProveedorId').value || '').trim();
            const numeroLote = (document.getElementById('regularizarNumeroLote').value || '').trim();
            const proveedorId = proveedorIdRaw ? Number(proveedorIdRaw) : null;

            if (!(productoId > 0) || !(precioVenta > 0)) {
                alert('Debes indicar un producto y un precio de venta válido.');
                return;
            }

            try {
                const payload = {
                    producto_id: productoId,
                    precio_venta: precioVenta,
                    costo_unitario: costoUnitario
                };
                if (proveedorId) payload.proveedor_id = proveedorId;
                if (numeroLote) payload.numero_lote = numeroLote;

                const resp = await fetch(`${API_URL}/lots/regularize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const json = await resp.json();
                if (!resp.ok) {
                    alert(json.message || 'No se pudo regularizar el producto.');
                    return;
                }

                closeForm();
                await cargarCandidatosRegularizacion();
                await window.cargarProductos();
                await window.verLotesProducto(productoId);
            } catch (err) {
                console.error(err);
                alert('Error de conexión regularizando stock.');
            }
        };
    }

    ns.regularization = {
        setupRegularizacionModal
    };
})();
