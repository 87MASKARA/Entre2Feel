/* ============================================================
   ENTRE2FIT — Admin Panel Logic v2 (admin.js)
   ============================================================ */

// ── Auth ──────────────────────────────────────────────────────
if (!localStorage.getItem('admin_logged_in')) {
  const pass = prompt('Contraseña de administrador:');
  if (pass !== 'entre2fit') {
    document.body.innerHTML = "<div style='display:flex;align-items:center;justify-content:center;height:100vh;background:#0F172A;color:#EF4444;font-family:sans-serif;font-size:1.5rem;'>⛔ Acceso denegado</div>";
    throw new Error('Unauthorized');
  }
  localStorage.setItem('admin_logged_in', 'true');
}
function logout() { localStorage.removeItem('admin_logged_in'); window.location.reload(); }

// ── Admin API Key (misma clave) ────────────────────────────────────
const ADMIN_API_KEY = 'entre2fit';
function adminHeaders(extra = {}) {
  return { 'X-Admin-Key': ADMIN_API_KEY, 'Content-Type': 'application/json', ...extra };
}

// ── Charts ────────────────────────────────────────────────────
Chart.defaults.color = '#64748B';
Chart.defaults.font.family = "'DM Sans', sans-serif";

let REVENUE_DATA = {
  '6m': { labels: [], data: [] },
  '3m': { labels: [], data: [] }
};

let revenueChart = null;

function initCharts() {
  // ── Revenue Line Chart ──
  const ctxR = document.getElementById('chart-revenue');
  if (ctxR) {
    const d = REVENUE_DATA['6m'];
    revenueChart = new Chart(ctxR, {
      type: 'line',
      data: {
        labels: d.labels,
        datasets: [{
          label: 'Ingresos COP',
          data: d.data,
          borderColor: '#7B5BFF',
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 200);
            g.addColorStop(0, 'rgba(123,91,255,0.25)');
            g.addColorStop(1, 'rgba(123,91,255,0)');
            return g;
          },
          fill: true,
          tension: 0.45,
          pointBackgroundColor: '#7B5BFF',
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            borderColor: '#2D3A52',
            borderWidth: 1,
            callbacks: {
              label: ctx => ' ' + new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(ctx.raw)
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false },
            ticks: { callback: v => '$' + (v/1000000).toFixed(1) + 'M' }
          }
        }
      }
    });
  }

  // ── Status Donut ──
  const ctxS = document.getElementById('chart-status');
  if (ctxS) {
    new Chart(ctxS, {
      type: 'doughnut',
      data: {
        labels: ['Pagado', 'Pendiente', 'Enviado', 'Cancelado'],
        datasets: [{
          data: [0, 0, 0, 0],
          backgroundColor: ['#10B981','#F59E0B','#7B5BFF','#EF4444'],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        cutout: '72%',
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', font: { size: 11 } }
          },
          tooltip: { backgroundColor: '#1E293B', borderColor: '#2D3A52', borderWidth: 1 }
        }
      }
    });
  }

  // ── Top Products Bar ──
  const ctxP = document.getElementById('chart-products');
  if (ctxP) {
    new Chart(ctxP, {
      type: 'bar',
      data: {
        labels: ['Protocolo BALANCE FEEL'],
        datasets: [{
          label: 'Unidades',
          data: [0],
          backgroundColor: [
            'rgba(123, 91, 255, 0.8)'
          ],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#1E293B', borderColor: '#2D3A52', borderWidth: 1 }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false } },
          y: { grid: { display: false }, border: { display: false } }
        }
      }
    });
  }
}

function setPeriod(period, btn) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (revenueChart) {
    const d = REVENUE_DATA[period];
    revenueChart.data.labels = d.labels;
    revenueChart.data.datasets[0].data = d.data;
    revenueChart.update('active');
  }
}

// ── Navigation ────────────────────────────────────────────────
function goTo(target) {
  document.querySelectorAll('.admin-nav a').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  const link = document.querySelector(`.admin-nav a[data-target="${target}"]`);
  if (link) link.classList.add('active');
  const panel = document.getElementById(`panel-${target}`);
  if (panel) panel.classList.add('active');
  document.getElementById('page-title').textContent = (link?.textContent?.trim() || target);
}

document.querySelectorAll('.admin-nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    goTo(link.dataset.target);
  });
});

// ── Health Check ──────────────────────────────────────────────
async function loadHealth() {
  try {
    const r = await fetch('/api/health');
    const d = await r.json();
    setDot('h-mp', d.mercadopago);
    setDot('h-tg', d.telegram);
    setDot('h-em', d.email_smtp);
    setDot('h-sh', d.sheets_write);
    document.getElementById('server-status').textContent = 'Servidor activo';
  } catch {
    document.getElementById('server-status').style.color = 'var(--admin-danger)';
    document.getElementById('server-status').textContent = 'Servidor offline';
  }
}
function setDot(id, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'health-dot ' + (ok ? 'ok' : 'err');
}

// ── INVENTORY ─────────────────────────────────────────────────
let products = [];

async function loadInventoryFromAPI() {
  const btn = document.getElementById('btn-reload-inv');
  if (btn) { btn.innerHTML = '<span class="spin">↻</span> Cargando…'; btn.disabled = true; }
  try {
    const r = await fetch('/api/products');
    if (!r.ok) throw new Error();
    const apiProducts = await r.json();
    
    // Combinar productos por defecto de shop.js con productos dinámicos de Sheets
    if (typeof DEFAULT_PRODUCTS !== 'undefined' && Array.isArray(DEFAULT_PRODUCTS)) {
      const defaultIds = new Set(DEFAULT_PRODUCTS.map(p => p.id));
      products = [
        ...DEFAULT_PRODUCTS,
        ...apiProducts.filter(p => !defaultIds.has(p.id))
      ];
    } else {
      products = apiProducts;
    }
    
    localStorage.setItem('entre2fit_products_v7', JSON.stringify(products));
  } catch {
    const stored = localStorage.getItem('entre2fit_products_v7');
    products = stored ? JSON.parse(stored) : [];
    showAdminToast('Sin conexión a Sheets — mostrando datos locales', 'warn');
  }
  renderInventory(products);
  updateDashboardKPIs();
  if (btn) { btn.innerHTML = '↻ Recargar Sheets'; btn.disabled = false; }
}

function renderInventory(list) {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--admin-text-light);">No hay productos cargados.</td></tr>`;
    return;
  }
  const fmt = n => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n);
  const stockBadge = s => {
    if (s > 10) return `<span class="badge-status badge-stock-ok">${s} ✓</span>`;
    if (s > 0)  return `<span class="badge-status badge-stock-low">${s} ⚠</span>`;
    return `<span class="badge-status badge-stock-out">Agotado</span>`;
  };
  tbody.innerHTML = list.map((p, i) => `
    <tr>
      <td style="display:flex;gap:0.5rem;align-items:center;">
        <img class="product-thumb" src="${p.image || 'https://placehold.co/36x36/1E293B/3B82F6?text=BP'}" alt="${p.name}" referrerpolicy="no-referrer" onerror="this.src='https://placehold.co/36x36/1E293B/3B82F6?text=BP'" title="Producto">
        ${p.certificate ? `<img class="product-thumb" src="${p.certificate}" alt="Certificado" referrerpolicy="no-referrer" style="border:1px solid #14B8A6;" title="Certificado">` : `<span style="font-size:0.65rem;color:var(--admin-danger);background:rgba(239,68,68,0.1);padding:0.1rem 0.3rem;border-radius:4px;" title="Falta Certificado">Sin Cert.</span>`}
      </td>
      <td style="font-weight:700;color:var(--admin-primary);font-size:0.8rem;">${p.id}</td>
      <td style="font-weight:500;">${p.name}</td>
      <td style="font-weight:600;">${fmt(p.price)}</td>
      <td>${stockBadge(p.stock)}</td>
    </tr>
  `).join('');
}

function filterInventory(q) {
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.id.toLowerCase().includes(q.toLowerCase())
  );
  renderInventory(filtered);
}


// ── CRM ───────────────────────────────────────────────────────
const STATUS_LABELS = {
  'Pending':    'Pendiente',
  'Paid':       'Pagado',
  'Shipped':    'Enviado',
  'Cancelled':  'Cancelado',
  'Refunded':   'Reembolsado'
};
const STATUS_CLASS = {
  'Pending':   'badge-pendiente',
  'Paid':      'badge-pagado',
  'Shipped':   'badge-enviado',
  'Cancelled': 'badge-cancelado',
  'Refunded':  'badge-reembolsado'
};

// Load from Google Sheets or use mock
let allOrders = [];

async function loadOrders() {
  try {
    const r = await fetch('/api/orders', { headers: { 'X-Admin-Key': ADMIN_API_KEY } });
    if (r.ok) { allOrders = await r.json(); }
    else throw new Error();
  } catch {
    // Use local data if no endpoint
    allOrders = [];
  }
  renderCRM(allOrders);
  updateDashboardKPIs();
}

function renderCRM(list) {
  const tbody = document.getElementById('crm-tbody');
  if (!tbody) return;
  const fmt = n => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n);
  tbody.innerHTML = list.map((o, i) => `
    <tr onclick="openOrderModal(${allOrders.indexOf(o)})">
      <td>${o.date}<br><small style="color:var(--admin-text-light);">${o.id}</small></td>
      <td style="font-weight:600;">${o.customer.fname} ${o.customer.lname}</td>
      <td><a href="https://wa.me/${(o.customer.phone||'').replace(/\D/g,'')}" target="_blank" style="color:var(--admin-teal);text-decoration:none;" onclick="event.stopPropagation()">📱 ${o.customer.phone || '—'}</a></td>
      <td>${o.customer.email}</td>
      <td style="font-weight:700;color:#34D399;">${fmt(o.total)}</td>
      <td><span class="badge-status ${STATUS_CLASS[o.status] || 'badge-pendiente'}">${STATUS_LABELS[o.status] || o.status}</span></td>
    </tr>
  `).join('');
}

function filterCRM(status) {
  const filtered = status ? allOrders.filter(o => o.status === status) : allOrders;
  renderCRM(filtered);
}

function exportCSV() {
  const rows = [['ID','Fecha','Nombre','Email','Teléfono','Total','Estado']];
  allOrders.forEach(o => rows.push([o.id, o.date, `${o.customer.fname} ${o.customer.lname}`, o.customer.email, o.customer.phone, o.total, STATUS_LABELS[o.status] || o.status]));
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = `ordenes_entre2fit_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

let activeOrder = null;
function openOrderModal(index) {
  const o = allOrders[index];
  activeOrder = o;
  const fmt = n => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n);
  document.getElementById('order-modal-title').textContent = `Orden ${o.id}`;
  const totalProducts = o.items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  const shippingCost = Math.max(0, o.total - totalProducts);

  const itemsHtml = o.items.map(i => `
    <div class="order-detail-row">
      <span>${i.qty}× ${i.name} <small style="color:var(--admin-text-light);">(${fmt(i.price || 0)} c/u)</small></span>
      <span>${fmt((i.price || 0) * i.qty)}</span>
    </div>`).join('');

  const labelBtns = [
    { key:'Pending',   label:'⏳ Pendiente' },
    { key:'Paid',      label:'✓ Pagado',    cls:'pagado' },
    { key:'Shipped',   label:'🚚 Enviado',   cls:'enviado' },
    { key:'Cancelled', label:'✕ Cancelado', cls:'cancelado' },
    { key:'Refunded',  label:'↩ Reembolsado' }
  ].map(b => `<button class="order-label-btn ${b.cls||''} ${o.status===b.key?'active':''}" onclick="changeStatus('${b.key}',this)">${b.label}</button>`).join('');

  document.getElementById('order-details-content').innerHTML = `
    <div class="order-detail-grid">
      <div class="order-detail-box">
        <h4>Cliente</h4>
        <div class="order-detail-row"><span>Nombre</span><span>${o.customer.fname} ${o.customer.lname}</span></div>
        <div class="order-detail-row"><span>Email</span><span><a href="mailto:${o.customer.email}">${o.customer.email}</a></span></div>
        <div class="order-detail-row"><span>Celular</span><span><a href="https://wa.me/${(o.customer.phone||'').replace(/\D/g,'')}" target="_blank">📱 ${o.customer.phone||'—'}</a></span></div>
        <div class="order-detail-row"><span>Ciudad</span><span>${o.customer.city}, ${o.customer.state}</span></div>
        <div class="order-detail-row"><span>Dirección</span><span>${o.customer.address}</span></div>
        ${o.notes ? `<div style="margin-top:0.75rem;padding:0.75rem;background:rgba(245,158,11,0.1);border-radius:8px;font-size:0.83rem;"><strong>📝 Notas:</strong> ${o.notes}</div>` : ''}
      </div>
      <div class="order-detail-box">
        <h4>Productos</h4>
        ${itemsHtml}
        <div style="border-top:1px solid var(--admin-border);margin-top:1rem;padding-top:0.5rem;">
          <div class="order-detail-row" style="color:var(--admin-text-light);font-size:0.85rem;"><span>Subtotal</span><span>${fmt(totalProducts)}</span></div>
          <div class="order-detail-row" style="color:var(--admin-text-light);font-size:0.85rem;"><span>Envío</span><span>${fmt(shippingCost)}</span></div>
          <div class="order-total-row" style="margin-top:0.5rem;"><span>Total</span><span>${fmt(o.total)}</span></div>
        </div>
        <div style="margin-top:1rem;">
          <div style="font-size:0.75rem;color:var(--admin-text-light);margin-bottom:0.5rem;text-transform:uppercase;letter-spacing:0.05em;">Cambiar estado:</div>
          <div class="order-label-select">${labelBtns}</div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('order-modal').classList.add('open');
}

async function changeStatus(status, btn) {
  if (!activeOrder) return;
  const oldStatus = activeOrder.status;
  activeOrder.status = status;
  document.querySelectorAll('.order-label-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  renderCRM(allOrders);
  
  try {
    const r = await fetch(`/api/orders/${activeOrder.id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_API_KEY
      },
      body: JSON.stringify({ status })
    });
    if (!r.ok) throw new Error('Error al actualizar');
    showAdminToast(`Estado actualizado a ${STATUS_LABELS[status]}`, 'success');
  } catch (e) {
    activeOrder.status = oldStatus;
    renderCRM(allOrders);
    showAdminToast('Error guardando estado', 'error');
  }
}
function closeOrderModal() { document.getElementById('order-modal').classList.remove('open'); }
function markAsShipped() { if(activeOrder){ changeStatus('Shipped', document.querySelector('.order-label-btn.enviado')); closeOrderModal(); } }

// Download PDF
async function downloadOrderPDF() {
  if (!activeOrder) return;
  const o = activeOrder;
  const fmt = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
  const label = document.getElementById('order-label-print');
  const logoSrc = document.querySelector('img[alt="Entre2Fit"]')?.src || '';
  const logoHtml = logoSrc ? `<img src="${logoSrc}" alt="Entre2Fit" style="height: 45px; margin-bottom: 0.5rem;" />` : `<div style="font-size:1.3rem;font-weight:800;color:#7B5BFF;margin-bottom:0.25rem;">Entre2Fit</div>`;

  label.innerHTML = `
    <div style="border:2px solid #7B5BFF;border-radius:12px;padding:2rem;max-width:380px;font-family:sans-serif;">
      ${logoHtml}
      <div style="font-size:0.7rem;color:#64748B;margin-bottom:1.5rem;">Etiqueta de Envío</div>
      <div style="font-size:0.75rem;color:#64748B;margin-bottom:0.25rem;">PARA:</div>
      <div style="font-size:1.1rem;font-weight:700;">${o.customer.fname} ${o.customer.lname}</div>
      <div style="font-size:0.9rem;">${o.customer.address}</div>
      <div style="font-size:0.9rem;">${o.customer.city}, ${o.customer.state} ${o.customer.zip}</div>
      <div style="font-size:0.9rem;margin-bottom:1rem;">${o.customer.country} | 📱 ${o.customer.phone}</div>
      <hr style="border:1px solid #E2E8F0;margin-bottom:1rem;">
      <div style="font-size:0.75rem;color:#64748B;">Orden: <strong>${o.id}</strong></div>
      <div style="font-size:0.75rem;color:#64748B;">Fecha: ${o.date}</div>
      <div style="margin-top:1rem;font-size:0.75rem;color:#64748B;">
        <div style="font-weight:bold;margin-bottom:0.25rem;">Productos:</div>
        ${o.items.map(i => `• ${i.qty}× ${i.name} — ${fmt((i.price || 0) * i.qty)} <span style="opacity:0.8;">(${fmt(i.price || 0)} c/u)</span>`).join('<br>')}
      </div>
      <hr style="border:1px dashed #E2E8F0;margin:0.75rem 0;">
      <div style="font-size:0.75rem;color:#64748B;display:flex;justify-content:space-between;"><span>Subtotal:</span> <span>${fmt(o.items.reduce((s, i) => s + (i.price || 0) * i.qty, 0))}</span></div>
      <div style="font-size:0.75rem;color:#64748B;display:flex;justify-content:space-between;"><span>Envío:</span> <span>${fmt(Math.max(0, o.total - o.items.reduce((s, i) => s + (i.price || 0) * i.qty, 0)))}</span></div>
      <div style="font-size:0.85rem;color:#7B5BFF;display:flex;justify-content:space-between;font-weight:bold;margin-top:0.25rem;"><span>Total:</span> <span>${fmt(o.total)}</span></div>
    </div>`;

  label.style.left = '0'; label.style.top = '0'; label.style.position = 'fixed';
  try {
    const canvas = await html2canvas(label, { backgroundColor:'#fff', scale: 2 });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit:'px', format:[canvas.width/2, canvas.height/2] });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width/2, canvas.height/2);
    pdf.save(`etiqueta_${o.id}.pdf`);
  } catch(err) { showAdminToast('Error generando PDF', 'error'); }
  label.style.left = '-9999px';
}

async function downloadOrderImage() {
  if (!activeOrder) return;
  await downloadOrderPDF(); // Reuse the label generation
  // Also save as PNG
  const label = document.getElementById('order-label-print');
  label.style.left = '0';
  const canvas = await html2canvas(label, { backgroundColor:'#fff', scale:2 });
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = `etiqueta_${activeOrder.id}.png`;
  a.click();
  label.style.left = '-9999px';
}

// ── Dashboard KPIs ────────────────────────────────────────────
function updateDashboardKPIs() {
  const fmt = n => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(n);

  const kpiProducts = document.getElementById('kpi-products');
  if (kpiProducts) kpiProducts.textContent = products.length;
  document.getElementById('kpi-orders').textContent   = allOrders.length;

  const pending = allOrders.filter(o => o.status === 'Pending' || o.status === 'Paid').length;
  const pendingSub = document.getElementById('kpi-pending-sub');
  if (pendingSub) pendingSub.textContent = `${pending} pendientes`;

  // ── Calcular ventas reales ──
  const paidOrders = allOrders.filter(o => o.status === 'Paid' || o.status === 'Shipped');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const revenueEl = document.getElementById('kpi-revenue');
  if (revenueEl) revenueEl.textContent = fmt(totalRevenue);

  // ── Poblar gráfico de ingresos por mes ──
  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const revenueByMonth = {};
  allOrders.forEach(o => {
    if (o.date && o.date.length >= 7) {
      const key = o.date.substring(0, 7); // "2026-05"
      if (!revenueByMonth[key]) revenueByMonth[key] = 0;
      revenueByMonth[key] += (parseFloat(o.total) || 0);
    }
  });
  const sortedMonths = Object.keys(revenueByMonth).sort();
  const last6 = sortedMonths.slice(-6);
  const last3 = sortedMonths.slice(-3);
  REVENUE_DATA['6m'] = {
    labels: last6.map(k => { const m = parseInt(k.split('-')[1]) - 1; return monthNames[m] || k; }),
    data:   last6.map(k => revenueByMonth[k])
  };
  REVENUE_DATA['3m'] = {
    labels: last3.map(k => { const m = parseInt(k.split('-')[1]) - 1; return monthNames[m] || k; }),
    data:   last3.map(k => revenueByMonth[k])
  };
  if (REVENUE_DATA['6m'].labels.length === 0) {
    const now = new Date();
    REVENUE_DATA['6m'] = { labels: [monthNames[now.getMonth()]], data: [0] };
    REVENUE_DATA['3m'] = { labels: [monthNames[now.getMonth()]], data: [0] };
  }
  if (revenueChart) {
    const d = REVENUE_DATA['6m'];
    revenueChart.data.labels = d.labels;
    revenueChart.data.datasets[0].data = d.data;
    revenueChart.update('active');
  }

  // ── Poblar donut de estados ──
  const statusCounts = { Paid: 0, Pending: 0, Shipped: 0, Cancelled: 0 };
  allOrders.forEach(o => {
    if (statusCounts.hasOwnProperty(o.status)) statusCounts[o.status]++;
    else statusCounts['Pending']++;
  });
  const statusChart = Chart.getChart('chart-status');
  if (statusChart) {
    statusChart.data.datasets[0].data = [statusCounts.Paid, statusCounts.Pending, statusCounts.Shipped, statusCounts.Cancelled];
    statusChart.update('active');
  }

  // ── Poblar top productos ──
  const productSales = {};
  allOrders.forEach(o => {
    (o.items || []).forEach(i => {
      const name = i.name || 'Desconocido';
      if (!productSales[name]) productSales[name] = 0;
      productSales[name] += (parseInt(i.qty) || 1);
    });
  });
  const topProducts = Object.entries(productSales).sort((a,b) => b[1]-a[1]).slice(0, 5);
  const productsChart = Chart.getChart('chart-products');
  if (productsChart && topProducts.length > 0) {
    productsChart.data.labels = topProducts.map(p => p[0]);
    productsChart.data.datasets[0].data = topProducts.map(p => p[1]);
    productsChart.update('active');
  }

  // ── Actividad reciente ──
  const actFeed = document.getElementById('activity-feed');
  if (actFeed) {
    const recent = allOrders.slice(-5).reverse();
    if (recent.length === 0) {
      actFeed.innerHTML = '<div style="padding:1rem;color:var(--admin-text-light);font-size:0.85rem;text-align:center;">No hay actividad reciente.</div>';
    } else {
      actFeed.innerHTML = recent.map(o => {
        const statusIcon = { Paid:'✅', Pending:'⏳', Shipped:'🚚', Cancelled:'❌' }[o.status] || '📦';
        return `<div style="padding:0.6rem 0;border-bottom:1px solid var(--admin-border);font-size:0.83rem;">
          <span>${statusIcon}</span>
          <strong>${o.customer.fname} ${o.customer.lname}</strong> &mdash; ${fmt(o.total)}
          <div style="font-size:0.75rem;color:var(--admin-text-light);margin-top:0.15rem;">${o.id} &bull; ${o.date}</div>
        </div>`;
      }).join('');
    }
  }
}

// ── MESSAGING ─────────────────────────────────────────────────
let activeContactId = null;
let activeContactPlatform = null;
let lastMessagesCount = 0;

async function loadMessages() {
  try {
    const r = await fetch('/api/admin/messages');
    if (!r.ok) return;
    const msgs = await r.json();
    
    // Group by contact (sender_id for inbound, recipient_id for outbound)
    const contacts = {};
    msgs.forEach(m => {
      const contactId = m.is_outbound ? m.recipient_id : m.sender_id;
      if (!contacts[contactId]) contacts[contactId] = { id: contactId, platform: m.platform, messages: [] };
      contacts[contactId].messages.push(m);
    });

    const cList = Object.values(contacts);
    
    let unreadCount = 0;
    cList.forEach(c => {
      const lastMsg = c.messages[c.messages.length - 1];
      if (lastMsg && !lastMsg.is_outbound) unreadCount++;
    });
    
    const kpiMessages = document.getElementById('kpi-messages');
    if (kpiMessages) kpiMessages.textContent = unreadCount;
    
    const msgBadge = document.getElementById('msg-badge');
    if (msgBadge) {
      msgBadge.textContent = unreadCount;
      msgBadge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
    }

    if (msgs.length !== lastMessagesCount) {
      lastMessagesCount = msgs.length;
      renderContacts(cList);
      if (activeContactId && contacts[activeContactId]) {
        renderChat(contacts[activeContactId]);
      }
    }
  } catch (e) { console.error('Error fetching messages', e); }
}

function renderContacts(contacts) {
  const container = document.getElementById('msg-list-container');
  if (contacts.length === 0) {
    container.innerHTML = '<div style="padding:1.5rem;color:var(--admin-text-light);font-size:0.85rem;text-align:center;">No hay mensajes nuevos.</div>';
    return;
  }
  
  container.innerHTML = '';
  contacts.forEach(c => {
    const lastMsg = c.messages[c.messages.length - 1];
    const div = document.createElement('div');
    div.className = `msg-item ${c.id === activeContactId ? 'active' : ''}`;
    div.onclick = () => selectContact(c, div);
    
    div.innerHTML = `
      <div class="msg-item-avatar">${c.platform === 'Instagram' ? '📷' : '📘'}</div>
      <div class="msg-item-info">
        <div style="font-weight:600;font-size:0.9rem;">ID: ${c.id.substring(0,8)}...</div>
        <div style="font-size:0.8rem;color:var(--admin-text-light);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${lastMsg.text}</div>
      </div>
      <div style="font-size:0.75rem;color:var(--admin-text-light);">
        ${new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </div>
    `;
    container.appendChild(div);
  });
}

function selectContact(contact, el) {
  document.querySelectorAll('.msg-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  activeContactId = contact.id;
  activeContactPlatform = contact.platform;
  document.getElementById('msg-contact-name').textContent = `ID: ${contact.id} — ${contact.platform}`;
  renderChat(contact);
}

function renderChat(contact) {
  const body = document.getElementById('msg-view-body');
  body.innerHTML = '';
  contact.messages.forEach(m => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${m.is_outbound ? 'chat-out' : 'chat-in'}`;
    bubble.textContent = m.text;
    body.appendChild(bubble);
  });
  body.scrollTop = body.scrollHeight;
}

async function sendMsg() {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text || !activeContactId) return;
  
  const originalBtnText = input.nextElementSibling.textContent;
  input.nextElementSibling.textContent = '...';
  input.disabled = true;
  
  try {
    const r = await fetch('/api/admin/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: activeContactId, text: text, platform: activeContactPlatform })
    });
    if (!r.ok) throw new Error();
    input.value = '';
    loadMessages(); // reload to show the sent message
  } catch (e) {
    showAdminToast('Error al enviar. Revisa tus Tokens API.', 'error');
  } finally {
    input.disabled = false;
    input.nextElementSibling.textContent = originalBtnText;
    input.focus();
  }
}

// Start polling
setInterval(loadMessages, 5000);

// ── SETTINGS ─────────────────────────────────────────────────
function toggleEye(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
  else { inp.type = 'password'; btn.textContent = '👁'; }
}

async function loadConfig() {
  const cfg = JSON.parse(localStorage.getItem('bp_admin_config') || '{}');
  if (cfg.mp_token)      document.getElementById('cfg-mp-token').value      = cfg.mp_token;
  if (cfg.mp_public_key) document.getElementById('cfg-mp-public-key').value = cfg.mp_public_key;
  if (cfg.tg_token)      document.getElementById('cfg-tg-token').value      = cfg.tg_token;
  if (cfg.tg_chat)       document.getElementById('cfg-tg-chat').value       = cfg.tg_chat;
  if (cfg.smtp_user)     document.getElementById('cfg-smtp-user').value     = cfg.smtp_user;
  if (cfg.smtp_pass)     document.getElementById('cfg-smtp-pass').value     = cfg.smtp_pass;
  if (cfg.admin_email)   document.getElementById('cfg-admin-email').value   = cfg.admin_email;
  if (cfg.fb_token)      document.getElementById('cfg-fb-token').value      = cfg.fb_token;
  if (cfg.ig_token)      document.getElementById('cfg-ig-token').value      = cfg.ig_token;
  if (cfg.wa_token)      document.getElementById('cfg-wa-token').value      = cfg.wa_token;
  if (cfg.site_url)      document.getElementById('cfg-site-url').value      = cfg.site_url;
  if (cfg.gemini_api_key) document.getElementById('cfg-gemini-key').value   = cfg.gemini_api_key;
  if (cfg.ai_bot_active !== undefined) document.getElementById('cfg-ai-bot-active').checked = cfg.ai_bot_active;
  showAdminToast('Configuración cargada', 'info');
}

async function saveConfig() {
  const cfg = {
    mp_token:       document.getElementById('cfg-mp-token').value,
    mp_public_key:  document.getElementById('cfg-mp-public-key').value,
    tg_token:       document.getElementById('cfg-tg-token').value,
    tg_chat:        document.getElementById('cfg-tg-chat').value,
    smtp_user:      document.getElementById('cfg-smtp-user').value,
    smtp_pass:      document.getElementById('cfg-smtp-pass').value,
    admin_email:    document.getElementById('cfg-admin-email').value,
    fb_token:       document.getElementById('cfg-fb-token').value,
    ig_token:       document.getElementById('cfg-ig-token').value,
    wa_token:       document.getElementById('cfg-wa-token').value,
    site_url:       document.getElementById('cfg-site-url').value,
    gemini_api_key: document.getElementById('cfg-gemini-key').value,
    ai_bot_active:  document.getElementById('cfg-ai-bot-active').checked
  };
  localStorage.setItem('bp_admin_config', JSON.stringify(cfg));
  // Send to backend
  try {
    const r = await fetch('/api/admin/config', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify(cfg)
    });
    if (r.ok) showAdminToast('Configuración guardada en el servidor ✓', 'success');
    else throw new Error();
  } catch {
    showAdminToast('Config guardada localmente (servidor no disponible)', 'warn');
  }
}

async function testTelegram() {
  try {
    const r = await fetch('/api/admin/test-telegram', { method: 'POST', headers: { 'X-Admin-Key': ADMIN_API_KEY } });
    if (r.ok) showAdminToast('✓ Mensaje de prueba enviado por Telegram', 'success');
    else throw new Error();
  } catch { showAdminToast('Error: verifica el token y chat ID', 'error'); }
}

async function testEmail() {
  showAdminToast('Enviando email de prueba...', 'info');
  try {
    const r = await fetch('/api/admin/test-email', { method: 'POST', headers: { 'X-Admin-Key': ADMIN_API_KEY } });
    if (r.ok) showAdminToast('✓ Email de prueba enviado', 'success');
    else throw new Error();
  } catch { showAdminToast('Error: verifica tu correo y contraseña de App', 'error'); }
}

async function testMP() {
  showAdminToast('Probando Mercado Pago…', 'info');
  // Calls health endpoint to verify
  await loadHealth();
  const dot = document.getElementById('h-mp');
  if (dot?.classList.contains('ok')) showAdminToast('✓ Mercado Pago conectado', 'success');
  else showAdminToast('Error: verifica el Access Token', 'error');
}

// ── Toast ─────────────────────────────────────────────────────
function showAdminToast(msg, type = 'info') {
  let c = document.querySelector('.admin-toast-container');
  if (!c) {
    c = document.createElement('div');
    c.className = 'admin-toast-container';
    c.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
    document.body.appendChild(c);
  }
  const colors = { success:'#10B981', warn:'#F59E0B', error:'#EF4444', info:'#3B82F6' };
  const t = document.createElement('div');
  t.style.cssText = `background:var(--admin-card);border:1px solid ${colors[type]||'#3B82F6'};color:var(--admin-text);padding:0.75rem 1.25rem;border-radius:10px;font-size:0.88rem;font-family:'DM Sans',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.4);animation:fadeIn 0.3s ease;max-width:300px;`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadHealth();
  loadInventoryFromAPI();
  loadOrders();
  loadConfig();
  initCharts();
});
