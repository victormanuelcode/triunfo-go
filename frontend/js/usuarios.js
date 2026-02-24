const API_URL = window.location.origin + '/proyecto_final/backend';
let usuariosGlobal = [];

document.addEventListener('DOMContentLoaded', () => {

    const modal = document.getElementById('usuarioModal');
    const btnNuevo = document.getElementById('btnNuevoUsuario');
    const closeBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    const form = document.getElementById('usuarioForm');

    btnNuevo.addEventListener('click', () => {
        form.reset();
        document.getElementById('usuarioId').value = '';
        modal.style.display = 'block';
    });

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarUsuario();
    });

    const filtroRol = document.getElementById('filtroRol');
    const filtroEstado = document.getElementById('filtroEstado');

    if (filtroRol) {
        filtroRol.addEventListener('change', renderUsuariosFiltrados);
    }
    if (filtroEstado) {
        filtroEstado.addEventListener('change', renderUsuariosFiltrados);
    }

    cargarUsuarios();
});

async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/users`);
        const usuarios = await response.json();

        usuariosGlobal = Array.isArray(usuarios)
            ? usuarios
                .filter(u => parseInt(u.rol_id) === 1 || parseInt(u.rol_id) === 2)
                .map(u => ({
                    ...u,
                    estado: 'activo',
                    ultimo_acceso: null
                }))
            : [];

        renderKPIsUsuarios();
        renderUsuariosFiltrados();
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

function renderKPIsUsuarios() {
    const total = usuariosGlobal.length;
    const admins = usuariosGlobal.filter(u => parseInt(u.rol_id) === 1).length;
    const cajeros = usuariosGlobal.filter(u => parseInt(u.rol_id) === 2).length;

    const totalEl = document.getElementById('kpiUsuariosTotal');
    const adminsEl = document.getElementById('kpiUsuariosAdmin');
    const cajerosEl = document.getElementById('kpiUsuariosCajero');

    if (totalEl) totalEl.textContent = total;
    if (adminsEl) adminsEl.textContent = admins;
    if (cajerosEl) cajerosEl.textContent = cajeros;
}

function renderUsuariosFiltrados() {
    const filtroRol = document.getElementById('filtroRol');
    const filtroEstado = document.getElementById('filtroEstado');

    const rolFiltro = filtroRol ? filtroRol.value : 'todos';
    const estadoFiltro = filtroEstado ? filtroEstado.value : 'todos';

    let lista = usuariosGlobal.slice();

    if (rolFiltro !== 'todos') {
        const rolInt = parseInt(rolFiltro);
        lista = lista.filter(u => parseInt(u.rol_id) === rolInt);
    }

    if (estadoFiltro !== 'todos') {
        lista = lista.filter(u => (u.estado || 'activo') === estadoFiltro);
    }

    renderUsuariosTabla(lista);
}

function renderUsuariosTabla(lista) {
    const tbody = document.getElementById('usuariosTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay usuarios registrados</td></tr>';
        return;
    }

    lista.forEach(user => {
        const rolId = parseInt(user.rol_id);
        const rolNombreBackend = user.nombre_rol || '';

        let rolLabel;
        if (rolId === 1) {
            rolLabel = 'Administrador';
        } else if (rolId === 2) {
            rolLabel = 'Cajero';
        } else {
            rolLabel = rolNombreBackend || 'Otro';
        }

        let rolBg = '#E5E7EB';
        let rolColor = '#111827';
        if (rolId === 1) {
            rolBg = '#DBEAFE';
            rolColor = '#1D4ED8';
        } else if (rolId === 2) {
            rolBg = '#DCFCE7';
            rolColor = '#166534';
        }

        const estado = user.estado || 'activo';
        const estadoLabel = estado === 'inactivo' ? 'Inactivo' : 'Activo';
        const estadoBg = estado === 'inactivo' ? '#E5E7EB' : '#DCFCE7';
        const estadoColor = estado === 'inactivo' ? '#374151' : '#166534';

        const textoBotonEstado = estado === 'inactivo' ? 'Activar' : 'Desactivar';

        const ultimoAcceso = user.ultimo_acceso || '-';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.nombre}</td>
            <td>${user.email || '-'}</td>
            <td>
                <span style="
                    background:${rolBg};
                    color:${rolColor};
                    padding:2px 8px;
                    border-radius:999px;
                    font-size:0.8rem;
                    display:inline-flex;
                    align-items:center;
                ">
                    ${rolLabel}
                </span>
            </td>
            <td>
                <span style="
                    background:${estadoBg};
                    color:${estadoColor};
                    padding:2px 8px;
                    border-radius:999px;
                    font-size:0.8rem;
                    display:inline-flex;
                    align-items:center;
                ">
                    ${estadoLabel}
                </span>
            </td>
            <td>${ultimoAcceso}</td>
            <td>
                <button onclick="editarUsuario(${user.id_usuario})" class="btn-secondary" style="padding: 2px 6px; font-size: 0.8em; margin-right:4px;">Editar</button>
                <button onclick="accionEstadoUsuario(${user.id_usuario})" class="btn-secondary" style="padding: 2px 6px; font-size: 0.8em; margin-right:4px;">${textoBotonEstado}</button>
                <button onclick="eliminarUsuario(${user.id_usuario})" class="btn-danger" style="padding: 2px 6px; font-size: 0.8em; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function guardarUsuario() {
    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('nombre').value;
    const usuario = document.getElementById('usuario').value;
    const email = document.getElementById('email').value;
    const contrasena = document.getElementById('contrasena').value;
    const rol_id = document.getElementById('rol_id').value;

    const data = { nombre, usuario, email, rol_id };
    
    // Solo enviar contraseña si no está vacía o es nuevo usuario
    if (contrasena || !id) {
        data.contrasena = contrasena;
    }

    const url = id 
        ? `${API_URL}/users/${id}`
        : `${API_URL}/users`;
    
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            document.getElementById('usuarioModal').style.display = 'none';
            cargarUsuarios();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error guardando usuario:', error);
        alert('Error de conexión');
    }
}

async function editarUsuario(id) {
    try {
        const response = await fetch(`${API_URL}/users/${id}`);
        const user = await response.json();

        document.getElementById('usuarioId').value = user.id_usuario;
        document.getElementById('nombre').value = user.nombre;
        document.getElementById('usuario').value = user.usuario;
        document.getElementById('email').value = user.email;
        document.getElementById('rol_id').value = user.rol_id;
        document.getElementById('contrasena').value = '';

        document.getElementById('usuarioModal').style.display = 'block';
    } catch (error) {
        console.error('Error cargando usuario:', error);
    }
}

async function eliminarUsuario(id) {
    if(!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if(response.ok) {
            alert(result.message);
            cargarUsuarios();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Error eliminando usuario:', error);
    }
}

function accionEstadoUsuario(id) {
    const usuarioId = parseInt(id);
    const index = usuariosGlobal.findIndex(u => parseInt(u.id_usuario) === usuarioId);
    if (index === -1) {
        return;
    }

    const user = usuariosGlobal[index];
    const estadoActual = user.estado || 'activo';
    const nuevoEstado = estadoActual === 'inactivo' ? 'activo' : 'inactivo';

    usuariosGlobal[index] = {
        ...user,
        estado: nuevoEstado
    };

    renderUsuariosFiltrados();
}
