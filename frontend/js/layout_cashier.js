// layout_cashier.js - Layout reutilizable para vistas del cajero (misma base que admin)
(function () {
    const APP_BASE = (window.TRIUNFOGO?.APP_BASE != null ? String(window.TRIUNFOGO.APP_BASE) : '');
    const PARTIALS_BASE = `${window.location.origin}${APP_BASE}/frontend/partials/`;
    const SIDEBAR_URL = PARTIALS_BASE + 'cashier_sidebar.html';
    const TOPBAR_URL = PARTIALS_BASE + 'admin_topbar.html';
    const LAYOUT_COLLAPSED_KEY = 'cashier_layout_collapsed';

    let layoutStarted = false;

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
            const current = path.split('/').pop();
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
            const temp = document.createElement('div');
            temp.innerHTML = html.trim();
            const asideNew = temp.firstElementChild;
            // Ajustar hrefs si estamos en common/
            if (window.location.pathname.includes('/common/')) {
                asideNew.querySelectorAll('a[href]').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href && !href.startsWith('http') && !href.startsWith('#')) {
                        a.setAttribute('href', '../cashier/' + href);
                    }
                });
            }
            mount.replaceWith(asideNew);
            setActiveNav(asideNew);
            return asideNew;
        } catch (e) {
            console.error('Error cargando sidebar cajero:', e);
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
            console.error('Error cargando topbar cajero:', e);
            mount.innerHTML = '<div style="padding:8px 12px;background:#fff;border-bottom:1px solid #eee;">Topbar no disponible</div>';
            return mount;
        }
    }

    function getLayoutRoot() {
        return document.querySelector('.layout-root');
    }

    function ensureSidebarOverlay() {
        let el = document.getElementById('sidebar-overlay');
        if (!el) {
            el = document.createElement('div');
            el.id = 'sidebar-overlay';
            el.className = 'sidebar-overlay';
            el.addEventListener('click', () => {
                setCollapsed(true);
            });
            document.body.appendChild(el);
        }
        return el;
    }

    function isMobileLayout() {
        return window.matchMedia('(max-width: 768px)').matches;
    }

    function updateSidebarOverlay() {
        const root = getLayoutRoot();
        if (!root) return;
        const overlay = ensureSidebarOverlay();
        const open = isMobileLayout() && !root.classList.contains('layout-collapsed');
        overlay.style.display = open ? 'block' : 'none';
        document.body.classList.toggle('sidebar-overlay-open', open);
    }

    function isCollapsed() {
        return localStorage.getItem(LAYOUT_COLLAPSED_KEY) === '1';
    }

    function setCollapsed(collapsed) {
        const root = getLayoutRoot();
        if (!root) return;
        root.classList.toggle('layout-collapsed', collapsed);
        localStorage.setItem(LAYOUT_COLLAPSED_KEY, collapsed ? '1' : '0');
        updateSidebarOverlay();
    }

    function toggleCollapsed() {
        const root = getLayoutRoot();
        if (!root) return;
        const notifPanel = document.getElementById('notif-panel');
        if (notifPanel) notifPanel.style.display = 'none';
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

    function getStoredAvatarUrl() {
        try {
            const raw = localStorage.getItem('usuario_datos');
            if (raw) {
                const u = JSON.parse(raw);
                const url = u?.avatar_url || u?.avatarUrl || null;
                if (url && String(url).trim() !== '') return String(url);
            }
        } catch (_) {}
        const url2 = localStorage.getItem('usuario_avatar_url');
        if (url2 && String(url2).trim() !== '') return String(url2);
        return null;
    }

    function applyAvatarToEl(el, url) {
        if (!el) return;
        if (!url) {
            el.classList.remove('has-image');
            el.style.removeProperty('background-image');
            return;
        }
        el.classList.add('has-image');
        el.style.backgroundImage = `url("${url}")`;
    }

    function applyUserAvatarFromStorage() {
        const url = getStoredAvatarUrl();
        applyAvatarToEl(document.getElementById('adminAvatar'), url);
        applyAvatarToEl(document.getElementById('adminAvatarTop'), url);
    }

    function applySidebarUserText() {
        let nombre = localStorage.getItem('usuario_nombre');
        if (!nombre) {
            try {
                const raw = localStorage.getItem('usuario_datos');
                if (raw) nombre = JSON.parse(raw).nombre;
            } catch (_) {}
        }
        nombre = nombre || 'Cajero';
        const nameEl = document.getElementById('adminName');
        if (nameEl) nameEl.textContent = nombre;

        const url = getStoredAvatarUrl();
        if (!url) {
            const inicial = String(nombre).trim().charAt(0).toUpperCase() || 'C';
            const a = document.getElementById('adminAvatar');
            const t = document.getElementById('adminAvatarTop');
            if (a) a.textContent = inicial;
            if (t) t.textContent = inicial;
        }
    }

    async function startLayout() {
        if (layoutStarted) return;
        layoutStarted = true;

        setCollapsed(isCollapsed());

        await Promise.all([
            injectSidebar(),
            injectTopbar()
        ]);

        bindLayoutToggles();
        updateSidebarOverlay();
        window.addEventListener('resize', updateSidebarOverlay);
        applyUserAvatarFromStorage();
        applySidebarUserText();
        
        // Make topbar search function globally available
        window.handleTopbarSearch = function(event) {
            const searchTerm = event.target.value.toLowerCase();
            
            // If on sales/ventas page, trigger product search
            if (typeof window.filtrarProductos === 'function') {
                const buscador = document.getElementById('buscador');
                if (buscador) {
                    buscador.value = searchTerm;
                    window.filtrarProductos();
                }
            }
            // If on history page, trigger history search
            else if (typeof window.filtrarHistorial === 'function') {
                const buscador = document.getElementById('buscador');
                if (buscador) {
                    buscador.value = searchTerm;
                    window.filtrarHistorial();
                }
            }
        };

        const scriptCaja = document.createElement('script');
        scriptCaja.src = `${window.location.origin}${APP_BASE}/frontend/js/caja.js`;
        document.body.appendChild(scriptCaja);

        const scriptNotif = document.createElement('script');
        scriptNotif.src = `${window.location.origin}${APP_BASE}/frontend/js/notifications.js`;
        scriptNotif.onload = () => {
            try { window.initNotifications && window.initNotifications(); } catch (_) {}
        };
        document.body.appendChild(scriptNotif);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startLayout);
    } else {
        startLayout();
    }
})();
