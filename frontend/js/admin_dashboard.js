const API_URL_ADMIN = 'http://localhost/proyecto_final/backend';

document.addEventListener('DOMContentLoaded', () => {
    loadAdminDashboard();
});

async function loadAdminDashboard() {
    try {
        const response = await fetch(`${API_URL_ADMIN}/reports/dashboard`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();

        // 1. Cargar KPIs
        const kpis = data.kpis || {};
        const ventasHoy = kpis.ventas_hoy || 0;
        const facturasHoy = kpis.facturas_hoy || 0;
        const productosBajoStock = kpis.productos_bajo_stock || 0;
        const usuariosActivos = kpis.usuarios_activos || 0;

        const formatCurrency = (val) =>
            new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

        const ventasHoyEl = document.querySelector('.metric-card .metric-value');
        if (ventasHoyEl) ventasHoyEl.textContent = formatCurrency(ventasHoy);

        const facturasHoyEl = document.querySelectorAll('.metric-card .metric-value')[1];
        if (facturasHoyEl) facturasHoyEl.textContent = facturasHoy;

        const stockBajoEl = document.querySelectorAll('.metric-card .metric-value')[2];
        if (stockBajoEl) stockBajoEl.textContent = productosBajoStock;

        const usuariosActivosEl = document.querySelectorAll('.metric-card .metric-value')[3];
        if (usuariosActivosEl) usuariosActivosEl.textContent = usuariosActivos;

        // 2. Cargar Historial de Ventas Recientes
        const salesTableBody = document.querySelector('#salesTable tbody');
        if (salesTableBody) {
            salesTableBody.innerHTML = '';
            if (data.recent_sales && data.recent_sales.length > 0) {
                data.recent_sales.forEach(sale => {
                    const row = document.createElement('tr');
                    const fecha = new Date(sale.fecha).toLocaleDateString() + ' ' + new Date(sale.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    row.innerHTML = `
                        <td>#${sale.id_factura}</td>
                        <td>${sale.cliente || 'Cliente General'}</td>
                        <td>${fecha}</td>
                        <td style="font-weight: bold;">${formatCurrency(sale.total)}</td>
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

    } catch (error) {
        console.error('Error cargando dashboard admin:', error);
    }
}