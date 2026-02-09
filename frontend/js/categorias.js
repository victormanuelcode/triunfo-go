const API_URL = 'http://localhost/proyecto_final/backend';

document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    setupModal();
});

async function cargarCategorias() {
    const container = document.getElementById('categorias-container');
    
    try {
        const response = await fetch(`${API_URL}/categories`);
        const categorias = await response.json();

        container.innerHTML = '';

        if (categorias.length === 0) {
            container.innerHTML = '<div class="loading-spinner">No hay categorías registradas.</div>';
            return;
        }

        categorias.forEach(cat => {
            const card = `
                <div class="card-producto">
                    <div class="card-body">
                        <h3 class="card-title">${cat.nombre}</h3>
                        <p class="card-desc">${cat.descripcion || 'Sin descripción'}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn-edit" onclick="editarCategoria(${cat.id_categoria})">Editar</button>
                        <button class="btn-danger" onclick="eliminarCategoria(${cat.id_categoria})">Eliminar</button>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<div class="loading-spinner" style="color:red">Error al cargar datos.</div>';
    }
}

function setupModal() {
    const modal = document.getElementById('categoriaModal');
    const btnNuevo = document.getElementById('btnNuevaCategoria');
    const spanClose = document.getElementsByClassName('close-modal')[0];
    const btnCancel = document.getElementsByClassName('close-modal-btn')[0];
    const form = document.getElementById('categoriaForm');

    btnNuevo.onclick = () => {
        form.reset();
        document.getElementById('categoriaId').value = '';
        modal.style.display = "block";
    }

    const closeModal = () => modal.style.display = "none";
    spanClose.onclick = closeModal;
    btnCancel.onclick = closeModal;
    window.onclick = (e) => { if (e.target == modal) closeModal(); }

    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('categoriaId').value;
        const nombre = document.getElementById('nombreCat').value;
        const descripcion = document.getElementById('descCat').value;

        const data = { nombre, descripcion };
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/categories/${id}` : `${API_URL}/categories`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                closeModal();
                cargarCategorias();
            } else {
                alert('Error al guardar');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    }
}

window.editarCategoria = async function(id) {
    try {
        const response = await fetch(`${API_URL}/categories/${id}`);
        const cat = await response.json();

        document.getElementById('categoriaId').value = cat.id_categoria;
        document.getElementById('nombreCat').value = cat.nombre;
        document.getElementById('descCat').value = cat.descripcion;

        document.getElementById('categoriaModal').style.display = "block";
    } catch (error) {
        console.error(error);
        alert('Error al cargar datos');
    }
}

window.eliminarCategoria = async function(id) {
    if(confirm('¿Seguro que deseas eliminar esta categoría?')) {
        try {
            const response = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
            if(response.ok) cargarCategorias();
            else alert('No se pudo eliminar');
        } catch (error) {
            console.error(error);
        }
    }
}
