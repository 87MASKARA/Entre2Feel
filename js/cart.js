/* ============================================================
   BIOPEPTIX — Cart Logic (cart.js)
   ============================================================ */

const CART_KEY = 'biopeptix_cart';

/* ── Formateador de precios COP (self-contained) ────────── */
const formatPriceCart = (amount) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

const Cart = (() => {
  // ── State ──────────────────────────────────────────────
  let items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

  const save = () => localStorage.setItem(CART_KEY, JSON.stringify(items));

  // ── Public API ─────────────────────────────────────────
  const getItems  = () => items;
  const getCount  = () => items.reduce((s, i) => s + i.qty, 0);
  const getTotal  = () => items.reduce((s, i) => s + i.price * i.qty, 0);

  const add = (product, requestedQty = 1) => {
    const idx = items.findIndex(i => i.id === product.id);
    if (idx > -1) { items[idx].qty += requestedQty; }
    else           { items.push({ ...product, qty: requestedQty }); }
    save();
    renderCart();
    updateBadge();
    openDrawer();           // ← Abre el drawer automáticamente al agregar
    Workflows.onCartActivity();
  };

  const remove = (id) => {
    items = items.filter(i => i.id !== id);
    save();
    renderCart();
    updateBadge();
  };

  const changeQty = (id, delta) => {
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0) return;
    items[idx].qty = Math.max(1, items[idx].qty + delta);
    save();
    renderCart();
    updateBadge();
  };

  const clear = () => {
    items = [];
    save();
    renderCart();
    updateBadge();
  };

  // ── Badge ──────────────────────────────────────────────
  const updateBadge = () => {
    const badges = document.querySelectorAll('.cart-count');
    const count  = getCount();
    badges.forEach(b => {
      b.textContent = count;
      b.classList.toggle('hidden', count === 0);
      b.classList.add('bump');
      b.addEventListener('animationend', () => b.classList.remove('bump'), { once: true });
    });
  };

  // ── Render Drawer ──────────────────────────────────────
  const renderCart = () => {
    const body = document.getElementById('cart-body');
    if (!body) return;

    if (items.length === 0) {
      body.innerHTML = `
        <div class="cart-empty">
          <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p>Your cart is empty</p>
          <a href="shop.html" class="btn btn-primary btn-sm">Shop Now</a>
        </div>`;
      const subtotalEl = document.getElementById('cart-subtotal-val');
      if (subtotalEl) subtotalEl.textContent = formatPriceCart(0);
      return;
    }

    body.innerHTML = items.map(item => `
      <div class="cart-item">
        <img class="cart-item__img" src="${item.image || 'https://placehold.co/72x72/E8F7FA/1A8FA0?text=BP'}" alt="${item.name}" referrerpolicy="no-referrer">
        <div class="cart-item__info">
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__price">${formatPriceCart(item.price * item.qty)}</div>
          <div class="cart-item__qty">
            <button class="qty-btn" onclick="Cart.changeQty('${item.id}',-1)">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" onclick="Cart.changeQty('${item.id}',1)">+</button>
          </div>
        </div>
        <button class="cart-item__remove" title="Remove" onclick="Cart.remove('${item.id}')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>`).join('');

    const total = document.getElementById('cart-subtotal-val');
    if (total) total.textContent = formatPriceCart(getTotal());
  };

  // ── Open / Close Drawer ────────────────────────────────
  const openDrawer  = () => {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-overlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderCart();
  };
  const closeDrawer = () => {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  };

  // ── Init ───────────────────────────────────────────────
  const init = () => {
    updateBadge();
    document.querySelectorAll('.cart-btn, [data-open-cart]').forEach(el =>
      el.addEventListener('click', openDrawer));
    document.getElementById('cart-overlay')?.addEventListener('click', closeDrawer);
    document.getElementById('cart-close-btn')?.addEventListener('click', closeDrawer);
    document.getElementById('cart-checkout-btn')?.addEventListener('click', () => {
      if (items.length === 0) return;
      closeDrawer();
      window.location.href = 'cart.html';
    });
  };

  return { add, remove, changeQty, clear, getItems, getCount, getTotal, init, openDrawer, closeDrawer, updateBadge };
})();

/* ── Toast Helper ─────────────────────────────────────── */
function showToast(msg, type = '') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.addEventListener('DOMContentLoaded', Cart.init);
