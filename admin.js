let appData = JSON.parse(localStorage.getItem("appData")) || {};

function salvar() {
  localStorage.setItem("appData", JSON.stringify(appData));
}

function renderList(id, list, removeFn) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  list.forEach((item, i) => {
    el.innerHTML += `
      <li>
        ${item.nome} — R$ ${item.preco.toFixed(2)}
        <button onclick="${removeFn}(${i})">❌</button>
      </li>
    `;
  });
}

function render() {
  lojaAberta.checked = appData.config.lojaAberta;
  horario.value = appData.config.horario;
  tempoEntrega.value = appData.config.tempoEntrega;
  kmGratis.value = appData.config.kmGratis;
  valorKm.value = appData.config.valorKm;
  limiteKm.value = appData.config.limiteKm;

  renderList("listaBordas", appData.bordas, "removeBorda");
  renderList("listaAdicionais", appData.adicionais, "removeAdicional");
  renderList("listaBebidas", appData.bebidas, "removeBebida");
}

/* ===== CONFIG ===== */
lojaAberta.onchange = () => {
  appData.config.lojaAberta = lojaAberta.checked;
  salvar();
};
horario.oninput = () => { appData.config.horario = horario.value; salvar(); };
tempoEntrega.oninput = () => { appData.config.tempoEntrega = tempoEntrega.value; salvar(); };
kmGratis.oninput = () => { appData.config.kmGratis = +kmGratis.value; salvar(); };
valorKm.oninput = () => { appData.config.valorKm = +valorKm.value; salvar(); };
limiteKm.oninput = () => { appData.config.limiteKm = +limiteKm.value; salvar(); };

/* ===== BORDAS ===== */
function addBorda() {
  appData.bordas.push({ nome: bordaNome.value, preco: +bordaPreco.value });
  salvar(); render();
}
function removeBorda(i) {
  appData.bordas.splice(i, 1);
  salvar(); render();
}

/* ===== ADICIONAIS ===== */
function addAdicional() {
  appData.adicionais.push({ nome: adicionalNome.value, preco: +adicionalPreco.value });
  salvar(); render();
}
function removeAdicional(i) {
  appData.adicionais.splice(i, 1);
  salvar(); render();
}

/* ===== BEBIDAS ===== */
function addBebida() {
  appData.bebidas.push({ nome: bebidaNome.value, preco: +bebidaPreco.value });
  salvar(); render();
}
function removeBebida(i) {
  appData.bebidas.splice(i, 1);
  salvar(); render();
}

/* ===== EXPORTAR ===== */
function exportar() {
  const blob = new Blob([JSON.stringify(appData, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "app.json";
  a.click();
}

/* INIT */
if (!appData.config) {
  fetch("app.json")
    .then(r => r.json())
    .then(d => {
      appData = d;
      salvar();
      render();
    });
} else {
  render();
}