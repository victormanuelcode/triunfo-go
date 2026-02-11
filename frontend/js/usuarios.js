document.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();

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
});

async function cargarUsuarios() {
    try {
        const response = await fetch('http://localhost/proyecto_final/backend/users');
        const usuarios = await response.json();
        
        const tbody = document.getElementById('usuariosTableBody');
        tbody.innerHTML = '';

        if(usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay usuarios registrados</td></tr>';
            return;
        }

        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id_usuario}</td>
                <td>${user.nombre}</td>
                <td>${user.usuario}</td>
                <td>${user.email || '-'}</td>
                <td>
                    <span style="
                        background: ${user.rol_id == 1 ? '#cce5ff' : '#d4edda'};
                        color: ${user.rol_id == 1 ? '#004085' : '#155724'};
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 0.9em;
                    ">
                        ${user.nombre_rol || (user.rol_id == 1 ? 'Administrador' : 'Cajero')}
                    </span>
                </td>
                <td>
                    <button onclick="editarUsuario(${user.id_usuario})" class="btn-secondary" style="padding: 2px 5px; font-size: 0.8em;">Editar</button>
                    <button onclick="eliminarUsuario(${user.id_usuario})" class="btn-danger" style="padding: 2px 5px; font-size: 0.8em; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
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
        ? `http://localhost/proyecto_final/backend/users/${id}`
        : 'http://localhost/proyecto_final/backend/users';
    
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
        const response = await fetch(`http://localhost/proyecto_final/backend/users/${id}`);
        const user = await response.json();

        document.getElementById('usuarioId').value = user.id_usuario;
        document.getElementById('nombre').value = user.nombre;
        document.getElementById('usuario').value = user.usuario;
        document.getElementById('email').value = user.email;
        document.getElementById('rol_id').value = user.rol_id;
        document.getElementById('contrasena').value = ''; // Limpiar contraseña

        document.getElementById('usuarioModal').style.display = 'block';
    } catch (error) {
        console.error('Error cargando usuario:', error);
    }
}

async function eliminarUsuario(id) {
    if(!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
        const response = await fetch(`http://localhost/proyecto_final/backend/users/${id}`, {
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