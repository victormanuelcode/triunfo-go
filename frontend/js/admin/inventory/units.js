(function () {
    const ns = window.AdminInventory = window.AdminInventory || {};
    const state = ns.state;

    async function cargarUnidadesSelect() {
        const select = document.getElementById('unidad_medida_id');
        if (!select) return;
        try {
            const response = await fetch(`${state.API_URL}/units`);
            const unidades = await response.json();

            select.innerHTML = '<option value="">Seleccione una unidad</option>';
            unidades.forEach(uni => {
                select.innerHTML += `<option value="${uni.id_unidad}">${uni.nombre} (${uni.abreviatura})</option>`;
            });
        } catch (error) {
            console.error('Error cargando unidades:', error);
        }
    }

    function setupUnidadesModal() {
        const modal = document.getElementById('unidadesModal');
        const btnGestionar = document.getElementById('btnGestionarUnidades');
        const spanClose = document.getElementsByClassName('close-modal-unidades')[0];
        const btnClose = document.getElementsByClassName('close-modal-unidades-btn')[0];
        const btnGuardar = document.getElementById('btnGuardarUnidad');
        const tbody = document.getElementById('tablaUnidadesBody');
        if (!modal || !tbody) return;

        async function cargarTablaUnidades() {
            tbody.innerHTML = '<tr><td colspan="3">Cargando...</td></tr>';
            try {
                const response = await fetch(`${state.API_URL}/units`);
                const unidades = await response.json();

                tbody.innerHTML = '';
                if (unidades.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3">No hay unidades registradas.</td></tr>';
                    return;
                }

                unidades.forEach(uni => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${uni.nombre}</td>
                        <td>${uni.abreviatura}</td>
                        <td>
                            <button class="btn-danger btn-sm" onclick="eliminarUnidadDesdeModal(${uni.id_unidad})">Eliminar</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (error) {
                console.error(error);
                tbody.innerHTML = '<tr><td colspan="3" style="color:red">Error al cargar unidades.</td></tr>';
            }
        }

        function closeModal() {
            modal.style.display = 'none';
            cargarUnidadesSelect();
        }

        if (btnGestionar) {
            btnGestionar.onclick = function () {
                modal.style.display = 'block';
                cargarTablaUnidades();
            };
        }

        if (spanClose) spanClose.onclick = closeModal;
        if (btnClose) btnClose.onclick = closeModal;

        if (btnGuardar) {
            btnGuardar.onclick = async function () {
                const nombre = document.getElementById('nuevaUnidadNombre').value;
                const abrev = document.getElementById('nuevaUnidadAbrev').value;

                if (!nombre || !abrev) {
                    alert('Por favor complete ambos campos.');
                    return;
                }

                try {
                    const response = await fetch(`${state.API_URL}/units`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre, abreviatura: abrev })
                    });

                    if (response.ok) {
                        document.getElementById('nuevaUnidadNombre').value = '';
                        document.getElementById('nuevaUnidadAbrev').value = '';
                        cargarTablaUnidades();
                    } else {
                        alert('Error al guardar unidad.');
                    }
                } catch (error) {
                    console.error(error);
                    alert('Error de conexión.');
                }
            };
        }

        window.eliminarUnidadDesdeModal = async function (id) {
            if (!confirm('¿Eliminar esta unidad?')) return;

            try {
                const response = await fetch(`${state.API_URL}/units/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    cargarTablaUnidades();
                } else {
                    alert('No se puede eliminar (posiblemente en uso).');
                }
            } catch (error) {
                console.error(error);
                alert('Error al eliminar.');
            }
        };
    }

    function setup() {
        cargarUnidadesSelect();
        setupUnidadesModal();
    }

    ns.units = {
        setup,
        cargarUnidadesSelect,
        setupUnidadesModal
    };
})();
