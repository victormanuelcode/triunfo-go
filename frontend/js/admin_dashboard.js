const API_URL_ADMIN = '/proyecto_final/backend';

document.addEventListener('DOMContentLoaded', () => {
    loadAdminDashboard();
});

async function loadAdminDashboard() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No hay token de autenticación');
            return;
        }

        const response = await fetch(`${API_URL_ADMIN}/reports/dashboard`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error('Sesión expirada o no autorizada');
                // Opcional: redirigir al login
                // window.location.href = '../views/auth/login.html';
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        console.log('Datos Dashboard Admin:', data);

        // 1. Cargar KPIs
        const kpis = data.kpis || {};
        const ventasHoy = kpis.ventas_hoy || 0;
        const facturasHoy = kpis.facturas_hoy || 0;
        const productosBajoStock = kpis.productos_bajo_stock || 0;
        const usuariosActivos = kpis.usuarios_activos || 0;

        const formatCurrency = (val) =>
            new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);

        const ventasHoyEl = document.getElementById('kpi-ventas-hoy');
        if (ventasHoyEl) ventasHoyEl.textContent = formatCurrency(ventasHoy);

        const facturasHoyEl = document.getElementById('kpi-facturas-hoy');
        if (facturasHoyEl) facturasHoyEl.textContent = facturasHoy;

        const stockBajoEl = document.getElementById('kpi-stock-bajo');
        if (stockBajoEl) stockBajoEl.textContent = productosBajoStock;

        const usuariosActivosEl = document.getElementById('kpi-usuarios-activos');
        if (usuariosActivosEl) usuariosActivosEl.textContent = usuariosActivos;

        // 2. Cargar Historial de Ventas Recientes
        const salesTableBody = document.querySelector('#salesTable tbody');
        if (salesTableBody) {
            salesTableBody.innerHTML = '';
            if (data.recent_sales && data.recent_sales.length > 0) {
                data.recent_sales.forEach(sale => {
                    const row = document.createElement('tr');
                    const fecha = new Date(sale.fecha).toLocaleDateString() + ' ' + new Date(sale.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    
                    let estado = (sale.estado || 'pagada').toLowerCase();
                    let badgeClass = 'badge-success';
                    if (estado === 'anulada') badgeClass = 'badge-secondary';
                    if (estado === 'pendiente') badgeClass = 'badge-warning';

                    row.innerHTML = `
                        <td>#${sale.id_factura}</td>
                        <td>${sale.cliente || 'Cliente General'}</td>
                        <td>${fecha}</td>
                        <td style="font-weight: bold;">${formatCurrency(sale.total)}</td>
                        <td><span class="badge-status ${badgeClass}" style="padding: 2px 6px; font-size: 0.8em;">${estado}</span></td>
                    `;
                    salesTableBody.appendChild(row);
                });
            } else {
                salesTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No hay ventas recientes</td></tr>';
            }
        }

        // 3. Cargar Productos Recientes
        const productsTableBody = document.querySelector('#productsTable tbody');
        if (productsTableBody) {
            productsTableBody.innerHTML = '';
            if (data.recent_products && data.recent_products.length > 0) {
                data.recent_products.forEach(prod => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${prod.nombre}</td>
                        <td>${formatCurrency(prod.precio_venta)}</td>
                        <td>${prod.stock_actual}</td>
                    `;
                    productsTableBody.appendChild(row);
                });
            } else {
                productsTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">No hay productos registrados</td></tr>';
            }
        }

        // 4. Cargar Alertas de Stock Bajo
        const lowStockTableBody = document.querySelector('#lowStockTable tbody');
        if (lowStockTableBody) {
            lowStockTableBody.innerHTML = '';
            if (data.low_stock && data.low_stock.length > 0) {
                data.low_stock.forEach(prod => {
                    const row = document.createElement('tr');
                    // Calcular severidad
                    let severityColor = '#e74c3c'; // Rojo (Crítico)
                    let statusText = 'Crítico';
                    
                    if (prod.stock_actual > 0) {
                        severityColor = '#f39c12'; // Naranja (Bajo)
                        statusText = 'Bajo';
                    } else {
                        statusText = 'Agotado';
                    }

                    row.innerHTML = `
                        <td style="font-weight: 500;">${prod.nombre}</td>
                        <td style="color: ${severityColor}; font-weight: bold;">${prod.stock_actual}</td>
                        <td>${prod.stock_minimo}</td>
                        <td><span style="background-color: ${severityColor}20; color: ${severityColor}; padding: 2px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 600;">${statusText}</span></td>
                    `;
                    lowStockTableBody.appendChild(row);
                });
            } else {
                lowStockTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--primary-color);">¡Todo en orden! No hay productos con stock bajo.</td></tr>';
            }
        }

    } catch (error) {
        console.error('Error cargando dashboard admin:', error);
    }
}