// server.js - Al Aroma (Cart Sidebar + Summary Page + Admin + Invoice)
// Load environment variables from .env
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const app = express();
const PORT = process.env.PORT || 3000;

// ====== BRAND & ADMIN CONFIG ======
const BRAND_NAME = "Al Aroma Spices";
const BRAND_TAGLINE = "We deliver fresh, high-quality spices and dry fruits for your kitchen.";
const PHONE_DISPLAY = "+91-6392914193";
const PHONE_WHATSAPP = "916392914193";
const EMAIL_ID = "aarinexa5@gmail.com";
const ADDRESS_LINE = "Vastukhand, Lucknow, Uttar Pradesh 226010, India";
const CURRENT_YEAR = new Date().getFullYear();

// Admin key (from env or default)
const ADMIN_KEY = (process.env.ADMIN_KEY || "aladmin6392").trim();

// ====== PATHS ======
const ROOT_DIR = __dirname;
const INVOICES_DIR = path.join(ROOT_DIR, "invoices");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const ORDERS_FILE = path.join(ROOT_DIR, "orders.json");
const LOGO_PATH = path.join(PUBLIC_DIR, "logo.png");

// Ensure folders/files exist
if (!fs.existsSync(INVOICES_DIR)) fs.mkdirSync(INVOICES_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf8");

// ====== MIDDLEWARE ======
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));
app.use("/invoices", express.static(INVOICES_DIR));

// ====== RAZORPAY INIT ======
const RZP_KEY_ID = (process.env.RZP_KEY_ID || "").trim();
const RZP_KEY_SECRET = (process.env.RZP_KEY_SECRET || "").trim();

console.log("RZP_KEY_ID from env:", JSON.stringify(RZP_KEY_ID));
console.log("RZP_KEY_SECRET present?:", !!RZP_KEY_SECRET);

let rzp = null;
if (RZP_KEY_ID && RZP_KEY_SECRET) {
  rzp = new Razorpay({ key_id: RZP_KEY_ID, key_secret: RZP_KEY_SECRET });
  console.log("✅ Razorpay client initialised.");
} else {
  console.warn("⚠️ Razorpay not configured. Orders will fail until keys are provided.");
}

// ====== PRODUCTS ======
const PRODUCTS = [
  { id: "p001", name: "Al Aroma Garam Masala (100g)", price: 120.0, img: "/products/garam-masala.jpg", desc: "Premium garam masala for rich flavour in every dish." },
  { id: "p002", name: "Al Aroma Turmeric Powder (200g)", price: 150.0, img: "/products/turmeric.jpg", desc: "Deep-coloured turmeric powder with natural aroma." },
  { id: "p003", name: "Al Aroma Red Chili Powder (100g)", price: 80.0, img: "/products/red-chili.jpg", desc: "Spicy and fresh red chili powder for everyday cooking." },
  { id: "p004", name: "Premium Dry Dates (Khajoor) 500g", price: 260.0, img: "/products/dates.jpg", desc: "Soft and sweet premium quality dates for snacking." },
];

// ====== Helper: read/write orders.json ======
function readOrders() {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    console.error("readOrders error:", e);
    return [];
  }
}
function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("writeOrders error:", e);
    return false;
  }
}

// ====== Layout helper ======
function renderPage({ title, active, bodyHtml, extraHead = "", extraScripts = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    *{box-sizing:border-box} body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial;color:#222;background:#f4f5fb}
    a{color:inherit;text-decoration:none}
    header{background:linear-gradient(90deg,#0b3058,#0f4c81);color:#fff;padding:12px 16px;position:sticky;top:0;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.12)}
    .topbar{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
    .brand{display:flex;align-items:center;gap:10px}
    .brand-logo{width:46px;height:46px;border-radius:50%;object-fit:cover;background:#fff;border:2px solid #ffd36b}
    .brand-title strong{font-size:18px}
    nav{margin-top:6px}
    .nav-link{margin-right:14px;opacity:0.95}
    .contact-top{font-size:13px;opacity:0.95}
    .container{max-width:1100px;margin:20px auto;padding:0 14px}
    .grid-products{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
    .product-card{background:#fff;border-radius:12px;padding:12px;box-shadow:0 10px 26px rgba(0,0,0,0.06);display:flex;flex-direction:column;gap:8px}
    .product-card img{width:100%;height:160px;border-radius:10px;object-fit:cover;background:#eee}
    .product-name{font-weight:700}
    .product-desc{font-size:13px;color:#555;min-height:36px}
    .product-price{font-weight:700}
    .controls{display:flex;gap:8px;align-items:center}
    .qty-input{width:72px;padding:6px;border-radius:8px;border:1px solid #ddd;text-align:center}
    .primary-btn{background:#ff7a00;color:#fff;border:0;padding:8px 14px;border-radius:999px;cursor:pointer;font-weight:700;box-shadow:0 8px 20px rgba(255,122,0,0.32)}
    .primary-btn:hover{filter:brightness(0.95)}
    footer{margin-top:28px;background:#0f4c81;color:#fff;padding:16px}
    .footer-inner{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}

    /* CART SIDEBAR */
    .cart-btn{position:fixed;right:18px;bottom:90px;background:#ff7a00;color:#fff;padding:10px 14px;border-radius:999px;z-index:70;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,0.25);font-weight:700}
    .cart-count{background:#fff;color:#ff7a00;border-radius:999px;padding:2px 8px;margin-left:8px;font-weight:700}
    .cart-sidebar{position:fixed;right:-420px;top:0;width:380px;height:100%;background:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:80;transition:right .28s ease;padding:18px;overflow:auto}
    .cart-sidebar.open{right:0}
    .cart-sidebar h3{margin:0 0 8px}
    .cart-item{display:flex;gap:8px;align-items:center;padding:8px;border-radius:8px;border:1px solid #f0f0f0;margin-bottom:8px}
    .cart-item img{width:68px;height:56px;object-fit:cover;border-radius:6px}
    .cart-item .meta{flex:1}
    .cart-item .meta .name{font-weight:700}
    .cart-item .meta .qty-controls{display:flex;align-items:center;gap:6px;margin-top:6px}
    .qty-btn{padding:6px;border-radius:6px;border:1px solid #ddd;background:#fafafa;cursor:pointer}
    .remove-small{background:#ffecec;border:1px solid #f2b1b1;color:#a60000;padding:6px;border-radius:6px;cursor:pointer}

    /* SUMMARY MODAL */
    .modal-backdrop{position:fixed;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,0.45);display:none;align-items:center;justify-content:center;z-index:90}
    .modal-backdrop.open{display:flex}
    .summary-modal{width:720px;max-width:96%;background:#fff;border-radius:12px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,0.4);max-height:90%;overflow:auto}
    .summary-grid{display:grid;grid-template-columns:1fr 360px;gap:12px}
    .summary-section{background:#f9fafb;padding:12px;border-radius:8px}
    .summary-table{width:100%;border-collapse:collapse}
    .summary-table th,.summary-table td{padding:8px;border-bottom:1px solid #eee;text-align:left}

    @media (max-width:800px){
      .summary-grid{grid-template-columns:1fr}
      .cart-sidebar{width:100%}
      .cart-sidebar.open{right:0}
    }
  </style>
  ${extraHead}
</head>
<body>
  <header>
    <div class="topbar">
      <div style="display:flex;align-items:center;gap:12px">
        <img src="/logo.png" class="brand-logo" onerror="this.style.display='none'"/>
        <div>
          <div class="brand-title"><strong>${BRAND_NAME}</strong></div>
          <div style="font-size:12px;color:rgba(255,255,255,0.9)">${BRAND_TAGLINE}</div>
        </div>
      </div>
      <div style="text-align:right">
        <nav>
          <a href="/" class="nav-link">Home</a>
          <a href="/about" class="nav-link">About</a>
          <a href="/contact" class="nav-link">Contact</a>
          <button id="openCartBtn" class="primary-btn" style="margin-left:12px">View Cart <span id="cartCountBadge" class="cart-count">0</span></button>
        </nav>
        <div class="contact-top" style="margin-top:6px">${PHONE_DISPLAY} • ${EMAIL_ID}</div>
      </div>
    </div>
  </header>

  <main class="container">
    ${bodyHtml}
  </main>

  <button id="floatingCartBtn" class="cart-btn">Cart <span id="floatingCartCount" class="cart-count">0</span></button>

  <!-- Cart Sidebar -->
  <aside id="cartSidebar" class="cart-sidebar" aria-hidden="true">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <h3>Your Cart</h3>
      <div>
        <button id="closeCartBtn" class="primary-btn" style="background:#888">Close</button>
      </div>
    </div>
    <div id="cartItemsWrap" style="margin-top:12px"></div>
    <div style="margin-top:12px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-weight:700">Total</div>
        <div style="font-weight:800">₹ <span id="cartSidebarTotal">0.00</span></div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px">
        <button id="openSummaryBtn" class="primary-btn" style="flex:1">Checkout</button>
        <button id="clearCartBtn" class="primary-btn" style="background:#ccc;color:#111">Clear</button>
      </div>
    </div>
  </aside>

  <!-- Summary Modal -->
  <div id="summaryModal" class="modal-backdrop" aria-hidden="true">
    <div class="summary-modal" role="dialog" aria-modal="true">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <h3>Order Summary</h3>
        <button id="closeSummaryBtn" class="primary-btn" style="background:#888">Close</button>
      </div>

      <div style="margin-top:10px" class="summary-grid">
        <div>
          <div style="margin-bottom:10px">
            <strong>Items</strong>
          </div>
          <div id="summaryItems" style="max-height:320px;overflow:auto;padding-right:6px"></div>

          <div style="margin-top:12px">
            <strong>Customer Details</strong>
            <div style="margin-top:8px">
              <input id="summaryName" placeholder="Full name" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd;margin-bottom:6px"/>
              <input id="summaryPhone" placeholder="Phone (WhatsApp)" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd;margin-bottom:6px"/>
              <input id="summaryEmail" placeholder="Email (optional)" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd;margin-bottom:6px"/>
              <textarea id="summaryAddress" placeholder="Full address" style="width:100%;padding:8px;border-radius:6px;border:1px solid #ddd;height:80px"></textarea>
            </div>
          </div>
        </div>

        <div>
          <div class="summary-section">
            <div style="display:flex;justify-content:space-between">
              <div>Subtotal</div>
              <div>₹ <span id="summarySubtotal">0.00</span></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:8px">
              <div>Delivery</div>
              <div>₹ <span id="summaryDelivery">0.00</span></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:8px;font-weight:700">
              <div>Grand Total</div>
              <div>₹ <span id="summaryGrandTotal">0.00</span></div>
            </div>

            <div style="margin-top:14px">
              <small class="muted">Delivery: orders under ₹499 will have a ₹49 charge. Above ₹499 free.</small>
            </div>

            <div style="margin-top:12px;display:flex;gap:8px">
              <button id="payNowBtn" class="primary-btn" style="flex:1">Pay & Checkout</button>
              <button id="saveForLaterBtn" class="primary-btn" style="background:#ccc;color:#111">Save</button>
            </div>
            <div id="summaryMessage" style="margin-top:10px;color:#a00"></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <footer>
    <div class="footer-inner">
      <div>© ${CURRENT_YEAR} ${BRAND_NAME} — ${ADDRESS_LINE}</div>
      <div>Phone: ${PHONE_DISPLAY} &nbsp; | &nbsp; Email: ${EMAIL_ID}</div>
    </div>
  </footer>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    // Frontend cart logic with sidebar + summary modal + localStorage
    const PRODUCTS = ${JSON.stringify(PRODUCTS)};
    const CART_KEY = 'al_aroma_cart_v1';

    let cart = [];

    // DOM refs
    const floatingCartBtn = document.getElementById('floatingCartBtn');
    const floatingCartCount = document.getElementById('floatingCartCount');
    const openCartBtn = document.getElementById('openCartBtn');
    const cartCountBadge = document.getElementById('cartCountBadge');

    const cartSidebar = document.getElementById('cartSidebar');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsWrap = document.getElementById('cartItemsWrap');
    const cartSidebarTotal = document.getElementById('cartSidebarTotal');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const openSummaryBtn = document.getElementById('openSummaryBtn');

    const summaryModal = document.getElementById('summaryModal');
    const closeSummaryBtn = document.getElementById('closeSummaryBtn');
    const summaryItems = document.getElementById('summaryItems');
    const summarySubtotal = document.getElementById('summarySubtotal');
    const summaryDelivery = document.getElementById('summaryDelivery');
    const summaryGrandTotal = document.getElementById('summaryGrandTotal');
    const payNowBtn = document.getElementById('payNowBtn');
    const saveForLaterBtn = document.getElementById('saveForLaterBtn');
    const summaryName = document.getElementById('summaryName');
    const summaryPhone = document.getElementById('summaryPhone');
    const summaryEmail = document.getElementById('summaryEmail');
    const summaryAddress = document.getElementById('summaryAddress');
    const summaryMessage = document.getElementById('summaryMessage');

    // Init
    function loadCart() {
      try {
        const raw = localStorage.getItem(CART_KEY);
        cart = raw ? JSON.parse(raw) : [];
      } catch (e) {
        cart = [];
      }
      updateCartUI();
    }

    function saveCart() {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      updateCartUI();
    }

    function updateCartUI() {
      const totalCount = cart.reduce((s,i)=>s + (i.qty||0), 0);
      floatingCartCount.textContent = totalCount;
      cartCountBadge.textContent = totalCount;

      // render items in sidebar
      cartItemsWrap.innerHTML = '';
      if (!cart.length) {
        cartItemsWrap.innerHTML = '<div style="padding:12px;color:#666">Your cart is empty.</div>';
        cartSidebarTotal.textContent = '0.00';
        return;
      }
      let total = 0;
      cart.forEach(item => {
        const p = PRODUCTS.find(pr => pr.id === item.id);
        if (!p) return;
        const line = p.price * item.qty;
        total += line;

        const el = document.createElement('div');
        el.className = 'cart-item';
        el.innerHTML = \`
          <img src="\${p.img}" alt="\${p.name}" onerror="this.style.display='none'"/>
          <div class="meta">
            <div class="name">\${p.name}</div>
            <div style="font-size:13px;color:#666">₹ \${p.price.toFixed(2)}</div>
            <div class="qty-controls">
              <button class="qty-btn" data-action="dec" data-id="\${item.id}">-</button>
              <span style="min-width:28px;text-align:center;display:inline-block">\${item.qty}</span>
              <button class="qty-btn" data-action="inc" data-id="\${item.id}">+</button>
              <button class="remove-small" data-action="rm" data-id="\${item.id}" style="margin-left:8px">Remove</button>
            </div>
          </div>
        \`;
        cartItemsWrap.appendChild(el);
      });
      cartSidebarTotal.textContent = total.toFixed(2);
    }

    // Add to cart buttons on product cards
    function initAddButtons() {
      document.querySelectorAll('.addCartBtn').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const id = btn.getAttribute('data-id');
          const parent = btn.closest('.product-card') || btn.parentElement;
          const qtyInput = parent.querySelector('input.qty-input');
          let qty = 1;
          if (qtyInput && qtyInput.value) qty = Math.max(1, parseInt(qtyInput.value,10)||1);
          addToCart(id, qty);
        });
      });
    }

    function addToCart(id, qty) {
      qty = Number(qty) || 1;
      const existing = cart.find(c=>c.id === id);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ id, qty });
      }
      saveCart();
      showTempMessage('Added to cart');
    }

    function changeQty(id, delta) {
      const item = cart.find(c=>c.id === id);
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(c=>c.id !== id);
      }
      saveCart();
    }

    function removeFromCart(id) {
      cart = cart.filter(c=>c.id !== id);
      saveCart();
    }

    // Event delegation in sidebar for qty buttons
    cartItemsWrap.addEventListener('click', (ev)=>{
      const btn = ev.target.closest('button');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (!action || !id) return;
      if (action === 'inc') changeQty(id, 1);
      if (action === 'dec') changeQty(id, -1);
      if (action === 'rm') removeFromCart(id);
      updateCartUI();
    });

    // Floating/open buttons
    floatingCartBtn.addEventListener('click', ()=> openCart());
    openCartBtn.addEventListener('click', ()=> openCart());
    closeCartBtn.addEventListener('click', ()=> closeCart());
    clearCartBtn.addEventListener('click', ()=> {
      if (!confirm('Clear cart?')) return;
      cart = [];
      saveCart();
    });

    function openCart() {
      cartSidebar.classList.add('open');
      cartSidebar.setAttribute('aria-hidden','false');
      updateCartUI();
    }
    function closeCart() {
      cartSidebar.classList.remove('open');
      cartSidebar.setAttribute('aria-hidden','true');
    }

    // Summary modal
    openSummaryBtn.addEventListener('click', ()=> openSummary());
    closeSummaryBtn.addEventListener('click', ()=> closeSummary());
    saveForLaterBtn.addEventListener('click', ()=> {
      saveCart();
      showTempMessage('Saved for later');
    });

    function openSummary() {
      if (!cart.length) return showTempMessage('Cart is empty');
      // populate summary items
      summaryItems.innerHTML = '';
      let subtotal = 0;
      cart.forEach(it=>{
        const p = PRODUCTS.find(pr=>pr.id===it.id);
        if (!p) return;
        const line = p.price * it.qty;
        subtotal += line;
        const div = document.createElement('div');
        div.style.padding = '8px 0';
        div.innerHTML = '<div style="display:flex;justify-content:space-between"><div>'+p.name+' × '+it.qty+'</div><div>₹ '+line.toFixed(2)+'</div></div>';
        summaryItems.appendChild(div);
      });
      summarySubtotal.textContent = subtotal.toFixed(2);
      // delivery charge logic
      const delivery = subtotal > 499 ? 0 : (subtotal === 0 ? 0 : 49);
      summaryDelivery.textContent = delivery.toFixed(2);
      summaryGrandTotal.textContent = (subtotal + delivery).toFixed(2);

      // fill last known customer details from localStorage if any
      const lastCustomerRaw = localStorage.getItem('al_aroma_customer_v1');
      if (lastCustomerRaw) {
        try {
          const c = JSON.parse(lastCustomerRaw);
          summaryName.value = c.name || '';
          summaryPhone.value = c.phone || '';
          summaryEmail.value = c.email || '';
          summaryAddress.value = c.address || '';
        } catch(e){}
      }

      summaryMessage.textContent = '';
      summaryModal.classList.add('open');
      summaryModal.setAttribute('aria-hidden','false');
    }

    function closeSummary() {
      summaryModal.classList.remove('open');
      summaryModal.setAttribute('aria-hidden','true');
    }

    function showTempMessage(msg, timeout=2500) {
      const el = document.getElementById('messageTemp');
      if (el) {
        el.remove();
      }
      const m = document.createElement('div');
      m.id = 'messageTemp';
      m.style.position = 'fixed';
      m.style.bottom = '22px';
      m.style.left = '50%';
      m.style.transform = 'translateX(-50%)';
      m.style.background = '#222';
      m.style.color = '#fff';
      m.style.padding = '8px 14px';
      m.style.borderRadius = '8px';
      m.style.zIndex = 120;
      m.textContent = msg;
      document.body.appendChild(m);
      setTimeout(()=> m.remove(), timeout);
    }

    // PAY NOW button (create order -> open Razorpay)
    payNowBtn.addEventListener('click', async ()=> {
      if (!cart.length) return showTempMessage('Cart empty');
      const name = (summaryName.value || '').trim();
      const phone = (summaryPhone.value || '').trim();
      const address = (summaryAddress.value || '').trim();
      if (!name || !phone || !address) {
        summaryMessage.textContent = 'Please fill name, phone and full address before paying.';
        return;
      }
      // Save customer details to localStorage (for next time)
      localStorage.setItem('al_aroma_customer_v1', JSON.stringify({ name, phone, email: (summaryEmail.value||''), address }));

      // prepare items to send to server
      const itemsForOrder = cart.map(c=>{
        const p = PRODUCTS.find(pr=>pr.id===c.id);
        return {
          id: c.id,
          name: p ? p.name : 'Product',
          unitPrice: p ? p.price : 0,
          quantity: c.qty
        };
      });

      // compute subtotal & delivery
      const subtotal = itemsForOrder.reduce((s,it)=>s + (Number(it.unitPrice)||0) * (Number(it.quantity)||0), 0);
      const delivery = subtotal > 499 ? 0 : (subtotal === 0 ? 0 : 49);
      const grandTotal = Math.round((subtotal + delivery) * 100); // paise

      // Create order on server
      showTempMessage('Creating order...');
      let orderResp;
      try {
        orderResp = await fetch('/create-order', {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ items: itemsForOrder, deliveryCharge: delivery })
        }).then(r=>r.json());
      } catch (e) {
        console.error(e);
        summaryMessage.textContent = 'Network/server error while creating order.';
        return;
      }

      if (!orderResp || orderResp.error) {
        summaryMessage.textContent = 'Server error: ' + (orderResp && orderResp.error ? orderResp.error : 'Unknown');
        return;
      }

      // Prepare Razorpay options
      const options = {
        key: orderResp.key || '', // server returns RZP key
        amount: orderResp.amount, // amount in paise
        currency: orderResp.currency || 'INR',
        name: '${BRAND_NAME}',
        description: 'Order from Al Aroma',
        order_id: orderResp.id,
        handler: async function(response) {
          // verify payment on server
          try {
            const verifyResp = await fetch('/verify-payment', {
              method:'POST',
              headers:{ 'Content-Type':'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: itemsForOrder,
                customer: { name, phone, email: (summaryEmail.value||''), address },
                deliveryCharge: delivery
              })
            }).then(r=>r.json());

            if (verifyResp && verifyResp.success) {
              // success: clear cart, close modal/sidebar, show invoice link
              cart = [];
              saveCart();
              closeSummary();
              closeCart();
              const link = verifyResp.invoiceUrl ? ('<a href="'+verifyResp.invoiceUrl+'" target="_blank">Download Invoice</a>') : '';
              showTempMessage('Payment successful! Invoice ready.');
              // small popup with invoice link
              setTimeout(()=> {
                if (verifyResp.invoiceUrl) window.open(verifyResp.invoiceUrl, '_blank');
              }, 800);
            } else {
              summaryMessage.textContent = 'Payment verification failed. Contact support.';
            }
          } catch (err) {
            console.error(err);
            summaryMessage.textContent = 'Verification error. Please contact support.';
          }
        },
        prefill: {
          name: name,
          email: summaryEmail.value || '',
          contact: phone
        },
        notes: {},
        theme: { color: '#ff7a00' }
      };

      const rzpObj = new Razorpay(options);
      rzpObj.open();
    });

    // initialize product add buttons (for product cards rendered server-side)
    window.addEventListener('load', ()=>{
      loadCart();
      initAddButtons();
    });
  </script>
</body>
</html>`;
}

// ====== HOME PAGE (renders product grid) ======
app.get("/", (req, res) => {
  const productCards = PRODUCTS.map(p => `
    <div class="product-card">
      <img src="${p.img}" alt="${p.name}" />
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc}</div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div class="product-price">₹ ${p.price.toFixed(2)}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <input class="qty-input" type="number" min="1" value="1" />
          <button class="primary-btn addCartBtn" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </div>
  `).join('\n');

  const bodyHtml = `
    <section style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <h1 style="margin:0">${BRAND_NAME}</h1>
          <div style="color:#666">${BRAND_TAGLINE}</div>
        </div>
        <div style="text-align:right">
          <div style="background:#fff;padding:8px;border-radius:8px;box-shadow:0 8px 20px rgba(0,0,0,0.06)">
            <div style="font-size:12px;color:#666">Call / WhatsApp</div>
            <div style="font-weight:700">${PHONE_DISPLAY}</div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 style="margin-top:0">Products</h2>
      <div class="grid-products">
        ${productCards}
      </div>
    </section>

    <section style="margin-top:22px">
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div style="flex:1" class="card-soft">
          <h3>Why choose Al Aroma?</h3>
          <p style="color:#555;margin-top:6px">Quality, hygiene and prompt delivery. Small-batch processing for fresh aroma.</p>
          <ul style="margin-top:8px;color:#555">
            <li>Selected ingredients from trusted suppliers</li>
            <li>Hygienic packing & sealing</li>
            <li>Pan-India delivery</li>
          </ul>
        </div>
        <div style="width:320px" class="card-soft">
          <h3>Quick info</h3>
          <p style="margin:6px 0;color:#555">Dispatch: 1–3 working days. Payment secure via Razorpay.</p>
          <p style="margin:6px 0"><strong>Address:</strong><br/>${ADDRESS_LINE}</p>
        </div>
      </div>
    </section>
  `;

  res.send(renderPage({ title: BRAND_NAME, bodyHtml }));
});

// ====== ADMIN ROUTES (same as before) ======
function requireAdminKey(req, res) {
  const key = (req.query.key || "").trim();
  if (!key || key !== ADMIN_KEY) {
    res.status(401).send('<h2>Unauthorized</h2><p>Provide admin key as ?key=YOUR_ADMIN_KEY</p>');
    return false;
  }
  return true;
}

app.get("/admin", (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const orders = readOrders();
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const recent = orders.slice().sort((a,b) => b.createdAt - a.createdAt).slice(0, 50);

  let rows = recent.map((o, i) => {
    const date = new Date(o.createdAt).toLocaleString();
    const invoiceLink = o.invoiceFilename ? `<a href="/invoices/${o.invoiceFilename}" target="_blank">Open</a>` : "—";
    const itemsHtml = (o.items || []).map(it => `<div>${it.name} × ${it.quantity} — ₹${(it.unitPrice||0).toFixed(2)}</div>`).join("");
    return `<tr>
      <td>${i+1}</td>
      <td>${o.orderId}</td>
      <td>${o.paymentId || ""}</td>
      <td>${o.customer && o.customer.name ? o.customer.name : ""}<br/><small>${o.customer && o.customer.phone ? o.customer.phone : ""}</small></td>
      <td>${itemsHtml}</td>
      <td>₹ ${Number(o.amount||0).toFixed(2)}</td>
      <td>${date}</td>
      <td>${invoiceLink}</td>
      <td><a href="/admin/delete-invoice?key=${ADMIN_KEY}&file=${encodeURIComponent(o.invoiceFilename)}" onclick="return confirm('Delete invoice?')">Delete</a></td>
    </tr>`;
  }).join("\n");

  const bodyHtml = `
    <h2>Admin Dashboard — Invoices & Orders</h2>
    <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap">
      <div class="card-soft" style="flex:1">
        <div class="muted small">Total Orders</div>
        <div style="font-weight:700;font-size:20px">${totalOrders}</div>
      </div>
      <div class="card-soft" style="flex:1">
        <div class="muted small">Total Revenue</div>
        <div style="font-weight:700;font-size:20px">₹ ${totalRevenue.toFixed(2)}</div>
      </div>
      <div class="card-soft" style="flex:1">
        <div class="muted small">Invoices Folder</div>
        <div style="margin-top:6px"><a class="primary-btn" href="/invoices">Open invoices folder</a></div>
      </div>
    </div>

    <div class="card-soft">
      <h3>Recent Orders</h3>
      ${recent.length === 0 ? '<p class="muted">No orders yet.</p>' : `
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th>#</th><th>Order ID</th><th>Payment ID</th><th>Customer</th><th>Items</th><th>Amount</th><th>Date</th><th>Invoice</th><th>Actions</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`}
      <div style="margin-top:12px;">
        <a class="primary-btn" href="/admin/export?key=${ADMIN_KEY}">Export orders (JSON)</a>
      </div>
    </div>

    <div style="margin-top:12px;" class="muted small">
      Tip: change ADMIN_KEY in env for improved security. Deleting an invoice removes file only; orders.json remains (so export/history safe).
    </div>
  `;
  res.send(renderPage({ title: "Admin", bodyHtml }));
});

app.get("/admin/export", (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const orders = readOrders();
  res.setHeader("Content-Disposition", "attachment; filename=orders.json");
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(orders, null, 2));
});

app.get("/admin/delete-invoice", (req, res) => {
  if (!requireAdminKey(req, res)) return;
  const file = req.query.file;
  if (!file) return res.status(400).send("file query param required");
  const filePath = path.join(INVOICES_DIR, path.basename(file));
  if (!fs.existsSync(filePath)) return res.status(404).send("file not found");
  try {
    fs.unlinkSync(filePath);
    return res.send(`<p>Deleted ${file}</p><p><a href="/admin?key=${ADMIN_KEY}">Back to admin</a></p>`);
  } catch (e) {
    console.error("delete invoice error:", e);
    return res.status(500).send("delete failed");
  }
});

// ====== CREATE ORDER (server side) ======
app.post("/create-order", async (req, res) => {
  try {
    if (!rzp) return res.status(500).json({ error: "Razorpay not configured" });

    const { items, deliveryCharge } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    let totalAmount = 0;
    items.forEach((item) => {
      const product = PRODUCTS.find((p) => p.id === item.id);
      const qty = Number(item.quantity || item.qty || 1);
      if (!product || qty <= 0) return;
      totalAmount += (product.price || item.unitPrice || 0) * qty;
    });

    const delivery = Number(deliveryCharge || 0);
    totalAmount += delivery;

    if (!totalAmount || totalAmount <= 0) return res.status(400).json({ error: "Invalid cart items" });

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await rzp.orders.create(options);

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: RZP_KEY_ID,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: err.description || err.message || "Server error" });
  }
});

// ====== VERIFY PAYMENT + GENERATE INVOICE + SAVE ORDER ======
app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, customer, deliveryCharge } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: "Missing verification fields" });

    // verify signature
    const generatedSignature = crypto.createHmac("sha256", RZP_KEY_SECRET).update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
    if (generatedSignature !== razorpay_signature) {
      console.warn("Signature mismatch", generatedSignature, razorpay_signature);
      return res.status(400).json({ error: "Invalid signature" });
    }

    const safeItems = Array.isArray(items) ? items : [];
    const safeCustomer = customer || {};

    // invoice properties
    const invoiceId = `INV-${Date.now()}`;
    const invoiceFilename = `invoice_${razorpay_order_id}.pdf`;
    const invoicePath = path.join(INVOICES_DIR, invoiceFilename);

    // calculate totals
    let grandTotal = 0;
    safeItems.forEach(it => {
      const q = Number(it.quantity || it.qty || 1);
      const u = Number(it.unitPrice || 0);
      grandTotal += q * u;
    });
    const delivery = Number(deliveryCharge || 0);
    grandTotal += delivery;

    // create PDF invoice
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(invoicePath);
    doc.pipe(writeStream);

    // header/logo
    let currentY = 40;
    if (fs.existsSync(LOGO_PATH)) doc.image(LOGO_PATH, 40, currentY, { width: 70 });
    doc.fontSize(18).text(BRAND_NAME, 130, currentY + 8);
    doc.fontSize(10).fillColor("#555").text(ADDRESS_LINE, 130, currentY + 34).text("Phone: " + PHONE_DISPLAY, 130, currentY + 48).text("Email: " + EMAIL_ID, 130, currentY + 60);

    const qrText = `Invoice:${invoiceId}\nOrder:${razorpay_order_id}\nPayment:${razorpay_payment_id}\nAmount:${grandTotal.toFixed(2)}\nCustomer:${safeCustomer.name||''}`;
    const qrDataUrl = await QRCode.toDataURL(qrText);
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBuffer = Buffer.from(qrBase64, "base64");
    doc.image(qrBuffer, 420, 40, { width: 100 });

    currentY += 80;
    doc.fillColor("#000").fontSize(13).text("TAX INVOICE", 40, currentY);
    doc.fontSize(9).text("Invoice No: " + invoiceId, 40, currentY + 20).text("Order ID: " + razorpay_order_id, 40, currentY + 34).text("Payment ID: " + razorpay_payment_id, 40, currentY + 48).text("Date: " + new Date().toLocaleString(), 40, currentY + 62);

    currentY += 96;
    doc.fontSize(11).text("Bill To:", 40, currentY);
    doc.fontSize(10).text(safeCustomer.name || "Customer Name").text("Phone: " + (safeCustomer.phone || "")).text("Email: " + (safeCustomer.email || "")).text("Address: " + (safeCustomer.address || ""));
    currentY += 70;

    // items table header
    const tableTop = currentY;
    const tableLeft = 40;
    const tableRight = 550;
    doc.rect(tableLeft, tableTop, tableRight - tableLeft, 18).fill("#f5f6ff").stroke("#e0e0e0");
    doc.fillColor("#000").fontSize(10).text("Item", tableLeft + 6, tableTop + 4).text("Qty", 340, tableTop + 4).text("Unit (₹)", 390, tableTop + 4).text("Total (₹)", 470, tableTop + 4);

    let rowY = tableTop + 22;
    safeItems.forEach(item => {
      const qty = Number(item.quantity || item.qty || 1);
      const unit = Number(item.unitPrice || 0);
      const lineTotal = qty * unit;
      doc.rect(tableLeft, rowY - 2, tableRight - tableLeft, 18).stroke("#e0e0e0");
      doc.fillColor("#000").fontSize(10).text(item.name || "Product", tableLeft + 6, rowY).text(qty.toString(), 340, rowY).text(unit.toFixed(2), 390, rowY).text(lineTotal.toFixed(2), 470, rowY);
      rowY += 20;
    });

    // delivery row if any
    if (delivery && delivery > 0) {
      doc.rect(tableLeft, rowY - 2, tableRight - tableLeft, 18).stroke("#e0e0e0");
      doc.fillColor("#000").fontSize(10).text("Delivery Charges", tableLeft + 6, rowY).text("", 340, rowY).text("", 390, rowY).text(delivery.toFixed(2), 470, rowY);
      rowY += 20;
    }

    // totals
    rowY += 10;
    doc.rect(380, rowY, tableRight - 380, 50).stroke("#e0e0e0");
    doc.fontSize(10).text("Subtotal:", 390, rowY + 8).text("₹ " + (grandTotal - delivery).toFixed(2), 470, rowY + 8, { align: "right" })
      .text("Delivery:", 390, rowY + 24).text("₹ " + delivery.toFixed(2), 470, rowY + 24, { align: "right" })
      .font("Helvetica-Bold").text("Grand Total:", 390, rowY + 38).text("₹ " + grandTotal.toFixed(2), 470, rowY + 38, { align: "right" }).font("Helvetica");

    rowY += 80;
    doc.fontSize(10).fillColor("#555").text("Thank you for your purchase! Contact on WhatsApp for queries.", 40, rowY, { align: "center" });

    doc.end();

    writeStream.on("finish", () => {
      // Save order metadata to orders.json
      const orders = readOrders();
      const newOrder = {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        invoiceFilename,
        amount: grandTotal,
        items: safeItems,
        customer: safeCustomer,
        createdAt: Date.now()
      };
      orders.push(newOrder);
      writeOrders(orders);

      console.log("Invoice generated:", invoicePath);
      res.json({ success: true, invoiceUrl: "/invoices/" + invoiceFilename });
    });

    writeStream.on("error", (err) => {
      console.error("Invoice write error", err);
      res.status(500).json({ error: "Invoice generation failed" });
    });

  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log("Ensure RZP_KEY_ID and RZP_KEY_SECRET set in .env or Render env vars.");
  console.log("Admin URL: /admin?key=" + ADMIN_KEY);
});
