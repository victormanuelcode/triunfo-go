const API_URL = 'http://localhost/proyecto_final/backend';
let proveedoresGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    cargarProveedores();
    setupModal();
});

function checkSession() {
    if (!localStorage.getItem('sesion_activa')) {
        window.location.href = '../auth/login.html';
    }
}

// Cargar proveedores desde API
async function cargarProveedores() {
    try {
        const response = await fetch(`${API_URL}/suppliers`);
        const data = await response.json();
        proveedoresGlobal = data;
        renderizarTabla(data);
    } catch (error) {
        console.error('Error cargando proveedores:', error);
    }
}

// Renderizar tabla
function renderizarTabla(proveedores) {
    const tbody = document.querySelector('#tablaProveedores tbody');
    tbody.innerHTML = '';

    if (proveedores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No hay proveedores registrados</td></tr>';
        return;
    }

    proveedores.forEach(prov => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${prov.nombre}</td>
            <td>${prov.nit || '-'}</td>
            <td>${prov.telefono || '-'}</td>
            <td>${prov.email || '-'}</td>
            <td>
                <button class="btn-edit" onclick="editarProveedor(${prov.id_proveedor})">Editar</button>
                <button class="btn-delete" onclick="eliminarProveedor(${prov.id_proveedor})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Filtrar
function filtrarProveedores() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filtrados = proveedoresGlobal.filter(p => 
        p.nombre.toLowerCase().includes(texto) || 
        (p.nit && p.nit.includes(texto))
    );
    renderizarTabla(filtrados);
}

// Configurar Modal
function setupModal() {
    const modal = document.getElementById('modalProveedor');
    const btnAdd = document.getElementById('btnNuevoProveedor');
    const spanClose = document.getElementsByClassName('close-modal')[0];
    const btnCancel = document.querySelector('.btn-cancel');
    const form = document.getElementById('formProveedor');

    btnAdd.onclick = () => {
        form.reset();
        document.getElementById('idProveedor').value = '';
        document.getElementById('modalTitle').textContent = 'Nuevo Proveedor';
        modal.style.display = 'block';
    }

    const closeModal = () => modal.style.display = 'none';
    spanClose.onclick = closeModal;
    btnCancel.onclick = closeModal;
    window.onclick = (e) => { if (e.target == modal) closeModal(); }

    form.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('idProveedor').value;
        const data = {
            nombre: document.getElementById('nombre').value,
            nit: document.getElementById('nit').value,
            telefono: document.getElementById('telefono').value,
            direccion: document.getElementById('direccion').value,
            email: document.getElementById('email').value
        };

        try {
            let response;
            if (id) {
                // Actualizar
                response = await fetch(`${API_URL}/suppliers/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                // Crear
                response = await fetch(`${API_URL}/suppliers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }

            if (response.ok) {
                closeModal();
                cargarProveedores();
                // Opcional: mostrar notificación
            } else {
                alert('Error al guardar proveedor');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }
}

function editarProveedor(id) {
    const prov = proveedoresGlobal.find(p => p.id_proveedor == id);
    if (prov) {
        document.getElementById('idProveedor').value = prov.id_proveedor;
        document.getElementById('nombre').value = prov.nombre;
        document.getElementById('nit').value = prov.nit || '';
        document.getElementById('telefono').value = prov.telefono || '';
        document.getElementById('direccion').value = prov.direccion || '';
        document.getElementById('email').value = prov.email || '';
        
        document.getElementById('modalTitle').textContent = 'Editar Proveedor';
        document.getElementById('modalProveedor').style.display = 'block';
    }
}

async function eliminarProveedor(id) {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
        try {
            const response = await fetch(`${API_URL}/suppliers/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                cargarProveedores();
            } else {
                alert('No se puede eliminar (posiblemente tenga productos asociados)');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}