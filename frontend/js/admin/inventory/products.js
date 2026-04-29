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
            const response = await fetch(`${state.API_URL}/products`, { cache: 'no-store' });
            const json = await response.json();
            const productos = Array.isArray(json) ? json : (json.data || []);
            state.productosAdminGlobal = productos;

            container.innerHTML = '';
            if (productos.length === 0) {
                container.innerHTML = '<div class="loading-spinner">No hay productos registrados.</div>';
                return;
            }

            productos.forEach(prod => {
                const imgSrc = resolveProductImageUrl(prod.imagen);
                const esPeso = (String(prod.tipo_venta || '').toLowerCase() === 'peso') || (String(prod.unidad_base || '').toLowerCase() === 'kg');
                const stockVal = Number(prod.stock_actual || 0);
                const stockTxt = esPeso ? `${stockVal.toFixed(3)} kg` : `${stockVal}`;
                const priceVal = Number(prod.precio_venta || 0);
                const priceTxt = esPeso ? `$${priceVal.toLocaleString('es-CO')} /kg` : `$${priceVal.toLocaleString('es-CO')}`;
                const card = `
                    <div class="card-producto">
                        <div class="card-img-wrapper">
                            <img src="${imgSrc}" alt="${prod.nombre}" data-fallback="${FALLBACK_IMAGE}" onerror="this.onerror=null;this.src=this.dataset.fallback;">
                        </div>
                        <span class="stock-badge ${prod.stock_actual <= prod.stock_minimo ? 'stock-low' : ''}">
                            Stock: ${stockTxt}
                        </span>
                        <div class="card-body">
                            <h3 class="card-title">${prod.nombre}</h3>
                            <p class="card-desc">${prod.descripcion || 'Sin descripción'}</p>
                            <p class="price-tag">${priceTxt}</p>
                        </div>
                        <div class="card-footer card-footer--wrap">
                            <button class="btn-primary btn-sm" type="button" onclick="verLotesProducto(${prod.id_producto})">Ver lotes</button>
                            <button class="btn-edit" onclick="editarProducto(${prod.id_producto})">Editar</button>
                            <button class="btn-danger-outline btn-sm" type="button" onclick="eliminarProducto(${prod.id_producto})">Eliminar</button>
                        </div>
                    </div>
                `;
                container.innerHTML += card;
            });
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

        if (btnNuevo) {
            btnNuevo.onclick = function () {
                form.reset();
                document.getElementById('productoId').value = '';
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
            const nombre = document.getElementById('nombre').value;
            const descripcion = document.getElementById('descripcion').value;
            const categoria_id = document.getElementById('categoria_id').value;
            const unidad_medida_id = document.getElementById('unidad_medida_id').value;
            const proveedor_id = document.getElementById('proveedor_id').value;
            const precio = document.getElementById('precio_venta').value;
            const stock = document.getElementById('stock_actual').value;
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
                formData.append('estado', 'activo');
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
                    estado: 'activo'
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

            document.getElementById('productoId').value = prod.id_producto;
            document.getElementById('nombre').value = prod.nombre;
            document.getElementById('descripcion').value = prod.descripcion || '';
            document.getElementById('categoria_id').value = prod.categoria_id;
            document.getElementById('unidad_medida_id').value = prod.unidad_medida_id;
            document.getElementById('proveedor_id').value = prod.proveedor_id || '';
            document.getElementById('precio_venta').value = prod.precio_venta;
            document.getElementById('stock_actual').value = prod.stock_actual;
            document.getElementById('imagen').value = '';
            document.getElementById('productoModal').style.display = 'block';
        } catch (error) {
            console.error(error);
            alert('Error al cargar datos del producto');
        }
    }

    async function eliminarProducto(id) {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await fetch(`${state.API_URL}/products/${id}`, { method: 'DELETE' });
            await cargarProductos();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al eliminar producto');
        }
    }

    function filtrarProductosInventario() {
        const searchTerm = document.getElementById('buscador')?.value.toLowerCase() || '';
        const categoriaFilter = document.getElementById('filtroCategoria')?.value || '';
        const stockFilter = document.getElementById('filtroStock')?.value || '';
        
        const container = document.getElementById('productos-container');
        if (!container || !state.productosAdminGlobal) return;
        
        let productosFiltrados = state.productosAdminGlobal.filter(producto => {
            // Filter by search term
            const matchSearch = !searchTerm || 
                producto.nombre.toLowerCase().includes(searchTerm) || 
                (producto.descripcion && producto.descripcion.toLowerCase().includes(searchTerm));
            
            // Filter by category
            const matchCategoria = !categoriaFilter || producto.categoria_id == categoriaFilter;
            
            // Filter by stock status
            let matchStock = true;
            if (stockFilter === 'low') {
                matchStock = producto.stock_actual <= producto.stock_minimo;
            } else if (stockFilter === 'ok') {
                matchStock = producto.stock_actual > producto.stock_minimo;
            }
            
            return matchSearch && matchCategoria && matchStock;
        });
        
        // Clear and reload with filtered results
        container.innerHTML = '';
        if (productosFiltrados.length === 0) {
            container.innerHTML = '<div class="loading-spinner">No se encontraron productos con los filtros aplicados.</div>';
            return;
        }
        
        productosFiltrados.forEach(prod => {
            const imgSrc = resolveProductImageUrl(prod.imagen);
            const esPeso = (String(prod.tipo_venta || '').toLowerCase() === 'peso') || (String(prod.unidad_base || '').toLowerCase() === 'kg');
            const stockVal = Number(prod.stock_actual || 0);
            const stockTxt = esPeso ? `${stockVal.toFixed(3)} kg` : `${stockVal}`;
            const priceVal = Number(prod.precio_venta || 0);
            const priceTxt = esPeso ? `$${priceVal.toLocaleString('es-CO')} /kg` : `$${priceVal.toLocaleString('es-CO')}`;
            const card = `
                <div class="card-producto">
                    <div class="card-img-wrapper">
                        <img src="${imgSrc}" alt="${prod.nombre}" data-fallback="${FALLBACK_IMAGE}" onerror="this.onerror=null;this.src=this.dataset.fallback;">
                    </div>
                    <span class="stock-badge ${prod.stock_actual <= prod.stock_minimo ? 'stock-low' : ''}">
                        Stock: ${stockTxt}
                    </span>
                    <div class="card-body">
                        <h3 class="card-title">${prod.nombre}</h3>
                        <p class="card-desc">${prod.descripcion || 'Sin descripción'}</p>
                        <p class="price-tag">${priceTxt}</p>
                    </div>
                    <div class="card-footer card-footer--wrap">
                        <button class="btn-primary btn-sm" type="button" onclick="verLotesProducto(${prod.id_producto})">Ver lotes</button>
                        <button class="btn-edit" onclick="editarProducto(${prod.id_producto})">Editar</button>
                        <button class="btn-danger-outline btn-sm" type="button" onclick="eliminarProducto(${prod.id_producto})">Eliminar</button>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    }

    function setup() {
        cargarProductos();
        cargarCategoriasSelect();
        cargarProveedoresSelect();
        setupModal();
        
        // Add event listeners for filters
        const filtroCategoria = document.getElementById('filtroCategoria');
        const filtroStock = document.getElementById('filtroStock');
        
        if (filtroCategoria) {
            filtroCategoria.addEventListener('change', filtrarProductosInventario);
        }
        if (filtroStock) {
            filtroStock.addEventListener('change', filtrarProductosInventario);
        }
        
        window.cargarProductos = cargarProductos;
        window.editarProducto = editarProducto;
        window.eliminarProducto = eliminarProducto;
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
