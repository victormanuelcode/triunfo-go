const API_URL = window.location.origin + '/proyecto_final/backend';

document.addEventListener('DOMContentLoaded', async () => {
    // Validar sesión
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }

    // Cargar datos del usuario
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('userWelcome').textContent = `Hola, ${user.nombre || 'Cajero'} 👋`;
    
    // Fecha actual
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('es-ES', options);

    // Cargar estado de la caja
    await loadBoxStatus();
    
    // Cargar estadísticas rápidas (simuladas por ahora, idealmente endpoints reales)
    loadQuickStats();
});

async function loadBoxStatus() {
    try {
        const usuarioId = localStorage.getItem('usuario_id');
        if (!usuarioId) return;

        const response = await fetch(`${API_URL}/box/status?usuario_id=${usuarioId}`);
        const data = await response.json();
        
        // Elementos UI
        const statusText = document.getElementById('box-status-text'); // Ajustar ID en HTML si es necesario
        const actionBtn = document.getElementById('btn-action-box'); // Ajustar ID

        if (data && data.estado === 'abierta') {
            // Caja Abierta
            if(statusText) statusText.innerText = "Caja Abierta";
            if(actionBtn) actionBtn.innerText = "Ir a Ventas";
            
            // Cargar estadísticas reales
            loadQuickStats(data);
        } else {
            // Caja Cerrada
            if(statusText) statusText.innerText = "Caja Cerrada";
            if(actionBtn) actionBtn.innerText = "Abrir Caja";
            
            // Reset stats
            document.getElementById('salesCount').textContent = "0";
            document.getElementById('totalSales').textContent = "$0.00";
        }
    } catch (error) {
        console.error('Error al cargar estado de caja:', error);
    }
}

function loadQuickStats(sessionData) {
    if (!sessionData) return;

    // Calcular ventas totales
    // sessionData.total_ventas viene del backend (BoxController::getStatus)
    const totalVentas = parseFloat(sessionData.total_ventas || 0);
    
    // Para el conteo de facturas, necesitaríamos otro endpoint o dato en getStatus.
    // Por ahora mostramos el total recaudado.
    
    document.getElementById('totalSales').textContent = `$${totalVentas.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    
    // Si el backend devolviera cantidad de ventas, lo pondríamos aquí.
    // Como no lo devuelve aún, podemos dejarlo en "-" o hacer un fetch adicional.
    document.getElementById('salesCount').textContent = "-"; 
}

function toggleBox() {
    // Redirigir a la vista de ventas donde ya está la lógica de caja, o crear un modal aquí
    // Por simplicidad, llevamos a ventas.html que maneja la caja
    window.location.href = 'ventas.html';
}

function showProfile() {
    // Implementar modal o redirección a perfil
    alert('Funcionalidad de perfil en construcción');
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../auth/login.html';
}
