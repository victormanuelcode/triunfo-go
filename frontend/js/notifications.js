const NOTIF_POLL_MS = 60000;
let notifTimer = null;
let notifCache = [];

function getApiBase() {
  return `${window.location.origin}/proyecto_final/backend`;
}

function notifHeaders() {
  const token = localStorage.getItem('token');
  const h = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function fetchNotifications(unreadOnly = true) {
  try {
    const resp = await fetch(`${getApiBase()}/notifications?only_unread=${unreadOnly ? '1' : '0'}`, { headers: notifHeaders() });
    const json = await resp.json();
    if (!resp.ok) throw new Error(json.message || 'Error notific.');
    notifCache = Array.isArray(json) ? json : [];
    renderNotifUI();
  } catch (e) {
    console.warn('Notif fetch fail', e);
  }
}

function renderNotifUI() {
  const badge = document.querySelector('.notif-icon .notif-badge');
  if (badge) {
    const count = notifCache.filter(n => n.estado === 'nuevo').length;
    badge.style.display = count > 0 ? 'block' : 'none';
    badge.textContent = String(count);
  }
  const list = document.getElementById('notif-list');
  if (list) {
    list.innerHTML = '';
    if (notifCache.length === 0) {
      list.innerHTML = '<div style="padding:10px 12px; color:#6b7280; text-align:center;">Sin notificaciones</div>';
      return;
    }
    notifCache.forEach(n => {
      const wrap = document.createElement('div');
      const color = n.tipo === 'alert' ? '#991b1b' : (n.tipo === 'warning' ? '#92400e' : '#111827');
      wrap.style.cssText = 'display:flex; gap:8px; align-items:flex-start; padding:10px 12px; border-bottom:1px solid #f3f4f6;';
      wrap.innerHTML = `
        <div style="width:28px;height:28px;border-radius:8px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;flex:0 0 28px;color:${color}">!</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:${color};">${n.titulo}</div>
          <div style="font-size:12px;color:#4b5563;word-break:break-word;">${n.mensaje}</div>
          <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${new Date(n.creado_en).toLocaleString()}</div>
        </div>
        ${n.estado === 'nuevo' ? '<button class="btn-qty" style="padding:6px 8px;">Leer</button>' : ''}
      `;
      const btn = wrap.querySelector('button');
      if (btn) {
        btn.addEventListener('click', () => markReadNotification(n.id));
      }
      list.appendChild(wrap);
    });
  }
}

async function markReadNotification(id) {
  try {
    const resp = await fetch(`${getApiBase()}/notifications/${id}/read`, { method: 'PATCH', headers: notifHeaders() });
    if (resp.ok) {
      notifCache = notifCache.map(n => n.id === id ? { ...n, estado: 'leido' } : n);
      renderNotifUI();
    }
  } catch (_) {}
}

function bindNotifUI() {
  const icon = document.querySelector('.notif-icon');
  const panel = document.getElementById('notif-panel');
  const markAll = document.getElementById('notif-markall');
  if (icon && panel) {
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => { panel.style.display = 'none'; });
  }
  if (markAll) {
    markAll.addEventListener('click', async () => {
      const unread = notifCache.filter(n => n.estado === 'nuevo').map(n => n.id);
      for (const id of unread) {
        await markReadNotification(id);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindNotifUI();
  fetchNotifications(true);
  notifTimer = setInterval(() => fetchNotifications(true), NOTIF_POLL_MS);
});

