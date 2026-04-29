(function () {
    const ns = window.AdminInventory = window.AdminInventory || {};
    const state = ns.state;

    function setupCompraProductoModal() {
        const utils = ns.utils;
        const API_URL = state.API_URL;
        const modal = document.getElementById('compraProductoModal');
        const btnCompra = document.getElementById('btnNuevoProducto');
        if (!modal || !btnCompra) return;

        const close = () => { modal.style.display = 'none'; };
        const spanClose = document.getElementsByClassName('close-modal-compra')[0];
        const btnClose = document.getElementsByClassName('close-modal-compra-btn')[0];
        if (spanClose) spanClose.onclick = close;
        if (btnClose) btnClose.onclick = close;

        const productoSelect = document.getElementById('compraProductoId');
        const proveedorComunSelect = document.getElementById('compraProveedorComunId');
        const productoExistenteBox = document.getElementById('compraProductoExistenteBox');
        const productoNuevoBox = document.getElementById('compraProductoNuevoBox');
        const compraTipoGroup = document.getElementById('compraTipoGroup');
        const nuevoCategoriaSelect = document.getElementById('compraNuevoProductoCategoriaId');
        const nuevoUnidadSelect = document.getElementById('compraNuevoProductoUnidadId');
        const nuevoTipoVentaSelect = document.getElementById('compraNuevoProductoTipoVenta');
        const nuevoFraccionPesoBox = document.getElementById('compraNuevoFraccionPesoBox');
        const nuevoFraccionGramosInput = document.getElementById('compraNuevoFraccionGramos');
        const nuevoEquivalenciaPesoTexto = document.getElementById('compraNuevoEquivalenciaPesoTexto');
        const compraTipoPolicyNotice = document.getElementById('compraLotePolicyNotice');
        const existenteBox = document.getElementById('compraExistenteBox');
        const nuevoBox = document.getElementById('compraNuevoBox');

        function getRegistroModo() {
            return document.querySelector('input[name="compraRegistroModo"]:checked')?.value || 'existente';
        }

        function gramosToKg(gramos) {
            const g = Number(gramos || 0);
            if (!Number.isFinite(g) || g <= 0) return 0.001;
            return Number((g / 1000).toFixed(6));
        }

        function actualizarUICompraPeso() {
            if (!nuevoTipoVentaSelect || !nuevoFraccionPesoBox || !nuevoFraccionGramosInput || !nuevoEquivalenciaPesoTexto) return;
            const esPeso = true;
            nuevoTipoVentaSelect.value = 'peso';
            nuevoFraccionPesoBox.style.display = '';
            const gramos = Math.max(1, Number(nuevoFraccionGramosInput.value || 1));
            nuevoFraccionGramosInput.value = String(gramos);
            nuevoEquivalenciaPesoTexto.textContent = `${gramos} g = ${(gramosToKg(gramos)).toFixed(3)} kg`;
        }

        async function cargarProveedoresCompra() {
            if (!proveedorComunSelect) return;
            proveedorComunSelect.innerHTML = '<option value="">Seleccione un proveedor</option>';
            try {
                const response = await fetch(`${API_URL}/suppliers`);
                const proveedores = await response.json();
                (proveedores || []).forEach(p => {
                    proveedorComunSelect.innerHTML += `<option value="${p.id_proveedor}">${p.nombre}</option>`;
                });
            } catch (err) {
                console.error(err);
            }
        }

        async function cargarProductosCompra() {
            if (!productoSelect) return;
            productoSelect.innerHTML = '<option value="">Seleccione un producto</option>';
            (state.productosAdminGlobal || []).forEach(p => {
                productoSelect.innerHTML += `<option value="${p.id_producto}">${p.nombre}</option>`;
            });
        }

        function syncCompraNuevoProductoSelects() {
            utils.copiarOpcionesSelect('categoria_id', 'compraNuevoProductoCategoriaId');
            utils.copiarOpcionesSelect('unidad_medida_id', 'compraNuevoProductoUnidadId');
        }

        function setTipo(_tipo) {
            if (existenteBox) existenteBox.style.display = 'none';
            if (nuevoBox) nuevoBox.style.display = 'block';
            const nCant = document.getElementById('compraNuevoCantidad');
            const nPrecio = document.getElementById('compraNuevoPrecioVenta');
            const eCant = document.getElementById('compraCantidad');
            const eLote = document.getElementById('compraLoteId');
            if (nCant) nCant.required = true;
            if (nPrecio) nPrecio.required = true;
            if (eCant) eCant.required = false;
            if (eLote) eLote.required = false;
        }

        function setRegistroModo(modo) {
            const esExistente = modo === 'existente';
            if (productoExistenteBox) productoExistenteBox.style.display = esExistente ? 'block' : 'none';
            if (productoNuevoBox) productoNuevoBox.style.display = esExistente ? 'none' : 'block';
            if (compraTipoGroup) compraTipoGroup.style.display = 'none';
            if (compraTipoPolicyNotice) compraTipoPolicyNotice.style.display = esExistente ? 'block' : 'none';

            if (productoSelect) productoSelect.required = esExistente;
            if (nuevoCategoriaSelect) nuevoCategoriaSelect.required = !esExistente;
            if (nuevoUnidadSelect) nuevoUnidadSelect.required = !esExistente;

            const nuevoNombre = document.getElementById('compraNuevoProductoNombre');
            if (nuevoNombre) nuevoNombre.required = !esExistente;

            setTipo('nuevo');
        }

        Array.from(document.querySelectorAll('input[name="compraRegistroModo"]')).forEach(r => {
            r.addEventListener('change', () => setRegistroModo(r.value));
        });

        if (productoSelect) {
            productoSelect.addEventListener('change', () => {
                const pid = Number(productoSelect.value || 0);
                const prod = utils.getProductoAdminById(pid);
                const precio = prod?.precio_venta ? Number(prod.precio_venta) : 0;
                const precioNuevo = document.getElementById('compraNuevoPrecioVenta');
                if (precioNuevo && precio > 0) precioNuevo.value = String(precio);
            });
        }
        if (nuevoTipoVentaSelect) {
            nuevoTipoVentaSelect.addEventListener('change', actualizarUICompraPeso);
        }
        if (nuevoFraccionGramosInput) {
            nuevoFraccionGramosInput.addEventListener('input', actualizarUICompraPeso);
            nuevoFraccionGramosInput.addEventListener('change', actualizarUICompraPeso);
        }

        async function crearProductoDesdeCompra(payload) {
            const resp = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await resp.json();
            if (!resp.ok) {
                throw new Error(json.message || 'No se pudo crear el producto.');
            }
            const productoId = Number(json.id_producto || 0);
            if (!(productoId > 0)) {
                throw new Error('El servidor no devolvió el ID del nuevo producto.');
            }
            return productoId;
        }

        const form = document.getElementById('compraProductoForm');
        if (form) {
            form.onsubmit = async function (e) {
                e.preventDefault();
                const registroModo = getRegistroModo();
                const proveedorIdRaw = (document.getElementById('compraProveedorComunId').value || '').trim();
                const proveedorId = proveedorIdRaw ? Number(proveedorIdRaw) : null;
                let productoId = Number(document.getElementById('compraProductoId').value || 0);

                try {
                    if (registroModo === 'nuevo') {
                        const nombre = (document.getElementById('compraNuevoProductoNombre').value || '').trim();
                        const descripcion = (document.getElementById('compraNuevoProductoDescripcion').value || '').trim();
                        const categoriaId = Number(document.getElementById('compraNuevoProductoCategoriaId').value || 0);
                        const unidadId = Number(document.getElementById('compraNuevoProductoUnidadId').value || 0);
                        const cantidad = Number(document.getElementById('compraNuevoCantidad').value || 0);
                        const precioVenta = Number(document.getElementById('compraNuevoPrecioVenta').value || 0);
                        const costoUnitario = Number(document.getElementById('compraNuevoCostoUnitario').value || 0);
                        const tipoVenta = 'peso';
                        const fraccionMinima = gramosToKg(nuevoFraccionGramosInput?.value || 1);

                        if (!nombre || !(categoriaId > 0) || !(unidadId > 0) || !(cantidad > 0) || !(precioVenta > 0)) {
                            alert('Complete nombre, categoría, unidad, cantidad y precio de venta para registrar el producto.');
                            return;
                        }

                        productoId = await crearProductoDesdeCompra({
                            nombre,
                            descripcion,
                            categoria_id: categoriaId,
                            unidad_medida_id: unidadId,
                            proveedor_id: proveedorId || '',
                            precio_compra: costoUnitario,
                            precio_venta: precioVenta,
                            tipo_venta: tipoVenta,
                            unidad_base: 'kg',
                            fraccion_minima: fraccionMinima,
                            stock_actual: 0,
                            estado: 'activo'
                        });

                        const payload = {
                            producto_id: productoId,
                            cantidad,
                            precio_venta: precioVenta,
                            costo_unitario: costoUnitario
                        };
                        if (proveedorId) payload.proveedor_id = proveedorId;

                        const resp = await fetch(`${API_URL}/lots`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const json = await resp.json();
                        if (!resp.ok) {
                            throw new Error(json.message || 'No se pudo registrar la compra.');
                        }
                    } else {
                        if (!(productoId > 0)) {
                            alert('Seleccione un producto.');
                            return;
                        }
                        const cantidad = Number(document.getElementById('compraNuevoCantidad').value || 0);
                        const precioVenta = Number(document.getElementById('compraNuevoPrecioVenta').value || 0);
                        const costoUnitario = Number(document.getElementById('compraNuevoCostoUnitario').value || 0);
                        if (!(cantidad > 0) || !(precioVenta > 0)) {
                            alert('Cantidad y precio de venta son obligatorios.');
                            return;
                        }
                        const payload = { producto_id: productoId, cantidad, precio_venta: precioVenta, costo_unitario: costoUnitario };
                        if (proveedorId) payload.proveedor_id = proveedorId;
                        const resp = await fetch(`${API_URL}/lots`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload)
                        });
                        const json = await resp.json();
                        if (!resp.ok) {
                            alert(json.message || 'No se pudo registrar la compra.');
                            return;
                        }
                    }

                    close();
                    await window.cargarProductos();
                    if (productoId > 0 && typeof window.verLotesProducto === 'function') {
                        await window.verLotesProducto(productoId);
                    }
                } catch (err) {
                    console.error(err);
                    alert(err.message || 'Error de conexión registrando compra.');
                }
            };
        }

        btnCompra.onclick = async function () {
            const formEl = document.getElementById('compraProductoForm');
            if (formEl) formEl.reset();
            await cargarProductosCompra();
            await cargarProveedoresCompra();
            syncCompraNuevoProductoSelects();
            if (nuevoTipoVentaSelect) nuevoTipoVentaSelect.value = 'unidad';
            if (nuevoFraccionGramosInput) nuevoFraccionGramosInput.value = '1';
            actualizarUICompraPeso();
            setRegistroModo('existente');
            setTipo('nuevo');
            modal.style.display = 'block';
        };
    }

    ns.purchase = {
        setupCompraProductoModal
    };
})();
