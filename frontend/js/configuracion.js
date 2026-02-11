document.addEventListener('DOMContentLoaded', () => {
    cargarConfiguracion();

    const form = document.getElementById('empresaForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarConfiguracion();
    });
});

async function cargarConfiguracion() {
    try {
        const response = await fetch('http://localhost/proyecto_final/backend/company');
        const data = await response.json();

        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('nit').value = data.nit || '';
        document.getElementById('direccion').value = data.direccion || '';
        document.getElementById('telefono').value = data.telefono || '';
        document.getElementById('lema').value = data.lema || '';

        if (data.logo) {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `<img src="http://localhost/proyecto_final/backend/uploads/company/${data.logo}" alt="Logo actual" style="max-height: 100px; border: 1px solid #ddd; padding: 5px; border-radius: 4px;">`;
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

async function guardarConfiguracion() {
    const form = document.getElementById('empresaForm');
    const formData = new FormData(form);

    try {
        const response = await fetch('http://localhost/proyecto_final/backend/company', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            cargarConfiguracion(); // Recargar para ver cambios (especialmente logo)
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error guardando configuración:', error);
        alert('Error de conexión');
    }
}