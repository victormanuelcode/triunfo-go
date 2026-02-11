const API_URL = 'http://localhost/proyecto_final/backend';
let clientesGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    cargarClientes();
    setupModal();
});

function checkSession() {
    if (!localStorage.getItem('sesion_activa')) {
        window.location.href = '../auth/login.html';
    }
}

async function cargarClientes() {
    try {
        const response = await fetch(`${API_URL}/clients`);
        clientesGlobal = await response.json();
        renderizarTabla(clientesGlobal);
    } catch (error) {
        console.error('Error cargando clientes:', error);
        alert('Error al cargar clientes');
    }
}

function renderizarTabla(clientes) {
    const tbody = document.querySelector('#tablaClientes tbody');
    tbody.innerHTML = '';

    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay clientes registrados</td></tr>';
        return;
    }

    clientes.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.nombre}</td>
            <td>${c.documento || '-'}</td>
            <td>${c.telefono || '-'}</td>
            <td>${c.email || '-'}</td>
            <td>
                <button class="btn-edit" onclick="editarCliente(${c.id_cliente})">Editar</button>
                <button class="btn-delete" onclick="eliminarCliente(${c.id_cliente})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarClientes() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    const filtrados = clientesGlobal.filter(c => 
        c.nombre.toLowerCase().includes(texto) || 
        (c.documento && c.documento.includes(texto))
    );
    renderizarTabla(filtrados);
}

// Modal Logic
function setupModal() {
    const modal = document.getElementById('modalCliente');
    const btnNuevo = document.getElementById('btnNuevoCliente');
    const spanClose = document.getElementsByClassName('close-modal')[0];
    const btnCancel = document.getElementsByClassName('btn-cancel')[0];
    const form = document.getElementById('formCliente');

    btnNuevo.onclick = () => {
        form.reset();
        document.getElementById('idCliente').value = '';
        document.getElementById('modalTitle').innerText = 'Nuevo Cliente';
        modal.style.display = "block";
    };

    const closeModal = () => modal.style.display = "none";
    spanClose.onclick = closeModal;
    btnCancel.onclick = closeModal;
    window.onclick = (e) => { if (e.target == modal) closeModal(); };

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('idCliente').value;
        const data = {
            nombre: document.getElementById('nombre').value,
            documento: document.getElementById('documento').value,
            telefono: document.getElementById('telefono').value,
            direccion: document.getElementById('direccion').value,
            email: document.getElementById('email').value
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/clients/${id}` : `${API_URL}/clients`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                closeModal();
                cargarClientes();
            } else {
                alert('Error al guardar cliente');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    };
}

async function editarCliente(id) {
    const cliente = clientesGlobal.find(c => c.id_cliente == id);
    if (!cliente) return;

    document.getElementById('idCliente').value = cliente.id_cliente;
    document.getElementById('nombre').value = cliente.nombre;
    document.getElementById('documento').value = cliente.documento;
    document.getElementById('telefono').value = cliente.telefono;
    document.getElementById('direccion').value = cliente.direccion;
    document.getElementById('email').value = cliente.email;
    
    document.getElementById('modalTitle').innerText = 'Editar Cliente';
    document.getElementById('modalCliente').style.display = "block";
}

async function eliminarCliente(id) {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
        const response = await fetch(`${API_URL}/clients/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            cargarClientes();
        } else {
            const res = await response.json();
            alert('Error: ' + (res.message || 'No se pudo eliminar'));
        }
    } catch (error) {
        console.error(error);
        alert('Error de conexión');
    }
}
