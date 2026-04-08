const NOTIF_POLL_MS = 60000;
let notifTimer = null;
let notifCache = [];
let notifBound = false;
let notifStarted = false;

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
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.textContent = String(count);
  }
  const list = document.getElementById('notif-list');
  if (list) {
    list.innerHTML = '';
    if (notifCache.length === 0) {
      list.innerHTML = '<div class="notif-empty">Sin notificaciones</div>';
      return;
    }
    notifCache.forEach(n => {
      const wrap = document.createElement('div');
      wrap.className = `notif-item notif-item--${n.tipo || 'info'}`;
      wrap.innerHTML = `
        <div class="notif-item__icon">!</div>
        <div class="notif-item__content">
          <div class="notif-item__title">${n.titulo}</div>
          <div class="notif-item__msg">${n.mensaje}</div>
          <div class="notif-item__date">${new Date(n.creado_en).toLocaleString()}</div>
        </div>
        ${n.estado === 'nuevo' ? '<button class="btn-light notif-read-btn">Leer</button>' : ''}
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
  if (notifBound) return;
  const icon = document.querySelector('.notif-icon');
  const panel = document.getElementById('notif-panel');
  const markAll = document.getElementById('notif-markall');
  if (icon && panel) {
    const closePanel = () => {
      panel.style.display = 'none';
      panel.dataset.open = '0';
    };
    const openPanel = () => {
      panel.style.display = 'block';
      panel.dataset.open = '1';
    };

    closePanel();
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = panel.dataset.open === '1';
      if (open) closePanel();
      else openPanel();
    });
    document.addEventListener('click', closePanel);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePanel();
    });
  }
  if (markAll) {
    markAll.addEventListener('click', async () => {
      const unread = notifCache.filter(n => n.estado === 'nuevo').map(n => n.id);
      for (const id of unread) {
        await markReadNotification(id);
      }
    });
  }
  notifBound = true;
}

function startNotifications() {
  if (notifStarted) return;
  bindNotifUI();
  fetchNotifications(true);
  clearInterval(notifTimer);
  notifTimer = setInterval(() => fetchNotifications(true), NOTIF_POLL_MS);
  notifStarted = true;
}

window.initNotifications = startNotifications;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startNotifications);
} else {
  startNotifications();
}
