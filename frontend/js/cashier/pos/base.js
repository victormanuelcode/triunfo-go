(function () {
    const ns = window.CashierPOS = window.CashierPOS || {};
    ns.state = ns.state || {
        API_URL: (window.TRIUNFOGO?.API_BASE || ((window.location.origin || '') + ((window.TRIUNFOGO?.APP_BASE || '') + '/backend/index.php'))),
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

    /** Pesos colombianos: $ + separador de miles (es-CO), sin decimales. */
    function formatCOP(value) {
        const n = Math.round(Number(value) || 0);
        return '$' + n.toLocaleString('es-CO', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    }

    /** Interpreta texto como COP entero (solo dígitos; ignora separadores y símbolos). */
    function parseCOPInput(raw) {
        const digits = String(raw ?? '').replace(/\D/g, '');
        if (digits === '') return 0;
        const n = parseInt(digits, 10);
        return Number.isFinite(n) ? n : 0;
    }

    /** Total a pagar en POS: respeta cotización por lote si existe (misma lógica que el carrito). */
    function getTotalCarritoOQuote() {
        let total = (ns.state.carrito || []).reduce((sum, item) => {
            return sum + Math.round(Number(item.precio) * Number(item.cantidad));
        }, 0);
        const q = ns.state.quoteCache;
        const keyOk = ns.state.quoteCartKey === getCartKey();
        if (q && keyOk && Number(q.total || 0) > 0) {
            total = Math.round(Number(q.total || 0));
        }
        return Math.round(Number(total) || 0);
    }

    /**
     * Monto recibido en efectivo: mínimo $50 COP si hay valor;
     * para pagar debe ser >= max(total, 50) cuando total > 0.
     */
    function minMontoRecibidoValido(totalVenta) {
        const t = Math.round(Number(totalVenta) || 0);
        if (t <= 0) return 50;
        return Math.max(t, 50);
    }

    /**
     * Solo dígitos en campo COP, formateo es-CO al escribir; bloquea letras y símbolos.
     */
    function applyMontoRecibidoInput(el) {
        if (!el) return;
        const maxDigits = 12;
        let digits = String(el.value || '').replace(/\D/g, '').slice(0, maxDigits);
        if (digits === '') {
            el.value = '';
            return;
        }
        let n = parseInt(digits, 10);
        if (!Number.isFinite(n)) {
            el.value = '';
            return;
        }
        const formatted = n.toLocaleString('es-CO', { maximumFractionDigits: 0, minimumFractionDigits: 0 });
        el.value = formatted;
    }

    ns.base = {
        showToastPOS,
        getAuthHeaders,
        getCartKey,
        saveCart,
        loadCartFromStorage,
        formatCOP,
        parseCOPInput,
        getTotalCarritoOQuote,
        minMontoRecibidoValido,
        applyMontoRecibidoInput
    };
})();
