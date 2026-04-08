/**
 * caja.js
 * Gestiona la apertura y cierre de caja en el frontend.
 * Se integra automáticamente en el layout del admin.
 */

const CAJA_API_STATUS = '/proyecto_final/backend/box/status';
const CAJA_API_OPEN = '/proyecto_final/backend/box/open';
const CAJA_API_CLOSE = '/proyecto_final/backend/box/close';

// Estado local de la caja
window.cajaSesion = null;

function showCajaToast(message, type = 'info') {
    let el = document.getElementById('admin-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'admin-toast';
        document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.remove('toast--success', 'toast--error', 'toast--warning', 'toast--info');
    el.classList.add(type === 'success' ? 'toast--success' : type === 'error' ? 'toast--error' : type === 'warning' ? 'toast--warning' : 'toast--info');
    el.style.display = 'block';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// HTML de los modales
const MODAL_APERTURA_HTML = `
<div id="modalAperturaCaja" class="modal">
    <div class="modal-content max-w-400 m-0">
        <div class="modal-header">
            <h2>Apertura de Caja</h2>
        </div>
        <div class="modal-body">
            <p class="caja-modal-hint">No hay una sesión de caja activa. Para comenzar a operar, por favor ingrese el monto base.</p>
            <div class="form-group">
                <label for="montoApertura" class="fw-bold">Monto Inicial (COP):</label>
                <input type="number" id="montoApertura" class="form-control caja-modal-input" value="0" min="0">
            </div>
            <div id="errorApertura" class="caja-modal-error hidden"></div>
            <button onclick="confirmarApertura()" class="btn-primary w-full caja-modal-btn">Abrir Caja</button>
        </div>
    </div>
</div>
`;

const MODAL_CIERRE_HTML = `
<div id="modalCierreCaja" class="modal">
    <div class="modal-content max-w-500 m-0">
        <div class="modal-header">
            <h2>Cierre de Caja</h2>
            <span class="close-modal modal-close-lg" onclick="cerrarModalCierre()">&times;</span>
        </div>
        <div class="modal-body">
            <div id="loadingResumen" class="caja-loading">
                <div class="spinner"></div>
                Calculando resumen de ventas...
            </div>
            <div id="contentResumen" class="hidden">
                <div class="alert alert-info caja-alert-info">
                    <strong class="caja-alert-title">Resumen del Sistema:</strong>
                    <div class="caja-alert-row">
                        <span>Ventas Totales:</span>
                        <span id="sysTotalVentas" class="fw-bold">0</span>
                    </div>
                    <div class="caja-alert-meta">
                        <span>(Efectivo: <span id="sysEfectivo">0</span>)</span>
                        <span>(Otros: <span id="sysOtros">0</span>)</span>
                    </div>
                </div>

                <div class="form-group">
                    <label for="montoCierre" class="fw-bold">Total Efectivo en Caja (Arqueo):</label>
                    <input type="number" id="montoCierre" class="form-control caja-modal-input caja-modal-input--danger" min="0" placeholder="Ingrese el total contado">
                    <small class="caja-hint">Ingrese la suma total de dinero físico (Billetes + Monedas).</small>
                </div>

                <div id="errorCierre" class="caja-modal-error caja-modal-error--box hidden"></div>

                <div class="modal-actions caja-modal-actions">
                    <button onclick="cerrarModalCierre()" class="btn-secondary">Cancelar</button>
                    <button onclick="confirmarCierre()" class="btn-primary btn-danger">Cerrar Caja Definitivamente</button>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// Inyectar modales al DOM
function inyectarModalesCaja() {
    if (!document.getElementById('modalAperturaCaja')) {
        document.body.insertAdjacentHTML('beforeend', MODAL_APERTURA_HTML);
        document.body.insertAdjacentHTML('beforeend', MODAL_CIERRE_HTML);
    }
}

function getUsuarioIdCaja() {
    const usuarioStr = localStorage.getItem('usuario_datos');
    if (usuarioStr) {
        try {
            const usuario = JSON.parse(usuarioStr);
            const id = usuario?.id_usuario;
            if (id !== undefined && id !== null && String(id).trim() !== '') return String(id);
        } catch (_) { }
    }

    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId !== undefined && usuarioId !== null && String(usuarioId).trim() !== '') return String(usuarioId);
    return null;
}

// Verificar estado de la caja
async function verificarEstadoCaja() {
    const usuarioId = getUsuarioIdCaja();
    if (!usuarioId) return; // No logueado

    try {
        const res = await fetch(`${CAJA_API_STATUS}?usuario_id=${usuarioId}`);
        const data = await res.json();

        if (data && data.id_sesion) {
            // Caja Abierta
            window.cajaSesion = data;
            actualizarBotonCaja(true);
        } else {
            // Caja Cerrada -> Mostrar Modal Apertura
            window.cajaSesion = null;
            actualizarBotonCaja(false);
            
            // Si estamos en login, no mostrar. Si estamos en dashboard u otra interna, mostrar.
            if (!window.location.pathname.includes('login.html')) {
                mostrarModalApertura();
            }
        }
    } catch (e) {
        console.error("Error verificando caja:", e);
    }
}

function actualizarBotonCaja(abierta) {
    const btnCaja = document.getElementById('btnCajaAccion');
    if (btnCaja) {
        if (abierta) {
            btnCaja.innerHTML = `
                <div class="nav-icon">🔒</div>
                <span>Cerrar Caja</span>
            `;
            btnCaja.onclick = (e) => { e.preventDefault(); mostrarModalCierre(); };
            btnCaja.classList.remove('disabled');
        } else {
            btnCaja.innerHTML = `
                <div class="nav-icon">🔓</div>
                <span>Abrir Caja</span>
            `;
            btnCaja.onclick = (e) => { e.preventDefault(); mostrarModalApertura(); };
        }
    }
}

// --- Apertura ---
function mostrarModalApertura() {
    inyectarModalesCaja(); // Asegurar inyección
    const modal = document.getElementById('modalAperturaCaja');
    if (modal) {
        modal.style.display = 'flex';
        // Focus con pequeño delay para asegurar visibilidad
        setTimeout(() => {
            const input = document.getElementById('montoApertura');
            if(input) input.focus();
        }, 100);
    }
}

async function confirmarApertura() {
    const monto = document.getElementById('montoApertura').value;
    const usuarioId = getUsuarioIdCaja();
    if (!usuarioId) {
        mostrarError('errorApertura', 'Sesión no válida. Inicie sesión nuevamente.');
        return;
    }

    if (monto === '' || monto < 0) {
        mostrarError('errorApertura', 'Por favor, ingrese un monto inicial válido (mayor o igual a 0).');
        return;
    }

    try {
        const res = await fetch(CAJA_API_OPEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: usuarioId,
                monto_apertura: monto
            })
        });
        const data = await res.json();

        if (res.ok) {
            document.getElementById('modalAperturaCaja').style.display = 'none';
            // Recargar estado
            showCajaToast('Caja abierta exitosamente. Ya puede realizar ventas.', 'success');
            verificarEstadoCaja();
        } else {
            mostrarError('errorApertura', data.message || 'Error al abrir caja');
        }
    } catch (e) {
        mostrarError('errorApertura', 'Error de conexión con el servidor.');
        console.error(e);
    }
}

// --- Cierre ---
async function mostrarModalCierre() {
    inyectarModalesCaja();
    const modal = document.getElementById('modalCierreCaja');
    if (!modal) return;
    
    modal.style.display = 'flex';
    document.getElementById('contentResumen').style.display = 'none';
    document.getElementById('loadingResumen').style.display = 'block';
    document.getElementById('errorCierre').style.display = 'none';
    document.getElementById('montoCierre').value = '';

    // Obtener datos actualizados de la sesión
    const usuarioId = getUsuarioIdCaja();
    if (!usuarioId) {
        showCajaToast('Sesión no válida. Inicie sesión nuevamente.', 'error');
        modal.style.display = 'none';
        return;
    }
    try {
        const res = await fetch(`${CAJA_API_STATUS}?usuario_id=${usuarioId}`);
        const data = await res.json();
        
        if (data && data.id_sesion) {
            cajaSesion = data; // Actualizar local
            
            // Llenar datos UI
            document.getElementById('sysTotalVentas').textContent = formatCurrency(data.total_ventas);
            document.getElementById('sysEfectivo').textContent = formatCurrency(data.total_efectivo);
            
            const otros = parseFloat(data.total_tarjeta || 0) + parseFloat(data.total_transferencia || 0) + parseFloat(data.total_otros || 0);
            document.getElementById('sysOtros').textContent = formatCurrency(otros);
            
            document.getElementById('loadingResumen').style.display = 'none';
            document.getElementById('contentResumen').style.display = 'block';
            setTimeout(() => document.getElementById('montoCierre').focus(), 100);
        } else {
            showCajaToast('No se encontró una sesión activa para cerrar.', 'warning');
            modal.style.display = 'none';
            window.location.reload();
        }
    } catch (e) {
        console.error(e);
        showCajaToast('Error obteniendo datos de caja.', 'error');
        modal.style.display = 'none';
    }
}

function cerrarModalCierre() {
    const modal = document.getElementById('modalCierreCaja');
    if(modal) modal.style.display = 'none';
}

async function confirmarCierre() {
    const montoCierre = document.getElementById('montoCierre').value;
    
    if (montoCierre === '' || montoCierre < 0) {
        mostrarError('errorCierre', 'Debe ingresar el monto total contado en caja.');
        return;
    }

    if (!confirm("¿Está seguro de cerrar la caja?\nEsta acción finalizará su turno y no se puede deshacer.")) return;

    try {
        const res = await fetch(CAJA_API_CLOSE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_sesion: cajaSesion.id_sesion,
                monto_cierre: montoCierre
            })
        });

        const data = await res.json();

        if (res.ok) {
            cerrarModalCierre();
            let msg = `Caja cerrada correctamente.\n\n`;
            msg += `Sistema: ${formatCurrency(data.resumen.sistema_total)}\n`;
            msg += `Contado: ${formatCurrency(data.resumen.contado_cajero)}\n`;
            msg += `Diferencia: ${formatCurrency(data.resumen.diferencia_calculada)}\n`;
            
            if(data.resumen.diferencia_calculada < 0) msg += "\n⚠️ Hay un faltante de dinero.";
            else if(data.resumen.diferencia_calculada > 0) msg += "\n⚠️ Hay un sobrante de dinero.";
            else msg += "\n✅ Cuadre perfecto.";
            showCajaToast(msg.replace(/\n/g, ' | '), data.resumen.diferencia_calculada === 0 ? 'success' : 'warning');
            
            window.cajaSesion = null;
            actualizarBotonCaja(false);
            window.location.reload(); // Recargar para forzar nueva apertura
        } else {
            mostrarError('errorCierre', data.message || 'Error al cerrar caja');
        }

    } catch (e) {
        mostrarError('errorCierre', 'Error de conexión');
        console.error(e);
    }
}

function mostrarError(id, msg) {
    const el = document.getElementById(id);
    if(el) {
        el.textContent = msg;
        el.style.display = 'block';
    }
}

function formatCurrency(val) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
}

// Inicialización automática
function initCaja() {
    inyectarModalesCaja();
    // Pequeño delay para asegurar que auth cargó usuario
    setTimeout(verificarEstadoCaja, 800);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCaja);
} else {
    initCaja();
}

// Exponer globalmente
window.mostrarCierreCaja = mostrarModalCierre;
window.mostrarAperturaCaja = mostrarModalApertura;
window.confirmarApertura = confirmarApertura;
window.confirmarCierre = confirmarCierre;
window.cerrarModalCierre = cerrarModalCierre;
