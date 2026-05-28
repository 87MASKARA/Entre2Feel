/* ============================================================
   ENTRE2FIT — Dedicated Cart Page Logic (cart-page.js)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof Cart !== 'undefined' && typeof Cart.init === 'function') {
    Cart.init(); // Ensure cart data is loaded from local storage
  }
  renderCartPage();

  // Listen for storage changes in case cart is updated in another tab
  window.addEventListener('storage', (e) => {
    if (e.key === 'entre2fit_cart') {
      if (typeof Cart !== 'undefined') Cart.init();
      renderCartPage();
    }
  });
});

function renderCartPage() {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  const items = (typeof Cart !== 'undefined' && Cart.getItems) ? Cart.getItems() : [];
  
  const lang = localStorage.getItem('entre2fit_lang') || 'en';
  const t_empty = lang === 'es' ? 'Tu carrito está vacío.' : 'Your cart is empty.';
  const t_shop = lang === 'es' ? 'Ir a la tienda' : 'Browse Shop';
  const t_prod = lang === 'es' ? 'Producto' : 'Product';
  const t_price = lang === 'es' ? 'Precio' : 'Price';
  const t_qty = lang === 'es' ? 'Cantidad' : 'Quantity';
  const t_sub = lang === 'es' ? 'Subtotal' : 'Subtotal';
  const t_cart_totals = lang === 'es' ? 'Total del carrito' : 'Cart Totals';
  const t_checkout = lang === 'es' ? 'Proceder al pago' : 'Proceed to Checkout';

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-msg" style="grid-column:1/-1;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <p>${t_empty}</p>
        <a href="shop.html" class="btn btn-primary">${t_shop}</a>
      </div>
    `;
    return;
  }

  const formatPrice = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);

  let tableRows = items.map(item => `
    <tr>
      <td>
        <div class="cart-item-info">
          <a href="product.html?id=${item.id}"><img src="${item.image}" alt="${item.name}" referrerpolicy="no-referrer"></a>
          <a href="product.html?id=${item.id}" class="cart-item-title">${item.name}</a>
        </div>
      </td>
      <td class="cart-item-price">${formatPrice(item.price)}</td>
      <td>
        <div class="cart-qty-ctrl">
          <button onclick="updateCartPageQty('${item.id}', -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateCartPageQty('${item.id}', 1)">+</button>
        </div>
      </td>
      <td class="cart-item-price">${formatPrice(item.price * item.qty)}</td>
      <td style="text-align:right;">
        <button class="cart-item-remove" onclick="removeCartPageItem('${item.id}')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');

  const total = items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  container.innerHTML = `
    <!-- Left: Table -->
    <div class="cart-table-wrap" style="overflow-x:auto;">
      <table class="cart-table">
        <thead>
          <tr>
            <th>${t_prod}</th>
            <th>${t_price}</th>
            <th>${t_qty}</th>
            <th>${t_sub}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>

    <!-- Right: Totals -->
    <div>
      <div class="cart-totals-box">
        <h3>${t_cart_totals}</h3>
        <div class="cart-totals-row">
          <span>${t_sub}</span>
          <span style="font-weight:600;">${formatPrice(total)}</span>
        </div>
        <div class="cart-totals-row total">
          <span>Total</span>
          <span>${formatPrice(total)}</span>
        </div>
        <button class="btn btn-primary checkout-btn" onclick="window.location.href='checkout.html'">
          ${t_checkout}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  `;
}

// Global functions for inline onclick handlers
window.updateCartPageQty = function(id, delta) {
  Cart.changeQty(id, delta);
  renderCartPage(); // Re-render the full page
};

window.removeCartPageItem = function(id) {
  Cart.remove(id);
  renderCartPage(); // Re-render the full page
};
