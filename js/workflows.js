/* ============================================================
   ENTRE2FEEL — Automation Workflows (workflows.js)
   ============================================================ */

const Workflows = (() => {
  // ── Config (set from admin settings panel) ─────────────
  const CFG_KEY   = 'entre2feel_workflow_config';
  const DEFAULTS  = {
    abandonedCartEnabled: true,
    abandonedCartUrl:     '/api/abandoned-cart',
    purchaseConfirmUrl:   '/api/checkout',
    leadRegistrationUrl:  '/api/leads'
  };
  const getConfig = () => ({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(CFG_KEY) || '{}') });

  const post = async (url, payload) => {
    if (!url) { console.info('[Entre2Feel Workflows] No webhook URL configured.', payload); return; }
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) { console.error('[Entre2Feel Workflows] Webhook error:', e); }
  };

  // ── 1. Abandoned Cart ──────────────────────────────────
  let abandonedCartTimer = null;
  const ABANDONED_MS = 2 * 60 * 60 * 1000; // 2 hours

  const onCartActivity = () => {
    clearTimeout(abandonedCartTimer);
    const cfg = getConfig();
    if (!cfg.abandonedCartEnabled) return;

    abandonedCartTimer = setTimeout(() => {
      const cart = JSON.parse(localStorage.getItem('entre2feel_cart') || '[]');
      if (cart.length === 0) return;

      const payload = {
        event: 'abandoned_cart',
        timestamp: new Date().toISOString(),
        cart_items: cart,
        cart_total: cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2),
        recovery_url: window.location.origin + '/shop.html'
      };

      console.info('[Workflow] Abandoned Cart triggered:', payload);
      post(cfg.abandonedCartUrl, payload);
    }, ABANDONED_MS);
  };

  // ── 2. Purchase Confirmation ───────────────────────────
  const onCheckout = (orderData) => {
    const cfg = getConfig();
    const payload = {
      event: 'purchase_confirmation',
      timestamp: new Date().toISOString(),
      order_id: 'BP-' + Date.now(),
      customer_email: orderData.email || '',
      items: orderData.items,
      total: orderData.total.toFixed(2),
      notify_admin: cfg.adminEmail || ''
    };
    console.info('[Workflow] Purchase Confirmation triggered:', payload);
    post(cfg.purchaseConfirmUrl, payload);
  };

  // ── 3. Lead Registration ───────────────────────────────
  const onLeadSubmit = (formData) => {
    const cfg = getConfig();
    const payload = {
      event: 'lead_registration',
      timestamp: new Date().toISOString(),
      name:    formData.name,
      email:   formData.email,
      message: formData.message || '',
      tag:     'Web Lead',
      source:  'Contact Form'
    };
    console.info('[Workflow] Lead Registration triggered:', payload);
    post(cfg.leadRegistrationUrl, payload);
  };

  // ── Config Save (from admin settings) ─────────────────
  const saveConfig = (data) => {
    localStorage.setItem(CFG_KEY, JSON.stringify(data));
    console.info('[Workflows] Config saved:', data);
  };

  return { onCartActivity, onCheckout, onLeadSubmit, saveConfig, getConfig };
})();
