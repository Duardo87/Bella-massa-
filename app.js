// =========================
// app.js – BELLA MASSA DELIVERY (PREMIUM CORE)
// =========================

const WHATSAPP = "62993343622";

// CONFIG PADRÃO (ADMIN SOBRESCREVE)
const DEFAULT_CONFIG = {
  lojaAberta: true,
  horario: "Fecha às 23:30",
  tempoEntrega: "40–60 min",
  kmGratis: 3,
  valorKm: 2,
  limiteKm: 10,
  lojaLat: -16.6003720,
  lojaLng: -49.3850282
};

let data = {};
let config = {};
let cart = [];
let produtoAtual = null;
let selecao = {
  tamanho: null,
  sabores: [],
  extras: [],
  obs: ""
};

// =========================
// INIT
// =========================
init();

async function init() {
  const local = localStorage.getItem("appData");
  if (local) {
    data = JSON.parse(local);
  } else {
    const r = await fetch("app.json");
    data = await r.json();
  }

  config = Object.assign({}, DEFAULT_CONFIG, data.config || {});
  atualizarHeader();
  renderCarousel();
  renderCategorias();
  renderProdutos();
  bindCarrinho();
}

// =========================
// HEADER
// =========================
function atualizarHeader() {
  document.getElementById("statusLoja").innerText = config.lojaAberta ? "ABERTO AGORA" : "FECHADO";
  document.getElementById("statusLoja").className = config.lojaAberta ? "open" : "";
  document.getElementById("horario").innerText = config.horario;
  document.getElementById("tempoEntrega").innerText = `⏱ ${config.tempoEntrega}`;
}

// =========================
// CAROUSEL
// =========================
function renderCarousel() {
  const c = document.getElementById("carousel");
  c.innerHTML = "";
  (data.promocoes || []).forEach(p => {
    const d = document.createElement("div");
    d.innerText = p;
    c.appendChild(d);
  });
}

// =========================
// CATEGORIAS
// =========================
function renderCategorias() {
  const nav = document.getElementById("categorias");
  nav.innerHTML = "";
  data.categorias.forEach(cat => {
    const b = document.createElement("button");
    b.innerText = cat;
    b.onclick = () => renderProdutos(cat);
    nav.appendChild(b);
  });
}

// =========================
// PRODUTOS
// =========================
function renderProdutos(filtro) {
  const main = document.getElementById("produtos");
  main.innerHTML = "";

  data.produtos
    .filter(p => !filtro || p.categoria === filtro)
    .forEach(p => {
      const div = document.createElement("div");
      div.className = "produto";
      div.innerHTML = `
        <img src="${p.imagem}">
        <div class="info">
          <h3>${p.nome} ${p.maisVendido ? "<span>🔥 Mais vendido</span>" : ""}</h3>
          <p>${p.descricao}</p>
          <p>A partir de R$ ${p.precos.P.toFixed(2)}</p>
        </div>
        <button>Adicionar</button>
      `;
      div.querySelector("button").onclick = () => abrirModal(p);
      main.appendChild(div);
    });
}

// =========================
// MODAL PIZZA
// =========================
function abrirModal(prod) {
  produtoAtual = prod;
  selecao = { tamanho: null, sabores: [], extras: [], obs: "" };

  document.getElementById("modalNome").innerText = prod.nome;
  document.getElementById("modalDesc").innerText = prod.descricao;

  renderTamanhos();
  renderSabores();
  renderExtras();
  atualizarTotalModal();

  document.getElementById("pizzaModal").style.display = "flex";
}

document.getElementById("closeModal").onclick = () =>
  document.getElementById("pizzaModal").style.display = "none";

function renderTamanhos() {
  const c = document.getElementById("tamanhos");
  c.innerHTML = "";
  Object.keys(produtoAtual.precos).forEach(t => {
    const b = document.createElement("button");
    b.innerText = `${t} - R$ ${produtoAtual.precos[t].toFixed(2)}`;
    b.onclick = () => {
      selecao.tamanho = t;
      document.querySelectorAll("#tamanhos button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      atualizarTotalModal();
    };
    c.appendChild(b);
  });
}

function renderSabores() {
  const c = document.getElementById("sabores");
  c.innerHTML = "";
  data.produtos
    .filter(p => p.categoria.includes("Pizza"))
    .forEach(s => {
      const preco = produtoAtual.precos[selecao.tamanho || "P"];
      const b = document.createElement("button");
      b.innerText = s.nome;
      b.onclick = () => {
        if (selecao.sabores.includes(s)) {
          selecao.sabores = selecao.sabores.filter(x => x !== s);
          b.classList.remove("active");
        } else {
          if (selecao.sabores.length >= 2) return;
          selecao.sabores.push(s);
          b.classList.add("active");
        }
        atualizarTotalModal();
      };
      c.appendChild(b);
    });
}

function renderExtras() {
  const c = document.getElementById("extrasModal");
  c.innerHTML = "";
  (data.extras || []).forEach(e => {
    const b = document.createElement("button");
    b.innerText = `${e.nome} (+R$ ${e.preco.toFixed(2)})`;
    b.onclick = () => {
      if (selecao.extras.includes(e)) {
        selecao.extras = selecao.extras.filter(x => x !== e);
        b.classList.remove("active");
      } else {
        selecao.extras.push(e);
        b.classList.add("active");
      }
      atualizarTotalModal();
    };
    c.appendChild(b);
  });
}

function atualizarTotalModal() {
  let total = 0;

  if (selecao.tamanho) {
    total = produtoAtual.precos[selecao.tamanho];
  }

  if (selecao.sabores.length > 1) {
    const maior = Math.max(
      ...selecao.sabores.map(s => produtoAtual.precos[selecao.tamanho])
    );
    total = maior;
  }

  selecao.extras.forEach(e => total += e.preco);

  document.getElementById("modalTotal").innerText = total.toFixed(2);
}

document.getElementById("addPizza").onclick = () => {
  if (!selecao.tamanho || selecao.sabores.length === 0) return;

  cart.push({
    nome: produtoAtual.nome,
    tamanho: selecao.tamanho,
    sabores: selecao.sabores.map(s => s.nome),
    extras: selecao.extras,
    obs: document.getElementById("obsItem").value,
    preco: parseFloat(document.getElementById("modalTotal").innerText)
  });

  document.getElementById("pizzaModal").style.display = "none";
  updateCart();
};

// =========================
// CARRINHO
// =========================
function bindCarrinho() {
  document.getElementById("openCart").onclick = () =>
    document.getElementById("cart").classList.toggle("active");

  document.getElementById("finalizar").onclick = finalizarPedido;
}

function updateCart() {
  const items = document.getElementById("cartItems");
  items.innerHTML = "";

  let subtotal = 0;
  let extras = 0;

  cart.forEach((i, idx) => {
    subtotal += i.preco;
    extras += i.extras.reduce((s, e) => s + e.preco, 0);

    const d = document.createElement("div");
    d.innerHTML = `
      <strong>${i.nome} (${i.tamanho})</strong><br>
      Sabores: ${i.sabores.join(" / ")}<br>
      Extras: ${i.extras.map(e => e.nome).join(", ") || "Nenhum"}<br>
      <em>${i.obs || ""}</em><br>
      R$ ${i.preco.toFixed(2)}
      <hr>
    `;
    items.appendChild(d);
  });

  const taxa = calcularTaxa();
  const total = subtotal + taxa;

  document.getElementById("cartQtd").innerText = cart.length;
  document.getElementById("subtotal").innerText = `R$ ${subtotal.toFixed(2)}`;
  document.getElementById("extras").innerText = `R$ ${extras.toFixed(2)}`;
  document.getElementById("taxa").innerText = `R$ ${taxa.toFixed(2)}`;
  document.getElementById("cartTotal").innerText = `R$ ${total.toFixed(2)}`;
}

// =========================
// TAXA ENTREGA
// =========================
function calcularTaxa() {
  return 0;
}

// =========================
// FINALIZAR
// =========================
function finalizarPedido() {
  let msg = "🍕 *Pedido Bella Massa* 🍕\n\n";

  cart.forEach(i => {
    msg += `• ${i.nome} (${i.tamanho})\n`;
    msg += `  Sabores: ${i.sabores.join(" / ")}\n`;
    if (i.extras.length) {
      msg += `  Extras: ${i.extras.map(e => e.nome).join(", ")}\n`;
    }
    if (i.obs) msg += `  Obs: ${i.obs}\n`;
    msg += `  R$ ${i.preco.toFixed(2)}\n\n`;
  });

  msg += `💰 Total: ${document.getElementById("cartTotal").innerText}`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`);
}