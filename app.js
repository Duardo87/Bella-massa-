// ==================================================
// CONFIG / STORAGE
// ==================================================
const STORAGE_KEY = "pizzaria-data";

const DEFAULT_DATA = {
  store: { name: "Bella Massa", phone: "" },
  products: [],
  extras: [],
  promo: null,
  theme: "auto"
};

function loadData() {
  const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  return {
    ...DEFAULT_DATA,
    ...raw,
    store: { ...DEFAULT_DATA.store, ...(raw.store || {}) },
    products: Array.isArray(raw.products) ? raw.products : [],
    extras: Array.isArray(raw.extras) ? raw.extras : [],
    promo: raw.promo || null
  };
}

let data = loadData();
let cart = [];
let selectedProduct = null;

// ==================================================
// INIT
// ==================================================
function renderPublic() {
  data = loadData();
  applyTheme();
  renderHeader();
  renderCategories();
  renderPromo();
}

window.app = { renderPublic };

// ==================================================
// HEADER
// ==================================================
function renderHeader() {
  const nameEl = document.getElementById("store-name");
  const phoneEl = document.getElementById("store-phone");

  if (nameEl) nameEl.textContent = data.store.name || "";
  if (phoneEl && data.store.phone) {
    phoneEl.href = "https://wa.me/" + data.store.phone;
  }
}

// ==================================================
// THEME
// ==================================================
function applyTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme =
    data.theme === "auto" ? (prefersDark ? "dark" : "light") : data.theme;
  document.body.classList.toggle("dark", theme === "dark");
}

// ==================================================
// CATEGORIAS
// ==================================================
function renderCategories() {
  const nav = document.getElementById("categories");
  if (!nav) return;

  const cats = [...new Set(
    data.products.map(p => p.category).filter(Boolean)
  )];

  nav.innerHTML = "";
  if (!cats.length) return;

  cats.forEach((cat, i) => {
    nav.insertAdjacentHTML("beforeend", `
      <button data-action="category" data-category="${cat}"
        class="${i === 0 ? "active" : ""}">
        ${cat}
      </button>
    `);
  });

  renderProducts(cats[0]);
}

// ==================================================
// PRODUTOS
// ==================================================
function renderProducts(category) {
  const grid = document.getElementById("products");
  if (!grid) return;

  grid.innerHTML = "";

  data.products
    .filter(p => p.category === category)
    .forEach(p => {
      grid.insertAdjacentHTML("beforeend", `
        <div class="product-card">
          ${p.best ? `<span class="badge">⭐ Mais pedido</span>` : ""}
          ${p.image ? `<img src="${p.image}" alt="${p.name}">` : ""}
          <h3>${p.name}</h3>
          <p>${p.desc || ""}</p>
          <div class="price">R$ ${p.price.toFixed(2)}</div>
          <button class="btn btn-green"
            data-action="add-product"
            data-id="${p.id}">
            Adicionar
          </button>
        </div>
      `);
    });
}

// ==================================================
// EVENT DELEGATION GLOBAL (🔥 IOS FIX)
// ==================================================
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === "category") {
    document
      .querySelectorAll(".categories button")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderProducts(btn.dataset.category);
  }

  if (action === "add-product") {
    openExtras(Number(btn.dataset.id));
  }

  if (action === "confirm-extras") confirmExtras();
  if (action === "close-modal") closeAnyModal();

  if (action === "accept-promo") acceptPromo();
  if (action === "close-promo") closePromo();

  if (action === "send-whats") sendToWhatsApp();
});

// ==================================================
// ADICIONAIS
// ==================================================
function openExtras(id) {
  selectedProduct = data.products.find(p => p.id === id);
  if (!selectedProduct) return;

  closeAnyModal();

  const extras = data.extras.filter(e => e.active);

  const modal = document.createElement("div");
  modal.className = "promo-overlay";

  modal.innerHTML = `
    <div class="promo-card">
      <h3>➕ Adicionais</h3>

      ${
        extras.length
          ? extras.map(e => `
            <label class="extra-item">
              <input type="checkbox" value="${e.id}">
              <span>${e.name}</span>
              <strong>R$ ${e.price.toFixed(2)}</strong>
            </label>
          `).join("")
          : `<p style="opacity:.6">Nenhum adicional disponível</p>`
      }

      <button class="btn btn-green" data-action="confirm-extras">
        Adicionar ao pedido
      </button>
      <button class="btn btn-ghost" data-action="close-modal">
        Cancelar
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

function confirmExtras() {
  if (!selectedProduct) return;

  cart.push({ ...selectedProduct });

  document
    .querySelectorAll(".promo-card input:checked")
    .forEach(chk => {
      const extra = data.extras.find(e => e.id == chk.value);
      if (extra) cart.push({ ...extra });
    });

  selectedProduct = null;
  closeAnyModal();
  renderCart();
}

// ==================================================
// PROMOÇÃO DO DIA
// ==================================================
function renderPromo() {
  if (!data.promo || !data.promo.active || typeof data.promo.price !== "number")
    return;

  const key = "promoClosed-" + new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(key)) return;

  closeAnyModal();

  const modal = document.createElement("div");
  modal.className = "promo-overlay";

  modal.innerHTML = `
    <div class="promo-card">
      ${data.promo.image ? `<img src="${data.promo.image}">` : ""}
      <h2>🔥 Promoção do Dia</h2>
      <p>${data.promo.description || ""}</p>
      <strong>R$ ${data.promo.price.toFixed(2)}</strong>

      <button class="btn btn-green" data-action="accept-promo">
        Aproveitar
      </button>
      <button class="btn btn-ghost" data-action="close-promo">
        Depois
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

function closePromo() {
  const key = "promoClosed-" + new Date().toISOString().slice(0, 10);
  localStorage.setItem(key, "1");
  closeAnyModal();
}

function acceptPromo() {
  cart.push({
    name: data.promo.description || "Promoção do Dia",
    price: data.promo.price
  });
  closePromo();
  renderCart();
}

// ==================================================
// CARRINHO
// ==================================================
function renderCart() {
  const div = document.getElementById("cart");
  if (!div) return;

  div.classList.remove("hidden");

  let total = 0;
  let html = "<h3>🧾 Seu pedido</h3>";

  cart.forEach(i => {
    total += i.price;
    html += `<p>${i.name} — R$ ${i.price.toFixed(2)}</p>`;
  });

  html += `
    <strong>Total: R$ ${total.toFixed(2)}</strong>
    <button class="btn btn-green" data-action="send-whats">
      Enviar no WhatsApp
    </button>
  `;

  div.innerHTML = html;
}

// ==================================================
// WHATSAPP
// ==================================================
function sendToWhatsApp() {
  if (!data.store.phone) {
    alert("WhatsApp não configurado no admin");
    return;
  }

  let msg = `Pedido - ${data.store.name}%0A%0A`;
  let total = 0;

  cart.forEach(i => {
    total += i.price;
    msg += `• ${i.name} R$ ${i.price.toFixed(2)}%0A`;
  });

  msg += `%0ATotal: R$ ${total.toFixed(2)}`;

  window.open(
    `https://wa.me/${data.store.phone}?text=${msg}`,
    "_blank"
  );
}

// ==================================================
// UTIL
// ==================================================
function closeAnyModal() {
  document.querySelectorAll(".promo-overlay").forEach(m => m.remove());
}