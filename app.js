/**************************************************
 * BELLA MASSA – APP.JS FINAL DEFINITIVO
 * ✔ Versão VENDE SOZINHA
 * ✔ Upsell de borda clicável no carrinho
 * ✔ Ticket psicológico R$45
 * ✔ Sem bugs conhecidos
 **************************************************/

const WHATSAPP = "62993343622";
const R = 6371;
const TICKET_MINIMO = 45;

// ESTADO GLOBAL
let data = {};
let config = {};
let carrinho = [];
let produtoAtual = null;
let selecao = { tamanho: null, sabores: [], extras: [], obs: "" };
let taxaEntrega = 0;

/* =====================
   DISTÂNCIA (KM)
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
  statusLoja.innerText = config.lojaAberta ? "ABERTO AGORA" : "FECHADO";
  horario.innerText = config.horario;
  tempoEntrega.innerText = `⏱ ${config.tempoEntrega}`;
}

/* =====================
   URGÊNCIA
===================== */
function aplicarUrgencia() {
  const el = document.querySelector(".urgencia");
  if (!el) return;

  const h = new Date().getHours();
  if (h >= 18 && h < 20) {
    el.innerText = "🔥 Horário de pico! Peça agora pra não esperar";
  } else if (h >= 20 && h < 22) {
    el.innerText = "⚠️ Alta demanda hoje — últimas unidades";
  } else if (h >= 22) {
    el.innerText = "⏳ Últimos pedidos antes de fechar";
  }
}

/* =====================
   CAROUSEL
===================== */
function renderCarousel() {
  carousel.innerHTML = "";
  data.promocoes.forEach(p => {
    const d = document.createElement("div");
    d.innerText = p;
    carousel.appendChild(d);
  });
}

/* =====================
   CATEGORIAS
===================== */
function renderCategorias() {
  categorias.innerHTML = "";
  data.categorias.forEach(c => {
    const b = document.createElement("button");
    b.innerText = c;
    b.onclick = () => renderProdutos(c);
    categorias.appendChild(b);
  });
}

/* =====================
   PRODUTOS
===================== */
function renderProdutos(cat) {
  produtos.innerHTML = "";
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
      produtos.appendChild(d);
    });
}

/* =====================
   MODAL
===================== */
function abrirModal(p) {
  produtoAtual = p;
  selecao = { tamanho: null, sabores: [], extras: [], obs: "" };
  modalNome.innerText = p.nome;
  modalDesc.innerText = p.descricao;
  obsItem.value = "";
  renderTamanhos();
  renderSabores();
  renderExtras();
  atualizarTotalModal();
  pizzaModal.style.display = "flex";
}

closeModal.onclick = () => pizzaModal.style.display = "none";

function renderTamanhos() {
  tamanhos.innerHTML = "";
  Object.keys(produtoAtual.precos).forEach(t => {
    const b = document.createElement("button");
    b.innerText = `${t} R$ ${produtoAtual.precos[t].toFixed(2)}`;
    b.onclick = () => {
      selecao.tamanho = t;
      [...tamanhos.children].forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      atualizarTotalModal();
    };
    tamanhos.appendChild(b);
  });
}

function renderSabores() {
  sabores.innerHTML = "";
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
    sabores.appendChild(b);
  });
}

function renderExtras() {
  extrasModal.innerHTML = "";
  data.extras.forEach(e => {
    const b = document.createElement("button");
    b.innerText = `${e.nome} +R$ ${e.preco.toFixed(2)}`;
    b.onclick = () => {
      selecao.extras.includes(e)
        ? selecao.extras = selecao.extras.filter(x => x !== e)
        : selecao.extras.push(e);
      b.classList.toggle("active");
      atualizarTotalModal();
    };
    extrasModal.appendChild(b);
  });
}

function atualizarTotalModal() {
  if (!selecao.tamanho || !selecao.sabores.length) {
    modalTotal.innerText = "0,00";
    return;
  }
  const maior = Math.max(...selecao.sabores.map(s => s.precos[selecao.tamanho]));
  let total = maior;
  selecao.extras.forEach(e => total += e.preco);
  modalTotal.innerText = total.toFixed(2);
}

addPizza.onclick = () => {
  if (!selecao.tamanho || !selecao.sabores.length) {
    alert("Escolha tamanho e sabor");
    return;
  }
  carrinho.push({
    nome: produtoAtual.nome,
    tamanho: selecao.tamanho,
    sabores: selecao.sabores.map(s => s.nome),
    extras: selecao.extras,
    obs: obsItem.value,
    preco: parseFloat(modalTotal.innerText)
  });
  pizzaModal.style.display = "none";
  atualizarCarrinho();
};

/* =====================
   CARRINHO + UPSELL
===================== */
function bindEventos() {
  const cartEl = document.getElementById("cart");

  openCart.onclick = () => cartEl.classList.toggle("active");
  btnWhats.onclick = () => {
    if (!carrinho.length) return alert("Adicione uma pizza 🍕");
    cartEl.classList.add("active");
  };
  finalizar.onclick = finalizarPedido;
}

function atualizarCarrinho() {
  cartItems.innerHTML = "";
  let subtotal = 0;

  carrinho.forEach(i => {
    subtotal += i.preco;
    cartItems.innerHTML += `
      <div>
        <strong>${i.nome} (${i.tamanho})</strong><br>
        Sabores: ${i.sabores.join(" / ")}<br>
        ${i.extras.length ? "Extras: " + i.extras.map(e => e.nome).join(", ") + "<br>" : ""}
        ${i.obs ? "Obs: " + i.obs + "<br>" : ""}
        R$ ${i.preco.toFixed(2)}
        <hr>
      </div>
    `;
  });

  calcularTaxa().then(() => {
    const total = subtotal + taxaEntrega;
    subtotalEl.innerText = `R$ ${subtotal.toFixed(2)}`;
    taxaEl.innerText = `R$ ${taxaEntrega.toFixed(2)}`;
    cartTotal.innerText = `R$ ${total.toFixed(2)}`;
    cartQtd.innerText = carrinho.length;

    // TRAVA PSICOLÓGICA
    if (total > 0 && total < TICKET_MINIMO) {
      const aviso = document.createElement("div");
      aviso.className = "upsell";
      aviso.innerText = "😋 Falta pouco pra aproveitar melhor seu pedido";
      cartItems.appendChild(aviso);
    }

    // UPSELL DE BORDA CLICÁVEL
    if (!carrinho.some(i => i.extras.length)) {
      const upsell = document.createElement("div");
      upsell.className = "upsell";
      upsell.innerHTML = `
        🧀 <strong>Que tal adicionar uma borda recheada?</strong><br>
        <button class="btn-upsell">Adicionar borda</button>
      `;
      upsell.querySelector(".btn-upsell").onclick = () => {
        const ultimo = carrinho[carrinho.length - 1];
        produtoAtual = data.produtos.find(p => p.nome === ultimo.nome);
        selecao = {
          tamanho: ultimo.tamanho,
          sabores: data.produtos.filter(p => ultimo.sabores.includes(p.nome)),
          extras: [],
          obs: ultimo.obs || ""
        };
        renderExtras();
        pizzaModal.style.display = "flex";
      };
      cartItems.appendChild(upsell);
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
      if (km > config.limiteKm) {
        alert("🚫 Fora da área de entrega");
        taxaEntrega = 0;
        return resolve();
      }
      taxaEntrega = km <= config.kmGratis
        ? 0
        : (km - config.kmGratis) * config.valorKm;
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
  if (!endereco.value.trim()) {
    alert("Informe o endereço");
    return;
  }

  let msg = "🍕 *Pedido Bella Massa* 🍕\n\n";
  carrinho.forEach(i => {
    msg += `${i.nome} (${i.tamanho})\n`;
    msg += `Sabores: ${i.sabores.join(" / ")}\n`;
    if (i.extras.length) msg += `Extras: ${i.extras.map(e => e.nome).join(", ")}\n`;
    if (i.obs) msg += `Obs: ${i.obs}\n`;
    msg += `R$ ${i.preco.toFixed(2)}\n\n`;
  });

  msg += `🚚 Taxa: R$ ${taxaEntrega.toFixed(2)}\n`;
  msg += `📍 Endereço: ${endereco.value}\n`;
  msg += `💰 Total: ${cartTotal.innerText}\n`;
  msg += `⏱ ${config.tempoEntrega}`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`);
}