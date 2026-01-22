/**************************************************
 * BELLA MASSA – APP.JS FINAL (100%)
 * - Meio a meio correto (maior preço real)
 * - Taxa por KM confiável (Haversine + Promise)
 * - Bloqueio por limite de KM
 * - Endereço obrigatório
 * - WhatsApp profissional
 **************************************************/

const WHATSAPP = "62993343622";
const R = 6371; // raio da Terra em KM

let data = {};
let config = {};
let cart = [];
let produtoAtual = null;
let selecao = { tamanho: null, sabores: [], extras: [], obs: "" };
let taxaEntrega = 0;
let distanciaKm = 0;

/* =======================
   UTIL – DISTÂNCIA
======================= */
function haversine(lat1, lon1, lat2, lon2) {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* =======================
   INIT
======================= */
init();

async function init() {
  data = JSON.parse(localStorage.getItem("appData"))
    || await (await fetch("app.json")).json();

  config = data.config;

  atualizarHeader();
  renderCarousel();
  renderCategorias();
  renderProdutos();
  bindEventos();
}

/* =======================
   HEADER
======================= */
function atualizarHeader() {
  document.getElementById("statusLoja").innerText =
    config.lojaAberta ? "ABERTO AGORA" : "FECHADO";
  document.getElementById("horario").innerText = config.horario;
  document.getElementById("tempoEntrega").innerText = `⏱ ${config.tempoEntrega}`;
}

/* =======================
   CAROUSEL
======================= */
function renderCarousel() {
  const c = document.getElementById("carousel");
  c.innerHTML = "";
  data.promocoes.forEach(p => {
    const d = document.createElement("div");
    d.innerText = p;
    c.appendChild(d);
  });
}

/* =======================
   CATEGORIAS
======================= */
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

/* =======================
   PRODUTOS
======================= */
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
          <h3>${p.nome} ${p.maisVendido ? "🔥" : ""}</h3>
          <p>${p.descricao}</p>
          <p>A partir de R$ ${p.precos.P.toFixed(2)}</p>
        </div>
        <button>Adicionar</button>
      `;
      div.querySelector("button").onclick = () => abrirModal(p);
      main.appendChild(div);
    });
}

/* =======================
   MODAL PIZZA
======================= */
function abrirModal(prod) {
  produtoAtual = prod;
  selecao = { tamanho: null, sabores: [], extras: [], obs: "" };

  document.getElementById("modalNome").innerText = prod.nome;
  document.getElementById("modalDesc").innerText = prod.descricao;
  document.getElementById("obsItem").value = "";

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
      [...c.children].forEach(x => x.classList.remove("active"));
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
  data.extras.forEach(e => {
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

/* =======================
   TOTAL MODAL (CORRETO)
======================= */
function atualizarTotalModal() {
  if (!selecao.tamanho || selecao.sabores.length === 0) {
    document.getElementById("modalTotal").innerText = "0,00";
    return;
  }

  const maiorPreco = Math.max(
    ...selecao.sabores.map(s => s.precos[selecao.tamanho])
  );

  let total = maiorPreco;
  selecao.extras.forEach(e => total += e.preco);

  document.getElementById("modalTotal").innerText = total.toFixed(2);
}

document.getElementById("addPizza").onclick = () => {
  if (!selecao.tamanho || selecao.sabores.length === 0) {
    alert("Escolha o tamanho e pelo menos 1 sabor.");
    return;
  }

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

/* =======================
   CARRINHO
======================= */
function bindEventos() {
  document.getElementById("openCart").onclick = () =>
    document.getElementById("cart").classList.toggle("active");

  document.getElementById("btnWhats").onclick = () => {
    if (cart.length === 0) {
      alert("Adicione itens ao carrinho primeiro 🍕");
      return;
    }
    document.getElementById("cart").classList.add("active");
  };

  document.getElementById("finalizar").onclick = finalizarPedido;
}

function updateCart() {
  const items = document.getElementById("cartItems");
  items.innerHTML = "";

  let subtotal = 0;
  let extrasV = 0;

  cart.forEach(i => {
    subtotal += i.preco;
    extrasV += i.extras.reduce((s, e) => s + e.preco, 0);

    items.innerHTML += `
      <div>
        <strong>${i.nome} (${i.tamanho})</strong><br>
        Sabores: ${i.sabores.join(" / ")}<br>
        Extras: ${i.extras.map(e => e.nome).join(", ") || "Nenhum"}<br>
        ${i.obs ? "Obs: " + i.obs + "<br>" : ""}
        R$ ${i.preco.toFixed(2)}
        <hr>
      </div>
    `;
  });

  calcularTaxaEntrega().then(() => {
    document.getElementById("subtotal").innerText = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById("extras").innerText = `R$ ${extrasV.toFixed(2)}`;
    document.getElementById("taxa").innerText = `R$ ${taxaEntrega.toFixed(2)}`;
    document.getElementById("cartTotal").innerText =
      `R$ ${(subtotal + taxaEntrega).toFixed(2)}`;
    document.getElementById("cartQtd").innerText = cart.length;
  });
}

/* =======================
   TAXA DE ENTREGA (100%)
======================= */
function calcularTaxaEntrega() {
  return new Promise(resolve => {
    if (!navigator.geolocation) {
      taxaEntrega = 0;
      return resolve();
    }

    navigator.geolocation.getCurrentPosition(pos => {
      distanciaKm = haversine(
        config.lojaLat,
        config.lojaLng,
        pos.coords.latitude,
        pos.coords.longitude
      );

      if (distanciaKm > config.limiteKm) {
        alert("🚫 Endereço fora da área de entrega.");
        taxaEntrega = 0;
        return resolve();
      }

      if (distanciaKm <= config.kmGratis) {
        taxaEntrega = 0;
      } else {
        taxaEntrega = (distanciaKm - config.kmGratis) * config.valorKm;
      }

      resolve();
    }, () => {
      taxaEntrega = 0;
      resolve();
    });
  });
}

/* =======================
   FINALIZAR – WHATSAPP
======================= */
function finalizarPedido() {
  const endereco = document.getElementById("endereco").value.trim();
  if (!endereco) {
    alert("Informe o endereço para entrega.");
    return;
  }

  let msg = "🍕 *Pedido Bella Massa* 🍕\n\n";

  cart.forEach(i => {
    msg += `• ${i.nome} (${i.tamanho})\n`;
    msg += `  Sabores: ${i.sabores.join(" / ")}\n`;
    if (i.extras.length)
      msg += `  Extras: ${i.extras.map(e => e.nome).join(", ")}\n`;
    if (i.obs) msg += `  Obs: ${i.obs}\n`;
    msg += `  R$ ${i.preco.toFixed(2)}\n\n`;
  });

  msg += `🚚 Taxa: R$ ${taxaEntrega.toFixed(2)}\n`;
  msg += `📍 Endereço: ${endereco}\n`;
  msg += `💰 Total: ${document.getElementById("cartTotal").innerText}\n`;
  msg += `⏱ Entrega: ${config.tempoEntrega}`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`);
}