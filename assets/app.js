
/**
 * LicenseOS — app.js
 * Shared UI logic for all admin pages.
 */

/* ── Toast ───────────────────────────────────────────────────── */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ── Badge HTML ──────────────────────────────────────────────── */
function badgeHTML(site) {
  const s = site.effectiveStatus;
  if (s === 'expired') return `<span class="badge badge-expired">Expired</span>`;
  if (s === 'warning') return `<span class="badge badge-warning">Expires in ${site.daysLeft}d</span>`;
  return `<span class="badge badge-active">Active</span>`;
}

/* ── Modal helpers ───────────────────────────────────────────── */
function openModal(id) {
  document.getElementById(id).style.display = 'flex';
  document.addEventListener('keydown', escListener);
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
function escListener(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.style.display = 'none');
  }
}
// Close on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.style.display = 'none';
    });
  });
});

/* ─────────────────────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────────────────────── */
function renderDashboard() {
  const sites = getSites();
  const total   = sites.length;
  const active  = sites.filter(s => s.effectiveStatus === 'active').length;
  const expired = sites.filter(s => s.effectiveStatus === 'expired').length;
  const soon    = sites.filter(s => s.effectiveStatus === 'warning').length;

  setText('statTotal',   total);
  setText('statActive',  active);
  setText('statExpired', expired);
  setText('statSoon',    soon);

  setWidth('barActive',  total ? (active  / total * 100) + '%' : '0%');
  setWidth('barExpired', total ? (expired / total * 100) + '%' : '0%');
  setWidth('barSoon',    total ? (soon    / total * 100) + '%' : '0%');

  // Recent table
  const tbody = document.getElementById('recentBody');
  if (tbody) {
    tbody.innerHTML = sites.slice(0, 6).map(s => `
      <tr>
        <td>
          <div class="domain-name">${esc(s.domain)}</div>
          <div class="domain-meta">${esc(s.clientName || '')}</div>
        </td>
        <td><span class="mono" style="font-size:12px">${esc(s.licenseKey)}</span></td>
        <td>${esc(s.plan)}</td>
        <td style="color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:13px">${s.expiryDate}</td>
        <td>${badgeHTML(s)}</td>
        <td>
          <div class="actions-cell">
            <a href="sites.html" class="btn-ghost" style="font-size:12px;padding:6px 12px">Manage</a>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Timeline
  const timeline = document.getElementById('timeline');
  if (timeline) {
    const sorted = [...sites].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    timeline.innerHTML = sorted.map(s => {
      const color = s.effectiveStatus === 'expired' ? 'var(--red)' : s.effectiveStatus === 'warning' ? 'var(--amber)' : 'var(--accent)';
      return `
        <div class="timeline-item">
          <div class="timeline-dot" style="background:${color}"></div>
          <div class="timeline-domain">${esc(s.domain)}</div>
          <span class="badge ${s.effectiveStatus === 'expired' ? 'badge-expired' : s.effectiveStatus === 'warning' ? 'badge-warning' : 'badge-active'}">${s.plan}</span>
          <div class="timeline-date">${s.expiryDate}</div>
          ${badgeHTML(s)}
        </div>
      `;
    }).join('');
  }
}

/* ─────────────────────────────────────────────────────────────
   SITES
───────────────────────────────────────────────────────────── */
let _revokeId = null;
let _renewId  = null;

function renderSites() {
  const searchEl  = document.getElementById('searchInput');
  const filterEl  = document.getElementById('filterStatus');
  const query  = searchEl  ? searchEl.value.toLowerCase()  : '';
  const filter = filterEl  ? filterEl.value                : '';

  let sites = getSites();

  if (query)  sites = sites.filter(s => s.domain.toLowerCase().includes(query) || (s.clientName || '').toLowerCase().includes(query));
  if (filter) sites = sites.filter(s => (filter === 'active' ? s.effectiveStatus !== 'expired' : s.effectiveStatus === 'expired'));

  const tbody = document.getElementById('sitesBody');
  const empty = document.getElementById('emptyMsg');

  if (!sites.length) {
    if (tbody) tbody.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  tbody.innerHTML = sites.map(s => `
    <tr>
      <td>
        <div class="domain-name">${esc(s.domain)}</div>
        <div class="domain-meta">${esc(s.clientName || '')}</div>
      </td>
      <td><span class="mono" style="font-size:12px">${esc(s.licenseKey)}</span></td>
      <td>${esc(s.plan)}</td>
      <td style="color:var(--muted);font-size:13px">${s.createdAt}</td>
      <td style="font-family:'JetBrains Mono',monospace;font-size:13px">${s.expiryDate}</td>
      <td>${badgeHTML(s)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn-ghost" style="font-size:12px;padding:6px 12px" onclick="openViewModal('${s.id}')">View</button>
          <button class="btn-ghost" style="font-size:12px;padding:6px 12px" onclick="openRenewModal('${s.id}')">Renew</button>
          <button class="btn-danger" style="font-size:12px;padding:6px 12px" onclick="openConfirmRevoke('${s.id}')">Revoke</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openViewModal(id) {
  const s = { id, ...DB[id], daysLeft: daysUntil(DB[id].expiryDate), effectiveStatus: computeStatus(DB[id]) };
  document.getElementById('viewTitle').textContent = s.domain;
  document.getElementById('viewBody').innerHTML = `
    <div class="info-row"><span>Client</span><span>${esc(s.clientName || '—')}</span></div>
    <div class="info-row"><span>License Key</span><span class="mono">${esc(s.licenseKey)}</span></div>
    <div class="info-row"><span>Plan</span><span>${esc(s.plan)}</span></div>
    <div class="info-row"><span>Status</span><span>${badgeHTML(s)}</span></div>
    <div class="info-row"><span>Expiry Date</span><span style="font-family:'JetBrains Mono',monospace">${s.expiryDate}</span></div>
    <div class="info-row"><span>Grace Period</span><span>${s.graceDays || 0} days</span></div>
    <div class="info-row"><span>Created</span><span>${s.createdAt}</span></div>
  `;
  document.getElementById('viewRenewBtn').onclick = () => { closeModal('viewModal'); openRenewModal(id); };
  openModal('viewModal');
}

function openRenewModal(id) {
  _renewId = id;
  const s = DB[id];
  document.getElementById('renewDomain').textContent = s.domain;
  document.getElementById('renewCurrentExpiry').textContent = s.expiryDate;

  const opts = document.getElementById('renewOptions');
  opts.innerHTML = [1, 3, 6, 12].map(m => {
    const base = (s.status === 'expired' || daysUntil(s.expiryDate) < 0) ? new Date() : new Date(s.expiryDate);
    base.setMonth(base.getMonth() + m);
    const newDate = base.toISOString().split('T')[0];
    return `
      <button class="renew-opt-btn" onclick="doRenew(${m})">
        <span>+ ${m} month${m > 1 ? 's' : ''}</span>
        <span class="renew-opt-date">→ ${newDate}</span>
      </button>`;
  }).join('');

  openModal('renewModal');
}

function doRenew(months) {
  if (!_renewId) return;
  const s = DB[_renewId];
  const base = (s.status === 'expired' || daysUntil(s.expiryDate) < 0) ? new Date() : new Date(s.expiryDate);
  base.setMonth(base.getMonth() + months);

  DB[_renewId] = {
    ...s,
    expiryDate: base.toISOString().split('T')[0],
    status: 'active',
    licenseKey: generateKey(s.domain)
  };
  saveDB();
  closeModal('renewModal');
  renderSites();
  showToast('License renewed for ' + s.domain);
}

function openConfirmRevoke(id) {
  _revokeId = id;
  document.getElementById('confirmRevokeBtn').onclick = doRevoke;
  openModal('confirmModal');
}

function doRevoke() {
  if (!_revokeId) return;
  DB[_revokeId] = { ...DB[_revokeId], status: 'expired' };
  saveDB();
  closeModal('confirmModal');
  renderSites();
  showToast('License revoked', 'danger');
  _revokeId = null;
}

/* ── Helpers ─────────────────────────────────────────────────── */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setWidth(id, val) {
  const el = document.getElementById(id);
  if (el) el.style.width = val;
}
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
