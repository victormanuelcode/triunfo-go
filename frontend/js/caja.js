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

// HTML de los modales
const MODAL_APERTURA_HTML = `
<div id="modalAperturaCaja" class="modal" style="display:none; align-items:center; justify-content:center; background-color: rgba(0,0,0,0.8);">
    <div class="modal-content" style="max-width: 400px; margin: 0;">
        <div class="modal-header">
            <h2>Apertura de Caja</h2>
        </div>
        <div class="modal-body">
            <p style="margin-bottom:15px; color:#555;">No hay una sesión de caja activa. Para comenzar a operar, por favor ingrese el monto base.</p>
            <div class="form-group">
                <label for="montoApertura" style="font-weight:bold;">Monto Inicial (COP):</label>
                <input type="number" id="montoApertura" class="form-control" value="0" min="0" style="font-size:1.5em; padding:10px; text-align:center; border:2px solid #2E7D32; border-radius:8px;">
            </div>
            <div id="errorApertura" style="color:#c0392b; margin-bottom:10px; display:none; text-align:center; font-weight:bold;"></div>
            <button onclick="confirmarApertura()" class="btn-primary" style="width:100%; padding:12px; font-size:1.1em; margin-top:10px;">Abrir Caja</button>
        </div>
    </div>
</div>
`;

const MODAL_CIERRE_HTML = `
<div id="modalCierreCaja" class="modal" style="display:none; align-items:center; justify-content:center; background-color: rgba(0,0,0,0.8);">
    <div class="modal-content" style="max-width: 500px; margin: 0;">
        <div class="modal-header">
            <h2>Cierre de Caja</h2>
            <span class="close-modal" onclick="cerrarModalCierre()" style="font-size:2rem;">&times;</span>
        </div>
        <div class="modal-body">
            <div id="loadingResumen" style="text-align:center; padding:20px; color:#666;">
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                Calculando resumen de ventas...
            </div>
            <div id="contentResumen" style="display:none;">
                <div class="alert alert-info" style="background:#e3f2fd; color:#0d47a1; padding:15px; border-radius:8px; margin-bottom:20px; border-left: 5px solid #2196F3;">
                    <strong style="display:block; margin-bottom:5px;">Resumen del Sistema:</strong>
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span>Ventas Totales:</span>
                        <span id="sysTotalVentas" style="font-weight:bold;">0</span>
                    </div>
                    <div style="font-size:0.9em; color:#555; display:flex; justify-content:space-between;">
                        <span>(Efectivo: <span id="sysEfectivo">0</span>)</span>
                        <span>(Otros: <span id="sysOtros">0</span>)</span>
                    </div>
                </div>

                <div class="form-group">
                    <label for="montoCierre" style="font-weight:bold; color:#2c3e50;">Total Efectivo en Caja (Arqueo):</label>
                    <input type="number" id="montoCierre" class="form-control" min="0" placeholder="Ingrese el total contado" style="font-size:1.5em; padding:10px; border:2px solid #e74c3c; border-radius:8px; text-align:right;">
                    <small style="display:block; margin-top:5px; color:#7f8c8d;">Ingrese la suma total de dinero físico (Billetes + Monedas).</small>
                </div>

                <div id="errorCierre" style="color:#c0392b; margin-bottom:10px; display:none; text-align:center; font-weight:bold; background: #fadbd8; padding: 10px; border-radius: 4px;"></div>

                <div class="modal-actions" style="display:flex; justify-content:flex-end; gap:10px; margin-top:25px; border-top: 1px solid #eee; padding-top: 20px;">
                    <button onclick="cerrarModalCierre()" class="btn-secondary">Cancelar</button>
                    <button onclick="confirmarCierre()" class="btn-primary" style="background-color:#c0392b;">Cerrar Caja Definitivamente</button>
                </div>
            </div>
        </div>
    </div>
</div>
<style>
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>
`;

// Inyectar modales al DOM
function inyectarModalesCaja() {
    if (!document.getElementById('modalAperturaCaja')) {
        document.body.insertAdjacentHTML('beforeend', MODAL_APERTURA_HTML);
        document.body.insertAdjacentHTML('beforeend', MODAL_CIERRE_HTML);
    }
}

// Verificar estado de la caja
async function verificarEstadoCaja() {
    const usuarioStr = localStorage.getItem('usuario_datos');
    if (!usuarioStr) return; // No logueado
    
    const usuario = JSON.parse(usuarioStr);

    try {
        const res = await fetch(`${CAJA_API_STATUS}?usuario_id=${usuario.id_usuario}`);
        const data = await res.json();

        if (data && data.id_sesion) {
            // Caja Abierta
            window.cajaSesion = data;
            console.log("Sesión de caja activa:", window.cajaSesion.id_sesion);
            actualizarBotonCaja(true);
        } else {
            // Caja Cerrada -> Mostrar Modal Apertura
            window.cajaSesion = null;
            console.log("No hay sesión de caja activa.");
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
    const usuario = JSON.parse(localStorage.getItem('usuario_datos'));

    if (monto === '' || monto < 0) {
        mostrarError('errorApertura', 'Por favor, ingrese un monto inicial válido (mayor o igual a 0).');
        return;
    }

    try {
        const res = await fetch(CAJA_API_OPEN, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario_id: usuario.id_usuario,
                monto_apertura: monto
            })
        });
        const data = await res.json();

        if (res.ok) {
            document.getElementById('modalAperturaCaja').style.display = 'none';
            // Recargar estado
            alert('¡Caja abierta exitosamente! Ya puede realizar ventas.');
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
    const usuario = JSON.parse(localStorage.getItem('usuario_datos'));
    try {
        const res = await fetch(`${CAJA_API_STATUS}?usuario_id=${usuario.id_usuario}`);
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
            alert("No se encontró una sesión activa para cerrar.");
            modal.style.display = 'none';
            window.location.reload();
        }
    } catch (e) {
        console.error(e);
        alert("Error obteniendo datos de caja.");
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

            alert(msg);
            
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
