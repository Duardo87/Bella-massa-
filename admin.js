// =========================
// admin.js – BELLA MASSA ADMIN (PROFISSIONAL)
// =========================

let data = JSON.parse(localStorage.getItem("appData")) || {
  promocoes: [],
  categorias: [],
  produtos: [],
  extras: [],
  config: {
    lojaAberta: true,
    horario: "Fecha às 23:30",
    tempoEntrega: "40–60 min",
    kmGratis: 3,
    valorKm: 2,
    limiteKm: 10
  }
};

// =========================
// INIT
// =========================
init();

function init() {
  carregarConfig();
  renderProdutos();
  renderExtras();
}

// =========================
// CONFIG
// =========================
function carregarConfig() {
  document.getElementById("lojaAberta").value = data.config.lojaAberta;
  document.getElementById("horario").value = data.config.horario;
  document.getElementById("tempoEntrega").value = data.config.tempoEntrega;
  document.getElementById("kmGratis").value = data.config.kmGratis;
  document.getElementById("valorKm").value = data.config.valorKm;
  document.getElementById("limiteKm").value = data.config.limiteKm;
}

function salvarConfig() {
  data.config.lojaAberta = document.getElementById("lojaAberta").value === "true";
  data.config.horario = document.getElementById("horario").value;
  data.config.tempoEntrega = document.getElementById("tempoEntrega").value;
  data.config.kmGratis = Number(document.getElementById("kmGratis").value);
  data.config.valorKm = Number(document.getElementById("valorKm").value);
  data.config.limiteKm = Number(document.getElementById("limiteKm").value);
  salvar();
}

// =========================
// PRODUTOS
// =========================
function addProduto() {
  const p = {
    nome: document.getElementById("prodNome").value,
    categoria: document.getElementById("prodCategoria").value,
    descricao: "",
    imagem: document.getElementById("prodImagem").value,
    maisVendido: false,
    precos: {
      P: Number(document.getElementById("prodPrecoP").value),
      M: Number(document.getElementById("prodPrecoM").value),
      G: Number(document.getElementById("prodPrecoG").value)
    }
  };
  data.produtos.push(p);
  salvar();
  renderProdutos();
}

function renderProdutos() {
  const l = document.getElementById("listaProdutos");
  l.innerHTML = "";
  data.produtos.forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "item";
    d.innerHTML = `
      <span>${p.nome}</span>
      <button class="danger" onclick="removerProduto(${i})">Excluir</button>
    `;
    l.appendChild(d);
  });
}

function removerProduto(i) {
  data.produtos.splice(i, 1);
  salvar();
  renderProdutos();
}

// =========================
// EXTRAS
// =========================
function addExtra() {
  const e = {
    nome: document.getElementById("extraNome").value,
    preco: Number(document.getElementById("extraPreco").value)
  };
  data.extras.push(e);
  salvar();
  renderExtras();
}

function renderExtras() {
  const l = document.getElementById("listaExtras");
  l.innerHTML = "";
  data.extras.forEach((e, i) => {
    const d = document.createElement("div");
    d.className = "item";
    d.innerHTML = `
      <span>${e.nome} – R$ ${e.preco.toFixed(2)}</span>
      <button class="danger" onclick="removerExtra(${i})">Excluir</button>
    `;
    l.appendChild(d);
  });
}

function removerExtra(i) {
  data.extras.splice(i, 1);
  salvar();
  renderExtras();
}

// =========================
// STORAGE
// =========================
function salvar() {
  salvarConfig();
  localStorage.setItem("appData", JSON.stringify(data));
  alert("Salvo com sucesso!");
}

function exportar() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "app.json";
  a.click();
}

function importar(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = ev => {
    data = JSON.parse(ev.target.result);
    salvar();
    init();
  };
  reader.readAsText(file);
}