// auth.js - Manejo centralizado de autenticación y sesiones en Frontend

(function applyUiThemeAndStylesheet() {
    try {
        const t = localStorage.getItem('ui_theme');
        document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    } catch (_) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    try {
        if (document.querySelector('link[data-app-theme-css]')) return;
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.setAttribute('data-app-theme-css', '1');
        l.href = window.location.origin + '/proyecto_final/frontend/css/theme.css';
        document.head.appendChild(l);
    } catch (_) {}
})();

const AUTH_LOGIN_URL = '/proyecto_final/frontend/views/auth/login.html';
const ROLE_ADMIN = '1';
const ROLE_CASHIER = '2';

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

function normalizeSessionStorage() {
    const token = localStorage.getItem('token');
    const sesionActiva = localStorage.getItem('sesion_activa');

    let usuarioDatos = null;
    const usuarioDatosRaw = localStorage.getItem('usuario_datos');
    if (usuarioDatosRaw) {
        try { usuarioDatos = JSON.parse(usuarioDatosRaw); } catch (_) { usuarioDatos = null; }
    }

    if (!usuarioDatos) {
        const legacyUserRaw = localStorage.getItem('user');
        if (legacyUserRaw) {
            try { usuarioDatos = JSON.parse(legacyUserRaw); } catch (_) { usuarioDatos = null; }
        }
    }

    const usuarioId = localStorage.getItem('usuario_id') || (usuarioDatos?.id_usuario != null ? String(usuarioDatos.id_usuario) : null) || (usuarioDatos?.user_id != null ? String(usuarioDatos.user_id) : null);
    const usuarioRol = localStorage.getItem('usuario_rol') || (usuarioDatos?.rol_id != null ? String(usuarioDatos.rol_id) : null);
    const usuarioNombre = localStorage.getItem('usuario_nombre') || (usuarioDatos?.nombre != null ? String(usuarioDatos.nombre) : null);
    const usuarioEmail = localStorage.getItem('usuario_email') || (usuarioDatos?.email != null ? String(usuarioDatos.email) : null);

    if (token && !sesionActiva) {
        localStorage.setItem('sesion_activa', 'true');
    }

    if (usuarioId) localStorage.setItem('usuario_id', usuarioId);
    if (usuarioRol) localStorage.setItem('usuario_rol', usuarioRol);
    if (usuarioNombre) localStorage.setItem('usuario_nombre', usuarioNombre);
    if (usuarioEmail) localStorage.setItem('usuario_email', usuarioEmail);

    if (!usuarioDatos) {
        usuarioDatos = {
            id_usuario: usuarioId ? Number(usuarioId) : null,
            rol_id: usuarioRol ? Number(usuarioRol) : null,
            nombre: usuarioNombre || null,
            email: usuarioEmail || null
        };
    }

    localStorage.setItem('usuario_datos', JSON.stringify(usuarioDatos));
    localStorage.removeItem('user');
}

// Interceptor global para fetch
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
    // Si la URL es hacia nuestra API backend
    // Ajuste para permitir que funcione tanto con rutas relativas como absolutas
    if (url.includes('proyecto_final/backend') && !url.includes('/login')) {
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
        clearSessionKeys();
        return;
    }

    normalizeSessionStorage();

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

const __enhancedForms = new WeakSet();
const __enhancedInputs = new WeakSet();

function __isVisibleField(el) {
    if (!el) return false;
    if (el.disabled) return false;
    if (el.type === 'hidden') return false;
    if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false;
    return true;
}

function __labelIsRequired(field) {
    const group = field.closest('.form-group');
    if (!group) return false;
    const label = group.querySelector('label');
    if (!label) return false;
    return (label.textContent || '').includes('*');
}

function __setDefaultNumberConstraints(input) {
    const key = `${input.id || ''} ${input.name || ''}`.toLowerCase();
    const isQty = key.includes('cantidad') || key.includes('stock');
    const isMoney = key.includes('precio') || key.includes('costo') || key.includes('monto') || key.includes('total');

    if (!input.step) input.step = isMoney ? '0.01' : '1';
    if (input.min === '' || input.min == null) {
        if (isQty) input.min = '0';
        if (isMoney) input.min = '0';
    }

    if ((key.includes('cantidad') || key.includes('loteCantidad'.toLowerCase()) || key.includes('ajusteCantidad'.toLowerCase())) && (input.min === '' || input.min == null || Number(input.min) === 0)) {
        input.min = '1';
    }

    input.inputMode = isMoney ? 'decimal' : 'numeric';
}

function __attachNonNegativeNumberGuards(input) {
    input.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k === 'e' || k === 'E' || k === '+') e.preventDefault();
        const min = input.min !== '' ? Number(input.min) : null;
        const disallowMinus = min !== null && Number.isFinite(min) && min >= 0;
        if (disallowMinus && k === '-') e.preventDefault();
    });

    input.addEventListener('input', () => {
        if (!input.value) {
            input.setCustomValidity('');
            return;
        }
        let v = input.value.replace(/,/g, '.');
        if (v.includes('e') || v.includes('E')) v = v.replace(/[eE]/g, '');
        const min = input.min !== '' ? Number(input.min) : null;
        const disallowMinus = min !== null && Number.isFinite(min) && min >= 0;
        if (disallowMinus) v = v.replace(/-/g, '');
        if (v !== input.value) input.value = v;
        input.setCustomValidity('');
    });
}

function __attachDigitsOnly(input) {
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.addEventListener('input', () => {
        const v = (input.value || '').replace(/[^\d]/g, '');
        if (v !== input.value) input.value = v;
        input.setCustomValidity('');
    });
}

function __attachLettersOnly(input) {
    input.autocomplete = 'off';
    input.addEventListener('input', () => {
        const v = (input.value || '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s.'-]/g, '');
        if (v !== input.value) input.value = v;
        input.setCustomValidity('');
    });
}

function __enhanceField(field) {
    if (!field || __enhancedInputs.has(field)) return;
    __enhancedInputs.add(field);

    if (__labelIsRequired(field)) field.required = true;

    const key = `${field.id || ''} ${field.name || ''}`.toLowerCase();
    const formId = (field.form?.id || '').toLowerCase();

    if (field.tagName === 'INPUT' && field.type === 'number') {
        __setDefaultNumberConstraints(field);
        __attachNonNegativeNumberGuards(field);
        if ((key.includes('monto') || key.includes('precio') || key.includes('costo') || key.includes('cantidad') || key.includes('stock')) && field.required === false && (field.id || '').toLowerCase().startsWith('monto-')) {
            field.required = true;
        }
    }

    if (field.tagName === 'INPUT' && field.type === 'text') {
        if (key.includes('telefono') || key.includes('documento') || key.includes('cedula') || key.includes('nit')) {
            __attachDigitsOnly(field);
        }

        if ((formId === 'formcliente' && (field.id || '').toLowerCase() === 'nombre') || (formId === 'categoriaform' && (field.id || '').toLowerCase() === 'nombrecat') || (formId === 'usuarioform' && (field.id || '').toLowerCase() === 'nombre')) {
            __attachLettersOnly(field);
        }
    }

    if (field.tagName === 'INPUT' && field.type === 'email') {
        field.autocapitalize = 'none';
        field.autocomplete = field.autocomplete || 'email';
    }
}

function __validateForm(form) {
    const fields = Array.from(form.querySelectorAll('input, select, textarea'));
    fields.forEach(f => {
        if (!__isVisibleField(f)) return;
        f.setCustomValidity('');
        if (f.required && (f.type === 'text' || f.tagName === 'TEXTAREA' || f.type === 'email')) {
            const v = (f.value || '').trim();
            if (v.length === 0) f.setCustomValidity('Este campo es obligatorio.');
        }
        if (f.type === 'number' && f.value !== '') {
            const n = Number(f.value);
            if (!Number.isFinite(n)) {
                f.setCustomValidity('Ingrese un número válido.');
                return;
            }
            if (f.min !== '' && f.min != null) {
                const min = Number(f.min);
                if (Number.isFinite(min) && n < min) f.setCustomValidity(`El valor mínimo es ${min}.`);
            }
        }
    });
    return form.checkValidity();
}

function __enhanceForm(form) {
    if (!form || __enhancedForms.has(form)) return;
    __enhancedForms.add(form);

    Array.from(form.querySelectorAll('input, select, textarea')).forEach(__enhanceField);

    form.addEventListener('submit', (e) => {
        Array.from(form.querySelectorAll('input[type="text"], textarea, input[type="email"]')).forEach(f => {
            if (!__isVisibleField(f)) return;
            if (typeof f.value === 'string') f.value = f.value.trim();
        });

        if (!__validateForm(form)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            form.reportValidity();
        }
    }, true);
}

function __enhanceDom(root) {
    if (!root || !(root instanceof Element || root instanceof Document)) return;
    const forms = root.querySelectorAll ? root.querySelectorAll('form') : [];
    forms.forEach(__enhanceForm);
    const fields = root.querySelectorAll ? root.querySelectorAll('input, select, textarea') : [];
    fields.forEach(__enhanceField);
}

document.addEventListener('DOMContentLoaded', () => {
    __enhanceDom(document);
    const observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
            m.addedNodes.forEach(node => {
                if (node && (node.nodeType === 1 || node.nodeType === 9)) __enhanceDom(node);
            });
        }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
});

function getRelativePathToLogin() {
    return AUTH_LOGIN_URL;
}

function checkRolePermissions() {
    const userRole = localStorage.getItem('usuario_rol');
    const path = window.location.pathname;

    if (userRole === ROLE_CASHIER && path.includes('/admin/')) {
        alert('Acceso no autorizado para su perfil.');
        window.location.href = '/proyecto_final/frontend/views/cashier/dashboard.html';
    }

    // Si es Admin (1) y trata de entrar a vistas de cajero, redirigir a POS de Admin
    if (userRole === ROLE_ADMIN && path.includes('/cashier/')) {
        alert('Acceso de Admin redirigido a su Punto de Venta.');
        window.location.href = '/proyecto_final/frontend/views/admin/dashboard.html';
    }
}

function logout(confirmar = true) {
    if (!confirmar || confirm('¿Está seguro que desea cerrar sesión?')) {
        const logoutUrl = `${window.location.origin}/proyecto_final/backend/logout`;
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        originalFetch(logoutUrl, { method: 'POST', headers }).finally(() => {
            clearSessionKeys();
            window.location.href = AUTH_LOGIN_URL;
        });
    }
}
