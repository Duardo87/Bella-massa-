// admin.js
const SENHA="8630";
let data=JSON.parse(localStorage.getItem("appData"));

if(!data){
  fetch("app.json").then(r=>r.json()).then(j=>{
    data=j;
    localStorage.setItem("appData",JSON.stringify(j));
  });
}

function login(){
  if(document.getElementById("senha").value===SENHA){
    localStorage.setItem("adminAuth","1");
    carregar();
  }else alert("Senha incorreta");
}

function carregar(){
  if(localStorage.getItem("adminAuth")!=="1") return;
  document.getElementById("login").style.display="none";
  document.getElementById("admin").style.display="block";

  nomePizzaria.value=data.config.nomePizzaria;
  whatsapp.value=data.config.whatsapp;
  pedidoMinimo.value=data.config.pedidoMinimo;
  kmGratis.value=data.config.entrega.kmGratis;
  valorKm.value=data.config.entrega.valorPorKm;
  limiteKm.value=data.config.entrega.limiteKm||"";

  prodCategoria.innerHTML="";
  data.categorias.forEach(c=>{
    const o=document.createElement("option");
    o.value=c.id;o.innerText=c.nome;
    prodCategoria.appendChild(o);
  });

  listarProdutos();
}

function addProduto(){
  const file=prodImg.files[0];
  const reader=new FileReader();
  reader.onload=()=>{
    data.produtos.push({
      id:Date.now(),
      nome:prodNome.value,
      preco:Number(prodPreco.value),
      categoria:Number(prodCategoria.value),
      imagem:reader.result
    });
    listarProdutos();
  };
  if(file) reader.readAsDataURL(file);
}

function listarProdutos(){
  listaProdutos.innerHTML="";
  data.produtos.forEach((p,i)=>{
    const d=document.createElement("div");
    d.innerHTML=`${p.nome} - R$ ${p.preco.toFixed(2)} <button onclick="rem(${i})">🗑</button>`;
    listaProdutos.appendChild(d);
  });
}

function rem(i){
  data.produtos.splice(i,1);
  listarProdutos();
}

function salvar(){
  data.config.nomePizzaria=nomePizzaria.value;
  data.config.whatsapp=whatsapp.value;
  data.config.pedidoMinimo=Number(pedidoMinimo.value);
  data.config.entrega.kmGratis=Number(kmGratis.value);
  data.config.entrega.valorPorKm=Number(valorKm.value);
  data.config.entrega.limiteKm=Number(limiteKm.value)||null;
  localStorage.setItem("appData",JSON.stringify(data));
  alert("Salvo com sucesso");
}

carregar();