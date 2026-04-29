(function () {
    const ns = window.CashierPOS = window.CashierPOS || {};
    const state = ns.state;

    async function refreshQuote() {
        const breakdown = document.getElementById('quote-breakdown');
        const body = document.getElementById('quote-breakdown-body');

        if (!state.sesionCajaId) {
            state.quoteCache = null;
            state.quoteCartKey = null;
            if (breakdown) breakdown.style.display = 'none';
            if (body) body.innerHTML = '';
            ns.cart.actualizarCarritoUI();
            return;
        }

        const usuarioId = localStorage.getItem('usuario_id');
        if (!usuarioId || !state.carrito || state.carrito.length === 0) {
            state.quoteCache = null;
            state.quoteCartKey = null;
            if (breakdown) breakdown.style.display = 'none';
            if (body) body.innerHTML = '';
            ns.cart.actualizarCarritoUI();
            return;
        }

        const cartKey = ns.base.getCartKey();
        try {
            const itemsQuote = state.carrito.map(item => ({
                producto_id: item.id_producto,
                cantidad: item.cantidad,
                lote_id: item.lote_id || null
            }));

            const response = await fetch(`${state.API_URL}/invoices/quote`, {
                method: 'POST',
                headers: ns.base.getAuthHeaders(true),
                body: JSON.stringify({ usuario_id: usuarioId, items: itemsQuote })
            });
            const json = await response.json();
            if (!response.ok) {
                state.quoteCache = null;
                state.quoteCartKey = null;
                if (breakdown) breakdown.style.display = 'none';
                if (body) body.innerHTML = '';
                ns.cart.actualizarCarritoUI();
                return;
            }

            if (cartKey !== ns.base.getCartKey()) return;

            state.quoteCache = json;
            state.quoteCartKey = cartKey;
            ns.cart.renderQuoteBreakdown();
            ns.cart.actualizarCarritoUI();
        } catch (e) {
            state.quoteCache = null;
            state.quoteCartKey = null;
            if (breakdown) breakdown.style.display = 'none';
            if (body) body.innerHTML = '';
            ns.cart.actualizarCarritoUI();
        }
    }

    async function procesarVenta() {
        if (state.carrito.length === 0) {
            ns.base.showToastPOS('El carrito está vacío.', 'warning');
            return;
        }

        if (!state.sesionCajaId) {
            ns.base.showToastPOS('Debe ABRIR CAJA antes de realizar una venta.', 'warning');
            if (typeof window.mostrarModalAperturaCaja === 'function') {
                window.mostrarModalAperturaCaja();
            }
            return;
        }

        const usuarioId = localStorage.getItem('usuario_id');
        if (!usuarioId) {
            alert('Sesión inválida. Inicie sesión nuevamente.');
            return;
        }

        let quote = null;
        try {
            const itemsQuote = state.carrito.map(item => ({
                producto_id: item.id_producto,
                cantidad: item.cantidad,
                lote_id: item.lote_id || null
            }));
            const responseQuote = await fetch(`${state.API_URL}/invoices/quote`, {
                method: 'POST',
                headers: ns.base.getAuthHeaders(true),
                body: JSON.stringify({
                    usuario_id: usuarioId,
                    items: itemsQuote
                })
            });
            quote = await responseQuote.json();
            if (!responseQuote.ok) {
                ns.base.showToastPOS('Error al calcular total: ' + (quote.message || 'Desconocido'), 'error');
                return;
            }
        } catch (error) {
            console.error(error);
            ns.base.showToastPOS('Error de conexión al calcular total.', 'error');
            return;
        }

        const totalVenta = parseFloat(quote.total || 0);
        if (!(totalVenta > 0)) {
            ns.base.showToastPOS('No se pudo calcular el total de la venta.', 'error');
            return;
        }

        if (state.metodoPagoSeleccionado === 'efectivo') {
            const recibido = parseFloat(document.getElementById('monto-recibido').value || '0') || 0;
            if (recibido < totalVenta) {
                ns.base.showToastPOS('El monto recibido es insuficiente.', 'warning');
                document.getElementById('monto-recibido')?.focus();
                return;
            }
        }

        if (!confirm('¿Confirmar venta por $' + totalVenta.toLocaleString('es-CO') + '?')) return;

        const itemsVenta = (state.carrito || []).map(item => {
            const pid = Number(item.id_producto);
            const qty = Number(item.cantidad || 0);
            if (item.lote_id) {
                return {
                    producto_id: pid,
                    lotes: [{ lote_id: Number(item.lote_id), cantidad: qty }]
                };
            }
            return {
                producto_id: pid,
                cantidad: qty
            };
        });

        const clienteSelect = document.getElementById('cliente-select');
        const clienteId = clienteSelect?.value;
        const data = {
            items: itemsVenta,
            total: totalVenta,
            metodo_pago: state.metodoPagoSeleccionado,
            cliente_id: clienteId || null,
            usuario_id: usuarioId,
            sesion_id: state.sesionCajaId
        };

        try {
            const response = await fetch(`${state.API_URL}/invoices`, {
                method: 'POST',
                headers: ns.base.getAuthHeaders(true),
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                state.ultimaVenta = {
                    id_factura: result.id_factura,
                    numero_factura: result.numero_factura,
                    total: parseFloat(result.total || totalVenta),
                    cliente_nombre: clienteSelect?.options?.[clienteSelect.selectedIndex]?.text || 'Cliente General',
                    fecha: new Date().toLocaleString(),
                    metodo_pago: state.metodoPagoSeleccionado
                };

                if (typeof window.mostrarModalExito === 'function') {
                    window.mostrarModalExito();
                }
                limpiarDespuesDeVenta();
            } else {
                alert('Error al procesar venta: ' + result.message);
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión.');
        }
    }

    function limpiarDespuesDeVenta() {
        state.carrito = [];
        localStorage.removeItem('pos_carrito');
        state.quoteCache = null;
        state.quoteCartKey = null;
        ns.cart.actualizarCarritoUI();

        const montoRecibido = document.getElementById('monto-recibido');
        const textoCambio = document.getElementById('texto-cambio');
        if (montoRecibido) montoRecibido.value = '';
        if (textoCambio) textoCambio.innerText = '$0';

        if (typeof window.cargarCatalogo === 'function') {
            window.cargarCatalogo();
        }
    }

    function init() {
        window.refreshQuote = refreshQuote;
        window.procesarVenta = procesarVenta;
    }

    ns.checkout = {
        init,
        refreshQuote,
        procesarVenta,
        limpiarDespuesDeVenta
    };
})();
