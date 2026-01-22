let data = JSON.parse(localStorage.getItem("appData")) || {
  promocoes: [],
  categorias: [],
  produtos: [],
  extras: [],
  config: {
    lojaAberta: true,
    horario: "",
    tempoEntrega: "",
    kmGratis: 0,
    valorKm: 0,
    limiteKm: 0
  }
};

function salvar() {
  localStorage.setItem("appData", JSON.stringify(data));
  alert("Salvo com sucesso");
}

function addProduto() {
  data.produtos.push({
    nome: prodNome.value,
    categoria: prodCategoria.value,
    descricao: "",
    imagem: prodImagem.value,
    precos: {
      P: Number(prodPrecoP.value),
      M: Number(prodPrecoM.value),
      G: Number(prodPrecoG.value)
    }
  });
  salvar();
}