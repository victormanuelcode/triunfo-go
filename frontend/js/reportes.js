const API_URL = window.location.origin + '/proyecto_final/backend';

let datosReportes = null;
let salesChartInstance = null;
let topProductsChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('sesion_activa')) {
        window.location.href = '../auth/login.html';
        return;
    }
    cargarDashboardReportes();
});

async function cargarDashboardReportes() {
    try {
        const response = await fetch(`${API_URL}/reports/dashboard`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        datosReportes = data;

        renderKPIs(data.kpis);
        renderSalesChart(data.sales_last_days);
        renderTopProductsChart(data.top_products);
        renderTopProductsTable(data.top_products);
        renderLowStock(data.low_stock);
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        alert('Error al cargar datos del dashboard');
    }
}

function renderKPIs(kpis) {
    const formatCurrency = val =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val || 0);

    const ventasHoyEl = document.getElementById('kpiSalesToday');
    const ventasMesEl = document.getElementById('kpiSalesMonth');
    const lowStockEl = document.getElementById('kpiLowStock');

    if (ventasHoyEl) ventasHoyEl.textContent = formatCurrency(kpis.ventas_hoy);
    if (ventasMesEl) ventasMesEl.textContent = formatCurrency(kpis.ventas_mes);
    if (lowStockEl) {
        const count = kpis.productos_bajo_stock || 0;
        lowStockEl.textContent = count;
        if (count > 0) {
            lowStockEl.style.color = '#B91C1C';
        } else {
            lowStockEl.style.color = '#111827';
        }
    }
}

function parseFechaIso(fechaStr) {
    return new Date(fechaStr);
}

function aplicarFiltrosReportes() {
    if (!datosReportes) return;

    const tipo = document.getElementById('reportTypeFilter')?.value || 'general';
    const desdeVal = document.getElementById('dateFromFilter')?.value;
    const hastaVal = document.getElementById('dateToFilter')?.value;

    let sales = datosReportes.sales_last_days || [];
    let topProducts = datosReportes.top_products || [];
    const lowStock = datosReportes.low_stock || [];

    if (desdeVal || hastaVal) {
        const desde = desdeVal ? new Date(desdeVal) : null;
        const hasta = hastaVal ? new Date(hastaVal) : null;
        sales = sales.filter(item => {
            const d = parseFechaIso(item.fecha);
            if (desde && d < desde) return false;
            if (hasta) {
                const end = new Date(hasta);
                end.setHours(23, 59, 59, 999);
                if (d > end) return false;
            }
            return true;
        });
    }

    const ventasTotalFiltrado = sales.reduce((sum, i) => sum + Number(i.total || 0), 0);
    const ventasHoy = datosReportes.kpis?.ventas_hoy || 0;
    const ventasMes = datosReportes.kpis?.ventas_mes || 0;
    const kpisFiltrados = {
        ventas_hoy: ventasHoy,
        ventas_mes: ventasTotalFiltrado || ventasMes,
        productos_bajo_stock: datosReportes.kpis?.productos_bajo_stock || 0
    };

    renderKPIs(kpisFiltrados);

    if (tipo === 'ventas' || tipo === 'general') {
        renderSalesChart(sales);
        document.getElementById('chartVentasCard').style.display = '';
    } else {
        document.getElementById('chartVentasCard').style.display = 'none';
    }

    if (tipo === 'productos' || tipo === 'general') {
        renderTopProductsChart(topProducts);
        document.getElementById('chartTopProductosCard').style.display = '';
        document.getElementById('tablaTopProductosCard').style.display = '';
    } else {
        document.getElementById('chartTopProductosCard').style.display = 'none';
        document.getElementById('tablaTopProductosCard').style.display = 'none';
    }

    if (tipo === 'inventario' || tipo === 'general') {
        renderLowStock(lowStock);
    } else {
        const tbodyLow = document.querySelector('#lowStockTable tbody');
        if (tbodyLow) tbodyLow.innerHTML = '';
    }
}

function limpiarFiltrosReportes() {
    const tipoEl = document.getElementById('reportTypeFilter');
    const desdeEl = document.getElementById('dateFromFilter');
    const hastaEl = document.getElementById('dateToFilter');

    if (tipoEl) tipoEl.value = 'general';
    if (desdeEl) desdeEl.value = '';
    if (hastaEl) hastaEl.value = '';

    if (!datosReportes) return;

    renderKPIs(datosReportes.kpis || {});
    renderSalesChart(datosReportes.sales_last_days || []);
    renderTopProductsChart(datosReportes.top_products || []);
    renderTopProductsTable(datosReportes.top_products || []);
    renderLowStock(datosReportes.low_stock || []);

    const ventasCard = document.getElementById('chartVentasCard');
    const topChartCard = document.getElementById('chartTopProductosCard');
    const topTableCard = document.getElementById('tablaTopProductosCard');

    if (ventasCard) ventasCard.style.display = '';
    if (topChartCard) topChartCard.style.display = '';
    if (topTableCard) topTableCard.style.display = '';
}

function renderSalesChart(salesData) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = salesData.map(item => item.fecha);
    const totals = salesData.map(item => Number(item.total || 0));

    if (salesChartInstance) {
        salesChartInstance.destroy();
    }

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas diarias',
                data: totals,
                borderColor: 'rgba(37, 99, 235, 1)',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(37, 99, 235, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '$' + Number(value).toLocaleString('es-CO')
                    }
                }
            }
        }
    });
}

function renderTopProductsChart(products) {
    const canvas = document.getElementById('topProductsChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = products.map(p => p.nombre);
    const totals = products.map(p => Number(p.total_vendido || 0));

    if (topProductsChartInstance) {
        topProductsChartInstance.destroy();
    }

    topProductsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad vendida',
                data: totals,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

function renderTopProductsTable(products) {
    const tbody = document.querySelector('#topProductsTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.descripcion || ''}</td>
            <td>${p.total_vendido}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderLowStock(products) {
    const tbody = document.querySelector('#lowStockTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.stock_actual}</td>
            <td>${p.stock_minimo}</td>
            <td><span class="badge-stock-low">Stock bajo</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function exportarReportes(tipo) {
    if (tipo === 'pdf') {
        alert('Exportar a PDF estará disponible en una siguiente versión.');
    } else if (tipo === 'excel') {
        alert('Exportar a Excel estará disponible en una siguiente versión.');
    }
}
