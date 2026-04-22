// Carga layout_admin o layout_cajero según rol (perfil y otras vistas comunes)
(function () {
    const role = String(localStorage.getItem('usuario_rol') || '').trim();
    const src = role === '2'
        ? '../../js/layout_cashier.js'
        : '../../js/layout_admin.js';
    const s = document.createElement('script');
    s.src = src;
    document.head.appendChild(s);
})();
