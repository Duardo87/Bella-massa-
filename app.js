// app.js (FINAL CORRIGIDO)
const R=6371;
let data={},carrinho=[],produtoAtual=null,selecao={},taxaEntrega=0;

document.addEventListener("DOMContentLoaded",async()=>{
  data=JSON.parse(localStorage.getItem("appData"))||await(await fetch("app.json")).json();
  renderHeader();
  renderCarousel();
  renderPromoDia();
  renderCategorias();
  renderProdutos();
  bindEventos();
});

function renderHeader(){
  document.getElementById("statusLoja").innerText=data.config.lojaAberta?"ABERTO AGORA":"FECHADO";
  document.getElementById("horario").innerText=data.config.horario;
  document.getElementById("tempoEntrega").innerText=`⏱ ${data.config.tempoEntrega}`;
  document.getElementById("avisoMeio").innerText=data.config.meioAMeio.aviso;
}

function renderCarousel(){
  const c=document.getElementById("carousel");c.innerHTML="";
  data.promocoes.forEach(p=>{const d=document.createElement("div");d.innerText=p;c.appendChild(d)});
}

function renderPromoDia(){
  const d=new Date().getDay();
  const map=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  document.getElementById("promoDia").innerText=`🔥 Promoção de ${map[d]} ativa hoje!`;
}

function renderCategorias(){
  const cat=document.getElementById("categorias");cat.innerHTML="";
  data.categorias.forEach(c=>{const b=document.createElement("button");b.innerText=c;b.onclick=()=>renderProdutos(c);cat.appendChild(b)});
}

function renderProdutos(cat){
  const p=document.getElementById("produtos");p.innerHTML="";
  if(cat==="Ofertas"){
    data.ofertas.forEach(o=>{
      const d=document.createElement("div");
      d.className="produto";
      d.innerHTML=`<div class="info"><h3>${o.nome}</h3><p>${o.descricao}</p><p><strong>R$ ${o.preco.toFixed(2)}</strong></p></div><button>Adicionar</button>`;
      d.querySelector("button").onclick=()=>{
        carrinho.push({tipo:"combo",nome:o.nome,descricao:o.descricao,preco:o.preco});
        atualizarCarrinho();
      };
      p.appendChild(d);
    });
    return;
  }
  data.produtos.filter(x=>!cat||x.categoria===cat).forEach(prod=>{
    const d=document.createElement("div");
    d.className="produto";
    d.innerHTML=`<img src="${prod.imagem}"><div class="info"><h3>${prod.nome} ${prod.maisVendido?"🔥":""}</h3><p>${prod.descricao}</p><p>A partir de R$ ${prod.precos.P.toFixed(2)}</p></div><button>Adicionar</button>`;
    d.querySelector("button").onclick=()=>abrirModal(prod);
    p.appendChild(d);
  });
}

function abrirModal(p){
  produtoAtual=p;
  selecao={tamanho:null,sabores:[],extras:[],obs:""};
  document.getElementById("modalNome").innerText=p.nome;
  document.getElementById("modalDesc").innerText=p.descricao;
  renderTamanhos();renderSabores();renderExtras();atualizarModalTotal();
  document.getElementById("pizzaModal").style.display="flex";
}

function renderTamanhos(){
  const t=document.getElementById("tamanhos");t.innerHTML="";
  Object.entries(produtoAtual.precos).forEach(([k,v])=>{
    const b=document.createElement("button");
    b.innerText=`${k} R$ ${v.toFixed(2)}`;
    b.onclick=()=>{selecao.tamanho=k;atualizarModalTotal()};
    t.appendChild(b);
  });
}

function renderSabores(){
  const s=document.getElementById("sabores");s.innerHTML="";
  data.produtos.forEach(p=>{
    const b=document.createElement("button");
    b.innerText=p.nome;
    b.onclick=()=>{
      if(selecao.sabores.includes(p))selecao.sabores=selecao.sabores.filter(x=>x!==p);
      else if(selecao.sabores.length<2)selecao.sabores.push(p);
      atualizarModalTotal();
    };
    s.appendChild(b);
  });
}

function renderExtras(){
  const e=document.getElementById("extrasModal");e.innerHTML="";
  [...data.bordas,...data.adicionais,...data.bebidas].forEach(x=>{
    const b=document.createElement("button");
    b.innerText=`${x.nome} +R$ ${x.preco.toFixed(2)}`;
    b.onclick=()=>{
      selecao.extras.includes(x)?selecao.extras=selecao.extras.filter(y=>y!==x):selecao.extras.push(x);
      atualizarModalTotal();
    };
    e.appendChild(b);
  });
}

function atualizarModalTotal(){
  if(!selecao.tamanho||!selecao.sabores.length){document.getElementById("modalTotal").innerText="0,00";return}
  let total=Math.max(...selecao.sabores.map(s=>s.precos[selecao.tamanho]));
  selecao.extras.forEach(e=>total+=e.preco);
  document.getElementById("modalTotal").innerText=total.toFixed(2);
}

document.getElementById("addPizza").onclick=()=>{
  carrinho.push({
    tipo:"pizza",
    nome:produtoAtual.nome,
    tamanho:selecao.tamanho,
    sabores:selecao.sabores.map(s=>s.nome),
    extras:selecao.extras,
    obs:document.getElementById("obsItem").value,
    preco:parseFloat(document.getElementById("modalTotal").innerText)
  });
  document.getElementById("pizzaModal").style.display="none";
  atualizarCarrinho();
};

function atualizarCarrinho(){
  const c=document.getElementById("cartItems");c.innerHTML="";
  let subtotal=0;
  carrinho.forEach(i=>{
    subtotal+=i.preco;
    c.innerHTML+=`<div><strong>${i.nome}</strong><br>${i.sabores?i.sabores.join(" / "):i.descricao||""}<br>R$ ${i.preco.toFixed(2)}<hr></div>`;
  });
  document.getElementById("subtotal").innerText=`R$ ${subtotal.toFixed(2)}`;
  calcularTaxa(subtotal);
  document.getElementById("cartQtd").innerText=carrinho.length;
  document.getElementById("upsell").innerText=data.bebidas.length?"🥤 Que tal adicionar uma bebida gelada?":"";
}

function calcularTaxa(sub){
  if(!navigator.geolocation){taxaEntrega=0;atualizarTotais(sub);return}
  navigator.geolocation.getCurrentPosition(pos=>{
    const km=haversine(data.config.lojaLat||-16.6001442,data.config.lojaLng||-49.3848331,pos.coords.latitude,pos.coords.longitude);
    taxaEntrega=km<=data.config.kmGratis?0:(km-data.config.kmGratis)*data.config.valorKm;
    atualizarTotais(sub);
  },()=>{taxaEntrega=0;atualizarTotais(sub)});
}

function atualizarTotais(sub){
  document.getElementById("taxa").innerText=`R$ ${taxaEntrega.toFixed(2)}`;
  document.getElementById("cartTotal").innerText=`R$ ${(sub+taxaEntrega).toFixed(2)}`;
}

function haversine(lat1,lon1,lat2,lon2){
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function bindEventos(){
  document.getElementById("openCart").onclick=()=>document.getElementById("cart").classList.toggle("active");
  document.getElementById("closeModal").onclick=()=>document.getElementById("pizzaModal").style.display="none";
  document.getElementById("btnWhats").onclick=e=>{e.preventDefault();document.getElementById("cart").classList.add("active")};
  document.getElementById("finalizar").onclick=finalizarPedido;
}

function finalizarPedido(){
  if(!data.config.lojaAberta)return alert("Loja fechada no momento");
  if(!carrinho.length)return alert("Carrinho vazio");
  const total=parseFloat(document.getElementById("cartTotal").innerText.replace("R$",""));
  if(total<data.config.pedidoMinimo)return alert(`Pedido mínimo R$ ${data.config.pedidoMinimo.toFixed(2)}`);
  const end=document.getElementById("endereco").value.trim();
  if(!end)return alert("Informe o endereço");

  let msg="🍕 *Pedido Bella Massa* 🍕\n\n";
  carrinho.forEach(i=>{
    msg+=`• ${i.nome}\n`;
    if(i.sabores)msg+=`  Sabores: ${i.sabores.join(" / ")}\n`;
    if(i.extras&&i.extras.length)msg+=`  Extras: ${i.extras.map(e=>e.nome).join(", ")}\n`;
    msg+=`  Valor: R$ ${i.preco.toFixed(2)}\n\n`;
  });
  msg+=`🚚 Taxa: R$ ${taxaEntrega.toFixed(2)}\n`;
  msg+=`📍 Endereço: ${end}\n`;
  msg+=`💰 Total: R$ ${total.toFixed(2)}`;
  window.open(`https://wa.me/${data.config.whatsapp}?text=${encodeURIComponent(msg)}`);
}