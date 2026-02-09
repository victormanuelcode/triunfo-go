const API_URL = 'http://localhost/proyecto_final/backend';

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadDashboard();
});

function checkSession() {
    if (!localStorage.getItem('sesion_activa')) {
        window.location.href = 'login.html';
    }
}

async function loadDashboard() {
    try {
        const response = await fetch(`${API_URL}/reports/dashboard`);
        const data = await response.json();

        renderKPIs(data.kpis);
        renderSalesChart(data.sales_last_days);
        renderTopProducts(data.top_products);
        renderLowStock(data.low_stock);

    } catch (error) {
        console.error('Error cargando dashboard:', error);
        alert('Error al cargar datos del dashboard');
    }
}

function renderKPIs(kpis) {
    const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);
    
    document.getElementById('kpiSalesToday').textContent = formatCurrency(kpis.ventas_hoy);
    document.getElementById('kpiSalesMonth').textContent = formatCurrency(kpis.ventas_mes);
    document.getElementById('kpiLowStock').textContent = kpis.productos_bajo_stock;
    
    // Estilo condicional para stock bajo
    if (kpis.productos_bajo_stock > 0) {
        document.getElementById('kpiLowStock').style.color = '#e74c3c'; // Rojo
    }
}

function renderSalesChart(salesData) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    // Preparar datos para Chart.js
    const labels = salesData.map(item => item.fecha);
    const totals = salesData.map(item => item.total);

    new Chart(ctx, {
        type: 'bar', // o 'line'
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas Diarias',
                data: totals,
                backgroundColor: 'rgba(52, 152, 219, 0.6)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-CO');
                        }
                    }
                }
            }
        }
    });
}

function renderTopProducts(products) {
    const tbody = document.querySelector('#topProductsTable tbody');
    tbody.innerHTML = '';
    
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.total_vendido}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderLowStock(products) {
    const tbody = document.querySelector('#lowStockTable tbody');
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="color: #e74c3c; font-weight: bold;">${p.nombre}</td>
            <td>${p.stock_actual}</td>
            <td>${p.stock_minimo}</td>
        `;
        tbody.appendChild(tr);
    });
}
