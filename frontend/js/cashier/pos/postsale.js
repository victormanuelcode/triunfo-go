(function () {
    const ns = window.CashierPOS = window.CashierPOS || {};
    const state = ns.state;

    function mostrarModalExito() {
        if (!state.ultimaVenta) return;
        document.getElementById('success-invoice-number').innerText = state.ultimaVenta.numero_factura;
        document.getElementById('success-client').innerText = state.ultimaVenta.cliente_nombre;
        document.getElementById('success-total').innerText = '$' + state.ultimaVenta.total.toLocaleString('es-CO');
        const modal = document.getElementById('modal-exito-venta');
        if (modal) modal.style.display = 'flex';
    }

    function nuevaVenta() {
        const modal = document.getElementById('modal-exito-venta');
        if (modal) modal.style.display = 'none';
        state.ultimaVenta = null;
        document.getElementById('buscador')?.focus();
    }

    /** Misma vista imprimible que admin: `views/admin/factura.html` + `factura.js` */
    function urlFacturaAdmin(idFactura) {
        return `../admin/factura.html?id=${idFactura}`;
    }

    function imprimirTicketDirecto() {
        if (state.ultimaVenta && state.ultimaVenta.id_factura) {
            window.open(urlFacturaAdmin(state.ultimaVenta.id_factura), '_blank');
        }
    }

    function descargarPDF() {
        imprimirTicketDirecto();
    }

    function descargarExcel() {
        if (!state.ultimaVenta) return;
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Factura,Cliente,Fecha,Total,MetodoPago\n"
            + `${state.ultimaVenta.numero_factura},${state.ultimaVenta.cliente_nombre},${state.ultimaVenta.fecha},${state.ultimaVenta.total},${state.ultimaVenta.metodo_pago}`;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `venta_${state.ultimaVenta.numero_factura}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function enviarWhatsApp() {
        if (!state.ultimaVenta) return;
        const telefono = prompt('Ingrese el número de WhatsApp del cliente (ej: 573001234567):');
        if (telefono) {
            const mensaje = `Hola! Gracias por tu compra en TRIUNFO GO. Tu factura es ${state.ultimaVenta.numero_factura} por un total de $${state.ultimaVenta.total.toLocaleString('es-CO')}.`;
            const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        }
    }

    function init() {
        window.mostrarModalExito = mostrarModalExito;
        window.nuevaVenta = nuevaVenta;
        window.imprimirTicketDirecto = imprimirTicketDirecto;
        window.descargarPDF = descargarPDF;
        window.descargarExcel = descargarExcel;
        window.enviarWhatsApp = enviarWhatsApp;
    }

    ns.postsale = {
        init,
        mostrarModalExito,
        nuevaVenta,
        imprimirTicketDirecto,
        descargarPDF,
        descargarExcel,
        enviarWhatsApp
    };
})();
