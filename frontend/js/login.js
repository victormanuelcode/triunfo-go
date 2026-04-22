function getAppBaseFromPathname(pathname) {
    const p = String(pathname || '/');
    const idxFrontend = p.indexOf('/frontend/');
    if (idxFrontend >= 0) return p.slice(0, idxFrontend) || '';
    const idxBackend = p.indexOf('/backend/');
    if (idxBackend >= 0) return p.slice(0, idxBackend) || '';
    return '';
}

// URL Base de la API (auto-detect al clonar en otra carpeta)
const URL_API = (window.location.origin || '') + (getAppBaseFromPathname(window.location.pathname) + '/backend/index.php');

document.addEventListener('DOMContentLoaded', () => {
    // Limpiar sesión al entrar al login
    clearSessionKeys();

    // Referencia al formulario
    const formulario = document.getElementById('formularioLogin');
    if (formulario) {
        formulario.addEventListener('submit', manejarInicioSesion);
    }
});

const SESSION_KEYS = [
    'sesion_activa',
    'token',
    'usuario_id',
    'usuario_rol',
    'usuario_datos',
    'usuario_nombre',
    'usuario_email',
    'sesion_actual',
    'pos_carrito',
    'user'
];

function clearSessionKeys() {
    SESSION_KEYS.forEach(k => localStorage.removeItem(k));
    sessionStorage.clear();
}

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

        let datos = null;
        const contentType = respuesta.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            datos = await respuesta.json();
        } else {
            const txt = await respuesta.text();
            throw new Error(txt || 'Respuesta no-JSON del servidor');
        }

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
    localStorage.setItem('token', datos.token); // Guardar JWT
    localStorage.setItem('usuario_id', datos.user_id);
    localStorage.setItem('usuario_nombre', datos.nombre);
    localStorage.setItem('usuario_rol', datos.rol_id);
    localStorage.setItem('usuario_email', datos.email);
    localStorage.setItem('usuario_datos', JSON.stringify({
        id_usuario: datos.user_id ? Number(datos.user_id) : null,
        rol_id: datos.rol_id ? Number(datos.rol_id) : null,
        nombre: datos.nombre || null,
        email: datos.email || null
    }));
}

/**
 * Redirige al usuario según su rol
 */
function redirigirUsuario(rolId) {
    const rol = parseInt(rolId);
    
    console.log('Redirigiendo rol:', rol);

    // Lógica de redirección
    if (rol === 1) {
        window.location.href = '../admin/dashboard.html';
    } else if (rol === 2) {
        // Rol 2: Cajero/Vendedor -> Va al nuevo Dashboard
        window.location.href = '../cashier/dashboard.html'; 
    } else {
        // Otros roles por defecto a login
        alert('Rol no reconocido. Contacte al administrador.');
        clearSessionKeys();
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
