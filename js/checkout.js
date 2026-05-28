/**
 * checkout.js — Entre2Fit Checkout con Mercado Pago Checkout Bricks
 * Optimizado para la venta de un ÚNICO producto principal: Kit Protocolo Integral BALANCE FEEL.
 */

(function () {
  "use strict";

  // ── Producto Único: Protocolo Integral BALANCE FEEL ─────────────────────────
  const SINGLE_PRODUCT = {
    id: "E2F-KIT",
    name: "Protocolo Integral BALANCE FEEL",
    price: 180000,
    qty: 1
  };

  // ── Formatear precio COP ────────────────────────────────────────────────────
  const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  // ── Capturar datos del formulario (IDs con prefijo chk_) ────────────────────
  function getFormData() {
    const get = (id) => (document.getElementById(id) || {}).value || "";
    return {
      fname:   get("chk_fname"),
      lname:   get("chk_lname"),
      email:   get("chk_email"),
      phone:   get("chk_phone"),
      address: get("chk_address"),
      city:    get("chk_city"),
      state:   get("chk_state"),
      zip:     get("chk_zip"),
      country: get("chk_country") || "CO",
      notes:   get("chk_notes"),
    };
  }

  // ── Rellenar el resumen "Tu pedido" en el HTML ──────────────────────────────
  function renderOrderSummary(product, shippingCost = 0) {
    const tbody    = document.getElementById("checkout-items-list");
    const subtotal = document.getElementById("checkout-subtotal");
    const totalEl  = document.getElementById("checkout-total");
    const shippingEl = document.getElementById("checkout-shipping");

    if (tbody) {
      tbody.innerHTML = `<tr>
        <td>${product.name} <strong>× ${product.qty}</strong></td>
        <td style="text-align:right;">${formatCOP(product.price * product.qty)}</td>
      </tr>`;
    }
    if (subtotal) subtotal.textContent = formatCOP(product.price);
    if (shippingEl) shippingEl.innerHTML = `<span style="color:#22A06B; font-weight:700;">¡Gratis hoy!</span>`;
    if (totalEl)  totalEl.textContent  = formatCOP(product.price + shippingCost);
  }

  // ── Validar campos obligatorios del formulario ──────────────────────────────
  function validateForm(data) {
    const required = ["fname", "lname", "email", "phone", "address", "city", "state", "zip"];
    
    // Simple custom alert style / browser alert for missing fields
    for (const key of required) {
      if (!data[key]) {
        const fieldNameMap = {
          fname: "Nombre",
          lname: "Apellido",
          email: "Correo electrónico",
          phone: "Teléfono",
          address: "Dirección",
          city: "Ciudad / Municipio",
          state: "Departamento",
          zip: "Código Postal / Zona"
        };
        alert(`Por favor completa el campo obligatorio: ${fieldNameMap[key] || key}`);
        return false;
      }
    }
    return true;
  }

  // ── Inicializar el Payment Brick de Mercado Pago ────────────────────────────
  async function initBrick(publicKey) {
    const product = SINGLE_PRODUCT;
    const shippingCost = 0; // Envío gratis en Entre2Fit
    const total = product.price + shippingCost;

    console.log("[Entre2Fit Checkout] Producto único:", product);
    console.log("[Entre2Fit Checkout] Total del pedido:", total);

    // Poblar el resumen "Tu pedido"
    renderOrderSummary(product, shippingCost);

    // Quitar el loader
    const loader = document.getElementById("brick-loading");
    if (loader) loader.remove();

    // Inicializar MercadoPago SDK
    const mp = new MercadoPago(publicKey, { locale: "es-CO" });

    const bricksBuilder = mp.bricks();

    const settings = {
      initialization: {
        amount: total,            // Total en COP ($180,000)
      },
      customization: {
        visual: {
          style: {
            theme: "default",     // Tema claro/default limpio para Entre2Fit
          },
        },
        paymentMethods: {
          creditCard: "all",
          debitCard:  "all",
          ticket:     "all",      // PSE, Efecty, etc.
          bankTransfer: "all",
          atm: "all",
        },
      },
      callbacks: {
        onReady: () => {
          console.log("[Brick] Payment Brick listo.");
        },
        onSubmit: async ({ selectedPaymentMethod, formData }) => {
          const shipping = getFormData();
          if (!validateForm(shipping)) return;

          const payload = {
            ...formData,              // token, payment_method_id, installments, payer, etc.
            transaction_amount: total, // Total de la compra
            ...shipping,              // fname, lname, email, phone, address, city, state, zip, country, notes
            items: [product],
            total: total,
          };

          console.log("[Brick] Enviando pago a process_payment:", payload);

          try {
            const resp = await fetch("/api/process_payment", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify(payload),
            });

            const result = await resp.json();

            if (!resp.ok) {
              console.error("[Brick] Error en backend:", result);
              alert("Error al procesar el pago: " + (result.detail || "Intenta de nuevo"));
              return;
            }

            // Redirigir a la página de éxito/pendiente/falla de Mercado Pago
            window.location.href = result.redirect_url;

          } catch (err) {
            console.error("[Brick] Error de red:", err);
            alert("Error de conexión. Por favor intenta de nuevo.");
          }
        },
        onError: (error) => {
          console.error("[Brick] Error en Mercado Pago Brick:", error);
        },
      },
    };

    // Renderizar el Brick
    try {
      window.brickController = await bricksBuilder.create("payment", "paymentBrick_container", settings);
    } catch (e) {
      console.error("[Brick] No se pudo crear el brick de pago:", e);
      document.getElementById("paymentBrick_container").innerHTML =
        "<p style='color:#D94F4F;text-align:center;padding:2rem;font-weight:600;'>Error al cargar el formulario de pago seguro. Recarga la página o inténtalo más tarde.</p>";
    }
  }

  // ── Punto de entrada ────────────────────────────────────────────────────────
  async function main() {
    try {
      const resp = await fetch("/api/config/public");
      if (!resp.ok) throw new Error("No se pudo obtener la configuración pública.");
      const { mp_public_key } = await resp.json();

      if (!mp_public_key) {
        document.getElementById("paymentBrick_container").innerHTML =
          "<p style='color:#D94F4F;text-align:center;padding:2rem;font-weight:600;'>" +
          "⚠️ El administrador aún no ha configurado Mercado Pago para Entre2Fit. Contáctanos directamente." +
          "</p>";
        return;
      }

      await initBrick(mp_public_key);

    } catch (err) {
      console.error("[checkout.js] Error de inicio:", err);
      document.getElementById("paymentBrick_container").innerHTML =
        "<p style='color:#D94F4F;text-align:center;padding:2rem;font-weight:600;'>Error de red al inicializar la pasarela de pago seguro.</p>";
    }
  }

  // Esperar DOM listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();
