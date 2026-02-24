// layout_admin.js - Inyección de layout reutilizable para vistas del Admin
(function () {
    const PARTIALS_BASE = `${window.location.origin}/proyecto_final/frontend/partials/`;
    const SIDEBAR_URL = PARTIALS_BASE + 'admin_sidebar.html';
    const TOPBAR_URL = PARTIALS_BASE + 'admin_topbar.html';

    async function fetchPartial(url) {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status} al cargar ${url}`);
        }
        return res.text();
    }

    function setActiveNav(asideEl) {
        try {
            const path = window.location.pathname;
            const current = path.split('/').pop(); // archivo.html
            asideEl.querySelectorAll('.sidebar-nav a[data-route]').forEach(a => {
                a.classList.toggle('active', a.getAttribute('data-route') === current);
            });
        } catch (_) {}
    }

    async function injectSidebar() {
        const mount = document.querySelector('.sidebar');
        if (!mount) return;
        try {
            const html = await fetchPartial(SIDEBAR_URL);
            // Reemplazar el aside completo para mantener consistencia de estructura
            const temp = document.createElement('div');
            temp.innerHTML = html.trim();
            const asideNew = temp.firstElementChild;
            mount.replaceWith(asideNew);
            setActiveNav(asideNew);
        } catch (e) {
            console.error('Error cargando sidebar admin:', e);
            // Fallback mínimo para no dejar la vista sin navegación
            mount.innerHTML = '<div style="padding:12px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">No se pudo cargar el menú lateral.</div>';
        }
    }

    async function injectTopbar() {
        const mount = document.querySelector('.topbar');
        if (!mount) return;
        try {
            const html = await fetchPartial(TOPBAR_URL);
            const temp = document.createElement('div');
            temp.innerHTML = html.trim();
            const topbarNew = temp.firstElementChild;
            mount.replaceWith(topbarNew);
        } catch (e) {
            console.error('Error cargando topbar admin:', e);
            mount.innerHTML = '<div style="padding:8px 12px;background:#fff;border-bottom:1px solid #eee;">Topbar no disponible</div>';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        injectSidebar();
        injectTopbar();
    });
})();
