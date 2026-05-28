/* ============================================================
   ENTRE2FIT — Product Details Logic (product.js)
   ============================================================ */

/* ── i18n helper ── */
const pdpT = (key, fallback) => {
  try {
    const lang = localStorage.getItem('entre2fit_lang') || 'en';
    return (window.translations && window.translations[lang] && window.translations[lang][key])
      ? window.translations[lang][key]
      : fallback;
  } catch (_) { return fallback; }
};

/* ── Main init function (called on load and on language change) ── */
async function initProductPage() {
  // 1. Get Product ID from URL
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    document.getElementById('pdp-container').innerHTML = '<div style="text-align:center;padding:5rem;"><h2>Product not found</h2><a href="shop.html" class="btn btn-primary mt-4">Return to Shop</a></div>';
    return;
  }

  // 2. Fetch Product Data
  const products = typeof fetchProducts === 'function' ? await fetchProducts() : [];
  const product = products.find(p => p.id === productId);

  if (!product) {
    document.getElementById('pdp-container').innerHTML = '<div style="text-align:center;padding:5rem;"><h2>Product not found</h2><a href="shop.html" class="btn btn-primary mt-4">Return to Shop</a></div>';
    return;
  }

  // 3. Populate UI
  document.title = `${product.name} — Entre2Fit`;
  document.getElementById('pdp-crumb-name').textContent = product.nameShort || product.name;
  document.getElementById('pdp-title').textContent = product.nameShort || product.name;

  // ── FREE SHIPPING BADGE ──────────────────────────────────────────────────
  let freeShipEl = document.getElementById('pdp-free-shipping');
  if (!freeShipEl) {
    freeShipEl = document.createElement('div');
    freeShipEl.id = 'pdp-free-shipping';
    freeShipEl.className = 'pdp-free-shipping';
    const priceWrap = document.getElementById('pdp-price-wrap');
    if (priceWrap) priceWrap.insertAdjacentElement('afterend', freeShipEl);
  }
  freeShipEl.style.display = product.freeShipping ? 'flex' : 'none';
  freeShipEl.innerHTML = product.freeShipping
    ? `<span class="pdp-ship-icon">🚚</span> <strong>Envío GRATIS</strong> a toda Colombia`
    : '';

  // ── VARIANT SELECTOR ─────────────────────────────────────────────────────
  let variantWrap = document.getElementById('pdp-variant-wrap');
  if (!variantWrap) {
    variantWrap = document.createElement('div');
    variantWrap.id = 'pdp-variant-wrap';
    const actionArea = document.querySelector('.pdp-action-area');
    if (actionArea) actionArea.insertAdjacentElement('beforebegin', variantWrap);
  }
  if (product.variants && product.variants.length > 1) {
    variantWrap.innerHTML = `
      <div class="pdp-variant-label">Presentación:</div>
      <div class="pdp-variant-btns">
        ${product.variants.map(v => `
          <a href="product.html?id=${v.id}"
             class="pdp-variant-btn${v.id === product.id ? ' active' : ''}">
            ${v.label}
          </a>
        `).join('')}
      </div>
    `;
    variantWrap.style.display = 'block';
  } else {
    variantWrap.style.display = 'none';
  }
  
  // Dynamic title: "PRODUCT NAME in Colombia" / "PRODUCT NAME en Colombia"
  const titleSuffix = pdpT('pdp_desc_title_suffix', 'en Colombia');
  const titleCol = document.getElementById('pdp-desc-title-col');
  if (titleCol) titleCol.textContent = `${product.name} ${titleSuffix}`;
  
  // Long description
  const longDesc = document.getElementById('pdp-desc-text');
  if (longDesc) {
    const bodyText = product.longDescription || product.description || '';
    longDesc.innerHTML = `<strong>${product.name}</strong> — ${bodyText}`;
  }

  // "Includes" list (for Kit and products with includes array)
  const includesEl = document.getElementById('pdp-includes-list');
  if (includesEl) {
    if (product.includes && product.includes.length > 0) {
      includesEl.innerHTML = product.includes.map(item => `<li>✅ ${item}</li>`).join('');
      document.getElementById('pdp-includes-wrap').style.display = 'block';
    } else {
      document.getElementById('pdp-includes-wrap').style.display = 'none';
    }
  }
  
  // Image
  const imgEl = document.getElementById('pdp-image');
  imgEl.src = product.image || 'https://placehold.co/600x600/E8F7FA/1A8FA0?text=Entre2Fit';
  imgEl.alt = product.name;
  imgEl.referrerPolicy = "no-referrer";
  
  const imgCol = imgEl.parentElement;
  imgCol.style.position = 'relative';
  const existingOverlay = imgCol.querySelector('.pdp-out-of-stock-overlay');
  if (existingOverlay) existingOverlay.remove();
  
  if (product.stock <= 0) {
    imgEl.style.opacity = '0.6';
    imgEl.style.filter = 'grayscale(100%)';
    const overlay = document.createElement('div');
    overlay.className = 'pdp-out-of-stock-overlay';
    overlay.style.cssText = 'position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;z-index:2;background:rgba(255,255,255,0.2);';
    overlay.innerHTML = `<span style="background:#dc3545;color:white;padding:0.5rem 1.5rem;border-radius:6px;font-weight:800;font-size:1.5rem;letter-spacing:1px;text-transform:uppercase;box-shadow:0 4px 15px rgba(0,0,0,0.2);">${pdpT('out_of_stock', 'Sin Stock')}</span>`;
    imgCol.appendChild(overlay);
  } else {
    imgEl.style.opacity = '1';
    imgEl.style.filter = 'none';
  }

  // Formatting price
  const formatPrice = (amount) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  
  document.getElementById('pdp-price').textContent = formatPrice(product.price);
  if (product.originalPrice) {
    document.getElementById('pdp-price-original').textContent = formatPrice(product.originalPrice);
    document.getElementById('pdp-price-original').style.display = 'inline';
  } else {
    document.getElementById('pdp-price-original').style.display = 'none';
  }

  // ── VIDEO BUTTON ──────────────────────────────────────────────────────────
  const videoBtnWrap = document.getElementById('pdp-video-btn-wrap');
  const videoPlayer  = document.getElementById('pdp-video-player');
  const videoModal   = document.getElementById('pdp-video-modal');
  const videoClose   = document.getElementById('pdp-video-close');
  const videoBackdrop = document.getElementById('pdp-video-backdrop');

  if (product.video && videoBtnWrap) {
    videoBtnWrap.style.display = 'block';
    const openModal = () => {
      videoPlayer.src = product.video;
      videoModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      videoPlayer.play().catch(() => {});
    };
    const closeModal = () => {
      videoModal.style.display = 'none';
      videoPlayer.pause();
      videoPlayer.src = '';
      document.body.style.overflow = '';
    };
    document.getElementById('pdp-video-btn').onclick = openModal;
    if (videoClose) videoClose.onclick = closeModal;
    if (videoBackdrop) videoBackdrop.onclick = closeModal;
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  } else if (videoBtnWrap) {
    videoBtnWrap.style.display = 'none';
  }

  // Handle Certificate Image Display
  if (product.certificate) {
    const certArea = document.getElementById('pdp-cert-area');
    if (certArea) {
      document.getElementById('pdp-cert-title-h3').style.display = 'block';
      const certImg = document.createElement('img');
      certImg.src = product.certificate;
      certImg.alt = "Certificate";
      certImg.referrerPolicy = "no-referrer";
      certImg.style.width = "100%";
      certImg.style.borderRadius = "8px";
      certImg.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
      const certLink = document.createElement('a');
      certLink.href = product.certificate;
      certLink.target = "_blank";
      certLink.referrerPolicy = "no-referrer";
      certLink.appendChild(certImg);
      certArea.appendChild(certLink);
    }
  }

  const stockEl = document.getElementById('pdp-stock');
  if (stockEl) {
    if (product.stock > 10) {
      stockEl.textContent = pdpT('pdp_stock_in', 'In Stock — Ships in 24h');
      stockEl.className = 'pdp-stock in';
    } else if (product.stock > 0) {
      stockEl.textContent = `${pdpT('pdp_stock_low', 'Low Stock — Only')} ${product.stock} ${pdpT('pdp_stock_low2', 'left')}`;
      stockEl.className = 'pdp-stock low';
    } else {
      stockEl.textContent = pdpT('pdp_stock_out', 'Out of Stock');
      stockEl.className = 'pdp-stock out';
    }
  }
  
  if (!product.stock || product.stock <= 0) {
    const addBtnEl = document.getElementById('pdp-add-btn');
    const buyBtnEl = document.getElementById('pdp-buy-btn');
    if (addBtnEl) {
      addBtnEl.disabled = true;
      addBtnEl.textContent = pdpT('out_of_stock', 'Sin Stock');
    }
    if (buyBtnEl) buyBtnEl.disabled = true;
  } else {
    const addBtnEl = document.getElementById('pdp-add-btn');
    const buyBtnEl = document.getElementById('pdp-buy-btn');
    if (addBtnEl) {
      addBtnEl.disabled = false;
      addBtnEl.textContent = pdpT('pdp_add_cart', 'Añadir al Carrito');
    }
    if (buyBtnEl) buyBtnEl.disabled = false;
  }

  // 4. Quantity Controls
  const qtyInput = document.getElementById('pdp-qty-input');
  if (qtyInput) {
    qtyInput.removeAttribute('readonly');
  }

  // 5. Add to Cart Logic
  const addBtn = document.getElementById('pdp-add-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
      if (typeof Cart !== 'undefined') {
        Cart.add(product, qty);
        if (typeof Cart.openDrawer === 'function') {
          Cart.openDrawer();
        }
      }
    };
  }

  // ── 6. DYNAMIC FAQs ──────────────────────────────────────────────────────
  const accordion = document.getElementById('pdp-accordion');
  if (accordion && product.faqs && product.faqs.length > 0) {
    accordion.innerHTML = product.faqs.map((faq, i) => `
      <div class="pdp-acc-item${i === 0 ? ' active' : ''}">
        <button class="pdp-acc-btn">
          <span>${faq.q}</span>
          <span class="plus-icon">+</span>
        </button>
        <div class="pdp-acc-content"${i === 0 ? ' style="max-height:500px;"' : ''}>
          <div class="pdp-acc-content-inner">${faq.a}</div>
        </div>
      </div>
    `).join('');
  }

  // 7. Accordions interaction
  const accBtns = document.querySelectorAll('.pdp-acc-btn');
  accBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const content = item.querySelector('.pdp-acc-content');
      const isActive = item.classList.contains('active');
      
      document.querySelectorAll('.pdp-acc-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.pdp-acc-content').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";
      }
    });
  });

  // Initialize first accordion open
  const firstAccContent = document.querySelector('.pdp-acc-item.active .pdp-acc-content');
  if (firstAccContent) {
    firstAccContent.style.maxHeight = firstAccContent.scrollHeight + "px";
  }

  // 8. Render Related Products
  renderRelatedProducts(product, products);
}

document.addEventListener('DOMContentLoaded', async () => {
  await initProductPage();
});

// Re-render when language changes
document.addEventListener('entre2fit:langchange', async () => {
  await initProductPage();
});

function renderRelatedProducts(currentProduct, allProducts) {
  const grid = document.getElementById('related-grid');
  if (!grid) return;

  // Filter by same category, exclude current, grab 4 random
  let related = allProducts.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id);
  if (related.length < 4) {
    // Fill with random products if not enough in category
    const others = allProducts.filter(p => p.id !== currentProduct.id && !related.includes(p));
    related = related.concat(others).slice(0, 4);
  } else {
    related = related.sort(() => 0.5 - Math.random()).slice(0, 4);
  }

  if (typeof renderCard === 'function') {
    grid.innerHTML = related.map(p => renderCard(p)).join('');
  }
}
