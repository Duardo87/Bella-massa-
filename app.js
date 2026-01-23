// app.js
let data = JSON.parse(localStorage.getItem("appData"));
let carrinho = [];
let taxa = 0;
let distanciaAtual = null;

const nome = document.getElementById("nome");
const status = document.getElementById("status");
const categoriasEl = document.getElementById("categorias");
const produtosEl = document.getElementById("produtos");
const cart = document.getElementById("cart");

if(!data){
  fetch("app.json").then(r=>r.json()).then(j=>{
    data=j;
    localStorage.setItem("appData",JSON.stringify(j));
    init();
  });
}else init();

function init(){
  nome.innerText = data.config.nomePizzaria;
  status.innerText = data.config.lojaAberta ? "ABERTO" : "FECHADO";

  categoriasEl.innerHTML="";
  data.categorias.forEach(c=>{
    const b=document.createElement("button");
    b.innerText=c.nome;
    b.onclick=()=>listar(c.id);
    categoriasEl.appendChild(b);
  });
}

function listar(cat){
  produtosEl.innerHTML="";
  data.produtos.filter(p=>p.categoria===cat).forEach(p=>{
    const d=document.createElement("div");
    d.className="produto";
    const img = p.imagem || "https://via.placeholder.com/400x300?text=Produto";
    d.innerHTML=`<img src="${img}"><h3>${p.nome}</h3><p>R$ ${p.preco.toFixed(2)}</p><button>Adicionar</button>`;
    d.querySelector("button").onclick=()=>{
      if(!data.config.lojaAberta) return alert("Loja fechada");
      carrinho.push({nome:p.nome,preco:p.preco});
      atualizar();
    };
    produtosEl.appendChild(d);
  });
}

function atualizar(){
  const items=document.getElementById("items");
  items.innerHTML="";
  let sub=0;

  carrinho.forEach((i,idx)=>{
    sub+=i.preco;
    items.innerHTML+=`${i.nome} - R$ ${i.preco.toFixed(2)} <button onclick="rem(${idx})">🗑</button><br>`;
  });

  document.getElementById("subtotal").innerText=`R$ ${sub.toFixed(2)}`;
  calcularTaxa(sub);
  document.getElementById("qtd").innerText=carrinho.length;
}

function rem(i){
  carrinho.splice(i,1);
  atualizar();
}

function calcularTaxa(sub){
  taxa=0;
  if(sub<=0){
    atualizarTotais(sub);
    return;
  }

  if(!navigator.geolocation){
    alert("Geolocalização não suportada");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos=>{
    distanciaAtual = distanciaKm(
      pos.coords.latitude,
      pos.coords.longitude,
      data.config.entrega.origem.lat,
      data.config.entrega.origem.lng
    );

    if(data.config.entrega.limiteKm && distanciaAtual>data.config.entrega.limiteKm){
      alert("Fora da área de entrega");
      taxa=0;
      atualizarTotais(sub);
      return;
    }

    const extra = Math.max(0, distanciaAtual - data.config.entrega.kmGratis);
    taxa = extra * data.config.entrega.valorPorKm;
    atualizarTotais(sub);
  },()=>{
    alert("Localização obrigatória para calcular entrega");
  });
}

function atualizarTotais(sub){
  document.getElementById("taxa").innerText=`R$ ${taxa.toFixed(2)}`;
  document.getElementById("total").innerText=`R$ ${(sub+taxa).toFixed(2)}`;
}

function distanciaKm(lat1,lon1,lat2,lon2){
  const R=6371;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

document.getElementById("openCart").onclick=()=>cart.classList.toggle("active");

document.getElementById("finalizar").onclick=()=>{
  if(!carrinho.length) return alert("Carrinho vazio");
  if(!data.config.lojaAberta) return alert("Loja fechada");

  const endereco=document.getElementById("endereco").value.trim();
  if(!endereco) return alert("Informe o endereço");

  const sub=carrinho.reduce((s,i)=>s+i.preco,0);
  const total=sub+taxa;

  if(total<data.config.pedidoMinimo) return alert("Pedido mínimo não atingido");

  let msg=`Pedido ${data.config.nomePizzaria}\n\n`;
  carrinho.forEach(i=>msg+=`${i.nome} - R$ ${i.preco.toFixed(2)}\n`);
  msg+=`\nSubtotal: R$ ${sub.toFixed(2)}\nTaxa: R$ ${taxa.toFixed(2)}\nTotal: R$ ${total.toFixed(2)}\n\nEndereço: ${endereco}`;

  const obs=document.getElementById("obs").value.trim();
  if(obs) msg+=`\nObs: ${obs}`;

  window.open(`https://wa.me/${data.config.whatsapp}?text=${encodeURIComponent(msg)}`);
};