// layout_admin.js - Inyección de layout reutilizable para vistas del Admin
(function () {
    const PARTIALS_BASE = `${window.location.origin}/proyecto_final/frontend/partials/`;
    const SIDEBAR_URL = PARTIALS_BASE + 'admin_sidebar.html';
    const TOPBAR_URL = PARTIALS_BASE + 'admin_topbar.html';
    const LAYOUT_COLLAPSED_KEY = 'admin_layout_collapsed';

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
        if (!mount) return null;
        try {
            const html = await fetchPartial(SIDEBAR_URL);
            // Reemplazar el aside completo para mantener consistencia de estructura
            const temp = document.createElement('div');
            temp.innerHTML = html.trim();
            const asideNew = temp.firstElementChild;
            mount.replaceWith(asideNew);
            setActiveNav(asideNew);
            return asideNew;
        } catch (e) {
            console.error('Error cargando sidebar admin:', e);
            // Fallback mínimo para no dejar la vista sin navegación
            mount.innerHTML = '<div style="padding:12px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;">No se pudo cargar el menú lateral.</div>';
            return mount;
        }
    }

    async function injectTopbar() {
        const mount = document.querySelector('.topbar');
        if (!mount) return null;
        try {
            const html = await fetchPartial(TOPBAR_URL);
            const temp = document.createElement('div');
            temp.innerHTML = html.trim();
            const topbarNew = temp.firstElementChild;
            mount.replaceWith(topbarNew);
            return topbarNew;
        } catch (e) {
            console.error('Error cargando topbar admin:', e);
            mount.innerHTML = '<div style="padding:8px 12px;background:#fff;border-bottom:1px solid #eee;">Topbar no disponible</div>';
            return mount;
        }
    }

    function getLayoutRoot() {
        return document.querySelector('.layout-root');
    }

    function isCollapsed() {
        return localStorage.getItem(LAYOUT_COLLAPSED_KEY) === '1';
    }

    function setCollapsed(collapsed) {
        const root = getLayoutRoot();
        if (!root) return;
        root.classList.toggle('layout-collapsed', collapsed);
        localStorage.setItem(LAYOUT_COLLAPSED_KEY, collapsed ? '1' : '0');
    }

    function toggleCollapsed() {
        const root = getLayoutRoot();
        if (!root) return;
        setCollapsed(!root.classList.contains('layout-collapsed'));
    }

    function bindLayoutToggles() {
        const root = getLayoutRoot();
        if (!root) return;

        const topbarBtn = document.getElementById('layoutToggleBtn');
        if (topbarBtn) {
            topbarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleCollapsed();
            });
        }

        const sidebarBtn = root.querySelector('.sidebar-toggle');
        if (sidebarBtn) {
            sidebarBtn.addEventListener('click', (e) => {
                e.preventDefault();
                toggleCollapsed();
            });
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        setCollapsed(isCollapsed());

        await Promise.all([
            injectSidebar(),
            injectTopbar()
        ]);

        bindLayoutToggles();

        const scriptCaja = document.createElement('script');
        scriptCaja.src = '../../js/caja.js';
        document.body.appendChild(scriptCaja);

        const scriptNotif = document.createElement('script');
        scriptNotif.src = '../../js/notifications.js';
        document.body.appendChild(scriptNotif);
    });
})();
