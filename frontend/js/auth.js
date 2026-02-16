
// auth.js - Manejo centralizado de autenticación y sesiones en Frontend

const AUTH_LOGIN_URL = '/proyecto_final/frontend/views/auth/login.html';
const ROLE_ADMIN = '1';
const ROLE_CASHIER = '2';

// Interceptor global para fetch
const originalFetch = window.fetch;
window.fetch = async function(url, options = {}) {
    // Si la URL es hacia nuestra API backend
    if (url.includes('/backend/') && !url.includes('/login')) {
        const token = localStorage.getItem('token');
        
        if (token) {
            // Asegurar que headers exista
            if (!options.headers) {
                options.headers = {};
            }
            
            // Agregar token
            options.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Ejecutar fetch original
    const response = await originalFetch(url, options);

    // Verificar si el token expiró (401 Unauthorized)
    if (response.status === 401 && !url.includes('/login')) {
        console.warn('Sesión expirada o inválida.');
        alert('Su sesión ha expirado. Por favor ingrese nuevamente.');
        logout(false); // Logout sin confirmación
    }

    return response;
};

// Ejecutar verificación al cargar (excepto si estamos en login)
(function initAuth() {
    const isLoginPage = window.location.pathname.includes('login.html');
    
    if (isLoginPage) {
        // Si estamos en login, limpiar sesión previa para evitar conflictos
        localStorage.clear();
        sessionStorage.clear();
        return;
    }

    // Verificar sesión y token
    const hasSession = localStorage.getItem('sesion_activa');
    const hasToken = localStorage.getItem('token');

    if (!hasSession || !hasToken) {
        // No hay sesión, redirigir a login
        console.warn('Acceso denegado: No hay sesión activa o token válido.');
        window.location.href = AUTH_LOGIN_URL;
    } else {
        // Hay sesión, verificar permisos de rol (Seguridad básica Frontend)
        checkRolePermissions();
    }
})();

function getRelativePathToLogin() {
    return AUTH_LOGIN_URL;
}

function checkRolePermissions() {
    const userRole = localStorage.getItem('usuario_rol');
    const path = window.location.pathname;

    // Si es Cajero (2) y trata de entrar a carpetas de admin
    if (userRole === ROLE_CASHIER && path.includes('/admin/')) {
        alert('Acceso no autorizado para su perfil.');
        window.location.href = '/proyecto_final/frontend/views/cashier/ventas.html';
    }

    // Si es Admin (1) y trata de entrar a ventas (Opcional: a veces los admins venden)
    // Dejamos que el Admin entre a ventas si quiere.
}

// Función global de Logout
function logout(confirmar = true) {
    if (!confirmar || confirm('¿Está seguro que desea cerrar sesión?')) {
        const logoutUrl = `${window.location.origin}/proyecto_final/backend/logout`;
        // Intentar revocar token en backend; ignorar errores
        originalFetch(logoutUrl, { method: 'POST' }).finally(() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = AUTH_LOGIN_URL;
        });
    }
}
