// Constantes
const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));
let movimientosGlobal = [];
let currentPage = 1;
let itemsPerPage = 10;
let lotesPorProductoMovimiento = new Map();

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales
    cargarResumen();
    cargarMovimientos();
    
    // Configurar event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // Paginación
    document.getElementById('items-per-page').addEventListener('change', (e) => {
        itemsPerPage = parseInt(e.target.value);
        currentPage = 1;
        renderizarTabla();
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderizarTabla();
        }
    });

    document.getElementById('btn-next').addEventListener('click', () => {
        const totalPages = Math.ceil(movimientosGlobal.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderizarTabla();
        }
    });

    // Filtros - Enter en inputs y cambio en selects/dates
    const inputs = ['filtro-busqueda', 'filtro-fecha-desde', 'filtro-fecha-hasta'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') aplicarFiltros();
            });
            // También al cambiar la fecha
            if (el.type === 'date') {
                el.addEventListener('change', aplicarFiltros);
            }
        }
    });

    const selects = ['filtro-tipo'];
    selects.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', aplicarFiltros);
    });
}

// Cargar KPIs del Resumen
async function cargarResumen() {
    try {
        const response = await fetch(`${API_URL}/inventory/summary`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error cargando resumen');
        
        const data = await response.json();
        
        // Actualizar valores con animación
        animateValue('kpi-total', 0, data.total_movimientos || 0, 1000);
        animateValue('kpi-entradas', 0, data.entradas_mes || 0, 1000);
        animateValue('kpi-salidas', 0, data.salidas_mes || 0, 1000);
        animateValue('kpi-ajustes', 0, data.ajustes_mes || 0, 1000);
        
    } catch (error) {
        console.error('Error cargando resumen:', error);
    }
}

// Animación de números
function animateValue(id, start, end, duration) {
    if (start === end) {
        const el = document.getElementById(id);
        if(el) el.textContent = end;
        return;
    }
    
    const range = end - start;
    let current = start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    const obj = document.getElementById(id);
    
    if (!obj) return;

    const timer = setInterval(function() {
        current += increment;
        obj.textContent = current;
        if (current == end) {
            clearInterval(timer);
        }
    }, Math.max(stepTime, 20)); // Min 20ms step
}

// Cargar Movimientos con Filtros
async function cargarMovimientos() {
    try {
        const search = document.getElementById('filtro-busqueda').value;
        const type = document.getElementById('filtro-tipo').value;
        const from = document.getElementById('filtro-fecha-desde').value;
        const to = document.getElementById('filtro-fecha-hasta').value;

        // Construir Query Params usando URLSearchParams
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (type && type !== 'todos') params.append('type', type);
        if (from) params.append('from', from);
        if (to) params.append('to', to);

        const url = `${API_URL}/inventory/movements?${params.toString()}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error en la petición');
        
        const data = await response.json();
        movimientosGlobal = data;
        currentPage = 1; // Reset a primera página
        renderizarTabla();
        
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        const tbody = document.getElementById('tabla-movimientos');
        const tableContainer = document.querySelector('.table-responsive');
        const paginationContainer = document.querySelector('.pagination-container');
        const emptyState = document.getElementById('empty-state');

        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color: #dc2626; padding: 20px;">Error al cargar datos. Verifique su conexión.</td></tr>';
        }
        
        // Mostrar tabla con el mensaje de error y ocultar el estado vacío
        if(tableContainer) tableContainer.style.display = 'block';
        if(paginationContainer) paginationContainer.style.display = 'none';
        if(emptyState) {
            emptyState.classList.add('d-none');
            emptyState.style.display = 'none';
        }
    }
}

function aplicarFiltros() {
    cargarMovimientos();
}

function renderizarTabla() {
    const tbody = document.getElementById('tabla-movimientos');
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

    // Manejo de estado vacío
    if (!movimientosGlobal || movimientosGlobal.length === 0) {
        if(tableContainer) tableContainer.style.display = 'none';
        if(paginationContainer) paginationContainer.style.display = 'none';
        if(emptyState) {
            emptyState.classList.remove('d-none');
            emptyState.style.display = 'flex';
            emptyState.style.flexDirection = 'column';
            emptyState.style.alignItems = 'center';
            emptyState.style.padding = '40px';
        }
        return;
    }

    // Mostrar tabla
    if(tableContainer) tableContainer.style.display = 'block';
    if(paginationContainer) paginationContainer.style.display = 'flex';
    if(emptyState) {
        emptyState.classList.add('d-none');
        emptyState.style.display = 'none';
    }

    // Calcular paginación
    const totalItems = movimientosGlobal.length;
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
    const paginatedItems = movimientosGlobal.slice(startIdx, endIdx);

    // Actualizar info paginación
    if(infoInicio) infoInicio.textContent = startIdx + 1;
    if(infoFin) infoFin.textContent = endIdx;
    if(infoTotal) infoTotal.textContent = totalItems;
    if(btnPrev) btnPrev.disabled = currentPage === 1;
    if(btnNext) btnNext.disabled = currentPage >= Math.ceil(totalItems / itemsPerPage);

    // Renderizar filas
    paginatedItems.forEach(m => {
        const tr = document.createElement('tr');
        
        // Estilos para badges (inline para evitar dependencias externas)
        let badgeStyle = '';
        let badgeText = '';
        
        if (m.referencia && (m.referencia.toUpperCase().includes('AJUSTE') || m.referencia.toUpperCase().includes('MANUAL'))) {
             badgeStyle = 'background-color: #fef3c7; color: #b45309; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; border: 1px solid #fcd34d;'; 
             badgeText = 'AJUSTE';
        } else if (m.tipo === 'entrada') {
            badgeStyle = 'background-color: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; border: 1px solid #86efac;';
            badgeText = 'ENTRADA';
        } else {
            badgeStyle = 'background-color: #fee2e2; color: #b91c1c; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; border: 1px solid #fca5a5;';
            badgeText = 'SALIDA';
        }

        const fechaObj = new Date(m.fecha);
        const fechaStr = fechaObj.toLocaleDateString();
        const horaStr = fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // Botón Ver Factura
        let btnFactura = '';
        if (m.id_factura) {
            btnFactura = `
                <button style="border: 1px solid #16a34a; background: white; color: #16a34a; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" 
                        onmouseover="this.style.background='#16a34a'; this.style.color='white';"
                        onmouseout="this.style.background='white'; this.style.color='#16a34a';"
                        onclick="verFactura(${m.id_factura})" 
                        title="Ver Factura #${m.referencia}">
                    <i class="fas fa-file-invoice"></i>
                </button>
            `;
        }

        // Imagen del producto
        const imgHtml = m.producto_imagen 
            ? `<img src="${m.producto_imagen}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 8px; margin-right: 12px; border: 1px solid #e5e7eb;">` 
            : '<div style="width: 40px; height: 40px; background-color: #f3f4f6; border-radius: 8px; margin-right: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb;"><i class="fas fa-box text-muted"></i></div>';

        const loteNumero = m.numero_lote_snapshot || m.numero_lote || (m.lote_id ? ('#' + m.lote_id) : '');
        const loteTexto = m.lote_id
            ? `Lote: ${loteNumero}`
            : 'Lote: -';

        tr.innerHTML = `
            <td><span style="font-family: monospace; color: #6b7280; font-weight: 500;">#${m.id_movimiento}</span></td>
            <td>
                <div style="display: flex; flex-direction: column;">
                    <span style="font-weight: 500; color: #111827;">${fechaStr}</span>
                    <span style="font-size: 0.85rem; color: #6b7280;">${horaStr}</span>
                </div>
            </td>
            <td>
                <div style="display: flex; align-items: center;">
                    ${imgHtml}
                    <div>
                        <div style="font-weight: 600; color: #1f2937; font-size: 0.95rem;">${m.producto_nombre || 'Producto Eliminado'}</div>
                        <div style="font-size: 0.8rem; color: #6b7280;">${m.categoria_nombre || 'Sin categoría'}</div>
                        <div style="font-size: 0.75rem; color: #6b7280;">${loteTexto}</div>
                    </div>
                </div>
            </td>
            <td><span style="${badgeStyle}">${badgeText}</span></td>
            <td style="font-weight: 700; font-size: 1rem; color: ${m.tipo === 'entrada' ? '#15803d' : '#b91c1c'};">
                ${m.tipo === 'entrada' ? '+' : '-'}${m.cantidad}
            </td>
            <td style="font-weight: 500;">${m.stock_resultante !== null ? m.stock_resultante : '-'}</td>
            <td style="font-family: monospace; color: #4b5563;">${m.referencia || '-'}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 24px; height: 24px; background: #e0e7ff; color: #4338ca; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold;">
                        ${(m.usuario_nombre || 'S').charAt(0).toUpperCase()}
                    </div>
                    <span>${m.usuario_nombre || 'Sistema'}</span>
                </div>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    ${btnFactura}
                    <button style="border: 1px solid #e5e7eb; background: white; color: #6b7280; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;" 
                            onmouseover="this.style.background='#f3f4f6';"
                            onmouseout="this.style.background='white';"
                            onclick="toggleDetalle(${m.id_movimiento})" title="Ver Detalles">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);

        // Fila de detalle
        const trDetalle = document.createElement('tr');
        trDetalle.id = `detalle-${m.id_movimiento}`;
        trDetalle.style.display = 'none';
        trDetalle.innerHTML = `
            <td colspan="9" style="padding: 0; border-bottom: 1px solid #e5e7eb;">
                <div style="background-color: #f9fafb; padding: 20px; border-left: 4px solid #3b82f6;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div>
                            <strong style="color: #374151; display: block; margin-bottom: 8px; font-size: 0.9rem;">Descripción / Notas</strong>
                            <p style="margin: 0; color: #4b5563; line-height: 1.5;">${m.descripcion || 'Sin descripción adicional.'}</p>
                        </div>
                        <div>
                            <strong style="color: #374151; display: block; margin-bottom: 8px; font-size: 0.9rem;">Detalles Técnicos</strong>
                            <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px; font-size: 0.9rem;">
                                <span style="color: #6b7280;">ID Movimiento:</span>
                                <span style="font-family: monospace; color: #111827;">${m.id_movimiento}</span>
                                <span style="color: #6b7280;">ID Producto:</span>
                                <span style="font-family: monospace; color: #111827;">${m.producto_id}</span>
                                <span style="color: #6b7280;">Lote:</span>
                                <span style="font-family: monospace; color: #111827;">${m.lote_id ? loteNumero : '-'}</span>
                                <span style="color: #6b7280;">Registrado:</span>
                                <span style="color: #111827;">${new Date(m.fecha).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(trDetalle);
    });
}

function toggleDetalle(id) {
    const detalleRow = document.getElementById(`detalle-${id}`);
    if (detalleRow.style.display === 'none') {
        detalleRow.style.display = 'table-row';
    } else {
        detalleRow.style.display = 'none';
    }
}

function verFactura(idFactura) {
    window.location.href = `factura.html?id=${idFactura}`;
}

// --- Funciones del Modal Manual ---

async function cargarProductos() {
    const select = document.getElementById('movimiento-producto');
    if (!select) return;
    
    // Si ya tiene opciones (más allá del placeholder), no recargar
    if (select.options.length > 1) return; 

    try {
        console.log('Cargando productos para el modal...');
        const response = await fetch(`${API_URL}/products?limit=1000`);
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Error al cargar productos');
        }
        
        const result = await response.json();
        const products = Array.isArray(result) ? result : (result.data || []);
        
        console.log(`Se encontraron ${products.length} productos.`);
        
        // Limpiar y añadir opción por defecto
        select.innerHTML = '<option value="">Seleccione un producto...</option>';
        
        if (products.length === 0) {
            select.innerHTML = '<option value="">No hay productos activos</option>';
            return;
        }
        
        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id_producto;
            const stock = (p.stock_actual !== undefined) ? p.stock_actual : (p.cantidad_stock || 0);
            option.textContent = `${p.nombre} (Stock: ${stock})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando productos:', error);
        alert('No se pudieron cargar los productos: ' + error.message);
    }
}

async function abrirModalMovimiento() {
    await cargarProductos(); // Esperar a que los productos carguen
    const modal = document.getElementById('modalMovimiento');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
        
        // Crear backdrop
        let backdrop = document.querySelector('.modal-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade show';
            document.body.appendChild(backdrop);
        }

        const productoSelect = document.getElementById('movimiento-producto');
        const loteSelect = document.getElementById('movimiento-lote');
        if (loteSelect) {
            loteSelect.innerHTML = '<option value="">Seleccione un lote...</option>';
        }
        if (productoSelect && !productoSelect.dataset.loteListener) {
            productoSelect.addEventListener('change', async (e) => {
                const pid = e.target.value;
                await cargarLotesDeProductoParaMovimiento(pid);
            });
            productoSelect.dataset.loteListener = 'true';
        }
    }
}

function cerrarModalMovimiento() {
    const modal = document.getElementById('modalMovimiento');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        
        // Remover backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.remove();
        
        // Limpiar formulario
        document.getElementById('form-movimiento').reset();
        const loteSelect = document.getElementById('movimiento-lote');
        if (loteSelect) {
            loteSelect.innerHTML = '<option value="">Seleccione un lote...</option>';
        }
    }
}

async function cargarLotesDeProductoParaMovimiento(productoId) {
    const loteSelect = document.getElementById('movimiento-lote');
    if (!loteSelect) return;

    const pid = Number(productoId || 0);
    if (!(pid > 0)) {
        loteSelect.innerHTML = '<option value="">Seleccione un lote...</option>';
        return;
    }

    loteSelect.innerHTML = '<option value="">Cargando lotes...</option>';

    try {
        if (lotesPorProductoMovimiento.has(pid)) {
            const cached = lotesPorProductoMovimiento.get(pid);
            renderLotesSelect(loteSelect, cached);
            return;
        }

        const response = await fetch(`${API_URL}/products/${pid}/lots`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await response.json();
        if (!response.ok) {
            throw new Error(json.message || 'Error cargando lotes');
        }
        const lots = Array.isArray(json) ? json : (json.data || []);
        const disponibles = (lots || []).filter(l => Number(l.cantidad_disponible || 0) > 0 && (l.estado || 'activo') === 'activo');
        lotesPorProductoMovimiento.set(pid, disponibles);
        renderLotesSelect(loteSelect, disponibles);
    } catch (err) {
        console.error(err);
        loteSelect.innerHTML = '<option value="">Error cargando lotes</option>';
    }
}

function renderLotesSelect(selectEl, lots) {
    selectEl.innerHTML = '<option value="">Seleccione un lote...</option>';
    if (!lots || lots.length === 0) {
        selectEl.innerHTML = '<option value="">No hay lotes disponibles</option>';
        return;
    }
    lots.forEach(l => {
        const opt = document.createElement('option');
        const idLote = Number(l.id_lote);
        const numero = l.numero_lote ? String(l.numero_lote) : ('#' + idLote);
        const disp = Number(l.cantidad_disponible || 0);
        const precio = Number(l.precio_venta || 0);
        opt.value = String(idLote);
        opt.textContent = `${numero} | disp:${disp} | $${precio.toLocaleString('es-CO')}`;
        selectEl.appendChild(opt);
    });
}

async function parseJsonResponseSafe(response) {
    const rawText = await response.text();
    const text = (rawText || '').trim();

    if (!text) {
        return { payload: null, rawText: '' };
    }

    try {
        return { payload: JSON.parse(text), rawText: text };
    } catch (_) {
        return { payload: null, rawText: text };
    }
}

async function guardarMovimiento() {
    const productoId = document.getElementById('movimiento-producto').value;
    const loteId = document.getElementById('movimiento-lote')?.value;
    const tipo = document.getElementById('movimiento-tipo').value;
    const cantidad = document.getElementById('movimiento-cantidad').value;
    const descripcion = document.getElementById('movimiento-descripcion').value;

    if (!productoId || !loteId || !tipo || !cantidad || !descripcion) {
        alert('Por favor complete todos los campos');
        return;
    }

    const data = {
        producto_id: productoId,
        lote_id: loteId,
        tipo: tipo,
        cantidad: cantidad,
        razon: descripcion
    };

    try {
        const response = await fetch(`${API_URL}/inventory/adjust`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(data)
        });

        const { payload, rawText } = await parseJsonResponseSafe(response);

        if (!response.ok) {
            throw new Error(payload?.message || rawText || 'Error al guardar');
        }

        if (!payload) {
            throw new Error('El servidor devolvió una respuesta inválida al registrar el movimiento.');
        }

        alert('Movimiento registrado con éxito');
        cerrarModalMovimiento();
        cargarMovimientos(); // Recargar tabla
        cargarResumen(); // Recargar KPIs

    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}
