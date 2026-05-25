/* ============================================================
   BIOPEPTIX — Product Data + Shop Rendering (shop.js)
   ============================================================ */

const PRODUCTS_KEY = 'biopeptix_products_v7';

/* ── i18n helper — lee la traducción actual de lang.js ─── */
const t = (key, fallback) => {
  try {
    const lang = localStorage.getItem('biopeptix_lang') || 'en';
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
  { id: 'TR15', name: 'TIRZEPATIDE 15mg', category: 'peptides', price: 400000, stock: 100, description: 'Dosis: 15mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=TIRZEPATIDE', featured: true },
  { id: 'TR30', name: 'TIRZEPATIDE 30mg', category: 'peptides', price: 600000, stock: 100, description: 'Dosis: 30mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=TIRZEPATIDE', featured: true },
  { id: 'RT10', name: 'RETATRUTIDE 10mg', category: 'peptides', price: 520000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=RETATRUTIDE', featured: false },
  { id: 'RT20', name: 'RETATRUTIDE 20mg', category: 'peptides', price: 1000000, stock: 100, description: 'Dosis: 20mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=RETATRUTIDE', featured: false },
  { id: 'RT40', name: 'RETATRUTIDE 40mg', category: 'peptides', price: 1800000, stock: 100, description: 'Dosis: 40mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=RETATRUTIDE', featured: false },
  { id: 'RT60', name: 'RETATRUTIDE 60mg', category: 'peptides', price: 2200000, stock: 100, description: 'Dosis: 60mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=RETATRUTIDE', featured: false },
  { id: 'CGL10', name: 'CAGRILINTIDE 10mg', category: 'peptides', price: 600000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=CAGRILINTIDE', featured: false },
  { id: 'RC10', name: 'Retatrutide 5mg + Cagrilintide 5mg', category: 'stacks', price: 900000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=STACK', featured: false },
  { id: 'TSM5', name: 'TESAMORELINE 5mg', category: 'peptides', price: 320000, stock: 100, description: 'Dosis: 5mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=TESAMORELINE', featured: false },
  { id: 'TSM10', name: 'TESAMORELINE 10mg', category: 'peptides', price: 400000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=TESAMORELINE', featured: false },
  { id: 'IP10', name: 'IPAMORELINE 10mg', category: 'peptides', price: 650000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=IPAMORELINE', featured: false },
  { id: 'BC10', name: 'BPC 157 10mg', category: 'peptides', price: 400000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=BPC+157', featured: false },
  { id: 'BT10', name: 'TB500 10mg', category: 'peptides', price: 400000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=TB500', featured: false },
  { id: 'BB10', name: 'BPC157 5mg + TB500 5mg', category: 'stacks', price: 400000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=STACK', featured: false },
  { id: 'BB20', name: 'BPC157 10mg + TB500 10mg', category: 'stacks', price: 600000, stock: 100, description: 'Dosis: 20mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=STACK', featured: false },
  { id: 'NJ500', name: 'NAD+ 500mg', category: 'peptides', price: 500000, stock: 100, description: 'Dosis: 500mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=NAD%2B', featured: false },
  { id: 'CU100', name: 'GHK-CU 100mg', category: 'peptides', price: 380000, stock: 100, description: 'Dosis: 100mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=GHK-CU', featured: false },
  { id: 'KP10', name: 'KPV 10mg', category: 'peptides', price: 200000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=KPV', featured: false },
  { id: 'P41', name: 'PT141 10mg', category: 'peptides', price: 300000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=PT141', featured: false },
  { id: '5AM', name: '5-amino-1mq 5mg', category: 'peptides', price: 300000, stock: 100, description: 'Dosis: 5mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=5-AMINO-1MQ', featured: false },
  { id: '10AM', name: '5-amino-1mq 10mg', category: 'peptides', price: 390000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=5-AMINO-1MQ', featured: false },
  { id: '50AM', name: '5-amino-1mq 50mg', category: 'peptides', price: 990000, stock: 100, description: 'Dosis: 50mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=5-AMINO-1MQ', featured: false },
  { id: 'SK10', name: 'SELANK 10mg', category: 'peptides', price: 200000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=SELANK', featured: false },
  { id: 'XA10', name: 'SEMAX 10mg', category: 'peptides', price: 200000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=SEMAX', featured: false },
  { id: '2S10', name: 'Péptido 2S10', category: 'peptides', price: 420000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=2S10', featured: false },
  { id: '2550', name: 'SS-31 50mg', category: 'peptides', price: 1500000, stock: 100, description: 'Dosis: 50mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=SS-31', featured: false },
  { id: '10AD', name: 'AOD9604 10mg', category: 'peptides', price: 300000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=AOD9604', featured: false },
  { id: 'CBL60', name: 'Cerebrolysin 60mg', category: 'peptides', price: 250000, stock: 100, description: 'Dosis: 60mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=Cerebrolysin', featured: false },
  { id: 'MS10', name: 'MOTS-C 10mg', category: 'peptides', price: 400000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=MOTS-C', featured: false },
  { id: 'MS20', name: 'MOTS-C 20mg', category: 'peptides', price: 700000, stock: 100, description: 'Dosis: 20mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=MOTS-C', featured: false },
  { id: 'MS40', name: 'MOTS-C 40mg', category: 'peptides', price: 1200000, stock: 100, description: 'Dosis: 40mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=MOTS-C', featured: false },
  { id: 'DS10', name: 'DSIP 10mg', category: 'peptides', price: 280000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=DSIP', featured: false },
  { id: 'CD5', name: 'CJC-1295 Whit DAC 5mg', category: 'peptides', price: 450000, stock: 100, description: 'Dosis: 5mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=CJC-1295', featured: false },
  { id: 'CND10', name: 'CJC-1295 Without DAC 10mg', category: 'peptides', price: 200000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=CJC-1295', featured: false },
  { id: 'CP10', name: 'CJC-1295 without DAC 5mg + Ipamorelin 5mg', category: 'stacks', price: 500000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=STACK', featured: false },
  { id: 'BBG70', name: 'GHK-CU 50mg + TB-500 10mg + BPC-157 10mg', category: 'stacks', price: 500000, stock: 100, description: 'Dosis: 70mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=STACK', featured: false },
  { id: 'KL80', name: 'BPC 157 10mg + GHK-CU 50mg + TB500 10mg + KPV 10mg', category: 'stacks', price: 650000, stock: 100, description: 'Dosis: 80mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=STACK', featured: false },
  { id: 'SLU5', name: 'SLU-PP-322 5mg', category: 'peptides', price: 450000, stock: 100, description: 'Dosis: 5mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=SLU-PP-322', featured: false },
  { id: 'IG1', name: 'IGF-1LR3 1mg', category: 'peptides', price: 400000, stock: 100, description: 'Dosis: 1mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=IGF-1LR3', featured: false },
  { id: 'ML10', name: 'Melanotan 2 10mg', category: 'peptides', price: 350000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=Melanotan', featured: false },
  { id: 'ET10', name: 'Epithalon 10mg', category: 'peptides', price: 250000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=Epithalon', featured: false },
  { id: 'ET50', name: 'Epithalon 50mg', category: 'peptides', price: 400000, stock: 100, description: 'Dosis: 50mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=Epithalon', featured: false },
  { id: 'TA10', name: 'Thymosin Alpha-1 10mg', category: 'peptides', price: 500000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=Thymosin', featured: false },
  { id: 'G610', name: 'GHRP-6 Acetate 10mg', category: 'peptides', price: 200000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=GHRP-6', featured: false },
  { id: 'KS10', name: 'KissPeptin-10 10mg', category: 'peptides', price: 430000, stock: 100, description: 'Dosis: 10mg', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=KissPeptin', featured: false },
  { id: 'BA03', name: 'Benzyl Alcoh 0.9% 3ml', category: 'accessories', price: 20000, stock: 100, description: 'Dosis: 3ml', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=Benzyl', featured: false },
  { id: 'BA50', name: 'Benzyl Alcoh 0.9% 50ml', category: 'accessories', price: 150000, stock: 100, description: 'Dosis: 50ml', image: 'https://placehold.co/400x300/f8f9fa/1B3A5C?text=Benzyl', featured: false }
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
        <img src="${product.image || 'https://placehold.co/400x300/E8F7FA/1A8FA0?text=BioPeptix'}"
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
const _origApplyLang = window._biopeptix_applyLang;
document.addEventListener('biopeptix:langchange', () => {
  renderGrid();
  renderFeatured();
});
