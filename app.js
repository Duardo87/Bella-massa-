/**************************************************
 * app.js – BELLA MASSA (VERSÃO FINAL ESTÁVEL)
 * Ajustes:
 * ✔ Taxa por KM funcionando
 * ✔ Até 3km grátis
 * ✔ R$2,00 por KM excedente
 * ✔ Bloqueio fora do raio
 * ✔ Fallback seguro de geolocalização
 **************************************************/

const WHATSAPP = "62993343622";
const R = 6371;

// 📍 LOCALIZAÇÃO FIXA DA LOJA
const LOJA_LAT = -16.6001442;
const LOJA_LNG = -49.3848331;

// ================= DOM =================
const statusLoja = document.getElementById("statusLoja");
const horario = document.getElementById("horario");
const tempoEntrega = document.getElementById("tempoEntrega");
const carousel = document.getElementById("carousel");
const categorias = document.getElementById("categorias");
const produtos = document.getElementById("produtos");

const btnWhats = document.getElementById("btnWhats");
const openCart = document.getElementById("openCart");
const cart = document.getElementById("cart");
const cartItems = document.getElementById("cartItems");
const cartQtd = document.getElementById("cartQtd");
const subtotalEl = document.getElementById("subtotal");
const taxaEl = document.getElementById("taxa");
const cartTotal = document.getElementById("cartTotal");
const finalizar = document.getElementById("finalizar");
const endereco = document.getElementById("endereco");
const obsGeral = document.getElementById("obsGeral");

const pizzaModal = document.getElementById("pizzaModal");
const closeModal = document.getElementById("closeModal");
const modalNome = document.getElementById("modalNome");
const modalDesc = document.getElementById("modalDesc");
const tamanhos = document.getElementById("tamanhos");
const sabores = document.getElementById("sabores");
const extrasModal = document.getElementById("extrasModal");
const obsItem = document.getElementById("obsItem");
const modalTotal = document.getElementById("modalTotal");
const addPizza = document.getElementById("addPizza");

// ================= STATE =================
let data = {};
let config = {};
let carrinho = [];
let produtoAtual = null;
let selecao = { tamanho: null, sabores: [], extras: [], obs: "" };
let taxaEntrega = 0;
let foraDoRaio = false;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", init);

async function init() {
  data = JSON.parse(localStorage.getItem("appData")) ||
         await (await fetch("app.json")).json();

  config = data.config || {
    kmGratis: 3,
    valorKm: 2,
    limiteKm: 10,
    lojaAberta: true,
    horario: "",
    tempoEntrega: ""
  };

  atualizarHeader();
  renderCarousel();
  renderCategorias();
  renderProdutos();
  bindEventos();
}

// ================= HEADER =================
function atualizarHeader() {
  statusLoja.innerText = config.lojaAberta ? "ABERTO AGORA" : "FECHADO";
  horario.innerText = config.horario || "";
  tempoEntrega.innerText = `⏱ ${config.tempoEntrega || ""}`;
}

// ================= PROMOÇÕES =================
function renderCarousel() {
  carousel.innerHTML = "";
  (data.promocoes || []).forEach(p => {
    const d = document.createElement("div");
    d.innerText = typeof p === "string" ? p : p.texto;
    carousel.appendChild(d);
  });
}

// ================= CATEGORIAS =================
function renderCategorias() {
  categorias.innerHTML = "";
  (data.categorias || []).forEach(c => {
    const b = document.createElement("button");
    b.innerText = c;
    b.onclick = () => renderProdutos(c);
    categorias.appendChild(b);
  });
}

// ================= PRODUTOS =================
function renderProdutos(cat) {
  produtos.innerHTML = "";
  (data.produtos || [])
    .filter(p => !cat || p.categoria === cat)
    .forEach(p => {
      const d = document.createElement("div");
      d.className = "produto";
      d.innerHTML = `
        <img src="${p.imagem}">
        <div class="info">
          <h3>${p.nome} ${p.maisVendido ? "🔥" : ""}</h3>
          <p>${p.descricao || ""}</p>
          <p>A partir de R$ ${Number(p.precos.P).toFixed(2)}</p>
        </div>
        <button>Adicionar</button>
      `;
      d.querySelector("button").onclick = () => abrirModal(p);
      produtos.appendChild(d);
    });
}

// ================= MODAL =================
function abrirModal(p) {
  produtoAtual = p;
  selecao = { tamanho: null, sabores: [], extras: [], obs: "" };
  modalNome.innerText = p.nome;
  modalDesc.innerText = p.descricao || "";
  obsItem.value = "";
  renderTamanhos();
  renderSabores();
  renderExtras();
  atualizarTotalModal();
  pizzaModal.style.display = "flex";
}

closeModal.onclick = () => pizzaModal.style.display = "none";

// ================= TAMANHOS =================
function renderTamanhos() {
  tamanhos.innerHTML = "";
  Object.keys(produtoAtual.precos || {}).forEach(t => {
    const b = document.createElement("button");
    b.innerText = `${t} R$ ${Number(produtoAtual.precos[t]).toFixed(2)}`;
    b.onclick = () => {
      selecao.tamanho = t;
      atualizarTotalModal();
    };
    tamanhos.appendChild(b);
  });
}

// ================= SABORES =================
function renderSabores() {
  sabores.innerHTML = "";
  (data.produtos || []).forEach(s => {
    const b = document.createElement("button");
    b.innerText = s.nome;
    b.onclick = () => {
      if (selecao.sabores.includes(s)) {
        selecao.sabores = selecao.sabores.filter(x => x !== s);
      } else if (selecao.sabores.length < 2) {
        selecao.sabores.push(s);
      }
      atualizarTotalModal();
    };
    sabores.appendChild(b);
  });
}

// ================= EXTRAS =================
function renderExtras() {
  extrasModal.innerHTML = "";
  const lista = []
    .concat(data.extras || [])
    .concat(data.bordas || [])
    .concat(data.adicionais || [])
    .concat(data.bebidas || []);

  lista.forEach(e => {
    if (!e || e.preco == null) return;
    const b = document.createElement("button");
    b.innerText = `${e.nome} +R$ ${Number(e.preco).toFixed(2)}`;
    b.onclick = () => {
      selecao.extras.includes(e)
        ? selecao.extras = selecao.extras.filter(x => x !== e)
        : selecao.extras.push(e);
      atualizarTotalModal();
    };
    extrasModal.appendChild(b);
  });
}

// ================= TOTAL MODAL =================
function atualizarTotalModal() {
  if (!selecao.tamanho || !selecao.sabores.length) {
    modalTotal.innerText = "0,00";
    return;
  }
  let total = Math.max(...selecao.sabores.map(s => s.precos[selecao.tamanho]));
  selecao.extras.forEach(e => total += e.preco);
  modalTotal.innerText = total.toFixed(2);
}

// ================= ADD CARRINHO =================
addPizza.onclick = () => {
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

// ================= DISTÂNCIA =================
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

// ================= CARRINHO + TAXA =================
function atualizarCarrinho() {
  cartItems.innerHTML = "";
  let subtotal = 0;
  foraDoRaio = false;

  carrinho.forEach(i => {
    subtotal += i.preco;
    cartItems.innerHTML += `
      <div>
        <strong>${i.nome} (${i.tamanho})</strong><br>
        ${i.sabores.join(" / ")}<br>
        R$ ${i.preco.toFixed(2)}
        <hr>
      </div>
    `;
  });

  if (!navigator.geolocation) {
    taxaEntrega = 0;
    atualizarTotais(subtotal);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const km = haversine(
        LOJA_LAT,
        LOJA_LNG,
        pos.coords.latitude,
        pos.coords.longitude
      );

      if (km > config.limiteKm) {
        foraDoRaio = true;
        taxaEntrega = 0;
        alert("🚫 Fora da área de entrega");
      } else {
        taxaEntrega =
          km <= 3 ? 0 : Math.max(0, (km - 3) * 2);
      }

      atualizarTotais(subtotal);
    },
    () => {
      taxaEntrega = 0;
      atualizarTotais(subtotal);
    }
  );
}

function atualizarTotais(subtotal) {
  subtotalEl.innerText = `R$ ${subtotal.toFixed(2)}`;
  taxaEl.innerText = `R$ ${taxaEntrega.toFixed(2)}`;
  cartTotal.innerText = `R$ ${(subtotal + taxaEntrega).toFixed(2)}`;
  cartQtd.innerText = carrinho.length;
}

// ================= EVENTOS =================
function bindEventos() {
  openCart.onclick = () => cart.classList.toggle("active");

  btnWhats.onclick = e => {
    e.preventDefault();
    produtos.scrollIntoView({ behavior: "smooth" });
  };

  finalizar.onclick = () => {
    if (!carrinho.length) return alert("Carrinho vazio");
    if (foraDoRaio) return alert("Endereço fora da área de entrega");
    if (!endereco.value.trim()) return alert("Informe o endereço");

    let msg = "🍕 *Pedido Bella Massa* 🍕\n\n";
    carrinho.forEach(i => {
      msg += `${i.nome} (${i.tamanho})\n${i.sabores.join(" / ")}\n`;
      if (i.obs) msg += `Obs: ${i.obs}\n`;
      msg += `R$ ${i.preco.toFixed(2)}\n\n`;
    });

    if (obsGeral.value.trim()) {
      msg += `📝 Obs geral: ${obsGeral.value}\n`;
    }

    msg += `🚚 Taxa: R$ ${taxaEntrega.toFixed(2)}\n`;
    msg += `📍 Endereço: ${endereco.value}\n`;
    msg += `💰 Total: ${cartTotal.innerText}`;

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`);
  };
}