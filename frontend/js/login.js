// URL Base de la API
const URL_API = 'http://localhost/proyecto_final/backend';

document.addEventListener('DOMContentLoaded', () => {
    // Referencia al formulario
    const formulario = document.getElementById('formularioLogin');
    if (formulario) {
        formulario.addEventListener('submit', manejarInicioSesion);
    }
});

/**
 * Función para manejar el evento de envío del formulario de login
 */
async function manejarInicioSesion(evento) {
    // Prevenir que se recargue la página
    evento.preventDefault();

    // Obtener elementos del DOM
    const usuarioInput = document.getElementById('usuario');
    const contrasenaInput = document.getElementById('contrasena');
    const alerta = document.getElementById('mensajeAlerta');

    // Limpiar alertas previas
    ocultarAlerta();

    // Validar campos vacíos (aunque el HTML tiene required, es bueno validar en JS)
    if (usuarioInput.value.trim() === '' || contrasenaInput.value.trim() === '') {
        mostrarAlerta('Por favor, complete todos los campos.');
        return;
    }

    // Preparar datos para enviar
    const credenciales = {
        usuario: usuarioInput.value,
        contrasena: contrasenaInput.value
    };

    try {
        // Realizar petición al servidor
        const respuesta = await fetch(`${URL_API}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credenciales)
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            // Login exitoso
            guardarSesion(datos);
            redirigirUsuario(datos.rol_id);
        } else {
            // Error en login (usuario no existe o contraseña incorrecta)
            mostrarAlerta(datos.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        }

    } catch (error) {
        console.error('Error de conexión:', error);
        mostrarAlerta('No se pudo conectar con el servidor. Intente más tarde.');
    }
}

/**
 * Guarda la información del usuario en LocalStorage
 */
function guardarSesion(datos) {
    localStorage.setItem('sesion_activa', 'true');
    localStorage.setItem('usuario_id', datos.user_id);
    localStorage.setItem('usuario_nombre', datos.nombre);
    localStorage.setItem('usuario_rol', datos.rol_id);
    localStorage.setItem('usuario_email', datos.email);
}

/**
 * Redirige al usuario según su rol
 */
function redirigirUsuario(rolId) {
    const rol = parseInt(rolId);
    
    console.log('Redirigiendo rol:', rol);

    // Lógica de redirección
    if (rol === 1) {
        // Rol 1: Administrador -> Va al Dashboard de Admin (Productos)
        window.location.href = '../admin/productos.html';
    } else if (rol === 2) {
        // Rol 2: Cajero/Vendedor -> Va a Ventas
        window.location.href = '../cashier/ventas.html'; 
    } else {
        // Otros roles por defecto a login o admin
        window.location.href = '../admin/productos.html';
    }
}

/**
 * Muestra un mensaje de error en la interfaz
 */
function mostrarAlerta(mensaje) {
    const alerta = document.getElementById('mensajeAlerta');
    alerta.textContent = mensaje;
    alerta.style.display = 'block';
}

/**
 * Oculta el mensaje de error
 */
function ocultarAlerta() {
    const alerta = document.getElementById('mensajeAlerta');
    alerta.style.display = 'none';
}
