const API_URL = 'http://localhost/proyecto_final/backend';
let movimientosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarMovimientos();

    document.getElementById('buscador').addEventListener('keyup', (e) => {
        filtrarMovimientos(e.target.value);
    });
});

async function cargarMovimientos() {
    try {
        const response = await fetch(`${API_URL}/inventory/movements`);
        const data = await response.json();
        
        movimientosGlobal = data;
        renderizarTabla(data);
    } catch (error) {
        console.error('Error cargando movimientos:', error);
        document.getElementById('tabla-movimientos').innerHTML = 
            '<tr><td colspan="7" style="text-align:center; color:red;">Error de conexión</td></tr>';
    }
}

function renderizarTabla(movimientos) {
    const tbody = document.getElementById('tabla-movimientos');
    tbody.innerHTML = '';

    if (movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay movimientos registrados.</td></tr>';
        return;
    }

    movimientos.forEach(m => {
        const tr = document.createElement('tr');
        const fecha = new Date(m.fecha).toLocaleString();
        const tipoBadge = m.tipo === 'entrada' 
            ? '<span class="badge-entrada">ENTRADA</span>' 
            : '<span class="badge-salida">SALIDA</span>';

        tr.innerHTML = `
            <td>${m.id_movimiento}</td>
            <td>${fecha}</td>
            <td><strong>${m.producto_nombre || 'Producto Eliminado'}</strong></td>
            <td>${tipoBadge}</td>
            <td style="font-weight:bold;">${m.cantidad}</td>
            <td>${m.referencia || '-'}</td>
            <td>${m.descripcion || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarMovimientos(texto) {
    const term = texto.toLowerCase();
    const filtrados = movimientosGlobal.filter(m => {
        const nombre = (m.producto_nombre || '').toLowerCase();
        const ref = (m.referencia || '').toLowerCase();
        const desc = (m.descripcion || '').toLowerCase();
        return nombre.includes(term) || ref.includes(term) || desc.includes(term);
    });
    renderizarTabla(filtrados);
}