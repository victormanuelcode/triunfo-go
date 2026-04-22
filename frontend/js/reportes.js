const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));

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
        // Obtener filtros de la URL o del DOM
        const desdeVal = document.getElementById('dateFromFilter')?.value;
        const hastaVal = document.getElementById('dateToFilter')?.value;
        
        let url = `${API_URL}/reports/dashboard`;
        const params = [];
        if (desdeVal) params.push(`fecha_inicio=${desdeVal}`);
        if (hastaVal) params.push(`fecha_fin=${hastaVal}`);
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        const response = await fetch(url);
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
    if (ventasMesEl) {
        // Si hay filtro activo, cambiar etiqueta para indicar que es del periodo
        const desdeVal = document.getElementById('dateFromFilter')?.value;
        const labelMes = ventasMesEl.parentElement.querySelector('.kpi-label');
        if (desdeVal && labelMes) {
            labelMes.textContent = 'Ventas del periodo';
        } else if (labelMes) {
            labelMes.textContent = 'Ventas mes actual';
        }
        ventasMesEl.textContent = formatCurrency(kpis.ventas_mes);
    }
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
    // Recargar todo el dashboard con los nuevos filtros desde el servidor
    cargarDashboardReportes();

    // Mostrar/ocultar secciones según tipo
    const tipo = document.getElementById('reportTypeFilter')?.value || 'general';
    const chartVentas = document.getElementById('chartVentasCard');
    const chartTop = document.getElementById('chartTopProductosCard');
    const tableTop = document.getElementById('tablaTopProductosCard');
    const tableLow = document.getElementById('tablaLowStockCard'); // Si existiera ID

    if (tipo === 'general') {
        if(chartVentas) chartVentas.style.display = '';
        if(chartTop) chartTop.style.display = '';
        if(tableTop) tableTop.style.display = '';
    } else if (tipo === 'ventas') {
        if(chartVentas) chartVentas.style.display = '';
        if(chartTop) chartTop.style.display = 'none';
        if(tableTop) tableTop.style.display = 'none';
    } else if (tipo === 'productos') {
        if(chartVentas) chartVentas.style.display = 'none';
        if(chartTop) chartTop.style.display = '';
        if(tableTop) tableTop.style.display = '';
    }
}

function limpiarFiltrosReportes() {
    document.getElementById('reportTypeFilter').value = 'general';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    
    // Restaurar visualización
    const chartVentas = document.getElementById('chartVentasCard');
    const chartTop = document.getElementById('chartTopProductosCard');
    const tableTop = document.getElementById('tablaTopProductosCard');
    if(chartVentas) chartVentas.style.display = '';
    if(chartTop) chartTop.style.display = '';
    if(tableTop) tableTop.style.display = '';

    cargarDashboardReportes();
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
    if (!datosReportes) {
        alert('No hay datos para exportar.');
        return;
    }

    if (tipo === 'pdf') {
        window.print();
    } else if (tipo === 'excel') {
        exportarExcel(datosReportes);
    }
}

function exportarExcel(data) {
    // Exportar ventas diarias
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Reporte de Ventas - TRIUNFO GO\n\n";
    
    // KPIs
    csvContent += "Resumen General\n";
    csvContent += `Ventas Hoy,${data.kpis.ventas_hoy}\n`;
    csvContent += `Ventas Mes,${data.kpis.ventas_mes}\n`;
    csvContent += `Bajo Stock,${data.kpis.productos_bajo_stock}\n\n`;

    // Ventas Diarias
    csvContent += "Ventas Diarias (Últimos días)\n";
    csvContent += "Fecha,Total Venta\n";
    data.sales_last_days.forEach(row => {
        csvContent += `${row.fecha},${row.total}\n`;
    });

    csvContent += "\nTop Productos\n";
    csvContent += "Producto,Cantidad Vendida\n";
    data.top_products.forEach(row => {
        csvContent += `${row.nombre},${row.total_vendido}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_triunfo_go.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
