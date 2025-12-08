// Load environment variables from .env
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = process.env.PORT || 3000;

// ====== BASIC CONFIG ======
const BRAND_NAME = "Al Aroma Spices";
const BRAND_TAGLINE = "We deliver fresh, high-quality spices for your kitchen.";
const PHONE_DISPLAY = "+91-9876543210";     // apna number
const PHONE_WHATSAPP = "919876543210";      // WhatsApp ke liye (country code + number, bina +)
const EMAIL_ID = "alaroma.spices@gmail.com";
const ADDRESS_LINE = "Pune, Maharashtra, India";
const CURRENT_YEAR = new Date().getFullYear();

// ====== INVOICE FOLDER ======
const INVOICES_DIR = path.join(__dirname, "invoices");
if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

// ====== MIDDLEWARE ======
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/invoices", express.static(INVOICES_DIR)); // serve invoice PDFs

// ====== RAZORPAY CLIENT ======
const rzp = new Razorpay({
  key_id: process.env.RZP_KEY_ID || "",
  key_secret: process.env.RZP_KEY_SECRET || "",
});

// yeh line check ke liye: .env se key load ho rahi hai ya nahi
console.log("Loaded Razorpay Key:", process.env.RZP_KEY_ID);

// ====== PRODUCTS ======
const PRODUCTS = [
  {
    id: "p001",
    name: "Al Aroma Garam Masala (100g)",
    price: 120.0,
    img: "https://via.placeholder.com/400x260?text=Garam+Masala",
    desc: "Premium garam masala for rich flavour in every dish.",
  },
  {
    id: "p002",
    name: "Al Aroma Turmeric Powder (200g)",
    price: 150.0,
    img: "https://via.placeholder.com/400x260?text=Turmeric",
    desc: "High-quality turmeric powder with rich colour and aroma.",
  },
  {
    id: "p003",
    name: "Al Aroma Red Chili Powder (100g)",
    price: 80.0,
    img: "https://via.placeholder.com/400x260?text=Red+Chili",
    desc: "Spicy and fresh red chili powder for everyday cooking.",
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
      body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin:0; padding:0; background:#f4f5fb; color:#222; }
      a { text-decoration:none; color:inherit; }

      header {
        background:#0f4c81;
        color:#fff;
        padding:10px 16px;
        position:sticky;
        top:0;
        z-index:10;
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
      .logo {
        font-weight:800;
        font-size:22px;
        letter-spacing:0.03em;
      }
      .contact-top {
        font-size:12px;
        opacity:0.9;
        text-align:right;
      }
      nav {
        margin-top:6px;
        font-size:14px;
      }
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

      .container {
        max-width:1100px;
        margin:22px auto;
        padding:0 14px;
      }

      .hero {
        background:#0f4c81;
        color:#fff;
        padding:24px 16px 30px;
      }
      .hero-inner {
        max-width:1100px;
        margin:0 auto;
        display:grid;
        grid-template-columns: minmax(0,1.4fr) minmax(0,1fr);
        gap:24px;
        align-items:center;
      }
      .hero h1 {
        margin:0 0 8px;
        font-size:32px;
      }
      .hero p {
        margin:0 0 14px;
        font-size:15px;
      }
      .hero-highlights {
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        margin-top:8px;
      }
      .pill {
        border-radius:999px;
        border:1px solid rgba(255,255,255,0.4);
        padding:4px 10px;
        font-size:12px;
      }
      .hero-box {
        background:rgba(255,255,255,0.12);
        border-radius:16px;
        padding:14px;
        font-size:13px;
        box-shadow:0 8px 24px rgba(0,0,0,0.18);
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
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap:18px;
      }
      .card {
        background:#fff;
        border-radius:16px;
        padding:14px;
        box-shadow:0 10px 26px rgba(15,18,40,0.08);
        text-align:center;
      }
      .card img {
        width:100%;
        height:170px;
        border-radius:12px;
        object-fit:cover;
        background:#eee;
      }
      .card h3 {
        margin:10px 0 4px;
        font-size:17px;
      }
      .card .desc {
        font-size:13px;
        color:#555;
        min-height:34px;
      }
      .price {
        font-weight:700;
        margin-top:8px;
        font-size:16px;
      }
      .controls {
        margin-top:10px;
        display:flex;
        justify-content:center;
        align-items:center;
        gap:8px;
      }
      .qty {
        width:70px;
        padding:6px;
        border-radius:8px;
        border:1px solid #d0d0d0;
        text-align:center;
        font-size:13px;
      }
      button.primary-btn {
        background:#ff7a00;
        color:#fff;
        border:0;
        border-radius:999px;
        padding:8px 16px;
        font-size:14px;
        cursor:pointer;
        font-weight:600;
        box-shadow:0 8px 20px rgba(255,122,0,0.45);
      }
      button.primary-btn:hover {
        filter:brightness(0.95);
      }

      .two-col {
        display:grid;
        grid-template-columns: minmax(0,1.2fr) minmax(0,1fr);
        gap:20px;
        align-items:flex-start;
        margin-top:10px;
      }
      .card-soft {
        background:#fff;
        border-radius:16px;
        padding:14px 16px;
        box-shadow:0 10px 25px rgba(0,0,0,0.04);
        font-size:13px;
      }
      .card-soft h3 {
        margin-top:0;
        margin-bottom:6px;
        font-size:16px;
      }
      .card-soft ul {
        padding-left:18px;
        margin:4px 0 8px;
      }
      .card-soft li {
        margin-bottom:4px;
      }
      .badge-list {
        display:flex;
        flex-wrap:wrap;
        gap:8px;
        margin-top:6px;
      }
      .badge {
        padding:4px 8px;
        border-radius:999px;
        border:1px solid #e0e0e0;
        font-size:11px;
      }

      /* CART */
      .cart-table {
        width:100%;
        border-collapse:collapse;
        font-size:12px;
      }
      .cart-table th,
      .cart-table td {
        border-bottom:1px solid #eee;
        padding:6px 4px;
        text-align:left;
      }
      .cart-total-row {
        font-weight:bold;
      }
      .cart-empty {
        font-size:12px;
        color:#777;
      }

      footer {
        margin-top:24px;
        background:#0f4c81;
        color:#fff;
        padding:18px 14px;
      }
      .footer-inner {
        max-width:1100px;
        margin:0 auto;
        font-size:13px;
        display:flex;
        flex-wrap:wrap;
        gap:10px;
        justify-content:space-between;
        align-items:center;
      }
      .footer-contact {
        line-height:1.5;
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

      form.contact-form {
        display:grid;
        gap:10px;
        margin-top:10px;
      }
      .contact-form input,
      .contact-form textarea {
        padding:8px;
        border-radius:8px;
        border:1px solid #ccc;
        font-size:13px;
      }
      .contact-form button {
        background:#0f4c81;
        color:#fff;
        border:0;
        border-radius:999px;
        padding:8px 16px;
        font-size:14px;
        cursor:pointer;
      }

      @media (max-width: 800px) {
        .hero-inner {
          grid-template-columns: minmax(0,1fr);
        }
        .two-col {
          grid-template-columns: minmax(0,1fr);
        }
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
          <div class="logo">${BRAND_NAME}</div>
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
        <div class="footer-contact">
          Ph: ${PHONE_DISPLAY} &nbsp; | &nbsp; Email: ${EMAIL_ID}
        </div>
      </div>
    </footer>

    <a class="wa-btn" href="https://wa.me/${PHONE_WHATSAPP}?text=Hi%20Al%20Aroma%20Spices%2C%20I%20want%20to%20order%20spices." target="_blank">
      WhatsApp Order
    </a>

    ${extraScripts}
  </body>
  </html>`;
}

// ====== HOME PAGE (PRODUCTS + CART + PAYMENT) ======
app.get("/", (req, res) => {
  const productCards = PRODUCTS.map(
    (p) => `
      <div class="card">
        <img src="${p.img}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p class="desc">${p.desc}</p>
        <div class="price">₹ ${p.price.toFixed(2)}</div>
        <div class="controls">
          <input type="number" min="1" value="1" data-id="${p.id}" class="qty" />
          <button data-id="${p.id}" class="primary-btn addCartBtn">Add to cart</button>
        </div>
      </div>
    `
  ).join("\n");

  const body = `
    <section class="hero">
      <div class="hero-inner">
        <div>
          <h1>${BRAND_NAME}</h1>
          <p>${BRAND_TAGLINE}</p>
          <div class="hero-highlights">
            <div class="pill">Pure & flavourful spices</div>
            <div class="pill">Retail & bulk supply</div>
            <div class="pill">Pan-India delivery*</div>
          </div>
        </div>
        <div class="hero-box">
          <strong>How to order:</strong>
          <ul>
            <li>Products se quantity select karke <b>Add to cart</b> pe click karein.</li>
            <li>Cart me sab items check karke <b>Pay & Checkout</b> click karein.</li>
            <li>Payment Razorpay ke through hoga (UPI / Card / NetBanking).</li>
            <li>Payment ke baad aapke liye automatic <b>PDF invoice</b> generate hoga.</li>
          </ul>
          <div style="font-size:11px; opacity:0.85; margin-top:6px;">
            *Delivery charges extra as per location.
          </div>
        </div>
      </div>
    </section>

    <main class="container">
      <h2 class="section-title">Products</h2>
      <div class="section-sub">Freshly packed spices. Quantity and price can be customised for bulk orders on request.</div>

      <div class="grid-products">
        ${productCards}
      </div>

      <section style="margin-top:26px;">
        <div class="two-col">
          <div class="card-soft">
            <h3>Your Cart</h3>
            <table class="cart-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody id="cart-body">
                <tr><td colspan="3" class="cart-empty">No items in cart yet.</td></tr>
              </tbody>
              <tfoot>
                <tr class="cart-total-row">
                  <td colspan="2">Cart Total</td>
                  <td>₹ <span id="cart-total">0.00</span></td>
                </tr>
              </tfoot>
            </table>
            <div style="margin-top:10px; text-align:right;">
              <button id="checkoutBtn" class="primary-btn">Pay & Checkout</button>
            </div>
            <div id="message" style="margin-top:10px; font-size:13px;"></div>
          </div>

          <div class="card-soft">
            <h3>Delivery & Contact</h3>
            <ul>
              <li>Dispatch within 1–3 working days for ready stock.</li>
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
      const messageEl = document.getElementById('message');
      const cartBody = document.getElementById('cart-body');
      const cartTotalEl = document.getElementById('cart-total');
      const checkoutBtn = document.getElementById('checkoutBtn');

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
          cartBody.innerHTML = '<tr><td colspan="3" class="cart-empty">No items in cart yet.</td></tr>';
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
            '<td>' + item.qty + '</td>' +
            '<td>' + lineTotal.toFixed(2) + '</td>' +
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

      addButtons.forEach(function(btn){
        btn.addEventListener('click', function(){
          var id = btn.getAttribute('data-id');
          var qtyInput = document.querySelector('input.qty[data-id="' + id + '"]');
          var qty = parseInt((qtyInput && qtyInput.value) || '1', 10);
          if (isNaN(qty) || qty < 1) qty = 1;
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

          if (orderResp.error) {
            showMessage('Server error: ' + (orderResp.error || 'Unknown error'), 9000);
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
                  items: detailedItems
                });
                if (verifyResp && verifyResp.success) {
                  cart = [];
                  renderCart();
                  var link = verifyResp.invoiceUrl ? '<a href="' + verifyResp.invoiceUrl + '" target="_blank">Download Invoice</a>' : '';
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
              name: '',
              email: '',
              contact: ''
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
      title: `${BRAND_NAME} — Online Spices Store`,
      active: "home",
      bodyHtml: body,
      extraHead,
      extraScripts,
    })
  );
});

// ====== ABOUT PAGE ======
app.get("/about", (req, res) => {
  const body = `
    <main class="container">
      <h2 class="section-title">About ${BRAND_NAME}</h2>
      <div class="section-sub">Know more about our journey and what we stand for.</div>

      <div class="two-col">
        <div class="card-soft">
          <h3>Our Story</h3>
          <p>
            ${BRAND_NAME} ek chhota se initiative ke roop mein shuru hua jahan humne
            apne ghar ke liye saaf aur flavourful masale source karne shuru kiye.
            Dheere-dheere local customers ko hamara taste pasand aaya, aur aaj hum
            retail aur bulk dono customers tak fresh masale pahucha rahe hain.
          </p>
          <p>
            Hamara mission simple hai: <b>“Har ghar tak asli swaad aur khushboo
            pohchana, bina quality compromise ke.”</b>
          </p>
        </div>

        <div class="card-soft">
          <h3>What makes us different?</h3>
          <ul>
            <li>Selected farms & trusted suppliers se raw material sourcing.</li>
            <li>Small-batch grinding taaki aroma aur oils retain rahein.</li>
            <li>Food-grade pouches aur cartons mein hygienic packing.</li>
            <li>Flexible packing sizes for homes, restaurants & bulk buyers.</li>
          </ul>
        </div>
      </div>
    </main>
  `;

  res.send(
    renderPage({
      title: `About — ${BRAND_NAME}`,
      active: "about",
      bodyHtml: body,
    })
  );
});

// ====== CONTACT PAGE ======
app.get("/contact", (req, res) => {
  const body = `
    <main class="container">
      <h2 class="section-title">Contact Us</h2>
      <div class="section-sub">Order, bulk enquiry ya kisi bhi sawaal ke liye humse contact karein.</div>

      <div class="two-col">
        <div class="card-soft">
          <h3>Reach us directly</h3>
          <p>
            Phone / WhatsApp: <b>${PHONE_DISPLAY}</b><br/>
            Email: <b>${EMAIL_ID}</b><br/>
            Location: <b>${ADDRESS_LINE}</b>
          </p>
          <p>
            WhatsApp direct link: <br/>
            <a href="https://wa.me/${PHONE_WHATSAPP}" target="_blank">https://wa.me/${PHONE_WHATSAPP}</a>
          </p>
        </div>

        <div class="card-soft">
          <h3>Quick enquiry form</h3>
          <p style="font-size:12px; color:#555;">
            Ye form aapka default email client open karega jisse aap seedha hume email kar sakte hain.
          </p>
          <form class="contact-form" action="mailto:${EMAIL_ID}" method="post" enctype="text/plain">
            <input type="text" name="Name" placeholder="Your name" required />
            <input type="email" name="Email" placeholder="Your email" required />
            <input type="text" name="Phone" placeholder="Phone / WhatsApp" />
            <textarea name="Message" rows="4" placeholder="Your message or order details" required></textarea>
            <button type="submit">Send Enquiry</button>
          </form>
        </div>
      </div>
    </main>
  `;

  res.send(
    renderPage({
      title: `Contact — ${BRAND_NAME}`,
      active: "contact",
      bodyHtml: body,
    })
  );
});

// ====== CREATE ORDER (RAZORPAY) USING CART ITEMS ======
app.post("/create-order", async (req, res) => {
  try {
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

    if (totalAmount <= 0) {
      return res.status(400).json({ error: "Invalid cart items" });
    }

    const amountPaise = Math.round(totalAmount * 100);
    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await rzp.orders.create(options);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RZP_KEY_ID || "",
      receipt: order.receipt,
      status: order.status,
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: err.description || err.message || "Server error" });
  }
});

// ====== VERIFY PAYMENT + GENERATE CART INVOICE ======
app.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing verification fields" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RZP_KEY_SECRET || "")
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("Signature mismatch", generatedSignature, razorpay_signature);
      return res.status(400).json({ error: "Invalid signature" });
    }

    const safeItems = Array.isArray(items) ? items : [];

    const invoiceId = `inv_${Date.now()}`;
    const invoiceFilename = `invoice_${razorpay_order_id}.pdf`;
    const invoicePath = path.join(INVOICES_DIR, invoiceFilename);

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(invoicePath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).text(BRAND_NAME, { align: "left" });
    doc.fontSize(10).text("Invoice ID: " + invoiceId, { align: "right" });
    doc.text("Order ID: " + razorpay_order_id, { align: "right" });
    doc.moveDown();

    // Seller info
    doc.fontSize(10).text("Seller: " + BRAND_NAME);
    doc.text("Address: " + ADDRESS_LINE);
    doc.moveDown();

    // Table header
    doc.moveDown(0.5);
    doc.fontSize(12).text("Item", 50, doc.y);
    doc.text("Qty", 300, doc.y);
    doc.text("Unit (₹)", 350, doc.y);
    doc.text("Total (₹)", 450, doc.y);
    doc.moveDown();

    let grandTotal = 0;

    safeItems.forEach((item) => {
      const qty = Number(item.quantity || 1);
      const unit = Number(item.unitPrice || 0);
      const lineTotal = qty * unit;
      grandTotal += lineTotal;

      doc.fontSize(11).text(item.name || "Product", 50);
      doc.text(qty.toString(), 300);
      doc.text(unit.toFixed(2), 350);
      doc.text(lineTotal.toFixed(2), 450);
      doc.moveDown();
    });

    doc.moveDown();
    doc.text("Subtotal: ₹" + grandTotal.toFixed(2), { align: "right" });
    doc.text("GST: ₹0.00", { align: "right" });
    doc.text("Grand Total: ₹" + grandTotal.toFixed(2), { align: "right" });

    doc.moveDown(2);
    doc.fontSize(10).text("Payment ID: " + razorpay_payment_id);
    doc.text("Thank you for your purchase!", { align: "center" });

    doc.end();

    writeStream.on("finish", () => {
      const invoiceUrl = "/invoices/" + invoiceFilename;
      console.log("Invoice generated:", invoicePath);
      res.json({ success: true, invoiceUrl });
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
  console.log("Ensure you set RZP_KEY_ID and RZP_KEY_SECRET in .env or Render env vars");
});
