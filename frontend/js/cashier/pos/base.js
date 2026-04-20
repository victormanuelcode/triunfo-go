(function () {
    const ns = window.CashierPOS = window.CashierPOS || {};
    ns.state = ns.state || {
        API_URL: '/proyecto_final/backend',
        carrito: [],
        productosGlobal: [],
        ultimaVenta: null,
        sesionCajaId: null,
        metodoPagoSeleccionado: 'efectivo',
        quoteCache: null,
        quoteCartKey: null,
        quoteRefreshTimer: null,
        quoteBreakdownVisible: true,
        cajaAbiertaUI: false,
        loteModalProductoId: null,
        loteModalDisponibles: []
    };

    function showToastPOS(message, type = 'info') {
        const el = document.getElementById('pos-toast');
        if (!el) return;
        el.textContent = message;
        el.style.background = type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : type === 'warning' ? '#92400e' : '#111827';
        el.style.borderColor = '#e5e7eb';
        el.style.display = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(() => { el.style.display = 'none'; }, 3000);
    }

    function getAuthHeaders(includeJson = false) {
        const token = localStorage.getItem('token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (includeJson) headers['Content-Type'] = 'application/json';
        return headers;
    }

    function getCartKey() {
        const items = (ns.state.carrito || [])
            .map(i => ({ p: Number(i.id_producto), q: Number(i.cantidad), l: i.lote_id ? Number(i.lote_id) : null }))
            .sort((a, b) => (a.p - b.p) || ((a.l ?? 0) - (b.l ?? 0)));
        return JSON.stringify(items);
    }

    function saveCart() {
        localStorage.setItem('pos_carrito', JSON.stringify(ns.state.carrito));
    }

    function loadCartFromStorage() {
        const carritoGuardado = localStorage.getItem('pos_carrito');
        if (!carritoGuardado) {
            ns.state.carrito = [];
            return [];
        }
        try {
            ns.state.carrito = JSON.parse(carritoGuardado) || [];
        } catch (e) {
            console.error('Error cargando carrito guardado', e);
            ns.state.carrito = [];
        }
        return ns.state.carrito;
    }

    ns.base = {
        showToastPOS,
        getAuthHeaders,
        getCartKey,
        saveCart,
        loadCartFromStorage
    };
})();
