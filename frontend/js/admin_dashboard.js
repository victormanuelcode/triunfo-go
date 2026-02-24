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

        const kpis = data.kpis || {};

        const ventasHoy = kpis.ventas_hoy || 0;
        const facturasHoy = kpis.facturas_hoy || 0;
        const productosBajoStock = kpis.productos_bajo_stock || 0;
        const usuariosActivos = kpis.usuarios_activos || 0;

        const formatCurrency = (val) =>
            new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);

        const ventasHoyEl = document.querySelector('.metric-card .metric-value');
        if (ventasHoyEl) {
            ventasHoyEl.textContent = formatCurrency(ventasHoy);
        }

        const facturasHoyEl = document.querySelectorAll('.metric-card .metric-value')[1];
        if (facturasHoyEl) {
            facturasHoyEl.textContent = facturasHoy;
        }

        const stockBajoEl = document.querySelectorAll('.metric-card .metric-value')[2];
        if (stockBajoEl) {
            stockBajoEl.textContent = productosBajoStock;
        }

        const usuariosActivosEl = document.querySelectorAll('.metric-card .metric-value')[3];
        if (usuariosActivosEl) {
            usuariosActivosEl.textContent = usuariosActivos;
        }
    } catch (error) {
        console.error('Error cargando dashboard admin:', error);
    }
}

