/** Ejecutar en <head> (login, factura, etc.) antes del primer paint si es posible. */
(function () {
    try {
        const t = localStorage.getItem('ui_theme');
        document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : 'light');
    } catch (_) {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();
