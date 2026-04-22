document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('empresaForm');
    if (form) {
        cargarConfiguracion();
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await guardarConfiguracion();
        });
    }

    document.querySelectorAll('.config-tab').forEach((btn) => {
        btn.addEventListener('click', () => {
            const panelId = btn.getAttribute('data-panel');
            document.querySelectorAll('.config-tab').forEach((b) => {
                b.classList.toggle('active', b === btn);
                b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
            });
            document.querySelectorAll('.config-panel').forEach((p) => {
                p.classList.toggle('hidden', p.id !== 'panel-' + panelId);
            });
        });
    });

    if (window.UITheme && typeof UITheme.bindThemeRadios === 'function') {
        const mount = document.getElementById('panel-apariencia') || document;
        UITheme.bindThemeRadios(mount);
    }
});

const API_URL = (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php')));

async function cargarConfiguracion() {
    const nombreInput = document.getElementById('nombre');
    if (!nombreInput) return;

    try {
        const response = await fetch(`${API_URL}/company`);
        const data = await response.json();

        document.getElementById('nombre').value = data.nombre || '';
        document.getElementById('nit').value = data.nit || '';
        document.getElementById('direccion').value = data.direccion || '';
        document.getElementById('telefono').value = data.telefono || '';
        document.getElementById('lema').value = data.lema || '';

        if (data.logo) {
            const preview = document.getElementById('logoPreview');
            preview.innerHTML = `<img src="${API_URL}/uploads/company/${data.logo}" alt="Logo actual" style="max-height: 100px; border: 1px solid #ddd; padding: 5px; border-radius: 4px;">`;
        }
    } catch (error) {
        console.error('Error cargando configuración:', error);
    }
}

async function guardarConfiguracion() {
    const form = document.getElementById('empresaForm');
    const formData = new FormData(form);

    try {
        const response = await fetch(`${API_URL}/company`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            cargarConfiguracion();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error guardando configuración:', error);
        alert('Error de conexión');
    }
}
