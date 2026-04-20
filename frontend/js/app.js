const inventoryNS = window.AdminInventory = window.AdminInventory || {};
inventoryNS.state = inventoryNS.state || {
    API_URL: window.location.origin + '/proyecto_final/backend',
    productosAdminGlobal: [],
    productoLotesActualId: null,
    regularizacionCandidates: [],
    detalleLoteTimelineCache: [],
    detalleLoteTimelineFilter: 'todos'
};
const API_URL = inventoryNS.state.API_URL;

document.addEventListener('DOMContentLoaded', () => {
    inventoryNS.products?.setup();
    inventoryNS.units?.setup();
    
    // Configurar modales
    inventoryNS.lots?.setupLotesModals();
    inventoryNS.purchase?.setupCompraProductoModal();
    inventoryNS.regularization?.setupRegularizacionModal();
    
    // Listener global para cerrar modales al hacer click fuera
    window.onclick = function(event) {
        const modalProductos = document.getElementById('productoModal');
        const modalUnidades = document.getElementById('unidadesModal');
        const modalLotes = document.getElementById('lotesModal');
        const modalCrearLote = document.getElementById('crearLoteModal');
        const modalEditarLote = document.getElementById('editarLoteModal');
        const modalDetalleLote = document.getElementById('detalleLoteModal');
        const modalCompra = document.getElementById('compraProductoModal');
        const modalRegularizacion = document.getElementById('regularizacionStockModal');
        const modalRegularizarProducto = document.getElementById('regularizarProductoModal');
        
        if (modalProductos && event.target == modalProductos) {
            modalProductos.style.display = "none";
        }
        if (modalUnidades && event.target == modalUnidades) {
            modalUnidades.style.display = "none";
            inventoryNS.units?.cargarUnidadesSelect();
        }
        if (modalLotes && event.target == modalLotes) {
            modalLotes.style.display = "none";
        }
        if (modalCrearLote && event.target == modalCrearLote) {
            modalCrearLote.style.display = "none";
        }
        if (modalEditarLote && event.target == modalEditarLote) {
            modalEditarLote.style.display = "none";
        }
        if (modalDetalleLote && event.target == modalDetalleLote) {
            modalDetalleLote.style.display = "none";
        }
        if (modalCompra && event.target == modalCompra) {
            modalCompra.style.display = "none";
        }
        if (modalRegularizacion && event.target == modalRegularizacion) {
            modalRegularizacion.style.display = "none";
        }
        if (modalRegularizarProducto && event.target == modalRegularizarProducto) {
            modalRegularizarProducto.style.display = "none";
        }
    };
});
