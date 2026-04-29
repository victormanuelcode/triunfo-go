const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));

let datosReportes = null;
let salesChartInstance = null;
let topProductsChartInstance = null;

const PDF_LANDSCAPE_RULES = {
    topProducts: { maxRowsPortrait: 10, minColumnsLandscape: 6 },
    lowStock: { maxRowsPortrait: 15, minColumnsLandscape: 6 }
};

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

        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        datosReportes = data;

        renderKPIs(data.kpis || {});
        renderSalesChart(data.sales_last_days || []);
        renderTopProductsChart(data.top_products || []);
        renderTopProductsTable(data.top_products || []);
        renderLowStock(data.low_stock || []);
    } catch (error) {
        console.error('Error cargando dashboard:', error);
        // Mostrar un mensaje amigable pero sin impedir que se vea la página
        const msg = error.message || 'Error desconocido al cargar los reportes';
        const contentInner = document.querySelector('.content-inner');
        if (contentInner) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-error';
            alertDiv.style.marginBottom = '20px';
            alertDiv.innerHTML = `<strong>Advertencia:</strong> ${msg}. Asegúrate de que la base de datos está disponible.`;
            contentInner.insertBefore(alertDiv, contentInner.querySelector('.card-admin'));
        }
    }
}

function renderKPIs(kpis) {
    const formatCurrency = val =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val || 0);

    const ventasHoyEl = document.getElementById('kpiSalesToday');
    const ventasMesEl = document.getElementById('kpiSalesMonth');
    const egresosHoyEl = document.getElementById('kpiExpensesToday');
    const netoPeriodoEl = document.getElementById('kpiNetPeriod');
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

    if (egresosHoyEl) egresosHoyEl.textContent = formatCurrency(kpis.egresos_hoy);

    if (netoPeriodoEl) {
        const desdeVal = document.getElementById('dateFromFilter')?.value;
        const labelNeto = netoPeriodoEl.parentElement.querySelector('.kpi-label');
        if (labelNeto) {
            labelNeto.textContent = desdeVal ? 'Neto del periodo' : 'Neto mes actual';
        }
        // Preferimos neto_mes si viene del backend; fallback a ventas-egresos
        const neto = (kpis.neto_mes !== undefined && kpis.neto_mes !== null)
            ? kpis.neto_mes
            : ((kpis.ventas_mes || 0) - (kpis.egresos_mes || 0));
        netoPeriodoEl.textContent = formatCurrency(neto);
        // Colorizar: negativo en rojo
        netoPeriodoEl.style.color = (Number(neto) < 0) ? '#B91C1C' : '#111827';
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

function aplicarFiltrosReportes() {
    // Recargar todo el dashboard con los nuevos filtros desde el servidor
    cargarDashboardReportes();

    // Mostrar/ocultar secciones según tipo
    const tipo = document.getElementById('reportTypeFilter')?.value || 'general';
    const chartVentas = document.getElementById('chartVentasCard');
    const chartTop = document.getElementById('chartTopProductosCard');
    const tableTop = document.getElementById('tablaTopProductosCard');

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
    const tipoEl = document.getElementById('reportTypeFilter');
    const desdeEl = document.getElementById('dateFromFilter');
    const hastaEl = document.getElementById('dateToFilter');

    if (tipoEl) tipoEl.value = 'general';
    if (desdeEl) desdeEl.value = '';
    if (hastaEl) hastaEl.value = '';

    cargarDashboardReportes();
}

function renderSalesChart(salesData) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;

    if (typeof Chart === 'undefined') {
        canvas.parentElement.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">No se pudo cargar Chart.js (sin conexión o CDN bloqueado)</p>';
        return;
    }
    
    if (!salesData || salesData.length === 0) {
        canvas.parentElement.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">Sin datos de ventas en este período</p>';
        return;
    }

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

    if (typeof Chart === 'undefined') {
        canvas.parentElement.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">No se pudo cargar Chart.js (sin conexión o CDN bloqueado)</p>';
        return;
    }
    
    if (!products || products.length === 0) {
        canvas.parentElement.innerHTML = '<p style="text-align:center;padding:40px;color:#9ca3af;">Sin datos de productos vendidos en este período</p>';
        return;
    }

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
                label: 'Cantidad vendida (kg)',
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

    if (!products || products.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="3" style="text-align:center;color:#9ca3af;">Sin datos disponibles</td>';
        tbody.appendChild(tr);
        return;
    }

    products.forEach(p => {
        const cantidadTxt = formatCantidadSegunTipo(p.total_vendido, p);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nombre || '-'}</td>
            <td>${p.descripcion || '-'}</td>
            <td>${cantidadTxt}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderLowStock(products) {
    const tbody = document.querySelector('#lowStockTable tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!products || products.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="text-align:center;color:#16a34a;font-weight:bold;">✓ Todo el stock está en niveles adecuados</td>';
        tbody.appendChild(tr);
        return;
    }

    products.forEach(p => {
        const stockActualTxt = formatCantidadSegunTipo(p.stock_actual, p);
        const stockMinTxt = formatCantidadSegunTipo(p.stock_minimo, p);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nombre || '-'}</td>
            <td>${stockActualTxt}</td>
            <td>${stockMinTxt}</td>
            <td><span class="badge-stock-low">Stock bajo</span></td>
        `;
        tbody.appendChild(tr);
    });
}

async function exportarReportes(tipo) {
    // Asegura que la exportación use los filtros actuales del formulario.
    await cargarDashboardReportes();

    if (!datosReportes) {
        alert('No hay datos para exportar.');
        return;
    }

    if (tipo === 'pdf') {
        exportarPdfEstructurado(datosReportes);
    } else if (tipo === 'excel') {
        exportarExcel(datosReportes);
    }
}

function exportarPdfEstructurado(data) {
    const win = window.open('', '_blank', 'width=1024,height=768');
    if (!win) {
        alert('No se pudo abrir la ventana de impresión. Revisa el bloqueador de ventanas emergentes.');
        return;
    }

    const now = new Date();
    const periodo = construirTextoPeriodo();
    const usuario = localStorage.getItem('usuario_nombre') || 'Administrador';
    const logoSrc = resolveLogoSrc();
    const reportType = getCurrentReportType();
    const showSalesSection = reportType === 'general' || reportType === 'ventas';
    const showProductsSection = reportType === 'general' || reportType === 'productos';
    const kpis = data.kpis || {};
    const salesRows = Array.isArray(data.sales_last_days) ? data.sales_last_days : [];
    const topProducts = Array.isArray(data.top_products) ? data.top_products : [];
    const lowStock = Array.isArray(data.low_stock) ? data.low_stock : [];
    const landscapeTopProducts = shouldUseLandscapeForTable(
        topProducts,
        3,
        PDF_LANDSCAPE_RULES.topProducts.maxRowsPortrait,
        PDF_LANDSCAPE_RULES.topProducts.minColumnsLandscape
    );
    const landscapeLowStock = shouldUseLandscapeForTable(
        lowStock,
        4,
        PDF_LANDSCAPE_RULES.lowStock.maxRowsPortrait,
        PDF_LANDSCAPE_RULES.lowStock.minColumnsLandscape
    );

    const salesChartBase64 = getChartImageBase64('salesChart');
    const topChartBase64 = getChartImageBase64('topProductsChart');

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte TRIUNFO GO</title>
    <style>
        @page { size: A4 portrait; margin: 18mm; }
        @page landscapePage { size: A4 landscape; margin: 16mm; }
        body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
        h1, h2, h3 { margin: 0 0 10px; }
        .meta { margin-bottom: 16px; color: #374151; font-size: 13px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .logo { display: inline-flex; align-items: center; gap: 8px; }
        .logo img { max-height: 42px; max-width: 170px; object-fit: contain; }
        .logo-fallback { font-weight: 700; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 10px; font-size: 13px; }
        .grid-kpi { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0 20px; }
        .kpi { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; }
        .kpi .label { font-size: 12px; color: #6b7280; }
        .kpi .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
        .page { page-break-after: always; padding: 2mm 1mm 18mm; }
        .page:last-of-type { page-break-after: auto; }
        .page.landscape { page: landscapePage; }
        .section { margin-top: 8px; page-break-inside: avoid; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; }
        th { background: #f3f4f6; }
        .chart-wrap { margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px; }
        .chart-wrap img { width: 100%; max-height: 300px; object-fit: contain; }
        .empty { color: #6b7280; font-size: 12px; }
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            border-top: 1px solid #e5e7eb;
            padding: 6px 0;
            font-size: 11px;
            color: #4b5563;
            display: flex;
            justify-content: space-between;
        }
        .page-number::after { content: counter(page); }
        @media print {
            .footer { position: fixed; }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="logo">
                ${logoSrc
                    ? `<img src="${escapeHtml(logoSrc)}" alt="Logo empresa">`
                    : '<div class="logo-fallback">TRIUNFO GO</div>'}
            </div>
            <div>
                <h1>Reporte de negocio - TRIUNFO GO</h1>
            </div>
        </div>
        <div class="meta">
            Generado: ${escapeHtml(now.toLocaleString('es-CO'))}<br>
            Periodo: ${escapeHtml(periodo)}
        </div>

        <div class="grid-kpi">
            <div class="kpi"><div class="label">Ventas hoy</div><div class="value">${formatCurrency(kpis.ventas_hoy)}</div></div>
            <div class="kpi"><div class="label">Ventas periodo</div><div class="value">${formatCurrency(kpis.ventas_mes)}</div></div>
            <div class="kpi"><div class="label">Egresos hoy</div><div class="value">${formatCurrency(kpis.egresos_hoy)}</div></div>
            <div class="kpi"><div class="label">Egresos periodo</div><div class="value">${formatCurrency(kpis.egresos_mes)}</div></div>
            <div class="kpi"><div class="label">Neto periodo</div><div class="value">${formatCurrency(kpis.neto_mes)}</div></div>
            <div class="kpi"><div class="label">Productos bajo stock</div><div class="value">${Number(kpis.productos_bajo_stock || 0)}</div></div>
        </div>
    </div>

    ${showSalesSection ? `
    <div class="page">
        <div class="section">
            <h2>Ventas por dia</h2>
            ${salesChartBase64 ? `<div class="chart-wrap"><img src="${salesChartBase64}" alt="Grafica de ventas por dia"></div>` : '<p class="empty">Sin grafica disponible.</p>'}
            <table>
                <thead><tr><th>Fecha</th><th>Total venta</th></tr></thead>
                <tbody>
                    ${salesRows.length
                        ? salesRows.map(r => `<tr><td>${escapeHtml(r.fecha || '-')}</td><td>${formatCurrency(r.total)}</td></tr>`).join('')
                        : '<tr><td colspan="2" class="empty">Sin datos de ventas.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    ${showProductsSection ? `
    <div class="page ${landscapeTopProducts ? 'landscape' : ''}">
        <div class="section">
            <h2>Productos mas vendidos</h2>
            ${topChartBase64 ? `<div class="chart-wrap"><img src="${topChartBase64}" alt="Grafica de top productos"></div>` : '<p class="empty">Sin grafica disponible.</p>'}
            <table>
                <thead><tr><th>Producto</th><th>Descripcion</th><th>Cantidad vendida</th></tr></thead>
                <tbody>
                    ${topProducts.length
                        ? topProducts.map(p => `<tr><td>${escapeHtml(p.nombre || '-')}</td><td>${escapeHtml(p.descripcion || '-')}</td><td>${escapeHtml(formatCantidadSegunTipo(p.total_vendido, p))}</td></tr>`).join('')
                        : '<tr><td colspan="3" class="empty">Sin datos de productos.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    ${showProductsSection ? `
    <div class="page ${landscapeLowStock ? 'landscape' : ''}">
        <div class="section">
            <h2>Alertas de stock bajo</h2>
            <table>
                <thead><tr><th>Producto</th><th>Stock actual</th><th>Stock minimo</th><th>Estado</th></tr></thead>
                <tbody>
                    ${lowStock.length
                        ? lowStock.map(p => `<tr><td>${escapeHtml(p.nombre || '-')}</td><td>${escapeHtml(formatCantidadSegunTipo(p.stock_actual, p))}</td><td>${escapeHtml(formatCantidadSegunTipo(p.stock_minimo, p))}</td><td>Stock bajo</td></tr>`).join('')
                        : '<tr><td colspan="4" class="empty">Sin alertas de stock.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <div>Usuario: ${escapeHtml(usuario)} | Fecha: ${escapeHtml(now.toLocaleString('es-CO'))}</div>
        <div>Pagina <span class="page-number"></span></div>
    </div>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
}

function getChartImageBase64(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof canvas.toDataURL !== 'function') return '';
    try {
        return canvas.toDataURL('image/png');
    } catch (_) {
        return '';
    }
}

function construirTextoPeriodo() {
    const desdeVal = document.getElementById('dateFromFilter')?.value || '';
    const hastaVal = document.getElementById('dateToFilter')?.value || '';
    if (!desdeVal && !hastaVal) return 'Mes actual';
    if (desdeVal && hastaVal) return `Desde ${desdeVal} hasta ${hastaVal}`;
    if (desdeVal) return `Desde ${desdeVal}`;
    return `Hasta ${hastaVal}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(Number(value || 0));
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function shouldUseLandscapeForTable(rows, columns, maxRowsPortrait = 12, minColumnsLandscape = 6) {
    const rowCount = Array.isArray(rows) ? rows.length : 0;
    return rowCount > Number(maxRowsPortrait || 12) || Number(columns || 0) >= Number(minColumnsLandscape || 6);
}

function resolveLogoSrc() {
    const fromGlobal = window.TRIUNFOGO?.LOGO_URL || '';
    const fromStorage = localStorage.getItem('empresa_logo')
        || localStorage.getItem('logo_empresa')
        || localStorage.getItem('triunfo_logo')
        || '';
    const src = fromGlobal || fromStorage;
    if (!src) return '';
    return src;
}

function getCurrentReportType() {
    return document.getElementById('reportTypeFilter')?.value || 'general';
}

function isProductoPeso(item) {
    return ((item?.tipo_venta || '').toString().toLowerCase() === 'peso')
        || ((item?.unidad_base || '').toString().toLowerCase() === 'kg');
}

function formatCantidadSegunTipo(value, item) {
    const num = Number(value || 0);
    return `${num.toFixed(3)} kg`;
}

function exportarExcel(data) {
    // Exportar ventas diarias
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Reporte de Ventas - TRIUNFO GO\n\n";
    
    // KPIs
    csvContent += "Resumen General\n";
    csvContent += `Ventas Hoy,${data.kpis.ventas_hoy}\n`;
    csvContent += `Ventas Mes,${data.kpis.ventas_mes}\n`;
    csvContent += `Egresos Hoy,${data.kpis.egresos_hoy}\n`;
    csvContent += `Egresos Mes,${data.kpis.egresos_mes}\n`;
    csvContent += `Neto Mes,${data.kpis.neto_mes}\n`;
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
        csvContent += `${row.nombre},${formatCantidadSegunTipo(row.total_vendido, row)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reporte_triunfo_go.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
