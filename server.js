// server.js
// Ek hi file me: backend (Node.js + Express) + frontend (HTML page)

// ====== CONFIG: Yahan apni Razorpay keys dalo ======
// server.js
// Ek hi file me: backend (Node.js + Express) + frontend (HTML page)

// ====== ENV LOAD (local .env + Render env) ======
require("dotenv").config();

// ====== CONFIG: Razorpay keys env se lo ======
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_rzp_live_RodivHVsenoOgh";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "GVgxYqWoWBMiZPXqnUyqMRDs";

// ====== Dependencies ======
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const bodyParser = require("body-parser");


const app = express();
app.use(bodyParser.json());

// ====== Razorpay instance ======
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// ====== Frontend HTML (poori website) ======
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Al Aroma Spices - Pure Spices & Dates</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      background: #faf5ef;
      color: #222;
    }

    a {
      text-decoration: none;
      color: inherit;
    }

    /* Header / Navbar */
    header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #f1e3d0;
    }

    .nav {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0.8rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 1.2rem;
    }

    .logo-badge {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #facc15, #b45309);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 0.9rem;
    }

    .nav-links {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
    }

    .nav-links a {
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      transition: background 0.2s, color 0.2s;
    }

    .nav-links a:hover {
      background: #f59e0b;
      color: #fff;
    }

    .cart-button {
      position: relative;
      padding: 0.4rem 0.9rem;
      border-radius: 999px;
      border: none;
      background: #16a34a;
      color: #fff;
      font-size: 0.9rem;
      cursor: pointer;
    }

    .cart-count {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #ef4444;
      color: #fff;
      border-radius: 999px;
      font-size: 0.65rem;
      padding: 0 5px;
      min-width: 16px;
      text-align: center;
    }

    /* Hero */
    .hero {
      max-width: 1100px;
      margin: 1.5rem auto;
      padding: 0 1rem;
      display: grid;
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
      gap: 1.5rem;
      align-items: center;
    }

    .hero-text h1 {
      font-size: 2.1rem;
      line-height: 1.2;
      margin-bottom: 0.5rem;
    }

    .hero-text h1 span {
      color: #b45309;
    }

    .hero-text p {
      font-size: 0.95rem;
      color: #4b5563;
      margin-bottom: 1rem;
    }

    .hero-highlights {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      margin-bottom: 1.2rem;
    }

    .hero-highlights span {
      font-size: 0.8rem;
      padding: 0.35rem 0.8rem;
      border-radius: 999px;
      border: 1px dashed #f59e0b;
      background: #fffbeb;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      align-items: center;
    }

    .btn-primary {
      padding: 0.6rem 1.2rem;
      border-radius: 999px;
      border: none;
      background: linear-gradient(135deg, #f97316, #b45309);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.9rem;
    }

    .btn-outline {
      padding: 0.6rem 1rem;
      border-radius: 999px;
      border: 1px solid #d1d5db;
      background: #fff;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .hero-contact {
      margin-top: 0.5rem;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .hero-contact b {
      color: #111827;
    }

    .hero-image {
      background: radial-gradient(circle at 0 0, #fffbeb, #f97316);
      border-radius: 24px;
      padding: 1rem;
      display: grid;
      place-items: center;
      position: relative;
      overflow: hidden;
    }

    .hero-image-inner {
      background: #fff7ed;
      border-radius: 20px;
      padding: 1rem;
      width: 100%;
      max-width: 320px;
      box-shadow: 0 18px 40px rgba(0,0,0,0.08);
    }

    .hero-image-inner h3 {
      font-size: 1rem;
      margin-bottom: 0.4rem;
    }

    .hero-image-inner p {
      font-size: 0.8rem;
      color: #4b5563;
      margin-bottom: 0.6rem;
    }

    .pill-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
    }

    .pill-row span {
      font-size: 0.7rem;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      background: #fef3c7;
      color: #92400e;
    }

    .badge {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: #16a34a;
      color: #fff;
      font-size: 0.7rem;
      padding: 0.4rem 0.7rem;
      border-radius: 999px;
      box-shadow: 0 8px 16px rgba(22,163,74,0.45);
    }

    /* Sections */
    section {
      max-width: 1100px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 0.3rem;
    }

    .section-subtitle {
      font-size: 0.85rem;
      color: #6b7280;
      margin-bottom: 1.2rem;
    }

    /* Product grid */
    .tabs {
      display: inline-flex;
      padding: 0.2rem;
      border-radius: 999px;
      background: #f3f4f6;
      margin-bottom: 1rem;
      gap: 0.2rem;
    }

    .tab-btn {
      border: none;
      border-radius: 999px;
      padding: 0.4rem 0.9rem;
      font-size: 0.8rem;
      cursor: pointer;
      background: transparent;
    }

    .tab-btn.active {
      background: #ef4444;
      color: #fff;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
    }

    .product-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 10px 20px rgba(0,0,0,0.05);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 230px;
    }

    .product-image {
      height: 130px;
      background-size: cover;
      background-position: center;
    }

    .product-body {
      padding: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      flex: 1;
    }

    .product-name {
      font-size: 0.9rem;
      font-weight: 600;
    }

    .product-tag {
      font-size: 0.7rem;
      color: #6b7280;
    }

    .product-footer {
      margin-top: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.3rem;
    }

    .price {
      font-weight: 700;
      font-size: 0.9rem;
      color: #b45309;
    }

    .unit {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .btn-add {
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      border: none;
      background: #16a34a;
      color: #fff;
      font-size: 0.75rem;
      cursor: pointer;
      white-space: nowrap;
    }

    /* Cart sidebar */
    .cart-panel {
      position: fixed;
      top: 0;
      right: -360px;
      width: 320px;
      height: 100vh;
      background: #fff;
      box-shadow: -10px 0 30px rgba(0,0,0,0.15);
      z-index: 60;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      transition: right 0.25s ease;
    }

    .cart-panel.open {
      right: 0;
    }

    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.8rem;
    }

    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding-right: 0.3rem;
      margin-bottom: 0.8rem;
    }

    .cart-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      padding: 0.4rem 0;
      border-bottom: 1px solid #f3f4f6;
      gap: 0.3rem;
    }

    .cart-item span {
      display: block;
    }

    .cart-item-title {
      font-weight: 500;
    }

    .cart-item-controls {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
    }

    .cart-btn {
      border: 1px solid #d1d5db;
      background: #f9fafb;
      border-radius: 999px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .cart-footer {
      border-top: 1px solid #f3f4f6;
      padding-top: 0.7rem;
      font-size: 0.85rem;
    }

    .cart-footer-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.4rem;
    }

    .btn-checkout {
      width: 100%;
      padding: 0.6rem;
      border-radius: 999px;
      border: none;
      background: #f97316;
      color: #fff;
      font-size: 0.9rem;
      cursor: pointer;
      margin-top: 0.4rem;
    }

    .checkout-note {
      margin-top: 0.4rem;
      font-size: 0.7rem;
      color: #6b7280;
    }

    /* Contact section */
    .contact-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      gap: 1rem;
      align-items: flex-start;
    }

    .contact-card {
      background: #fff;
      border-radius: 18px;
      padding: 1rem;
      box-shadow: 0 10px 20px rgba(0,0,0,0.05);
      font-size: 0.85rem;
    }

    .contact-row {
      margin-bottom: 0.5rem;
    }

    .contact-row b {
      display: inline-block;
      width: 80px;
      color: #4b5563;
    }

    form {
      display: grid;
      gap: 0.6rem;
    }

    label {
      font-size: 0.8rem;
      color: #4b5563;
    }

    input, textarea {
      width: 100%;
      padding: 0.45rem 0.6rem;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      font-size: 0.85rem;
      outline: none;
    }

    input:focus, textarea:focus {
      border-color: #f97316;
      box-shadow: 0 0 0 1px rgba(249,115,22,0.3);
    }

    textarea {
      resize: vertical;
      min-height: 70px;
    }

    footer {
      text-align: center;
      font-size: 0.75rem;
      color: #9ca3af;
      padding: 1rem 0.5rem 1.3rem;
    }

    /* Responsive */
    @media (max-width: 800px) {
      .hero {
        grid-template-columns: minmax(0, 1fr);
      }
      .hero-image {
        order: -1;
      }
      .nav-links {
        display: none;
      }
    }

    @media (max-width: 640px) {
      .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }
      .contact-grid {
        grid-template-columns: minmax(0,1fr);
      }
      .hero-text h1 {
        font-size: 1.6rem;
      }
    }
  </style>
</head>
<body>

<header>
  <div class="nav">
    <div class="logo">
      <div class="logo-badge">AA</div>
      <div>
        <div>Al Aroma Spices</div>
        <div style="font-size:0.7rem;color:#6b7280;">Pure Spices & Premium Dates</div>
      </div>
    </div>

    <nav class="nav-links">
      <a href="#products">Products</a>
      <a href="#dates">Premium Dates</a>
      <a href="#contact">Contact</a>
    </nav>

    <button class="cart-button" id="cartButton">
      Cart
      <span class="cart-count" id="cartCount">0</span>
    </button>
  </div>
</header>

<main>
  <!-- Hero -->
  <section class="hero" id="top">
    <div class="hero-text">
      <h1>Fresh, <span>Aromatic Spices</span> & Handpicked Dates.</h1>
      <p>
        Al Aroma Spices mein hum laate hain high-quality masale & premium dates,
        seedha aapke kitchen tak. Taste, freshness aur purity — sab ek hi jagah.
      </p>
      <div class="hero-highlights">
        <span>100% Quality Checked</span>
        <span>No Added Color</span>
        <span>Bulk & Retail Packing</span>
        <span>Pan India Delivery*</span>
      </div>
      <div class="hero-actions">
        <button class="btn-primary" onclick="scrollToSection('products')">Shop Spices</button>
        <button class="btn-outline" onclick="scrollToSection('dates')">Shop Dates</button>
      </div>
      <div class="hero-contact">
        WhatsApp / Call: <b>+91-6392914193</b> &nbsp;|&nbsp; Email: <b>aarifnexa5@mail.com</b>
      </div>
    </div>

    <div class="hero-image">
      <div class="hero-image-inner">
        <h3>Today’s Pick</h3>
        <p>Signature Garam Masala blend with 14 hand-roasted spices.</p>
        <div class="pill-row">
          <span>Garam Masala</span>
          <span>Turmeric</span>
          <span>Red Chilli</span>
          <span>Ajwa Dates</span>
        </div>
        <div style="font-size:0.8rem;color:#4b5563;">
          Perfect for restaurants, home chefs & bulk buyers.
        </div>
      </div>
      <div class="badge">Fresh Batch Roasted</div>
    </div>
  </section>

  <!-- Spices -->
  <section id="products">
    <div class="section-title">All Spices</div>
    <div class="section-subtitle">Daily-use masale for every Indian kitchen.</div>

    <div class="tabs">
      <button class="tab-btn active" onclick="filterCategory('all')">All</button>
      <button class="tab-btn" onclick="filterCategory('spice')">Spices</button>
      <button class="tab-btn" onclick="filterCategory('dates')">Dates</button>
    </div>

    <div class="product-grid" id="productGrid">
      <!-- Products injected by JS -->
    </div>
  </section>

  <!-- Dates highlight -->
  <section id="dates">
    <div class="section-title">Premium Dates Collection</div>
    <div class="section-subtitle">
      Saudi & Middle Eastern dates – Ajwa, Medjool, Mabroom, Safawi & more.
    </div>
    <div style="font-size:0.85rem;color:#4b5563;">
      Hum high-grade dates source karte hain, jo iftar hampers, gifting & daily consumption ke liye perfect hain.
      Bulk and customised packing available (250g, 500g, 1kg).
    </div>
  </section>

  <!-- Contact / Order section -->
  <section id="contact">
    <div class="section-title">Bulk / Retail Order & Enquiry</div>
    <div class="section-subtitle">
      Form fill karo, hum WhatsApp / email se aapse contact karenge.
    </div>

    <div class="contact-grid">
      <div class="contact-card">
        <h3 style="margin-bottom:0.6rem;font-size:1rem;">Send us an enquiry</h3>
        <form onsubmit="event.preventDefault(); alert('Thank you! Hum jaldi aapse contact karenge.');">
          <div>
            <label for="name">Name</label>
            <input id="name" placeholder="Your full name" />
          </div>
          <div>
            <label for="phone">WhatsApp Number</label>
            <input id="phone" placeholder="+91-" />
          </div>
          <div>
            <label for="message">Products / Quantity</label>
            <textarea id="message" placeholder="Example: 10kg Turmeric, 5kg Garam Masala, 3kg Ajwa dates"></textarea>
          </div>
          <button type="submit" class="btn-primary">Submit Enquiry</button>
        </form>
      </div>

      <div class="contact-card">
        <h3 style="margin-bottom:0.6rem;font-size:1rem;">Business Details</h3>
        <div class="contact-row">
          <b>Brand:</b> Al Aroma Spices
        </div>
        <div class="contact-row">
          <b>Owner:</b> Aarif Khan
        </div>
        <div class="contact-row">
          <b>Phone:</b> +91-6392914193
        </div>
        <div class="contact-row">
          <b>Email:</b> aarifnexa5@mail.com
        </div>
        <div class="contact-row">
          <b>Address:</b> Your City, India
        </div>
        <p style="margin-top:0.7rem;font-size:0.8rem;color:#6b7280;">
          Payment Options: Card, UPI, Wallet – Razorpay Payment Gateway ke through.
        </p>
      </div>
    </div>
  </section>
</main>

<!-- Cart Sidebar -->
<aside class="cart-panel" id="cartPanel">
  <div class="cart-header">
    <div style="font-weight:600;">Your Cart</div>
    <button class="cart-btn" onclick="toggleCart()">✕</button>
  </div>
  <div class="cart-items" id="cartItems"></div>

  <div class="cart-footer">
    <div class="cart-footer-row">
      <span>Items</span>
      <span id="cartItemsCount">0</span>
    </div>
    <div class="cart-footer-row">
      <span>Total</span>
      <span id="cartTotal">₹0</span>
    </div>
    <button class="btn-checkout" onclick="checkout()">Proceed to Payment</button>
    <div class="checkout-note">
      Amount cart se automatic Razorpay payment popup me jayega.  
      Payment ke baad invoice auto generate ho jayegi (print / PDF).
    </div>
  </div>
</aside>

<footer>
  © <span id="year"></span> Al Aroma Spices. All rights reserved.
</footer>

<script src="https://checkout.razorpay.com/v1/checkout.js"></script>

<script>
  // ================== PRODUCTS ==================
  var products = [
    { id: 1,  name: "Turmeric Powder",   tag: "Haldi – 7% curcumin",   price: 120, unit: "500g pouch", category: "spice", image: "https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg" },
    { id: 2,  name: "Red Chilli Powder", tag: "Lal mirch – medium hot", price: 150, unit: "500g pouch", category: "spice", image: "https://images.pexels.com/photos/1431335/pexels-photo-1431335.jpeg" },
    { id: 3,  name: "Coriander Powder",  tag: "Dhaniya powder",        price: 110, unit: "500g pouch", category: "spice", image: "https://images.pexels.com/photos/4110251/pexels-photo-4110251.jpeg" },
    { id: 4,  name: "Cumin Seeds",       tag: "Jeera – bold grade",    price: 180, unit: "500g pouch", category: "spice", image: "https://images.pexels.com/photos/6969659/pexels-photo-6969659.jpeg" },
    { id: 5,  name: "Black Pepper",      tag: "Kali mirch – whole",    price: 220, unit: "250g pouch", category: "spice", image: "https://images.pexels.com/photos/1431337/pexels-photo-1431337.jpeg" },
    { id: 6,  name: "Garam Masala Blend",tag: "14-spice signature blend", price: 199, unit: "250g pouch", category: "spice", image: "https://images.pexels.com/photos/1431325/pexels-photo-1431325.jpeg" },
    { id: 7,  name: "Cardamom Pods",     tag: "Elaichi – premium",     price: 350, unit: "100g pack", category: "spice", image: "https://images.pexels.com/photos/4110229/pexels-photo-4110229.jpeg" },
    { id: 8,  name: "Cloves",            tag: "Laung – handpicked",    price: 260, unit: "100g pack", category: "spice", image: "https://images.pexels.com/photos/4198084/pexels-photo-4198084.jpeg" },

    { id: 9,  name: "Ajwa Dates",        tag: "Saudi – Premium Grade", price: 480, unit: "500g box", category: "dates", image: "https://images.pexels.com/photos/4110458/pexels-photo-4110458.jpeg" },
    { id: 10, name: "Medjool Dates",     tag: "Soft & Jumbo",          price: 520, unit: "500g box", category: "dates", image: "https://images.pexels.com/photos/5946081/pexels-photo-5946081.jpeg" },
    { id: 11, name: "Mabroom Dates",     tag: "Long & chewy",          price: 450, unit: "500g box", category: "dates", image: "https://images.pexels.com/photos/4110472/pexels-photo-4110472.jpeg" },
    { id: 12, name: "Safawi Dates",      tag: "Dark & soft",           price: 430, unit: "500g box", category: "dates", image: "https://images.pexels.com/photos/5946083/pexels-photo-5946083.jpeg" }
  ];

  var currentCategory = "all";
  var cart = [];

  function renderProducts() {
    var grid = document.getElementById("productGrid");
    grid.innerHTML = "";

    var filtered = products.filter(function(p) {
      return currentCategory === "all" ? true : p.category === currentCategory;
    });

    filtered.forEach(function(p) {
      var card = document.createElement("div");
      card.className = "product-card";

      var imgDiv = document.createElement("div");
      imgDiv.className = "product-image";
      imgDiv.style.backgroundImage = "url('" + p.image + "')";

      var body = document.createElement("div");
      body.className = "product-body";

      var name = document.createElement("div");
      name.className = "product-name";
      name.textContent = p.name;

      var tag = document.createElement("div");
      tag.className = "product-tag";
      tag.textContent = p.tag;

      var footer = document.createElement("div");
      footer.className = "product-footer";

      var priceBox = document.createElement("div");
      priceBox.innerHTML = "<span class=\\"price\\">₹" + p.price + "</span><br/><span class=\\"unit\\">" + p.unit + "</span>";

      var btn = document.createElement("button");
      btn.className = "btn-add";
      btn.textContent = "Add to Cart";
      btn.onclick = function() { addToCart(p.id); };

      footer.appendChild(priceBox);
      footer.appendChild(btn);

      body.appendChild(name);
      body.appendChild(tag);
      body.appendChild(footer);

      card.appendChild(imgDiv);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  function filterCategory(cat) {
    currentCategory = cat;
    var btns = document.querySelectorAll(".tab-btn");
    btns.forEach(function(b) { b.classList.remove("active"); });
    if (cat === "all") btns[0].classList.add("active");
    if (cat === "spice") btns[1].classList.add("active");
    if (cat === "dates") btns[2].classList.add("active");

    renderProducts();
  }

  function addToCart(id) {
    var item = products.find(function(p) { return p.id === id; });
    if (!item) return;

    var existing = cart.find(function(c) { return c.id === id; });
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, qty: 1 });
    }

    updateCartUI();
  }

  function updateCartUI() {
    var count = cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
    document.getElementById("cartCount").textContent = count;
    document.getElementById("cartItemsCount").textContent = count;

    var total = cart.reduce(function(sum, item) { return sum + item.qty * item.price; }, 0);
    document.getElementById("cartTotal").textContent = "₹" + total;

    var itemsDiv = document.getElementById("cartItems");
    itemsDiv.innerHTML = "";

    if (cart.length === 0) {
      itemsDiv.innerHTML = "<div style=\\"font-size:0.8rem;color:#9ca3af;\\">Your cart is empty.</div>";
      return;
    }

    cart.forEach(function(item) {
      var row = document.createElement("div");
      row.className = "cart-item";

      var left = document.createElement("div");
      left.innerHTML =
        "<span class=\\"cart-item-title\\">" + item.name + "</span>" +
        "<span style=\\"color:#6b7280;\\">₹" + item.price + " x " + item.qty + "</span>";

      var right = document.createElement("div");
      right.className = "cart-item-controls";

      var minus = document.createElement("button");
      minus.className = "cart-btn";
      minus.textContent = "-";
      minus.onclick = function() { changeQty(item.id, -1); };

      var qty = document.createElement("span");
      qty.textContent = item.qty;

      var plus = document.createElement("button");
      plus.className = "cart-btn";
      plus.textContent = "+";
      plus.onclick = function() { changeQty(item.id, 1); };

      right.appendChild(minus);
      right.appendChild(qty);
      right.appendChild(plus);

      row.appendChild(left);
      row.appendChild(right);
      itemsDiv.appendChild(row);
    });
  }

  function changeQty(id, delta) {
    var item = cart.find(function(c) { return c.id === id; });
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(function(c) { return c.id !== id; });
    }
    updateCartUI();
  }

  function toggleCart() {
    var panel = document.getElementById("cartPanel");
    panel.classList.toggle("open");
  }

  // ===== Auto invoice (new window + print/PDF) =====
  function openInvoice(data) {
    var invoiceId = data.invoiceId;
    var total = data.total;
    var cartItems = data.cartItems;
    var customerName = data.customerName || "Customer";
    var customerPhone = data.customerPhone || "";
    var paymentId = data.paymentId;
    var orderId = data.orderId;

    var dateStr = new Date().toLocaleString("en-IN");
    var rows = "";
    cartItems.forEach(function(item, idx) {
      rows += "<tr>" +
        "<td style='border:1px solid #ddd;padding:8px;'>" + (idx + 1) + "</td>" +
        "<td style='border:1px solid #ddd;padding:8px;'>" + item.name + "</td>" +
        "<td style='border:1px solid #ddd;padding:8px;'>" + item.qty + "</td>" +
        "<td style='border:1px solid #ddd;padding:8px;'>₹" + item.price + "</td>" +
        "<td style='border:1px solid #ddd;padding:8px;'>₹" + (item.qty * item.price) + "</td>" +
        "</tr>";
    });

    var htmlInvoice = "" +
      "<!DOCTYPE html>" +
      "<html><head><meta charset='utf-8' />" +
      "<title>Invoice - " + invoiceId + "</title></head>" +
      "<body style='font-family:system-ui, sans-serif; padding:20px; background:#f3f4f6;'>" +
      "<div style='max-width:700px;margin:0 auto;background:#fff;padding:20px;border-radius:10px;'>" +
      "<h2 style='margin-bottom:4px;'>Al Aroma Spices</h2>" +
      "<div style='font-size:12px;color:#4b5563;margin-bottom:10px;'>" +
      "Owner: Aarif Khan • Phone: +91-6392914193 • Email: aarifnexa5@mail.com" +
      "</div><hr style='margin:10px 0 15px;'/>" +
      "<div style='display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;'>" +
      "<div><b>Invoice ID:</b> " + invoiceId + "<br/><b>Date:</b> " + dateStr + "</div>" +
      "<div><b>Bill To:</b> " + customerName + "<br/><b>Phone:</b> " + customerPhone + "</div>" +
      "</div>" +
      "<div style='font-size:12px;margin-bottom:10px;'>" +
      "<b>Payment ID:</b> " + paymentId + "<br/><b>Order ID:</b> " + orderId +
      "</div>" +
      "<table style='width:100%;border-collapse:collapse;font-size:13px;margin-top:10px;'>" +
      "<thead><tr>" +
      "<th style='border:1px solid #ddd;padding:8px;text-align:left;'>#</th>" +
      "<th style='border:1px solid #ddd;padding:8px;text-align:left;'>Item</th>" +
      "<th style='border:1px solid #ddd;padding:8px;text-align:left;'>Qty</th>" +
      "<th style='border:1px solid #ddd;padding:8px;text-align:left;'>Price</th>" +
      "<th style='border:1px solid #ddd;padding:8px;text-align:left;'>Total</th>" +
      "</tr></thead><tbody>" + rows + "</tbody></table>" +
      "<div style='margin-top:15px;font-size:14px;text-align:right;'><b>Grand Total: ₹" + total + "</b></div>" +
      "<p style='margin-top:15px;font-size:11px;color:#6b7280;'>" +
      "This is a system generated invoice for your purchase from Al Aroma Spices." +
      "</p>" +
      "<button onclick='window.print()' style='margin-top:10px;padding:6px 14px;border-radius:999px;border:none;background:#111827;color:#fff;font-size:12px;cursor:pointer;'>" +
      "Print / Download PDF</button>" +
      "</div></body></html>";

    var w = window.open("", "_blank");
    w.document.open();
    w.document.write(htmlInvoice);
    w.document.close();
  }

  // ===== CHECKOUT (Razorpay + backend order + verify + invoice) =====
  async function checkout() {
    if (cart.length === 0) {
      alert("Cart is empty. Please add products first.");
      return;
    }

    var total = cart.reduce(function(sum, item) { return sum + item.qty * item.price; }, 0);
    var nameInput = document.getElementById("name");
    var phoneInput = document.getElementById("phone");
    var customerName = nameInput && nameInput.value ? nameInput.value : "Customer";
    var customerPhone = phoneInput && phoneInput.value ? phoneInput.value : "";
    var orderSummary = cart.map(function(i) {
      return i.name + " (" + i.qty + " x ₹" + i.price + ")";
    }).join(", ");

    try {
      // 1) backend se order create
      var createRes = await fetch("/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "INR",
          notes: {
            customer_name: customerName,
            customer_phone: customerPhone,
            items: orderSummary
          }
        })
      });

      var createData = await createRes.json();
      if (!createData.success) {
        alert("Order create nahi ho paaya. Please try again.");
        return;
      }

      var order = createData.order;

      var options = {
        key: "${RAZORPAY_KEY_ID}",
        amount: order.amount,
        currency: order.currency,
        name: "Al Aroma Spices",
        description: "Order Payment",
        order_id: order.id,
        handler: async function(response) {
          try {
            // 2) backend se verify
            var verifyRes = await fetch("/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            var verifyData = await verifyRes.json();

            if (verifyData.success) {
              alert("Payment successful & verified ✅");

              var invoiceId = "AA-" + Date.now();
              openInvoice({
                invoiceId: invoiceId,
                total: total,
                cartItems: cart,
                customerName: customerName,
                customerPhone: customerPhone,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id
              });

              cart = [];
              updateCartUI();
            } else {
              alert("Payment verified nahi ho paaya. Please contact support.");
            }
          } catch (err) {
            console.error(err);
            alert("Payment success, lekin verify me error aaya. Razorpay dashboard me check karo.");
          }
        },
        prefill: {
          name: customerName,
          email: "customer@example.com",
          contact: customerPhone
        },
        notes: {
          items: orderSummary
        },
        theme: {
          color: "#f97316"
        }
      };

      var rzp1 = new Razorpay(options);
      rzp1.on("payment.failed", function(resp) {
        alert("Payment failed. Reason: " + resp.error.description);
      });
      rzp1.open();
    } catch (e) {
      console.error(e);
      alert("Kuch galat ho gaya. Please dobara try karo.");
    }
  }

  function scrollToSection(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  document.getElementById("cartButton").addEventListener("click", toggleCart);
  document.getElementById("year").textContent = new Date().getFullYear();

  renderProducts();
</script>

</body>
</html>`;

// ====== Routes ======

// Front page
app.get("/", function (req, res) {
  res.send(html);
});

// Create Razorpay order
app.post("/create-order", async function (req, res) {
  try {
    var amount = req.body.amount;
    var currency = req.body.currency || "INR";
    var notes = req.body.notes || {};

    if (!amount) {
      return res.json({ success: false, error: "Amount is required" });
    }

    var options = {
      amount: Math.round(amount * 100), // rupees -> paise
      currency: currency,
      receipt: "receipt_" + Date.now(),
      notes: notes
    };

    var order = await razorpay.orders.create(options);
    return res.json({ success: true, order: order });
  } catch (err) {
    console.error("Error creating Razorpay order:", err);
    return res.json({ success: false, error: "Failed to create order" });
  }
});

// Verify Razorpay payment
app.post("/verify-payment", function (req, res) {
  try {
    var orderId = req.body.razorpay_order_id;
    var paymentId = req.body.razorpay_payment_id;
    var signature = req.body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return res.json({ success: false, message: "Missing params" });
    }

    var body = orderId + "|" + paymentId;
    var expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === signature) {
      return res.json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.json({ success: false, message: "Invalid payment signature" });
    }
    } catch (err) {
    console.error("Error creating Razorpay order:", err);
    return res.json({
      success: false,
      error: (err && (err.description || err.message)) || "Failed to create order"
    });
  }
});


// ====== Start server ======
const PORT = 3000;
app.listen(PORT, function () {
  console.log("Server running on http://localhost:" + PORT);
});
