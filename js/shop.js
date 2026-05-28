/* ============================================================
   ENTRE2FIT — Product Data + Shop Rendering (shop.js)
   ============================================================ */

const PRODUCTS_KEY = 'entre2fit_products_v7';

/* ── i18n helper — lee la traducción actual de lang.js ─── */
const t = (key, fallback) => {
  try {
    const lang = localStorage.getItem('entre2fit_lang') || 'en';
    return (window.translations && window.translations[lang] && window.translations[lang][key])
      ? window.translations[lang][key]
      : fallback;
  } catch (_) { return fallback; }
};

/* ── Default Seed Products ─────────────────────────────── */
const formatPrice = (amount) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
};

const DEFAULT_PRODUCTS = [
  { id: 'E2F-KIT', name: 'Kit Protocolo Integral BALANCE FEEL', category: 'peptides', price: 180000, originalPrice: 415000, stock: 100, description: 'El protocolo completo que te ayuda a desinflamar tu cuerpo, eliminar la retención de líquidos y encender nuevamente tu metabolismo sin dietas extremas ni rebotes. Incluye: Gotas Lipo Drean Complex, Protocolo Detox, Sal Rosada del Himalaya, Guía de Alimentación Antiinflamatoria y Plan de Ejercicios en PDF.', image: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/axN0gPIgxQr8rG0tyPSN/media/69ab5b56b3fc00ce6534f016.jpeg', featured: true },
  { id: 'E2F-GOTAS', name: 'Gotas Lipo Drean Complex', category: 'peptides', price: 130000, originalPrice: 200000, stock: 100, description: 'Nuestra fórmula estrella concentrada para ayudarte a regular la ansiedad de picar dulces, desinflamar el organismo y reparar progresivamente tu metabolismo.', image: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/axN0gPIgxQr8rG0tyPSN/media/69ab5a2cb2a2741dd0d43850.jpeg', featured: true },
  { id: 'E2F-SAL', name: 'Sal Rosada del Himalaya', category: 'accessories', price: 25000, originalPrice: 35000, stock: 100, description: 'Sal pura rosada del Himalaya para aportar los minerales y electrolitos esenciales necesarios para una correcta hidratación celular sin inflamarte.', image: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/axN0gPIgxQr8rG0tyPSN/media/69ab5b56b3fc00ce6534f016.jpeg', featured: false },
  { id: 'E2F-DETOX', name: 'Protocolo Detox', category: 'peptides', price: 45000, originalPrice: 65000, stock: 100, description: 'Limpia tu organismo desde las primeras 24 horas y prepara tu cuerpo para absorber correctamente los nutrientes y comenzar la desinflamación.', image: 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_https://assets.cdn.filesafe.space/axN0gPIgxQr8rG0tyPSN/media/69ab5b56b3fc00ce6534f016.jpeg', featured: false }
];

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1-vsPu_yUAU0xPJMqwPupB3KP5daTx73PbpzfNyvRhl0/gviz/tq?tqx=out:csv&gid=1581422793';

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0].trim().split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    let row = [];
    let inQuotes = false;
    let currentVal = '';
    for (let char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { row.push(currentVal); currentVal = ''; }
      else currentVal += char;
    }
    row.push(currentVal);

    const obj = {};
    headers.forEach((h, j) => {
      obj[h] = row[j] ? row[j].trim().replace(/^"|"$/g, '') : '';
    });
    results.push(obj);
  }
  return results;
}

/* ── Fetch Products from Google Sheets ── */
const fetchProducts = async () => {
  try {
    const response = await fetch('/api/products');
    if (!response.ok) throw new Error('Cannot read products from API');
    
    const products = await response.json();
    
    if (products.error) throw new Error(products.error);
    
    // Save a backup copy in case offline later
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    return products;
  } catch (error) {
    console.error('Error loading API, falling back to local:', error);
    const stored = localStorage.getItem(PRODUCTS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PRODUCTS;
  }
};

/* ── Render Product Card ───────────────────────────────── */
const renderCard = (product, isFeatured = false) => {
  const btnLabel = product.stock <= 0 ? t('out_of_stock', 'Out of Stock') : t('add_to_cart', 'Add to Cart');
  return `
    <div class="product-card" data-category="${product.category}" data-id="${product.id}">
      <a href="product.html?id=${product.id}" class="product-card__img-wrap" style="display:block; position:relative;">
        <img src="${product.image || 'https://placehold.co/400x300/E8F7FA/1A8FA0?text=Entre2Fit'}"
             alt="${product.name}" loading="lazy" referrerpolicy="no-referrer" ${product.stock <= 0 ? 'style="opacity:0.6; filter:grayscale(100%);"' : ''}>
        <span class="product-card__badge badge badge-teal" style="text-transform:capitalize;">${product.category}</span>
        ${product.stock <= 0 ? `<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:2;background:rgba(255,255,255,0.2);"><span style="background:#dc3545;color:white;padding:0.4rem 1rem;border-radius:4px;font-weight:700;font-size:1rem;letter-spacing:1px;text-transform:uppercase;box-shadow:0 4px 12px rgba(0,0,0,0.15);">${t('out_of_stock', 'Sin Stock')}</span></div>` : ''}
      </a>
      <div class="product-card__body">
        <a href="product.html?id=${product.id}" style="text-decoration:none;color:inherit;">
          <div class="product-card__name" style="cursor:pointer;">${product.name}</div>
        </a>

        <div class="product-card__footer">
          <div class="product-card__price">
            ${formatPrice(product.price)}
            ${product.originalPrice ? `<span>${formatPrice(product.originalPrice)}</span>` : ''}
          </div>
          <button class="add-to-cart-btn"
            ${product.stock <= 0 ? 'disabled' : ''}
            onclick="handleAddToCart('${product.id}', this)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            ${btnLabel}
          </button>
        </div>
      </div>
    </div>`;
};

/* ── Add to Cart Handler ───────────────────────────────── */
async function handleAddToCart(productId, btn) {
  const products = await fetchProducts();
  const product  = products.find(p => p.id === productId);
  if (!product) return;

  // Feedback visual en el botón (con texto traducido)
  btn.classList.add('added');
  btn.disabled = true;
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ${t('added', 'Added!')}`;

  Cart.add(product); // Abre el drawer automáticamente

  setTimeout(() => {
    btn.classList.remove('added');
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> ${t('add_to_cart', 'Add to Cart')}`;
  }, 2000);
}

/* ── Filter & Render Grid ─────────────────────────────── */
let currentFilter = 'all';

const renderGrid = async (filter = 'all') => {
  currentFilter = filter;
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  const products = await fetchProducts();
  const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

  if (filtered.length === 0) {
    const noResultsMsg = t('no_products', 'No products found in this category.');
    grid.innerHTML = `<div class="no-results"><p>${noResultsMsg}</p></div>`;
    return;
  }
  grid.innerHTML = filtered.map(p => renderCard(p)).join('');
};

/* ── Featured Products (index.html) ───────────────────── */
const renderFeatured = async () => {
  const container = document.getElementById('featured-grid');
  if (!container) return;
  const products = await fetchProducts();
  const featured = products.filter(p => p.featured).slice(0, 3);
  container.innerHTML = featured.map(p => renderCard(p, true)).join('');
};

/* ── Filter Buttons ───────────────────────────────────── */
const initFilters = () => {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(btn.dataset.filter);
    });
  });
};

/* ── Init ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
  renderFeatured();
  initFilters();
});

/* ── Re-render when language changes ───────────────────── */
// Escucha cambios de idioma: cuando lang.js actualiza localStorage, volvemos
// a renderizar la grilla para que los botones se traduzcan al instante.
const _origApplyLang = window._entre2fit_applyLang;
document.addEventListener('entre2fit:langchange', () => {
  renderGrid();
  renderFeatured();
});
