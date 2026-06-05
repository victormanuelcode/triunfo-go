(function () {
    const ns = window.AdminInventory = window.AdminInventory || {};
    const state = ns.state;
    const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial,sans-serif" font-size="16">Sin imagen</text></svg>')}`;

    function resolveProductImageUrl(imagePath) {
        if (!imagePath) return FALLBACK_IMAGE;
        if (/^https?:\/\//i.test(imagePath) || imagePath.startsWith('data:')) return imagePath;
        const baseBackendURL = state.API_URL.replace('/index.php', '');
        const normalizedPath = String(imagePath).replace(/^\/+/, '');
        return `${baseBackendURL}/${normalizedPath}`;
    }

    function gramosToKg(gramos) {
        const g = Number(gramos || 0);
        if (!Number.isFinite(g) || g <= 0) return 0.001;
        return Number((g / 1000).toFixed(6));
    }

    function kgToGramos(kg) {
        const k = Number(kg || 0);
        if (!Number.isFinite(k) || k <= 0) return 1;
        return Math.max(1, Math.round(k * 1000));
    }

    function formatStockDisplay(prod) {
        const esPeso = (String(prod?.tipo_venta || '').toLowerCase() === 'peso') || (String(prod?.unidad_base || '').toLowerCase() === 'kg');
        const stockVal = Number(prod?.stock_actual || 0);
        if (esPeso) {
            const gramos = Math.round(stockVal * 1000);
            return `${stockVal.toFixed(3)} kg (${gramos} g)`;
        }
        return `${stockVal}`;
    }

    function renderProductCard(prod) {
        const imgSrc = resolveProductImageUrl(prod.imagen);
        const esPeso = (String(prod.tipo_venta || '').toLowerCase() === 'peso') || (String(prod.unidad_base || '').toLowerCase() === 'kg');
        const stockTxt = formatStockDisplay(prod);
        const priceVal = Number(prod.precio_venta || 0);
        const priceTxt = esPeso ? `$${priceVal.toLocaleString('es-CO')} /kg` : `$${priceVal.toLocaleString('es-CO')}`;
        const fraccionKg = Number(prod.fraccion_minima || 0.001);
        const fraccionGramos = kgToGramos(fraccionKg);
        const metaPeso = esPeso ? `<p class="card-desc">Equivalencia: ${fraccionGramos} g (${fraccionKg.toFixed(3)} kg)</p>` : '';
        const esInactivo = String(prod.estado || '').toLowerCase() === 'inactivo';
        const estadoBadge = esInactivo
            ? '<span class="producto-estado-badge producto-estado-badge--inactivo">Inactivo</span>'
            : '';
        const tieneHistorial = !!prod.tiene_historial;
        const accionEstadoBtn = esInactivo
            ? `<button class="btn-primary btn-sm" type="button" title="Reactivar producto" onclick="activarProducto(${prod.id_producto})">Activar</button>`
            : `<button class="btn-danger-outline btn-sm" type="button" title="${tieneHistorial ? 'Inactivar (conserva lotes y movimientos)' : 'Inactivar producto'}" onclick="inactivarProducto(${prod.id_producto})">Inactivar</button>`;

        return `
            <div class="card-producto${esInactivo ? ' card-producto--inactive' : ''}">
                <div class="card-img-wrapper">
                    <img src="${imgSrc}" alt="${prod.nombre}" data-fallback="${FALLBACK_IMAGE}" onerror="this.onerror=null;this.src=this.dataset.fallback;">
                </div>
                <span class="stock-badge ${prod.stock_actual <= prod.stock_minimo ? 'stock-low' : ''}">
                    Stock: ${stockTxt}
                </span>
                <div class="card-body">
                    <h3 class="card-title card-title--with-badge">
                        <span class="card-title-text">${prod.nombre}</span>
                        ${estadoBadge}
                    </h3>
                    <p class="card-desc">${prod.descripcion || 'Sin descripción'}</p>
                    <p class="price-tag">${priceTxt}</p>
                    ${metaPeso}
                </div>
                <div class="card-footer card-footer--wrap">
                    <button class="btn-primary btn-sm" type="button" onclick="verLotesProducto(${prod.id_producto})">Ver lotes</button>
                    <button class="btn-edit" type="button" onclick="editarProducto(${prod.id_producto})"${esInactivo ? ' disabled title="Active el producto primero"' : ''}>Editar</button>
                    ${accionEstadoBtn}
                </div>
            </div>
        `;
    }

    function renderProductosLista(productos) {
        const container = document.getElementById('productos-container');
        if (!container) return;

        container.innerHTML = '';
        if (!productos.length) {
            container.innerHTML = '<div class="loading-spinner">No se encontraron productos con los filtros aplicados.</div>';
            return;
        }

        productos.forEach(prod => {
            container.innerHTML += renderProductCard(prod);
        });
    }

    function setFormularioProductoEditable(editable) {
        const form = document.getElementById('productoForm');
        const aviso = document.getElementById('productoInactivoAviso');
        const submitBtn = form?.querySelector('button[type="submit"]');
        if (!form) return;

        form.querySelectorAll('input, select, textarea').forEach(el => {
            if (el.id === 'productoId' || el.id === 'productoEstado') return;
            if (el.id === 'stock_actual') {
                el.readOnly = true;
                return;
            }
            el.disabled = !editable;
        });

        if (aviso) aviso.classList.toggle('hidden', editable);
        if (submitBtn) submitBtn.disabled = !editable;
    }

    function actualizarUIVentaPeso() {
        const tipoVentaEl = document.getElementById('tipo_venta');
        const gramosEl = document.getElementById('fraccion_gramos');
        const grupoPesoEl = document.getElementById('grupoFraccionPeso');
        const equivalenciaEl = document.getElementById('equivalenciaPesoTexto');
        const precioHelpEl = document.getElementById('precioVentaHelp');
        if (!tipoVentaEl || !gramosEl || !grupoPesoEl || !equivalenciaEl || !precioHelpEl) return;

        const esPeso = tipoVentaEl.value === 'peso';
        grupoPesoEl.style.display = esPeso ? '' : 'none';
        precioHelpEl.textContent = esPeso
            ? 'Precio de venta por kilogramo (kg).'
            : 'Precio de venta por unidad.';

        const gramos = Math.max(1, Number(gramosEl.value || 1));
        gramosEl.value = String(gramos);
        const kg = gramosToKg(gramos);
        equivalenciaEl.textContent = `${gramos} g = ${kg.toFixed(3)} kg`;
    }

    async function cargarCategoriasSelect() {
        const select = document.getElementById('categoria_id');
        const filterSelect = document.getElementById('filtroCategoria');
        if (!select) return;
        try {
            const response = await fetch(`${state.API_URL}/categories`);
            const categorias = await response.json();

            select.innerHTML = '<option value="">Seleccione una categoría</option>';
            categorias.forEach(cat => {
                select.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre}</option>`;
            });

            // Populate filter dropdown
            if (filterSelect) {
                filterSelect.innerHTML = '<option value="">Todas</option>';
                categorias.forEach(cat => {
                    filterSelect.innerHTML += `<option value="${cat.id_categoria}">${cat.nombre}</option>`;
                });
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    async function cargarProveedoresSelect() {
        const select = document.getElementById('proveedor_id');
        if (!select) return;
        try {
            const response = await fetch(`${state.API_URL}/suppliers`);
            const proveedores = await response.json();

            select.innerHTML = '<option value="">Seleccione un proveedor</option>';
            proveedores.forEach(prov => {
                select.innerHTML += `<option value="${prov.id_proveedor}">${prov.nombre}</option>`;
            });
        } catch (error) {
            console.error('Error cargando proveedores:', error);
        }
    }

    async function cargarProductos() {
        const container = document.getElementById('productos-container');
        if (!container) return;

        try {
            const response = await fetch(`${state.API_URL}/products?include_inactive=1&limit=1000`, { cache: 'no-store' });
            const json = await response.json();
            const productos = Array.isArray(json) ? json : (json.data || []);
            state.productosAdminGlobal = productos;

            if (productos.length === 0) {
                container.innerHTML = '<div class="loading-spinner">No hay productos registrados.</div>';
                return;
            }

            filtrarProductosInventario();
        } catch (error) {
            console.error('Error cargando productos:', error);
            container.innerHTML = '<div class="loading-spinner text-danger">Error al conectar con el servidor.</div>';
        }
    }

    function setupModal() {
        const modal = document.getElementById('productoModal');
        const btnNuevo = document.getElementById('btnCrearProducto');
        const spanClose = document.getElementsByClassName('close-modal')[0];
        const btnCancel = document.getElementsByClassName('close-modal-btn')[0];
        const form = document.getElementById('productoForm');
        if (!modal || !form) return;
        const tipoVentaEl = document.getElementById('tipo_venta');
        const gramosEl = document.getElementById('fraccion_gramos');

        if (btnNuevo) {
            btnNuevo.onclick = function () {
                form.reset();
                document.getElementById('productoId').value = '';
                const estadoEl = document.getElementById('productoEstado');
                if (estadoEl) estadoEl.value = 'activo';
                setFormularioProductoEditable(true);
                modal.style.display = 'block';
            };
        }

        function closeModal() {
            modal.style.display = 'none';
        }

        if (spanClose) spanClose.onclick = closeModal;
        if (btnCancel) btnCancel.onclick = closeModal;

        form.onsubmit = async function (e) {
            e.preventDefault();

            const id = document.getElementById('productoId').value;
            if (!id) {
                alert('Los productos nuevos se registran desde "Compra de producto".');
                return;
            }
            const estadoActual = document.getElementById('productoEstado')?.value || 'activo';
            if (estadoActual === 'inactivo') {
                alert('No se puede editar un producto inactivo. Actívelo primero con el botón Activar en su tarjeta.');
                return;
            }
            const nombre = document.getElementById('nombre').value;
            const descripcion = document.getElementById('descripcion').value;
            const categoria_id = document.getElementById('categoria_id').value;
            const unidad_medida_id = document.getElementById('unidad_medida_id').value;
            const proveedor_id = document.getElementById('proveedor_id').value;
            const precio = document.getElementById('precio_venta').value;
            const stock = document.getElementById('stock_actual').value;
            const tipoVenta = (tipoVentaEl?.value === 'peso') ? 'peso' : 'unidad';
            const fraccionKg = tipoVenta === 'peso' ? gramosToKg(gramosEl?.value || 1) : 1;
            const imagenInput = document.getElementById('imagen');

            const hasImage = imagenInput.files.length > 0;
            let url = `${state.API_URL}/products/${id}`;
            let options;

            if (hasImage) {
                const formData = new FormData();
                formData.append('nombre', nombre);
                formData.append('descripcion', descripcion);
                formData.append('categoria_id', categoria_id);
                formData.append('unidad_medida_id', unidad_medida_id);
                formData.append('proveedor_id', proveedor_id);
                formData.append('precio_venta', precio);
                formData.append('stock_actual', stock);
                formData.append('tipo_venta', tipoVenta);
                formData.append('unidad_base', tipoVenta === 'peso' ? 'kg' : 'unidad');
                formData.append('fraccion_minima', String(fraccionKg));
                formData.append('estado', document.getElementById('productoEstado')?.value || 'activo');
                formData.append('imagen', imagenInput.files[0]);
                options = { method: 'POST', body: formData };
            } else {
                const payload = {
                    nombre,
                    descripcion,
                    categoria_id,
                    unidad_medida_id,
                    proveedor_id,
                    precio_venta: precio,
                    stock_actual: stock,
                    tipo_venta: tipoVenta,
                    unidad_base: tipoVenta === 'peso' ? 'kg' : 'unidad',
                    fraccion_minima: fraccionKg,
                    estado: document.getElementById('productoEstado')?.value || 'activo'
                };
                options = {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                };
            }

            try {
                const response = await fetch(url, options);
                const rawBody = await response.text();
                let res = {};
                if (rawBody) {
                    try {
                        res = JSON.parse(rawBody);
                    } catch (_) {
                        res = { message: rawBody };
                    }
                }

                if (response.ok) {
                    if (res.warning) {
                        alert(res.warning);
                    }
                    closeModal();
                    await cargarProductos();
                } else {
                    alert('Error al guardar: ' + (res.message || `HTTP ${response.status}`));
                }
            } catch (error) {
                console.error(error);
                alert('Error de conexión');
            }
        };
    }

    async function editarProducto(id) {
        try {
            const response = await fetch(`${state.API_URL}/products/${id}`, { cache: 'no-store' });
            const prod = await response.json();
            const tipoVentaEl = document.getElementById('tipo_venta');
            const gramosEl = document.getElementById('fraccion_gramos');

            document.getElementById('productoId').value = prod.id_producto;
            const estadoEl = document.getElementById('productoEstado');
            const estado = prod.estado || 'activo';
            if (estadoEl) estadoEl.value = estado;
            const esInactivo = String(estado).toLowerCase() === 'inactivo';
            setFormularioProductoEditable(!esInactivo);
            if (esInactivo) {
                alert('Este producto está inactivo. Para editarlo, actívelo primero con el botón Activar en su tarjeta (filtre por Inactivos si no lo ve).');
            }
            document.getElementById('nombre').value = prod.nombre;
            document.getElementById('descripcion').value = prod.descripcion || '';
            document.getElementById('categoria_id').value = prod.categoria_id;
            document.getElementById('unidad_medida_id').value = prod.unidad_medida_id;
            document.getElementById('proveedor_id').value = prod.proveedor_id || '';
            document.getElementById('precio_venta').value = prod.precio_venta;
            document.getElementById('stock_actual').value = prod.stock_actual;
            if (tipoVentaEl) tipoVentaEl.value = (prod.tipo_venta === 'peso') ? 'peso' : 'unidad';
            if (gramosEl) gramosEl.value = String(kgToGramos(prod.fraccion_minima || 0.001));
            actualizarUIVentaPeso();
            document.getElementById('imagen').value = '';
            document.getElementById('productoModal').style.display = 'block';
        } catch (error) {
            console.error(error);
            alert('Error al cargar datos del producto');
        }
    }

    async function cambiarEstadoProducto(id, nuevoEstado) {
        const esInactivar = nuevoEstado === 'inactivo';
        const mensaje = esInactivar
            ? '¿Inactivar este producto? No aparecerá en ventas, pero se conservará su historial de lotes y movimientos.'
            : '¿Reactivar este producto? Volverá a estar disponible en el inventario y ventas.';
        if (!confirm(mensaje)) return;

        try {
            const response = await fetch(`${state.API_URL}/products/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado })
            });
            const rawBody = await response.text();
            let res = {};
            if (rawBody) {
                try {
                    res = JSON.parse(rawBody);
                } catch (_) {
                    res = { message: rawBody };
                }
            }

            if (response.ok) {
                alert(res.message || (esInactivar ? 'Producto inactivado.' : 'Producto reactivado.'));
                await cargarProductos();
            } else {
                alert(res.message || `No se pudo actualizar el estado (HTTP ${response.status}).`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión al cambiar el estado del producto');
        }
    }

    async function inactivarProducto(id) {
        await cambiarEstadoProducto(id, 'inactivo');
    }

    async function activarProducto(id) {
        await cambiarEstadoProducto(id, 'activo');
    }

    function filtrarProductosInventario() {
        const searchTerm = document.getElementById('buscador')?.value.toLowerCase() || '';
        const categoriaFilter = document.getElementById('filtroCategoria')?.value || '';
        const stockFilter = document.getElementById('filtroStock')?.value || '';
        const estadoFilter = document.getElementById('filtroEstado')?.value || '';

        if (!state.productosAdminGlobal) return;

        const productosFiltrados = state.productosAdminGlobal.filter(producto => {
            const matchSearch = !searchTerm ||
                producto.nombre.toLowerCase().includes(searchTerm) ||
                (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm));

            const matchCategoria = !categoriaFilter || producto.categoria_id == categoriaFilter;

            let matchStock = true;
            if (stockFilter === 'low') {
                matchStock = producto.stock_actual <= producto.stock_minimo;
            } else if (stockFilter === 'ok') {
                matchStock = producto.stock_actual > producto.stock_minimo;
            }

            const estadoProducto = String(producto.estado || 'activo').toLowerCase();
            const matchEstado = !estadoFilter || estadoProducto === estadoFilter;

            return matchSearch && matchCategoria && matchStock && matchEstado;
        });

        renderProductosLista(productosFiltrados);
    }

    function setup() {
        cargarProductos();
        cargarCategoriasSelect();
        cargarProveedoresSelect();
        setupModal();
        const tipoVentaEl = document.getElementById('tipo_venta');
        const gramosEl = document.getElementById('fraccion_gramos');
        if (tipoVentaEl) {
            tipoVentaEl.addEventListener('change', actualizarUIVentaPeso);
        }
        if (gramosEl) {
            gramosEl.addEventListener('input', actualizarUIVentaPeso);
            gramosEl.addEventListener('change', actualizarUIVentaPeso);
        }
        actualizarUIVentaPeso();
        
        // Add event listeners for filters
        const filtroCategoria = document.getElementById('filtroCategoria');
        const filtroStock = document.getElementById('filtroStock');
        const filtroEstado = document.getElementById('filtroEstado');

        if (filtroCategoria) {
            filtroCategoria.addEventListener('change', filtrarProductosInventario);
        }
        if (filtroStock) {
            filtroStock.addEventListener('change', filtrarProductosInventario);
        }
        if (filtroEstado) {
            filtroEstado.addEventListener('change', filtrarProductosInventario);
        }

        window.cargarProductos = cargarProductos;
        window.editarProducto = editarProducto;
        window.inactivarProducto = inactivarProducto;
        window.activarProducto = activarProducto;
        window.filtrarProductosInventario = filtrarProductosInventario;
    }

    ns.products = {
        setup,
        cargarProductos,
        cargarCategoriasSelect,
        cargarProveedoresSelect,
        setupModal
    };
})();
