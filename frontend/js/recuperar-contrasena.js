// recuperar-contrasena.js — Flujo de recuperación de contraseña en dos pasos:
// 1) Solicitar código por correo  2) Verificar código y establecer nueva contraseña

/**
 * Detecta la ruta base del proyecto según la URL actual.
 * Ejemplo: /triunfo-go/frontend/... → /triunfo-go
 */
function getAppBaseFromPathname(pathname) {
    const p = String(pathname || '/');
    const idxFrontend = p.indexOf('/frontend/');
    if (idxFrontend >= 0) return p.slice(0, idxFrontend) || '';
    const idxBackend = p.indexOf('/backend/');
    if (idxBackend >= 0) return p.slice(0, idxBackend) || '';
    return '';
}

// URL base de la API (auto-detect al clonar en otra carpeta)
const URL_API = (window.location.origin || '') + (getAppBaseFromPathname(window.location.pathname) + '/backend/index.php');

// Correo usado en el paso 1; se reutiliza en el paso 2 y al reenviar código
let emailGuardado = '';

document.addEventListener('DOMContentLoaded', () => {
    const formSolicitar = document.getElementById('formSolicitarCodigo');
    const formRestablecer = document.getElementById('formRestablecer');
    const btnReenviar = document.getElementById('btnReenviarCodigo');
    const codigoInput = document.getElementById('codigoVerificacion');

    if (formSolicitar) formSolicitar.addEventListener('submit', solicitarCodigo);
    if (formRestablecer) formRestablecer.addEventListener('submit', restablecerContrasena);
    if (btnReenviar) btnReenviar.addEventListener('click', reenviarCodigo);

    // Solo permitir dígitos y máximo 6 caracteres en el campo código
    if (codigoInput) {
        codigoInput.addEventListener('input', () => {
            codigoInput.value = (codigoInput.value || '').replace(/\D/g, '').slice(0, 6);
        });
    }
});

/**
 * Paso 1: envía el correo al backend para que genere y envíe el código.
 */
async function solicitarCodigo(evento) {
    evento.preventDefault();
    ocultarMensajes(1);

    const emailInput = document.getElementById('emailRecuperacion');
    const email = emailInput.value.trim().toLowerCase();
    const btn = document.getElementById('btnEnviarCodigo');

    if (!email) {
        mostrarAlerta(1, 'Ingrese su correo electrónico.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
        const respuesta = await fetch(`${URL_API}/password-reset/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            emailGuardado = email;
            let msg = datos.message || 'Código enviado. Revisa tu correo.';
            if (datos.dev_code) {
                msg = `Código de verificación: ${datos.dev_code}`;
                if (datos.dev_hint) {
                    msg += '. ' + datos.dev_hint;
                }
            } else if (datos.dev_hint) {
                msg += ' (' + datos.dev_hint + ')';
            }
            mostrarExito(1, msg);
            irAlPaso2(email, datos.dev_code || '');
        } else {
            mostrarAlerta(1, datos.message || 'No se pudo enviar el código.');
        }
    } catch (error) {
        console.error(error);
        mostrarAlerta(1, 'No se pudo conectar con el servidor.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Enviar código';
    }
}

/**
 * Vuelve a solicitar un código nuevo al mismo correo del paso 1.
 */
async function reenviarCodigo() {
    if (!emailGuardado) return;
    ocultarMensajes(2);

    const btn = document.getElementById('btnReenviarCodigo');
    btn.disabled = true;
    btn.textContent = 'Reenviando...';

    try {
        const respuesta = await fetch(`${URL_API}/password-reset/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailGuardado })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            let msg = 'Se envió un nuevo código.';
            if (datos.dev_code) {
                msg = `Nuevo código: ${datos.dev_code}`;
            }
            mostrarExito(2, msg);
            if (datos.dev_code) {
                const codigoInput = document.getElementById('codigoVerificacion');
                if (codigoInput) codigoInput.value = datos.dev_code;
            }
        } else {
            mostrarAlerta(2, datos.message || 'No se pudo reenviar el código.');
        }
    } catch (error) {
        mostrarAlerta(2, 'No se pudo conectar con el servidor.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Reenviar código';
    }
}

/**
 * Paso 2: verifica el código y actualiza la contraseña en el backend.
 */
async function restablecerContrasena(evento) {
    evento.preventDefault();
    ocultarMensajes(2);

    const codigo = document.getElementById('codigoVerificacion').value.trim();
    const contrasena = document.getElementById('nuevaContrasena').value;
    const confirmacion = document.getElementById('confirmarContrasena').value;
    const btn = document.getElementById('btnRestablecer');

    if (codigo.length !== 6) {
        mostrarAlerta(2, 'El código debe tener 6 dígitos.');
        return;
    }

    if (contrasena.length < 6) {
        mostrarAlerta(2, 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    if (contrasena !== confirmacion) {
        mostrarAlerta(2, 'Las contraseñas no coinciden.');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Actualizando...';

    try {
        const respuesta = await fetch(`${URL_API}/password-reset/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailGuardado,
                codigo,
                contrasena,
                contrasena_confirmacion: confirmacion
            })
        });

        const datos = await respuesta.json();

        if (respuesta.ok) {
            mostrarExito(2, datos.message || 'Contraseña actualizada.');
            // Breve pausa para que el usuario lea el mensaje antes de ir al login
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2500);
        } else {
            mostrarAlerta(2, datos.message || 'No se pudo restablecer la contraseña.');
        }
    } catch (error) {
        mostrarAlerta(2, 'No se pudo conectar con el servidor.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Cambiar contraseña';
    }
}

/**
 * Muestra el formulario del paso 2 y actualiza textos e indicador visual.
 */
function irAlPaso2(email, codigoPrefill = '') {
    document.getElementById('emailConfirmacion').value = email;
    document.getElementById('tituloPaso').textContent = 'Verificar código';
    document.getElementById('subtituloPaso').textContent = 'Ingresa el código recibido y tu nueva contraseña';

    document.querySelectorAll('.paso-form').forEach(f => f.classList.remove('activo'));
    document.getElementById('formRestablecer').classList.add('activo');

    document.querySelectorAll('.paso-indicador .paso').forEach(p => {
        p.classList.toggle('activo', Number(p.dataset.paso) <= 2);
        p.classList.toggle('completado', Number(p.dataset.paso) === 1);
    });

    const codigoInput = document.getElementById('codigoVerificacion');
    if (codigoInput && codigoPrefill) {
        codigoInput.value = String(codigoPrefill).replace(/\D/g, '').slice(0, 6);
    }

    setTimeout(() => (codigoInput || document.getElementById('codigoVerificacion'))?.focus(), 300);
}

/** Muestra mensaje de error en el paso indicado (1 o 2). */
function mostrarAlerta(paso, mensaje) {
    const el = document.getElementById(`mensajeAlerta${paso}`);
    if (el) {
        el.textContent = mensaje;
        el.style.display = 'block';
    }
}

/** Muestra mensaje de éxito en el paso indicado (1 o 2). */
function mostrarExito(paso, mensaje) {
    const el = document.getElementById(`mensajeExito${paso}`);
    if (el) {
        el.textContent = mensaje;
        el.style.display = 'block';
    }
}

/** Oculta alertas y mensajes de éxito del paso indicado. */
function ocultarMensajes(paso) {
    const alerta = document.getElementById(`mensajeAlerta${paso}`);
    const exito = document.getElementById(`mensajeExito${paso}`);
    if (alerta) alerta.style.display = 'none';
    if (exito) exito.style.display = 'none';
}
