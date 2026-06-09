(function () {
    const ns = window.CashierPOS = window.CashierPOS || {};

    const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];

    function getMetodoPagoSeleccionado() {
        const fromState = String(ns.state?.metodoPagoSeleccionado || '').trim().toLowerCase();
        if (METODOS_PAGO.includes(fromState)) {
            return fromState;
        }
        const selected = document.querySelector('.payment-option.selected');
        if (!selected?.id) {
            return 'efectivo';
        }
        const fromDom = selected.id.replace(/^opt-/, '').trim().toLowerCase();
        return METODOS_PAGO.includes(fromDom) ? fromDom : 'efectivo';
    }

    function labelMetodoPago(metodo) {
        if (metodo === 'tarjeta') return 'tarjeta';
        if (metodo === 'transferencia') return 'transferencia';
        return 'efectivo';
    }

    async function refreshQuote() {
        const breakdown = document.getElementById('quote-breakdown');
        const body = document.getElementById('quote-breakdown-body');

        if (!ns.state.sesionCajaId) {
            ns.state.quoteCache = null;
            ns.state.quoteCartKey = null;
            if (breakdown) breakdown.style.display = 'none';
            if (body) body.innerHTML = '';
            ns.cart.actualizarCarritoUI();
            return;
        }

        const usuarioId = localStorage.getItem('usuario_id');
        if (!usuarioId || !ns.state.carrito || ns.state.carrito.length === 0) {
            ns.state.quoteCache = null;
            ns.state.quoteCartKey = null;
            if (breakdown) breakdown.style.display = 'none';
            if (body) body.innerHTML = '';
            ns.cart.actualizarCarritoUI();
            return;
        }

        const cartKey = ns.base.getCartKey();
        try {
            const itemsQuote = ns.state.carrito.map(item => ({
                producto_id: item.id_producto,
                cantidad: item.cantidad,
                lote_id: item.lote_id || null
            }));

            const response = await fetch(`${ns.state.API_URL}/invoices/quote`, {
                method: 'POST',
                headers: ns.base.getAuthHeaders(true),
                body: JSON.stringify({ usuario_id: usuarioId, items: itemsQuote })
            });
            const json = await response.json();
            if (!response.ok) {
                ns.state.quoteCache = null;
                ns.state.quoteCartKey = null;
                if (breakdown) breakdown.style.display = 'none';
                if (body) body.innerHTML = '';
                ns.cart.actualizarCarritoUI();
                return;
            }

            if (cartKey !== ns.base.getCartKey()) return;

            ns.state.quoteCache = json;
            ns.state.quoteCartKey = cartKey;
            ns.cart.renderQuoteBreakdown();
            ns.cart.actualizarCarritoUI();
        } catch (e) {
            ns.state.quoteCache = null;
            ns.state.quoteCartKey = null;
            if (breakdown) breakdown.style.display = 'none';
            if (body) body.innerHTML = '';
            ns.cart.actualizarCarritoUI();
        }
    }

    async function procesarVenta() {
        if (ns.state.carrito.length === 0) {
            ns.base.showToastPOS('El carrito está vacío.', 'warning');
            return;
        }

        if (!ns.state.sesionCajaId) {
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
            const itemsQuote = ns.state.carrito.map(item => ({
                producto_id: item.id_producto,
                cantidad: item.cantidad,
                lote_id: item.lote_id || null
            }));
            const responseQuote = await fetch(`${ns.state.API_URL}/invoices/quote`, {
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

        const totalVenta = Math.round(parseFloat(quote.total || 0));
        if (!(totalVenta > 0)) {
            ns.base.showToastPOS('No se pudo calcular el total de la venta.', 'error');
            return;
        }

        const metodoPago = getMetodoPagoSeleccionado();
        ns.state.metodoPagoSeleccionado = metodoPago;

        if (metodoPago === 'efectivo') {
            const recibido = ns.base.parseCOPInput(document.getElementById('monto-recibido')?.value);
            const minRec = ns.base.minMontoRecibidoValido(totalVenta);
            if (recibido < minRec) {
                let msg = 'Ingrese al menos ' + ns.base.formatCOP(minRec) + ' en efectivo.';
                if (recibido > 0 && recibido < totalVenta) {
                    msg = 'Faltan ' + ns.base.formatCOP(totalVenta - recibido) + ' para cubrir el total (' + ns.base.formatCOP(totalVenta) + ').';
                } else if (recibido >= totalVenta && recibido < 50 && totalVenta < 50) {
                    msg = 'En efectivo el monto mínimo es $50 (total de esta venta: ' + ns.base.formatCOP(totalVenta) + ').';
                }
                ns.base.showToastPOS(msg, 'warning');
                document.getElementById('monto-recibido')?.focus();
                return;
            }
        }

        if (!confirm('¿Confirmar venta por ' + labelMetodoPago(metodoPago) + ' por ' + ns.base.formatCOP(totalVenta) + '?')) return;

        const itemsVenta = (ns.state.carrito || []).map(item => {
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
            metodo_pago: metodoPago,
            cliente_id: clienteId || null,
            usuario_id: usuarioId,
            sesion_id: ns.state.sesionCajaId
        };
        if (metodoPago === 'efectivo') {
            data.monto_recibido = ns.base.parseCOPInput(document.getElementById('monto-recibido')?.value);
        }
        try {
            const response = await fetch(`${ns.state.API_URL}/invoices`, {
                method: 'POST',
                headers: ns.base.getAuthHeaders(true),
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (response.ok) {
                ns.state.ultimaVenta = {
                    id_factura: result.id_factura,
                    numero_factura: result.numero_factura,
                    total: parseFloat(result.total || totalVenta),
                    cliente_nombre: clienteSelect?.options?.[clienteSelect.selectedIndex]?.text || 'Cliente General',
                    fecha: new Date().toLocaleString(),
                    metodo_pago: metodoPago
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
        ns.state.carrito = [];
        localStorage.removeItem('pos_carrito');
        ns.state.quoteCache = null;
        ns.state.quoteCartKey = null;
        ns.cart.actualizarCarritoUI();

        const montoRecibido = document.getElementById('monto-recibido');
        const textoCambio = document.getElementById('texto-cambio');
        if (montoRecibido) montoRecibido.value = '';
        if (textoCambio) textoCambio.innerText = ns.base.formatCOP(0);
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
