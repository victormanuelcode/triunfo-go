document.addEventListener('DOMContentLoaded', () => {
    // Verificar sesión
    if (!localStorage.getItem('sesion_activa')) {
        window.location.href = 'login.html';
        return;
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // Cargar historial
    loadHistory();

    // Modal Logic
    const modal = document.getElementById("detailModal");
    const span = document.getElementsByClassName("close")[0];
    
    span.onclick = function() {
        modal.style.display = "none";
    }
    
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
});

const API_URL = 'http://localhost/proyecto_final/backend';

async function loadHistory() {
    try {
        const response = await fetch(`${API_URL}/invoices`);
        const invoices = await response.json();
        
        const tbody = document.querySelector('#historyTable tbody');
        tbody.innerHTML = '';

        if (invoices.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay ventas registradas</td></tr>';
            return;
        }

        invoices.forEach(inv => {
            const tr = document.createElement('tr');
            // Formatear fecha
            const fecha = new Date(inv.fecha).toLocaleString();
            // Formatear moneda
            const total = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(inv.total);

            tr.innerHTML = `
                <td>${inv.numero_factura}</td>
                <td>${fecha}</td>
                <td>${inv.cliente_nombre || 'Cliente General'}</td>
                <td>${inv.metodo_pago}</td>
                <td>${total}</td>
                <td>
                    <button class="btn-view" onclick="viewDetail(${inv.id_factura})">Ver Detalle</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error cargando historial:', error);
        alert('Error al cargar el historial de ventas.');
    }
}

async function viewDetail(id) {
    try {
        const response = await fetch(`${API_URL}/invoices/${id}`);
        if (!response.ok) throw new Error('Error fetching detail');
        
        const invoice = await response.json();
        
        // Rellenar Modal
        const modal = document.getElementById("detailModal");
        const modalInfo = document.getElementById("modalInfo");
        const tbody = document.querySelector('#modalTable tbody');
        
        // Header Info
        modalInfo.innerHTML = `
            <div><strong>N° Factura:</strong> ${invoice.numero_factura}</div>
            <div><strong>Fecha:</strong> ${new Date(invoice.fecha).toLocaleString()}</div>
            <div><strong>Cliente:</strong> ${invoice.cliente_nombre || 'General'}</div>
            <div><strong>Método Pago:</strong> ${invoice.metodo_pago}</div>
            <div style="grid-column: 1 / -1;"><strong>Observaciones:</strong> ${invoice.observaciones || '-'}</div>
            <div style="grid-column: 1 / -1; font-size: 1.2em; margin-top: 10px;"><strong>Total: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(invoice.total)}</strong></div>
        `;

        // Detalles Table
        tbody.innerHTML = '';
        invoice.detalles.forEach(item => {
            const tr = document.createElement('tr');
            const precio = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.precio_unitario);
            const subtotal = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.subtotal);
            
            tr.innerHTML = `
                <td>${item.producto_nombre}</td>
                <td>${item.cantidad}</td>
                <td>${precio}</td>
                <td>${subtotal}</td>
            `;
            tbody.appendChild(tr);
        });

        modal.style.display = "block";

    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo cargar el detalle de la venta.');
    }
}
