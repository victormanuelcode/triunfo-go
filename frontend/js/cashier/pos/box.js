(function () {
    const ns = window.CashierPOS = window.CashierPOS || {};
    const state = ns.state;

    function setCajaAbiertaUIState(estaAbierta) {
        state.cajaAbiertaUI = !!estaAbierta;
        const banner = document.getElementById('banner-caja-cerrada');
        if (banner) banner.style.display = estaAbierta ? 'none' : 'block';

        const btnCompletar = document.getElementById('btn-completar-venta');
        if (btnCompletar) {
            btnCompletar.disabled = !estaAbierta;
            btnCompletar.style.opacity = estaAbierta ? '1' : '0.6';
            btnCompletar.style.cursor = estaAbierta ? 'pointer' : 'not-allowed';
        }

        document.querySelectorAll('.payment-option').forEach(el => {
            el.style.pointerEvents = estaAbierta ? 'auto' : 'none';
            el.style.opacity = estaAbierta ? '1' : '0.6';
        });

        const montoRecibido = document.getElementById('monto-recibido');
        if (montoRecibido) {
            montoRecibido.disabled = !estaAbierta;
            if (!estaAbierta) montoRecibido.value = '';
        }
        if (!estaAbierta) {
            const cambio = document.getElementById('texto-cambio');
            if (cambio) cambio.innerText = '$0';
        }
    }

    async function verificarEstadoCaja() {
        const usuarioId = localStorage.getItem('usuario_id');
        if (!usuarioId) return;

        try {
            const response = await fetch(`${state.API_URL}/box/status?usuario_id=${usuarioId}`, {
                headers: ns.base.getAuthHeaders(false)
            });
            const sesion = await response.json();

            if (sesion && sesion.estado === 'abierta') {
                state.sesionCajaId = sesion.id_sesion;
                localStorage.setItem('sesion_actual', JSON.stringify(sesion));
                actualizarBotonCaja(true);
                setCajaAbiertaUIState(true);
                ns.cart.scheduleQuoteRefresh();
            } else {
                state.sesionCajaId = null;
                actualizarBotonCaja(false);
                state.quoteCache = null;
                state.quoteCartKey = null;
                ns.cart.renderQuoteBreakdown();
                setCajaAbiertaUIState(false);
            }
        } catch (error) {
            console.error('Error verificando caja:', error);
            setCajaAbiertaUIState(false);
        }
    }

    function actualizarBotonCaja(estaAbierta) {
        const btnCaja = document.getElementById('btn-gestion-caja');
        if (!btnCaja) return;
        if (estaAbierta) {
            btnCaja.innerText = 'Cerrar Caja';
            btnCaja.onclick = mostrarModalCierreCaja;
        } else {
            btnCaja.innerText = 'Abrir Caja';
            btnCaja.onclick = mostrarModalAperturaCaja;
        }
    }

    function mostrarModalAperturaCaja() {
        const modal = document.getElementById('modal-apertura-caja');
        if (modal) modal.style.display = 'flex';
    }

    function cerrarModalApertura() {
        const modal = document.getElementById('modal-apertura-caja');
        if (modal) modal.style.display = 'none';
    }

    async function abrirCaja() {
        const monto = document.getElementById('monto-apertura').value;
        const usuarioId = localStorage.getItem('usuario_id');

        if (monto === '') {
            ns.base.showToastPOS('Ingrese un monto inicial (0 si está vacía).', 'warning');
            return;
        }

        try {
            const response = await fetch(`${state.API_URL}/box/open`, {
                method: 'POST',
                headers: ns.base.getAuthHeaders(true),
                body: JSON.stringify({
                    usuario_id: usuarioId,
                    monto_apertura: monto
                })
            });

            const result = await response.json();
            if (response.ok) {
                ns.base.showToastPOS('Caja abierta correctamente.', 'success');
                cerrarModalApertura();
                verificarEstadoCaja();
            } else {
                ns.base.showToastPOS('Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            ns.base.showToastPOS('Error de conexión al abrir caja.', 'error');
        }
    }

    function mostrarModalCierreCaja() {
        if (!state.sesionCajaId) {
            ns.base.showToastPOS('No hay caja abierta.', 'warning');
            return;
        }

        fetch(`${state.API_URL}/box/status?usuario_id=${localStorage.getItem('usuario_id')}`, {
            headers: ns.base.getAuthHeaders(false)
        })
            .then(res => res.json())
            .then(data => {
                if (!data) return;
                const inicial = parseFloat(data.monto_apertura || 0);
                const ventas = parseFloat(data.total_ventas || 0);
                const efectivo = parseFloat(data.total_efectivo || 0);
                const tarjeta = parseFloat(data.total_tarjeta || 0);
                const transf = parseFloat(data.total_transferencia || 0);
                const esperadoEnCaja = inicial + efectivo;
                const format = (val) => '$' + val.toLocaleString('es-CO', { minimumFractionDigits: 0 });

                document.getElementById('cierre-inicial').innerText = format(inicial);
                document.getElementById('cierre-ventas').innerText = format(ventas);
                document.getElementById('cierre-efectivo').innerText = format(efectivo);
                document.getElementById('cierre-tarjeta').innerText = format(tarjeta);
                document.getElementById('cierre-transferencia').innerText = format(transf);
                document.getElementById('cierre-esperado').innerText = format(esperadoEnCaja);
                document.getElementById('modal-cierre-caja').style.display = 'flex';
            });
    }

    function cerrarModalCierre() {
        const modal = document.getElementById('modal-cierre-caja');
        if (modal) modal.style.display = 'none';
    }

    async function procesarCierreCaja() {
        const montoCierre = document.getElementById('monto-cierre').value;

        if (montoCierre === '') {
            ns.base.showToastPOS('Ingrese el monto real en caja.', 'warning');
            return;
        }

        if (!confirm('¿Seguro que desea cerrar la caja? Esta acción no se puede deshacer.')) return;

        try {
            const response = await fetch(`${state.API_URL}/box/close`, {
                method: 'POST',
                headers: ns.base.getAuthHeaders(true),
                body: JSON.stringify({
                    id_sesion: state.sesionCajaId,
                    monto_cierre: montoCierre
                })
            });

            const result = await response.json();
            if (response.ok) {
                ns.base.showToastPOS('Caja cerrada correctamente. Se cerrará la sesión.', 'success');
                logout();
            } else {
                ns.base.showToastPOS('Error: ' + result.message, 'error');
            }
        } catch (error) {
            console.error(error);
            ns.base.showToastPOS('Error al cerrar caja.', 'error');
        }
    }

    function init() {
        setCajaAbiertaUIState(false);
        verificarEstadoCaja();

        window.mostrarModalAperturaCaja = mostrarModalAperturaCaja;
        window.cerrarModalApertura = cerrarModalApertura;
        window.abrirCaja = abrirCaja;
        window.mostrarModalCierreCaja = mostrarModalCierreCaja;
        window.cerrarModalCierre = cerrarModalCierre;
        window.procesarCierreCaja = procesarCierreCaja;
    }

    ns.box = {
        init,
        setCajaAbiertaUIState,
        verificarEstadoCaja,
        actualizarBotonCaja,
        mostrarModalAperturaCaja,
        cerrarModalApertura,
        abrirCaja,
        mostrarModalCierreCaja,
        cerrarModalCierre,
        procesarCierreCaja
    };
})();
