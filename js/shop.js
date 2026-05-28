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
  {
    id: 'E2F-KIT',
    name: 'Kit Protocolo Integral BALANCE FEEL',
    category: 'kits',
    price: 180000,
    originalPrice: 415000,
    stock: 100,
    featured: true,
    image: 'images/products/kit balance.png',
    video: 'videos/products/kit balance.mp4',
    badge: 'Más Vendido',
    description: 'El protocolo médico-nutricional completo diseñado para desinflamar tu cuerpo, eliminar la retención de líquidos y reactivar tu metabolismo de manera 100% natural. Sin gluten, sin lácteos, anti-inflamatorio.',
    longDescription: 'BALANCE FEEL es más que un protocolo nutricional. Es un movimiento de amor propio. Diseñado especialmente para mujeres que han intentado todo sin resultados, este protocolo ataca la raíz del problema: la inflamación. No estás gorda, estás inflamada. Y ahora tienes las herramientas para desinflamarte.',
    includes: [
      'Gotas Lipo Drean Complex (fórmula estrella)',
      'Protocolo Detox de 21 días',
      'Sal Rosada del Himalaya orgánica',
      'Guía de Alimentación Antiinflamatoria',
      'Plan de Ejercicios de Drenaje Linfático en PDF'
    ],
    faqs: [
      { q: '¿Qué incluye el Kit BALANCE FEEL?', a: 'El kit incluye las Gotas Lipo Drean Complex, el Protocolo Detox, la Sal Rosada del Himalaya, la Guía de Alimentación Antiinflamatoria y el Plan de Ejercicios de Drenaje Linfático en PDF.' },
      { q: '¿En cuánto tiempo veo resultados?', a: 'Hemos visto que la mayoría de personas comienzan a ver resultados visibles (reducción de inflamación, menos retención de líquidos) entre los primeros 15 a 20 días de uso constante.' },
      { q: '¿Para quién está diseñado el protocolo?', a: 'Está diseñado para personas que buscan desinflamar su cuerpo, eliminar la retención de líquidos, controlar la ansiedad y reactivar su metabolismo de manera 100% natural.' },
      { q: '¿Cómo se realiza el envío?', a: 'Realizamos envíos a toda Colombia. Tu pedido llega en 2 a 4 días hábiles dependiendo de tu ciudad.' },
      { q: '¿El embalaje es discreto?', a: 'Sí, garantizamos un empaque completamente discreto sin marcas externas que revelen el contenido de tu pedido.' },
      { q: '¿Cuáles son los métodos de pago?', a: 'Aceptamos Mercado Pago: tarjeta de crédito, débito, PSE y Efecty.' }
    ]
  },
  {
    id: 'E2F-GOTAS',
    name: 'Gotas Lipo Drean Complex',
    category: 'suplementos',
    price: 130000,
    originalPrice: 200000,
    stock: 100,
    featured: true,
    image: 'images/products/lipo drean complex.png',
    video: null,
    badge: 'Fórmula Estrella',
    description: 'Nuestra fórmula estrella concentrada para regular la ansiedad de picar dulces, desinflamar el organismo y reparar progresivamente tu metabolismo desde adentro.',
    longDescription: 'Las Gotas Lipo Drean Complex son el corazón del Método Lipodrean. Esta fórmula única actúa directamente sobre los procesos inflamatorios del cuerpo, ayudando a reactivar el drenaje linfático natural, reducir la retención de líquidos y controlar el apetito ansioso. No atacamos el peso, atacamos la inflamación.',
    includes: [],
    faqs: [
      { q: '¿Cómo se toman las gotas?', a: 'Se toman según el protocolo indicado en el kit. Generalmente se administran en ayunas para maximizar su absorción y efectividad.' },
      { q: '¿Cuánto dura un frasco?', a: 'Un frasco está diseñado para completar el ciclo de 21 días del protocolo BALANCE FEEL.' },
      { q: '¿Tienen algún efecto secundario?', a: 'La fórmula es 100% natural. Sin embargo, si tienes alguna condición médica o estás embarazada, consulta con tu médico antes de iniciar.' },
      { q: '¿En cuánto tiempo veo resultados?', a: 'Muchas personas reportan sentirse más livianas y con menos retención de líquidos desde la primera semana. Los resultados visibles en báscula suelen aparecer entre los días 15 y 20.' },
      { q: '¿Cómo se realiza el envío?', a: 'Realizamos envíos a toda Colombia. Tu pedido llega en 2 a 4 días hábiles.' },
      { q: '¿Cuáles son los métodos de pago?', a: 'Aceptamos Mercado Pago: tarjeta de crédito, débito, PSE y Efecty.' }
    ]
  },
  {
    id: 'E2F-SAL',
    name: 'Sal Rosada del Himalaya',
    category: 'suplementos',
    price: 25000,
    originalPrice: 35000,
    stock: 100,
    featured: false,
    image: 'images/products/sal rosada del himalaya.png',
    video: 'videos/products/sal rosada del himalaya.mp4',
    badge: '100% Natural',
    description: 'Sal orgánica rosada del Himalaya, 100% pura y sin conservantes ni aditivos. Aporta más de 80 minerales y electrolitos esenciales para una hidratación celular profunda sin inflamarte.',
    longDescription: 'A diferencia de la sal de mesa común (procesada y con aditivos), la Sal Rosada del Himalaya es extraída de depósitos naturales de más de 250 millones de años. Su color rosa característico se debe a su riqueza en hierro y otros minerales traza. Es el complemento perfecto para el protocolo antiinflamatorio BALANCE FEEL.',
    includes: [],
    faqs: [
      { q: '¿Cuál es el contenido del empaque?', a: 'Disponible en presentación de 500g y 1000g. Sin conservantes ni aditivos, 100% natural.' },
      { q: '¿Por qué es mejor que la sal normal?', a: 'La sal rosada del Himalaya contiene más de 80 minerales y oligoelementos en su forma natural, sin procesar ni blanquear. Ayuda a regular el pH del cuerpo, la presión arterial y mejora la salud cardiovascular.' },
      { q: '¿Cómo se usa en el protocolo BALANCE FEEL?', a: 'Se usa como reemplazo de la sal de mesa en todas tus preparaciones. Sazona tus comidas, prepara agua mineralizada o úsala en el protocolo de hidratación indicado en la guía.' },
      { q: '¿Cuáles son los métodos de pago?', a: 'Aceptamos Mercado Pago: tarjeta de crédito, débito, PSE y Efecty.' }
    ]
  },
  {
    id: 'E2F-COLAGENO',
    name: 'Péptidos de Colágeno Bioactivo',
    category: 'suplementos',
    price: 80000,
    originalPrice: 120000,
    stock: 100,
    featured: false,
    image: 'images/products/colageno.png',
    video: 'videos/products/como identificar un buen colágeno.mp4',
    badge: '4x más potente',
    description: 'Péptidos de colágeno bioactivo, 4 veces más potentes que el colágeno hidrolizado normal. Mejora tu piel, articulaciones, cabello y salud digestiva desde adentro.',
    longDescription: 'Después de los 25 años nuestro cuerpo deja de producir colágeno de manera eficiente. A diferencia del colágeno hidrolizado común, nuestros péptidos bioactivos son cortados mediante tecnología de enzimas en fragmentos ultra-pequeños que el cuerpo absorbe hasta 4 veces más rápido y de manera más eficiente.',
    includes: [],
    faqs: [
      { q: '¿En qué horario se puede tomar el colágeno?', a: 'Lo puedes tomar en cualquier horario, sin embargo, hemos visto mejores resultados cuando se toma en ayunas.' },
      { q: '¿Se puede mezclar con cualquier bebida?', a: 'Lo puedes mezclar con la bebida de tu preferencia. Nuestros péptidos no tienen sabor, así que va bien con todo, inclusive se lo puedes agregar a una sopa.' },
      { q: '¿Al cuánto tiempo de consumir el producto veo resultados?', a: 'Todos los organismos son diferentes. Sin embargo, hemos tenido casos de personas que a las dos semanas de consumir los péptidos de colágeno en ayunas comienzan a ver resultados en piel, cabello y articulaciones.' },
      { q: '¿Cuáles son los métodos de pago?', a: 'Aceptamos Mercado Pago: tarjeta de crédito, débito, PSE y Efecty.' }
    ]
  },
  {
    id: 'E2F-METABOLIS',
    name: 'Metabolism Repairer',
    category: 'suplementos',
    price: 90000,
    originalPrice: 140000,
    stock: 100,
    featured: false,
    image: 'images/products/metabolis.png',
    video: null,
    badge: '5 en 1',
    description: 'Suplemento nutricional 5 en 1 que combina Magnesio, Potasio, Zinc, Glutamina y Vitamina C para reparar tu metabolismo, mejorar tu sueño, reducir el estrés y fortalecer tu sistema inmunológico.',
    longDescription: 'Metabolism Repairer es la fórmula completa que tu cuerpo necesita para funcionar de manera óptima. Cada ingrediente fue seleccionado estratégicamente: el Magnesio apoya más de 300 procesos bioquímicos y promueve un sueño profundo; el Potasio regula la presión arterial y la salud cardiovascular; el Zinc fortalece el sistema inmune y la salud de piel, cabello y uñas; la Glutamina apoya la recuperación muscular y la salud intestinal; y la Vitamina C actúa como poderoso antioxidante y favorece la producción de colágeno.',
    includes: [],
    faqs: [
      { q: '¿En qué horario se puede tomar el Metabolism Repairer?', a: 'Debes tomar dos cápsulas media hora antes de dormir para maximizar su efecto reparador durante el descanso nocturno.' },
      { q: '¿Se puede tomar con cualquier bebida?', a: 'Puedes tomar las cápsulas con la bebida de tu preferencia, pero como se toman en la noche, procura que no sea una bebida estimulante para no afectar tu sueño reparador.' },
      { q: '¿Al cuánto tiempo veo resultados?', a: 'Hemos tenido casos de personas que en la primera semana comienzan a ver resultados: reducción del estrés y la ansiedad, sueño más profundo y mayor energía durante el día.' },
      { q: '¿Cuáles son los métodos de pago?', a: 'Aceptamos Mercado Pago: tarjeta de crédito, débito, PSE y Efecty.' }
    ]
  }
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
