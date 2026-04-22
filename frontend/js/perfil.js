function showAdminToast(message, type = 'info') {
  const el = document.getElementById('admin-toast');
  if (!el) return alert(message);
  el.textContent = message;
  el.classList.remove('toast--success', 'toast--error', 'toast--warning', 'toast--info');
  el.classList.add(type === 'success' ? 'toast--success' : type === 'error' ? 'toast--error' : type === 'warning' ? 'toast--warning' : 'toast--info');
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function apiBase() {
  return (window.TRIUNFOGO?.API_BASE || `${(window.location.origin || '')}${(window.TRIUNFOGO?.APP_BASE || '')}/backend/index.php`);
}

function authHeaders() {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

function normalizePerfilLayout() {
  const rol = String(localStorage.getItem('usuario_rol') || '').trim();
  // Admin y cajero usan layout con sidebar/topbar (layout_route → layout_admin / layout_cajero).
  if (rol === '1' || rol === '2') return;
  document.body.classList.add('perfil-standalone');
  const root = document.querySelector('.layout-root');
  if (root) root.classList.remove('layout-root');
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.remove();
  const topbar = document.querySelector('.topbar');
  if (topbar) topbar.remove();
}

function setStoredAvatarUrl(url) {
  try {
    const raw = localStorage.getItem('usuario_datos');
    const u = raw ? JSON.parse(raw) : {};
    u.avatar_url = url || '';
    localStorage.setItem('usuario_datos', JSON.stringify(u));
  } catch (_) {}
  if (url) localStorage.setItem('usuario_avatar_url', url);
  else localStorage.removeItem('usuario_avatar_url');
}

function applyAvatarToLayout(url) {
  const els = [
    document.getElementById('adminAvatar'),
    document.getElementById('adminAvatarTop')
  ];
  els.forEach(el => {
    if (!el) return;
    if (!url) {
      el.classList.remove('has-image');
      el.style.removeProperty('background-image');
      return;
    }
    el.classList.add('has-image');
    el.style.backgroundImage = `url("${url}")`;
  });
}

async function cargarPerfil() {
  try {
    const resp = await fetch(`${apiBase()}/profile`, { headers: authHeaders() });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.message || 'No se pudo leer el perfil');
    document.getElementById('pf-email').value = json.email || '';
    document.getElementById('pf-telefono').value = json.telefono || '';
    document.getElementById('pf-avatar').value = json.avatar_url || '';
    let pref = {};
    try { pref = json.preferencias ? JSON.parse(json.preferencias) : {}; } catch (_) { pref = {}; }
    document.getElementById('pf-pref-collapse').checked = !!pref.sidebarCollapsed;
    const prev = document.getElementById('pf-avatar-preview');
    if (prev) prev.src = json.avatar_url || '';
    setStoredAvatarUrl(json.avatar_url || '');
    applyAvatarToLayout(json.avatar_url || '');

    const rol = String(localStorage.getItem('usuario_rol') || '');
    const restr = document.getElementById('pf-restriccion');
    if (rol !== '1' && restr) restr.style.display = 'block';
  } catch (e) {
    showAdminToast(e.message, 'error');
  }
}

async function guardarPerfil(e) {
  e.preventDefault();
  const email = document.getElementById('pf-email').value.trim();
  const telefono = document.getElementById('pf-telefono').value.trim();
  const avatar = document.getElementById('pf-avatar').value.trim();
  const pref = {
    sidebarCollapsed: document.getElementById('pf-pref-collapse').checked
  };
  try {
    const resp = await fetch(`${apiBase()}/profile`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        email,
        telefono,
        avatar_url: avatar,
        preferencias: pref
      })
    });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.message || 'No se pudo actualizar el perfil');
    showAdminToast('Perfil actualizado', 'success');
    try {
      const stored = JSON.parse(localStorage.getItem('usuario_datos') || '{}');
      stored.email = email;
      localStorage.setItem('usuario_datos', JSON.stringify(stored));
      localStorage.setItem('usuario_email', email);
    } catch (_) {}
    if (pref.sidebarCollapsed !== undefined) {
      const r = String(localStorage.getItem('usuario_rol') || '').trim();
      const collapseKey = r === '2' ? 'cashier_layout_collapsed' : 'admin_layout_collapsed';
      localStorage.setItem(collapseKey, pref.sidebarCollapsed ? '1' : '0');
    }
  } catch (e) {
    showAdminToast(e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  normalizePerfilLayout();
  setTimeout(normalizePerfilLayout, 350);
  cargarPerfil();
  document.getElementById('perfilForm').addEventListener('submit', guardarPerfil);
  const btn = document.getElementById('pf-avatar-btn');
  const file = document.getElementById('pf-avatar-file');
  const clearBtn = document.getElementById('pf-avatar-clear');
  if (btn && file) {
    btn.addEventListener('click', () => file.click());
    file.addEventListener('change', async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      const urlPrev = URL.createObjectURL(f);
      const prev = document.getElementById('pf-avatar-preview');
      if (prev) prev.src = urlPrev;
      const fd = new FormData();
      fd.append('avatar', f);
      try {
        const resp = await fetch(`${apiBase()}/profile/avatar`, { method: 'POST', headers: { 'Authorization': authHeaders()['Authorization'] || '' }, body: fd });
        const json = await resp.json();
        if (!resp.ok) throw new Error(json.message || 'No se pudo subir el avatar');
        document.getElementById('pf-avatar').value = json.avatar_url || '';
        setStoredAvatarUrl(json.avatar_url || '');
        applyAvatarToLayout(json.avatar_url || '');
        showAdminToast('Avatar actualizado', 'success');
      } catch (e) {
        showAdminToast(e.message, 'error');
      }
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      document.getElementById('pf-avatar').value = '';
      const prev = document.getElementById('pf-avatar-preview');
      if (prev) prev.src = '';
    });
  }
});
