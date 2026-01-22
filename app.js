/**************************************************
 * BELLA MASSA – APP.JS FINAL DEFINITIVO
 * ✔ Bordas separadas
 * ✔ Adicionais separados
 * ✔ Bebidas em 1 clique
 * ✔ Botão ADICIONAR corrigido
 * ✔ Versão VENDE SOZINHA
 **************************************************/

const WHATSAPP = "62993343622";
const R = 6371;
const TICKET_MINIMO = 45;

// ===== ESTADO GLOBAL =====
let data = {};
let config = {};
let carrinho = [];
let produtoAtual = null;
let selecao = {
  tamanho: null,
  sabores: [],
  bordas: [],
  adicionais: [],
  obs: ""
};
let taxaEntrega = 0;

/* =====================
   DISTÂNCIA
===================== */
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

/* =====================
   INIT
===================== */
document.addEventListener("DOMContentLoaded", init);

async function init() {
  data = JSON.parse(localStorage.getItem("appData")) ||
    await (await fetch("app.json")).json();

  config = data.config;

  atualizarHeader();
  aplicarUrgencia();
  renderCarousel();
  renderCategorias();
  renderProdutos();
  bindEventos();
}

/* =====================
   HEADER
===================== */
function atualizarHeader() {
  document.getElementById("statusLoja").innerText =
    config.lojaAberta ? "ABERTO AGORA" : "FECHADO";
  document.getElementById("horario").innerText = config.horario;
  document.getElementById("tempoEntrega").innerText = `⏱ ${config.tempoEntrega}`;
}

/* =====================
   URGÊNCIA
===================== */
function aplicarUrgencia() {
  const el = document.querySelector(".urgencia");
  if (!el) return;
  const h = new Date().getHours();
  if (h >= 18 && h < 20) el.innerText = "🔥 Horário de pico! Peça agora";
  else if (h >= 20 && h < 22) el.innerText = "⚠️ Alta demanda hoje";
  else if (h >= 22) el.innerText = "⏳ Últimos pedidos antes de fechar";
}

/* =====================
   CAROUSEL
===================== */
function renderCarousel() {
  const c = document.getElementById("carousel");
  c.innerHTML = "";
  data.promocoes.forEach(p => {
    const d = document.createElement("div");
    d.innerText = p;
    c.appendChild(d);
  });
}

/* =====================
   CATEGORIAS
===================== */
function renderCategorias() {
  const nav = document.getElementById("categorias");
  nav.innerHTML = "";
  data.categorias.forEach(c => {
    const b = document.createElement("button");
    b.innerText = c;
    b.onclick = () => renderProdutos(c);
    nav.appendChild(b);
  });
}

/* =====================
   PRODUTOS
===================== */
function renderProdutos(cat) {
  const main = document.getElementById("produtos");
  main.innerHTML = "";
  data.produtos
    .filter(p => !cat || p.categoria === cat)
    .forEach(p => {
      const d = document.createElement("div");
      d.className = "produto";
      d.innerHTML = `
        <img src="${p.imagem}">
        <div class="info">
          <h3>${p.nome} ${p.maisVendido ? "🔥 Mais pedida" : ""}</h3>
          <p>${p.descricao}</p>
          <p>A partir de R$ ${p.precos.P.toFixed(2)}</p>
        </div>
        <button>Adicionar</button>
      `;
      d.querySelector("button").onclick = () => abrirModal(p);
      main.appendChild(d);
    });
}

/* =====================
   MODAL
===================== */
function abrirModal(p) {
  produtoAtual = p;
  selecao = { tamanho: null, sabores: [], bordas: [], adicionais: [], obs: "" };

  document.getElementById("modalNome").innerText = p.nome;
  document.getElementById("modalDesc").innerText = p.descricao;
  document.getElementById("obsItem").value = "";

  renderTamanhos();
  renderSabores();
  renderBordas();
  renderAdicionais();
  renderBebidas();
  atualizarTotalModal();

  document.getElementById("pizzaModal").style.display = "flex";
}

document.getElementById("closeModal").onclick = () =>
  document.getElementById("pizzaModal").style.display = "none";

/* =====================
   TAMANHOS / SABORES
===================== */
function renderTamanhos() {
  const c = document.getElementById("tamanhos");
  c.innerHTML = "";
  Object.keys(produtoAtual.precos).forEach(t => {
    const b = document.createElement("button");
    b.innerText = `${t} R$ ${produtoAtual.precos[t].toFixed(2)}`;
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
  data.produtos.filter(p => p.categoria.includes("Pizza")).forEach(s => {
    const b = document.createElement("button");
    b.innerText = s.nome;
    b.onclick = () => {
      if (selecao.sabores.includes(s)) {
        selecao.sabores = selecao.sabores.filter(x => x !== s);
        b.classList.remove("active");
      } else if (selecao.sabores.length < 2) {
        selecao.sabores.push(s);
        b.classList.add("active");
      }
      atualizarTotalModal();
    };
    c.appendChild(b);
  });
}

/* =====================
   BORDAS / ADICIONAIS / BEBIDAS
===================== */
function renderBordas() {
  const c = document.getElementById("bordasModal");
  c.innerHTML = "";
  data.bordas.forEach(borda => {
    const b = document.createElement("button");
    b.innerText = `${borda.nome} +R$ ${borda.preco.toFixed(2)}`;
    b.onclick = () => {
      selecao.bordas = [borda];
      [...c.children].forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      atualizarTotalModal();
    };
    c.appendChild(b);
  });
}

function renderAdicionais() {
  const c = document.getElementById("adicionaisModal");
  c.innerHTML = "";
  data.adicionais.forEach(a => {
    const b = document.createElement("button");
    b.innerText = `${a.nome} +R$ ${a.preco.toFixed(2)}`;
    b.onclick = () => {
      selecao.adicionais.includes(a)
        ? selecao.adicionais = selecao.adicionais.filter(x => x !== a)
        : selecao.adicionais.push(a);
      b.classList.toggle("active");
      atualizarTotalModal();
    };
    c.appendChild(b);
  });
}

function renderBebidas() {
  const c = document.getElementById("bebidasModal");
  c.innerHTML = "";
  data.bebidas.forEach(b => {
    const btn = document.createElement("button");
    btn.innerText = `${b.nome} +R$ ${b.preco.toFixed(2)}`;
    btn.onclick = () => {
      carrinho.push({
        nome: b.nome,
        tamanho: "",
        sabores: [],
        extras: [],
        obs: "",
        preco: b.preco
      });
      atualizarCarrinho();
    };
    c.appendChild(btn);
  });
}

/* =====================
   TOTAL MODAL
===================== */
function atualizarTotalModal() {
  if (!selecao.tamanho || !selecao.sabores.length) {
    document.getElementById("modalTotal").innerText = "0,00";
    return;
  }
  const maior = Math.max(...selecao.sabores.map(s => s.precos[selecao.tamanho]));
  let total = maior;
  selecao.bordas.forEach(b => total += b.preco);
  selecao.adicionais.forEach(a => total += a.preco);
  document.getElementById("modalTotal").innerText = total.toFixed(2);
}

/* =====================
   BOTÃO ADICIONAR (CORRIGIDO)
===================== */
document.getElementById("addPizza").onclick = () => {
  if (!selecao.tamanho || !selecao.sabores.length) {
    alert("Escolha tamanho e sabor");
    return;
  }

  carrinho.push({
    nome: produtoAtual.nome,
    tamanho: selecao.tamanho,
    sabores: selecao.sabores.map(s => s.nome),
    extras: [...selecao.bordas, ...selecao.adicionais],
    obs: document.getElementById("obsItem").value,
    preco: parseFloat(document.getElementById("modalTotal").innerText)
  });

  document.getElementById("pizzaModal").style.display = "none";
  atualizarCarrinho();
};

/* =====================
   CARRINHO
===================== */
function bindEventos() {
  const cartEl = document.getElementById("cart");
  document.getElementById("openCart").onclick = () => cartEl.classList.toggle("active");
  document.getElementById("btnWhats").onclick = () => {
    if (!carrinho.length) return alert("Adicione uma pizza 🍕");
    cartEl.classList.add("active");
  };
  document.getElementById("finalizar").onclick = finalizarPedido;
}

function atualizarCarrinho() {
  const items = document.getElementById("cartItems");
  items.innerHTML = "";
  let subtotal = 0;

  carrinho.forEach(i => {
    subtotal += i.preco;
    items.innerHTML += `
      <div>
        <strong>${i.nome} ${i.tamanho ? "(" + i.tamanho + ")" : ""}</strong><br>
        ${i.sabores.length ? "Sabores: " + i.sabores.join(" / ") + "<br>" : ""}
        ${i.extras.length ? "Extras: " + i.extras.map(e => e.nome).join(", ") + "<br>" : ""}
        ${i.obs ? "Obs: " + i.obs + "<br>" : ""}
        R$ ${i.preco.toFixed(2)}
        <hr>
      </div>
    `;
  });

  calcularTaxa().then(() => {
    const total = subtotal + taxaEntrega;
    document.getElementById("subtotal").innerText = `R$ ${subtotal.toFixed(2)}`;
    document.getElementById("taxa").innerText = `R$ ${taxaEntrega.toFixed(2)}`;
    document.getElementById("cartTotal").innerText = `R$ ${total.toFixed(2)}`;
    document.getElementById("cartQtd").innerText = carrinho.length;

    if (total > 0 && total < TICKET_MINIMO) {
      const aviso = document.createElement("div");
      aviso.className = "upsell";
      aviso.innerText = "😋 Falta pouco pra aproveitar melhor seu pedido";
      items.appendChild(aviso);
    }
  });
}

/* =====================
   TAXA
===================== */
function calcularTaxa() {
  return new Promise(resolve => {
    if (!navigator.geolocation) {
      taxaEntrega = 0;
      return resolve();
    }
    navigator.geolocation.getCurrentPosition(pos => {
      const km = haversine(
        config.lojaLat,
        config.lojaLng,
        pos.coords.latitude,
        pos.coords.longitude
      );
      taxaEntrega = km <= config.kmGratis ? 0 : (km - config.kmGratis) * config.valorKm;
      resolve();
    }, () => {
      taxaEntrega = 0;
      resolve();
    });
  });
}

/* =====================
   WHATSAPP
===================== */
function finalizarPedido() {
  const endereco = document.getElementById("endereco").value.trim();
  if (!endereco) {
    alert("Informe o endereço");
    return;
  }

  let msg = "🍕 *Pedido Bella Massa* 🍕\n\n";
  carrinho.forEach(i => {
    msg += `${i.nome} ${i.tamanho ? "(" + i.tamanho + ")" : ""}\n`;
    if (i.sabores.length) msg += `Sabores: ${i.sabores.join(" / ")}\n`;
    if (i.extras.length) msg += `Extras: ${i.extras.map(e => e.nome).join(", ")}\n`;
    if (i.obs) msg += `Obs: ${i.obs}\n`;
    msg += `R$ ${i.preco.toFixed(2)}\n\n`;
  });

  msg += `🚚 Taxa: R$ ${taxaEntrega.toFixed(2)}\n`;
  msg += `📍 Endereço: ${endereco}\n`;
  msg += `💰 Total: ${document.getElementById("cartTotal").innerText}\n`;
  msg += `⏱ ${config.tempoEntrega}`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`);
}