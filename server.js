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

// ====== BASIC BRAND CONFIG ======
const BRAND_NAME = "Al Aroma Spices";
const BRAND_TAGLINE =
  "We deliver fresh, high-quality spices and dry fruits for your kitchen.";
const PHONE_DISPLAY = "+91-6392914193";
const PHONE_WHATSAPP = "916392914193"; // 91 + 10 digits
const EMAIL_ID = "aarinexa5@gmail.com";
const ADDRESS_LINE = "Vastukhand, Lucknow, Uttar Pradesh 226010, India";
const CURRENT_YEAR = new Date().getFullYear();

// ====== PATHS & FOLDERS ======
const ROOT_DIR = __dirname;
const INVOICES_DIR = path.join(ROOT_DIR, "invoices");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const LOGO_PATH = path.join(PUBLIC_DIR, "logo.png");

if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// ====== MIDDLEWARE ======
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static files (logo, product images, etc.)
app.use(express.static(PUBLIC_DIR));
// Serve invoice PDFs
app.use("/invoices", express.static(INVOICES_DIR));

// ====== RAZORPAY INIT (SAFE) ======
const RZP_KEY_ID = (process.env.RZP_KEY_ID || "").trim();
const RZP_KEY_SECRET = (process.env.RZP_KEY_SECRET || "").trim();

console.log("RZP_KEY_ID from env:", JSON.stringify(RZP_KEY_ID));
console.log("RZP_KEY_SECRET present?:", !!RZP_KEY_SECRET);

let rzp = null;
if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
  console.error(
    "❌ Razorpay env vars missing! Please set RZP_KEY_ID & RZP_KEY_SECRET in .env or Render env."
  );
} else {
  rzp = new Razorpay({
    key_id: RZP_KEY_ID,
    key_secret: RZP_KEY_SECRET,
  });
  console.log("✅ Razorpay client initialised.");
}

// ====== PRODUCTS (LOCAL IMAGES) ======
const PRODUCTS = [
  {
    id: "p001",
    name: "Al Aroma Garam Masala (100g)",
    price: 120.0,
    img: "/products/garam-masala.jpg",
    desc: "Premium garam masala for rich flavour in every dish.",
  },
  {
    id: "p002",
    name: "Al Aroma Turmeric Powder (200g)",
    price: 150.0,
    img: "/products/turmeric.jpg",
    desc: "Deep-coloured turmeric powder with natural aroma.",
  },
  {
    id: "p003",
    name: "Al Aroma Red Chili Powder (100g)",
    price: 80.0,
    img: "/products/red-chili.jpg",
    desc: "Spicy and fresh red chili powder for everyday cooking.",
  },
  {
    id: "p004",
    name: "Premium Dry Dates (Khajoor) 500g",
    price: 260.0,
    img: "/products/dates.jpg",
    desc: "Soft and sweet premium quality dates for snacking.",
  },
];

// ====== COMMON LAYOUT FUNCTION ======
function renderPage({ title, active, bodyHtml, extraHead = "", extraScripts = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin:0;
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      background:#f4f5fb;
      color:#222;
    }
    a { text-decoration:none; color:inherit; }

    header {
      background:#0f4c81;
      color:#fff;
      padding:8px 16px 12px;
      position:sticky;
      top:0;
      z-index:50;
    }
    .topbar {
      max-width:1100px;
      margin:0 auto;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      flex-wrap:wrap;
    }
    .brand {
      display:flex;
      align-items:center;
      gap:10px;
    }
    .brand-logo {
      width:42px;
      height:42px;
      border-radius:50%;
      border:2px solid #ffd36b;
      object-fit:cover;
      background:#fff;
    }
    .brand-title {
      display:flex;
      flex-direction:column;
      gap:2px;
    }
    .brand-title strong {
      font-size:20px;
      letter-spacing:0.06em;
    }
    .brand-title span {
      font-size:11px;
      opacity:0.9;
    }
    nav { margin-top:4px; font-size:14px; }
    .nav-link {
      margin-right:16px;
      opacity:0.9;
    }
    .nav-link.active {
      font-weight:600;
      opacity:1;
      border-bottom:2px solid #ffd36b;
      padding-bottom:2px;
    }
    .contact-top {
      font-size:12px;
      text-align:right;
      opacity:0.9;
    }

    .container {
      max-width:1100px;
      margin:22px auto;
      padding:0 14px;
    }

    .hero {
      background:#0f4c81;
      color:#fff;
      padding:22px 14px 26px;
    }
    .hero-inner {
      max-width:1100px;
      margin:0 auto;
      display:grid;
      grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);
      gap:22px;
      align-items:center;
    }
    .hero h1 {
      margin:0 0 6px;
      font-size:30px;
    }
    .hero p { margin:0 0 10px; font-size:14px; }
    .hero-highlights {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin-top:8px;
    }
    .pill {
      padding:4px 10px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,0.4);
      font-size:11px;
    }
    .hero-box {
      background:rgba(255,255,255,0.1);
      border-radius:14px;
      padding:14px;
      font-size:12px;
      box-shadow:0 10px 26px rgba(0,0,0,0.25);
    }

    h2.section-title {
      font-size:20px;
      margin:0 0 4px;
    }
    .section-sub {
      font-size:13px;
      color:#555;
      margin-bottom:16px;
    }

    .grid-products {
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
      gap:18px;
    }
    .product-card {
      background:#fff;
      border-radius:16px;
      padding:14px;
      box-shadow:0 10px 26px rgba(15,18,40,0.08);
      display:flex;
      flex-direction:column;
      gap:8px;
    }
    .product-card img {
      width:100%;
      height:170px;
      border-radius:12px;
      object-fit:cover;
    }
    .product-name { font-size:16px; font-weight:600; }
    .product-desc { font-size:13px; color:#555; min-height:36px; }
    .product-price { font-weight:700; font-size:15px; }

    .controls {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:8px;
      margin-top:6px;
    }
    .qty-input {
      width:70px;
      padding:6px;
      font-size:13px;
      border-radius:8px;
      border:1px solid #d0d0d0;
      text-align:center;
    }
    .primary-btn {
      background:#ff7a00;
      color:#fff;
      border:0;
      border-radius:999px;
      padding:8px 16px;
      font-size:14px;
      font-weight:600;
      cursor:pointer;
      box-shadow:0 8px 20px rgba(255,122,0,0.5);
    }
    .primary-btn:hover { filter:brightness(0.95); }

    .two-col {
      display:grid;
      grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);
      gap:18px;
      margin-top:24px;
      align-items:flex-start;
    }
    .card-soft {
      background:#fff;
      border-radius:16px;
      padding:14px 16px;
      box-shadow:0 10px 25px rgba(0,0,0,0.04);
      font-size:13px;
    }
    .card-soft h3 {
      margin:0 0 6px;
      font-size:16px;
    }
    .card-soft ul {
      margin:4px 0 8px;
      padding-left:18px;
    }
    .card-soft li { margin-bottom:4px; }

    .cart-table {
      width:100%;
      border-collapse:collapse;
      font-size:12px;
    }
    .cart-table th,
    .cart-table td {
      padding:6px 6px;
      border:1px solid #e0e0e0;
      text-align:left;
    }
    .cart-table th {
      background:#f5f6ff;
      font-weight:600;
    }
    .cart-total-row { font-weight:700; }
    .cart-empty {
      text-align:center;
      padding:10px 4px;
      color:#777;
    }

    .qty-btn {
      padding:2px 8px;
      border-radius:999px;
      border:1px solid #ccc;
      background:#f8f8ff;
      font-size:11px;
      cursor:pointer;
      margin:0 4px;
    }
    .qty-btn:hover { background:#e8e8ff; }
    .remove-btn {
      padding:2px 7px;
      border-radius:999px;
      border:1px solid #f2b1b1;
      background:#ffe5e5;
      color:#a60000;
      font-size:11px;
      cursor:pointer;
    }
    .remove-btn:hover { background:#ffd0d0; }

    .customer-input {
      width:100%;
      padding:8px;
      border-radius:8px;
      border:1px solid #ccc;
      font-size:13px;
      margin-bottom:6px;
    }

    footer {
      margin-top:26px;
      background:#0f4c81;
      color:#fff;
      padding:16px 14px;
    }
    .footer-inner {
      max-width:1100px;
      margin:0 auto;
      font-size:12px;
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      justify-content:space-between;
      align-items:center;
    }

    .wa-btn {
      position:fixed;
      right:18px;
      bottom:18px;
      background:#25D366;
      color:#fff;
      padding:9px 14px;
      border-radius:999px;
      font-size:14px;
      font-weight:600;
      display:flex;
      align-items:center;
      gap:6px;
      box-shadow:0 10px 26px rgba(0,0,0,0.3);
    }

    @media (max-width: 800px) {
      .hero-inner,
      .two-col { grid-template-columns:minmax(0,1fr); }
      header { position:static; }
      .hero { padding-top:16px; }
    }
  </style>
  ${extraHead}
</head>
<body>
  <header>
    <div class="topbar">
      <div>
        <div class="brand">
          <img src="/logo.png" alt="Logo" class="brand-logo" onerror="this.style.display='none';"/>
          <div class="brand-title">
            <strong>AL-AROMA SPICES</strong>
            <span>${BRAND_TAGLINE}</span>
          </div>
        </div>
        <nav>
          <a href="/" class="nav-link ${active === "home" ? "active" : ""}">Home</a>
          <a href="/about" class="nav-link ${active === "about" ? "active" : ""}">About</a>
          <a href="/contact" class="nav-link ${active === "contact" ? "active" : ""}">Contact</a>
        </nav>
      </div>
      <div class="contact-top">
        Call / WhatsApp: ${PHONE_DISPLAY}<br/>
        Email: ${EMAIL_ID}
      </div>
    </div>
  </header>

  ${bodyHtml}

  <footer>
    <div class="footer-inner">
      <div>© ${CURRENT_YEAR} ${BRAND_NAME} — ${ADDRESS_LINE}</div>
      <div>Phone: ${PHONE_DISPLAY} &nbsp; | &nbsp; Email: ${EMAIL_ID}</div>
    </div>
  </footer>

  <a class="wa-btn" href="https://wa.me/${PHONE_WHATSAPP}?text=Hi%20Al%20Aroma%20Spices%2C%20I%20want%20to%20order." target="_blank">
    WhatsApp Order
  </a>

  ${extraScripts}
</body>
</html>`;
}

// ====== HOME PAGE (PRODUCTS + CART + CUSTOMER DETAILS) ======
app.get("/", (req, res) => {
  const productCards = PRODUCTS.map(
    (p) =>
      '<div class="product-card">' +
      '<img src="' + p.img + '" alt="' + p.name + '"/>' +
      '<div class="product-name">' + p.name + '</div>' +
      '<div class="product-desc">' + p.desc + '</div>' +
      '<div class="product-price">₹ ' + p.price.toFixed(2) + '</div>' +
      '<div class="controls">' +
        '<input type="number" min="1" value="1" data-id="' + p.id + '" class="qty-input"/>' +
        '<button class="primary-btn addCartBtn" data-id="' + p.id + '">Add to cart</button>' +
      '</div>' +
      '</div>'
  ).join("\n");

  const bodyHtml = `
    <section class="hero">
      <div class="hero-inner">
        <div>
          <h1>${BRAND_NAME}</h1>
          <p>${BRAND_TAGLINE}</p>
          <div class="hero-highlights">
            <div class="pill">Pure & flavourful spices</div>
            <div class="pill">Premium dates & dry fruits</div>
            <div class="pill">Retail & bulk supply</div>
            <div class="pill">Pan-India delivery*</div>
          </div>
        </div>
        <div class="hero-box">
          <strong>How to order:</strong>
          <ul>
            <li>Products se quantity choose karke <b>Add to cart</b> pe click karein.</li>
            <li>Customer details (naam, phone, address) fill karein.</li>
            <li>Cart check karke <b>Pay & Checkout</b> dabayein.</li>
            <li>Payment Razorpay (UPI / Card / NetBanking) se hoga.</li>
            <li>Payment ke baad automatic <b>PDF invoice</b> generate hogi.</li>
          </ul>
          <div style="font-size:11px;opacity:0.85;margin-top:6px;">
            *Delivery charges extra, as per location.
          </div>
        </div>
      </div>
    </section>

    <main class="container">
      <h2 class="section-title">Products</h2>
      <div class="section-sub">
        Freshly packed spices and premium dates. Quantity and price can be customised for bulk orders.
      </div>

      <div class="grid-products">
        ${productCards}
      </div>

      <section>
        <div class="two-col">
          <div class="card-soft">
            <h3>Your Cart</h3>
            <table class="cart-table">
              <thead>
                <tr>
                  <th style="width:45%;">Item</th>
                  <th style="width:25%;">Qty</th>
                  <th style="width:20%;">Total (₹)</th>
                  <th style="width:10%;">Remove</th>
                </tr>
              </thead>
              <tbody id="cart-body">
                <tr><td colspan="4" class="cart-empty">No items in cart yet.</td></tr>
              </tbody>
              <tfoot>
                <tr class="cart-total-row">
                  <td colspan="3">Cart Total</td>
                  <td>₹ <span id="cart-total">0.00</span></td>
                </tr>
              </tfoot>
            </table>
            <div style="margin-top:10px; text-align:right;">
              <button id="checkoutBtn" class="primary-btn">Pay & Checkout</button>
            </div>
            <div id="message" style="margin-top:10px;font-size:13px;"></div>
          </div>

          <div class="card-soft">
            <h3>Customer Details (for Invoice)</h3>
            <p style="font-size:12px;color:#555;">
              Kripya apna naam aur address sahi bharein. Yeh details aapke invoice par dikhenge.
            </p>
            <input id="cust-name" class="customer-input" type="text" placeholder="Full Name *" />
            <input id="cust-phone" class="customer-input" type="text" placeholder="Phone / WhatsApp *" />
            <input id="cust-email" class="customer-input" type="email" placeholder="Email (optional)" />
            <textarea id="cust-address" class="customer-input" rows="3" placeholder="Full Address * (House no, Area, City, Pincode)"></textarea>

            <hr style="margin:12px 0; border:none; border-top:1px dashed #ddd;"/>

            <h3>Delivery & Contact</h3>
            <ul>
              <li>Dispatch within 1–3 working days (ready stock).</li>
              <li>Pan-India courier service (charges as per location).</li>
              <li>Secure online payment via Razorpay.</li>
            </ul>
            <p>
              Phone / WhatsApp: <b>${PHONE_DISPLAY}</b><br/>
              Email: <b>${EMAIL_ID}</b><br/>
              Location: <b>${ADDRESS_LINE}</b>
            </p>
          </div>
        </div>
      </section>
    </main>
  `;

  const extraHead = `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`;

  const extraScripts = `<script>
    const products = ${JSON.stringify(PRODUCTS)};
    let cart = [];

    const addButtons = document.querySelectorAll('.addCartBtn');
    const cartBody = document.getElementById('cart-body');
    const cartTotalEl = document.getElementById('cart-total');
    const messageEl = document.getElementById('message');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const custNameInput = document.getElementById('cust-name');
    const custPhoneInput = document.getElementById('cust-phone');
    const custEmailInput = document.getElementById('cust-email');
    const custAddressInput = document.getElementById('cust-address');

    function showMessage(html, timeout) {
      if (!messageEl) return;
      messageEl.innerHTML = html;
      if (timeout) {
        setTimeout(function(){ messageEl.innerHTML = ''; }, timeout);
      }
    }

    function renderCart() {
      if (!cartBody || !cartTotalEl) return;

      if (!cart.length) {
        cartBody.innerHTML = '<tr><td colspan="4" class="cart-empty">No items in cart yet.</td></tr>';
        cartTotalEl.textContent = '0.00';
        return;
      }

      let total = 0;
      let rows = '';

      cart.forEach(function(item) {
        var p = products.find(function(pr){ return pr.id === item.id; });
        if (!p) return;
        var lineTotal = p.price * item.qty;
        total += lineTotal;

        rows += '<tr>' +
          '<td>' + p.name + '</td>' +
          '<td style="white-space:nowrap;">' +
            '<button class="qty-btn" onclick="changeQty(\\'' + p.id + '\\', -1)">-</button>' +
            '<span>' + item.qty + '</span>' +
            '<button class="qty-btn" onclick="changeQty(\\'' + p.id + '\\', 1)">+</button>' +
          '</td>' +
          '<td>' + lineTotal.toFixed(2) + '</td>' +
          '<td style="text-align:center;">' +
            '<button class="remove-btn" onclick="removeItem(\\'' + p.id + '\\')">✕</button>' +
          '</td>' +
        '</tr>';
      });

      cartBody.innerHTML = rows;
      cartTotalEl.textContent = total.toFixed(2);
    }

    function addToCart(productId, qty) {
      if (qty <= 0) qty = 1;
      var existing = cart.find(function(i){ return i.id === productId; });
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({ id: productId, qty: qty });
      }
      renderCart();
      showMessage('Item added to cart.', 3000);
    }

    function changeQty(productId, delta) {
      var item = cart.find(function(i){ return i.id === productId; });
      if (!item) return;
      item.qty += delta;
      if (item.qty <= 0) {
        cart = cart.filter(function(i){ return i.id !== productId; });
      }
      renderCart();
    }

    function removeItem(productId) {
      cart = cart.filter(function(i){ return i.id !== productId; });
      renderCart();
    }

    window.changeQty = changeQty;
    window.removeItem = removeItem;

    addButtons.forEach(function(btn){
      btn.addEventListener('click', function(){
        var id = btn.getAttribute('data-id');
        var qtyInput = document.querySelector('input.qty-input[data-id="' + id + '"]');
        var qty = 1;
        if (qtyInput && qtyInput.value) {
          qty = parseInt(qtyInput.value, 10);
        }
        if (!qty || qty < 1) qty = 1;
        addToCart(id, qty);
      });
    });

    async function createOrderOnServer(payload) {
      var res = await fetch('/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }

    async function verifyPaymentOnServer(payload) {
      var res = await fetch('/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return res.json();
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', async function(){
        if (!cart.length) {
          showMessage('Your cart is empty.', 4000);
          return;
        }

        var custName = (custNameInput && custNameInput.value || '').trim();
        var custPhone = (custPhoneInput && custPhoneInput.value || '').trim();
        var custEmail = (custEmailInput && custEmailInput.value || '').trim();
        var custAddress = (custAddressInput && custAddressInput.value || '').trim();

        if (!custName || !custPhone || !custAddress) {
          showMessage('Please fill Name, Phone and Address for invoice.', 5000);
          return;
        }

        var customer = {
          name: custName,
          phone: custPhone,
          email: custEmail,
          address: custAddress
        };

        var itemsForOrder = cart.map(function(c){
          return { id: c.id, qty: c.qty };
        });

        showMessage('Creating order...');
        var orderResp;
        try {
          orderResp = await createOrderOnServer({ items: itemsForOrder });
        } catch (e) {
          console.error(e);
          showMessage('Network/server error. Please try again.', 9000);
          return;
        }

        if (!orderResp || orderResp.error) {
          showMessage('Server error: ' + (orderResp && orderResp.error ? orderResp.error : 'Unknown error'), 9000);
          return;
        }

        var detailedItems = cart.map(function(c){
          var p = products.find(function(pr){ return pr.id === c.id; });
          if (!p) return null;
          return {
            id: p.id,
            name: p.name,
            unitPrice: p.price,
            quantity: c.qty
          };
        }).filter(Boolean);

        var options = {
          key: orderResp.key,
          amount: orderResp.amount,
          currency: orderResp.currency,
          name: '${BRAND_NAME}',
          description: 'Order of ' + cart.length + ' item(s)',
          order_id: orderResp.id,
          handler: async function (response) {
            showMessage('Verifying payment, please wait...');
            try {
              var verifyResp = await verifyPaymentOnServer({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: detailedItems,
                customer: customer
              });
              if (verifyResp && verifyResp.success) {
                cart = [];
                renderCart();
                var link = verifyResp.invoiceUrl
                  ? '<a href="' + verifyResp.invoiceUrl + '" target="_blank">Download Invoice</a>'
                  : '';
                showMessage('Payment successful! ' + link, 15000);
              } else {
                showMessage('Payment verification failed. Please contact support.', 12000);
              }
            } catch (err) {
              console.error(err);
              showMessage('Verification error. Please contact support.', 12000);
            }
          },
          prefill: {
            name: custName,
            email: custEmail,
            contact: custPhone
          },
          notes: {},
          theme: { color: '#ff7a00' }
        };

        var rzpObj = new Razorpay(options);
        rzpObj.open();
      });
    }
  </script>`;

  res.send(
    renderPage({
      title: `${BRAND_NAME} — Online Store`,
      active: "home",
      bodyHtml,
      extraHead,
      extraScripts,
    })
  );
});

// ====== ABOUT PAGE ======
app.get("/about", (req, res) => {
  const bodyHtml = `
    <main class="container">
      <h2 class="section-title">About ${BRAND_NAME}</h2>
      <div class="section-sub">Know more about our journey and what we stand for.</div>

      <div class="two-col">
        <div class="card-soft">
          <h3>Our Story</h3>
          <p>
            ${BRAND_NAME} shuru hua ek chhote setup se jahan humne apne ghar ke liye
            saaf, flavourful masale aur khajoor source karne shuru kiye. Dheere-dheere
            local customers ko hamara taste pasand aaya aur aaj hum retail aur bulk
            dono ke liye supply kar rahe hain.
          </p>
          <p>
            Hamara mission simple hai:
            <b>"Har ghar tak asli swaad aur khushboo pohchana, bina quality compromise ke."</b>
          </p>
        </div>

        <div class="card-soft">
          <h3>Why choose us?</h3>
          <ul>
            <li>Selected farms & trusted suppliers se sourcing.</li>
            <li>Small-batch grinding taaki aroma aur natural oils safe rahein.</li>
            <li>Food-grade pouches aur cartons me hygienic packing.</li>
            <li>Flexible packing sizes: homes, restaurants & bulk buyers.</li>
          </ul>
        </div>
      </div>
    </main>
  `;

  res.send(
    renderPage({
      title: `About — ${BRAND_NAME}`,
      active: "about",
      bodyHtml,
    })
  );
});

// ====== CONTACT PAGE ======
app.get("/contact", (req, res) => {
  const bodyHtml = `
    <main class="container">
      <h2 class="section-title">Contact Us</h2>
      <div class="section-sub">
        Order, bulk enquiry ya kisi bhi sawaal ke liye niche diye gaye details se contact karein.
      </div>

      <div class="two-col">
        <div class="card-soft">
          <h3>Reach us directly</h3>
          <p>
            Phone / WhatsApp: <b>${PHONE_DISPLAY}</b><br/>
            Email: <b>${EMAIL_ID}</b><br/>
            Location: <b>${ADDRESS_LINE}</b>
          </p>
          <p>
            WhatsApp direct link:<br/>
            <a href="https://wa.me/${PHONE_WHATSAPP}" target="_blank">https://wa.me/${PHONE_WHATSAPP}</a>
          </p>
        </div>

        <div class="card-soft">
          <h3>Quick enquiry form</h3>
          <p style="font-size:12px;color:#555;">
            Ye form aapka default email client open karega, jisse aap seedha hume email kar sakte hain.
          </p>
          <form class="contact-form" action="mailto:${EMAIL_ID}" method="post" enctype="text/plain" style="display:grid;gap:10px;margin-top:8px;">
            <input type="text" name="Name" placeholder="Your name" required
              style="padding:8px;border-radius:8px;border:1px solid #ccc;font-size:13px;"/>
            <input type="email" name="Email" placeholder="Your email" required
              style="padding:8px;border-radius:8px;border:1px solid #ccc;font-size:13px;"/>
            <input type="text" name="Phone" placeholder="Phone / WhatsApp"
              style="padding:8px;border-radius:8px;border:1px solid #ccc;font-size:13px;"/>
            <textarea name="Message" rows="4" placeholder="Your message or order details" required
              style="padding:8px;border-radius:8px;border:1px solid #ccc;font-size:13px;"></textarea>
            <button type="submit"
              style="background:#0f4c81;color:#fff;border:0;border-radius:999px;padding:8px 16px;font-size:14px;cursor:pointer;">
              Send Enquiry
            </button>
          </form>
        </div>
      </div>
    </main>
  `;

  res.send(
    renderPage({
      title: `Contact — ${BRAND_NAME}`,
      active: "contact",
      bodyHtml,
    })
  );
});

// ====== CREATE ORDER (SERVER SIDE) ======
app.post("/create-order", async (req, res) => {
  try {
    if (!rzp) {
      return res.status(500).json({ error: "Razorpay not configured on server." });
    }

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    let totalAmount = 0;
    items.forEach((item) => {
      const product = PRODUCTS.find((p) => p.id === item.id);
      const qty = Number(item.qty || 1);
      if (!product || qty <= 0) return;
      totalAmount += product.price * qty;
    });

    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: "Invalid cart items" });
    }

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
    res
      .status(500)
      .json({ error: err.description || err.message || "Server error" });
  }
});

// ====== VERIFY PAYMENT + GENERATE INVOICE (WITH BILL TO + QR) ======
app.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      customer,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing verification fields" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", RZP_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("Signature mismatch", generatedSignature, razorpay_signature);
      return res.status(400).json({ error: "Invalid signature" });
    }

    const safeItems = Array.isArray(items) ? items : [];
    const safeCustomer = customer || {};

    const invoiceId = `INV-${Date.now()}`;
    const invoiceFilename = `invoice_${razorpay_order_id}.pdf`;
    const invoicePath = path.join(INVOICES_DIR, invoiceFilename);

    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(invoicePath);
    doc.pipe(writeStream);

    // HEADER with logo + brand
    let currentY = 40;
    if (fs.existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, 40, currentY, { width: 70 });
    }

    doc
      .fontSize(20)
      .text(BRAND_NAME, 130, currentY + 10, { align: "left" })
      .fontSize(10)
      .fillColor("#555")
      .text(ADDRESS_LINE, 130, currentY + 34, { align: "left" })
      .text("Phone: " + PHONE_DISPLAY, 130, currentY + 48)
      .text("Email: " + EMAIL_ID, 130, currentY + 60);

    // QR code with basic order info
    const qrText =
      "Invoice: " + invoiceId +
      "\\nOrder: " + razorpay_order_id +
      "\\nPayment: " + razorpay_payment_id +
      "\\nAmount: " + (safeItems.reduce(function(sum, it){ return sum + (Number(it.unitPrice || 0) * Number(it.quantity || 1)); }, 0)).toFixed(2) +
      "\\nCustomer: " + (safeCustomer.name || "");
    const qrDataUrl = await QRCode.toDataURL(qrText);
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBuffer = Buffer.from(qrBase64, "base64");
    doc.image(qrBuffer, 420, 40, { width: 100 });

    currentY += 80;

    // Invoice meta
    doc
      .fillColor("#000")
      .fontSize(14)
      .text("TAX INVOICE", 40, currentY, { align: "left" });

    doc
      .fontSize(10)
      .text("Invoice No: " + invoiceId, 40, currentY + 22)
      .text("Order ID: " + razorpay_order_id, 40, currentY + 36)
      .text("Payment ID: " + razorpay_payment_id, 40, currentY + 50)
      .text("Date: " + new Date().toLocaleString(), 40, currentY + 64);

    currentY += 96;

    // Bill To
    doc
      .fontSize(12)
      .text("Bill To:", 40, currentY)
      .fontSize(10)
      .text(safeCustomer.name || "Customer Name")
      .text("Phone: " + (safeCustomer.phone || ""))
      .text("Email: " + (safeCustomer.email || ""))
      .text("Address: " + (safeCustomer.address || ""));
    currentY += 70;

    // Items table
    const tableTop = currentY;
    const tableLeft = 40;
    const tableRight = 550;

    doc
      .rect(tableLeft, tableTop, tableRight - tableLeft, 18)
      .fill("#f5f6ff")
      .stroke("#e0e0e0");

    doc
      .fillColor("#000")
      .fontSize(10)
      .text("Item", tableLeft + 6, tableTop + 4)
      .text("Qty", 340, tableTop + 4)
      .text("Unit (₹)", 390, tableTop + 4)
      .text("Total (₹)", 470, tableTop + 4);

    let rowY = tableTop + 22;
    let grandTotal = 0;

    safeItems.forEach(function(item) {
      const qty = Number(item.quantity || 1);
      const unit = Number(item.unitPrice || 0);
      const lineTotal = qty * unit;
      grandTotal += lineTotal;

      doc
        .rect(tableLeft, rowY - 2, tableRight - tableLeft, 18)
        .stroke("#e0e0e0");

      doc
        .fillColor("#000")
        .fontSize(10)
        .text(item.name || "Product", tableLeft + 6, rowY)
        .text(qty.toString(), 340, rowY)
        .text(unit.toFixed(2), 390, rowY)
        .text(lineTotal.toFixed(2), 470, rowY);

      rowY += 20;
    });

    // Totals box
    rowY += 8;
    doc
      .rect(380, rowY, tableRight - 380, 50)
      .stroke("#e0e0e0")
      .fillColor("#000")
      .fontSize(10);

    doc
      .text("Subtotal:", 390, rowY + 8)
      .text("₹ " + grandTotal.toFixed(2), 470, rowY + 8, { align: "right" })
      .text("GST (included where applicable):", 390, rowY + 24)
      .text("₹ 0.00", 470, rowY + 24, { align: "right" })
      .font("Helvetica-Bold")
      .text("Grand Total:", 390, rowY + 38)
      .text("₹ " + grandTotal.toFixed(2), 470, rowY + 38, { align: "right" })
      .font("Helvetica");

    // Footer note
    rowY += 80;
    doc
      .fontSize(10)
      .fillColor("#555")
      .text(
        "Thank you for your purchase! For any query related to this invoice, please contact us on WhatsApp or email.",
        40,
        rowY,
        { align: "center" }
      );

    doc.end();

    writeStream.on("finish", function () {
      const invoiceUrl = "/invoices/" + invoiceFilename;
      console.log("Invoice generated:", invoicePath);
      res.json({ success: true, invoiceUrl: invoiceUrl });
    });

    writeStream.on("error", function (err) {
      console.error("Invoice write error", err);
      res.status(500).json({ error: "Invoice generation failed" });
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res
      .status(500)
      .json({ error: err.message || err.description || "Server error" });
  }
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log("Server listening on http://localhost:" + PORT);
  console.log(
    "Ensure you set RZP_KEY_ID and RZP_KEY_SECRET in .env or Render env vars."
  );
});
