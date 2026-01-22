let appData = {};

/* ===== INIT ===== */
async function init() {
  const local = localStorage.getItem("appData");
  if (local) {
    appData = JSON.parse(local);
  } else {
    const res = await fetch("app.json");
    appData = await res.json();
    salvar();
  }
  render();
}

function salvar() {
  localStorage.setItem("appData", JSON.stringify(appData));
}

/* ===== RENDER ===== */
function render() {
  // config
  lojaAberta.checked = appData.config.lojaAberta;
  horario.value = appData.config.horario;
  tempoEntrega.value = appData.config.tempoEntrega;

  renderLista("listaBordas", appData.bordas, removeBorda);
  renderLista("listaAdicionais", appData.adicionais, removeAdicional);
  renderLista("listaBebidas", appData.bebidas, removeBebida);
}

function renderLista(id, lista, removerFn) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";
  lista.forEach((item, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.nome} — R$ ${item.preco.toFixed(2)}
      <button class="remover">❌</button>
    `;
    li.querySelector("button").onclick = () => removerFn(i);
    ul.appendChild(li);
  });
}

/* ===== CONFIG ===== */
lojaAberta.onchange = () => {
  appData.config.lojaAberta = lojaAberta.checked;
  salvar();
};
horario.oninput = () => {
  appData.config.horario = horario.value;
  salvar();
};
tempoEntrega.oninput = () => {
  appData.config.tempoEntrega = tempoEntrega.value;
  salvar();
};

/* ===== BORDAS ===== */
function addBorda() {
  if (!bordaNome.value || !bordaPreco.value) return;
  appData.bordas.push({
    nome: bordaNome.value,
    preco: parseFloat(bordaPreco.value)
  });
  bordaNome.value = "";
  bordaPreco.value = "";
  salvar();
  render();
}

function removeBorda(i) {
  appData.bordas.splice(i, 1);
  salvar();
  render();
}

/* ===== ADICIONAIS ===== */
function addAdicional() {
  if (!adicionalNome.value || !adicionalPreco.value) return;
  appData.adicionais.push({
    nome: adicionalNome.value,
    preco: parseFloat(adicionalPreco.value)
  });
  adicionalNome.value = "";
  adicionalPreco.value = "";
  salvar();
  render();
}

function removeAdicional(i) {
  appData.adicionais.splice(i, 1);
  salvar();
  render();
}

/* ===== BEBIDAS ===== */
function addBebida() {
  if (!bebidaNome.value || !bebidaPreco.value) return;
  appData.bebidas.push({
    nome: bebidaNome.value,
    preco: parseFloat(bebidaPreco.value)
  });
  bebidaNome.value = "";
  bebidaPreco.value = "";
  salvar();
  render();
}

function removeBebida(i) {
  appData.bebidas.splice(i, 1);
  salvar();
  render();
}

/* ===== EXPORTAR ===== */
function exportar() {
  const blob = new Blob(
    [JSON.stringify(appData, null, 2)],
    { type: "application/json" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "app.json";
  a.click();
}

/* START */
init();