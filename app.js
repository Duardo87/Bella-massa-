// app.js
const R=6371;
let data={},carrinho=[],produtoAtual=null,selecao={},taxaEntrega=0,distanciaKm=null;

document.addEventListener("DOMContentLoaded",async()=>{
  data=JSON.parse(localStorage.getItem("appData"))||await(await fetch("app.json")).json();
  renderHeader();renderCarousel();renderPromoDia();renderCategorias();renderProdutos();bindEventos();
});

function renderHeader(){
  statusLoja.innerText=data.config.lojaAberta?"ABERTO AGORA":"FECHADO";
  horario.innerText=data.config.horario;
  tempoEntrega.innerText=`⏱ ${data.config.tempoEntrega}`;
  avisoMeio.innerText=data.config.meioAMeio.aviso;
}

function renderCarousel(){
  carousel.innerHTML="";
  data.promocoes.forEach(p=>{const d=document.createElement("div");d.innerText=p;carousel.appendChild(d)});
}

function renderPromoDia(){
  const dias=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  promoDia.innerText=`🔥 Promoção de ${dias[new Date().getDay()]} ativa hoje!`;
}

function renderCategorias(){
  categorias.innerHTML="";
  data.categorias.forEach(c=>{const b=document.createElement("button");b.innerText=c;b.onclick=()=>renderProdutos(c);categorias.appendChild(b)});
}

function renderProdutos(cat){
  produtos.innerHTML="";
  if(cat==="Bebidas"){
    data.bebidas.forEach(b=>{
      const d=document.createElement("div");
      d.className="produto";
      d.innerHTML=`<div class="info"><h3>${b.nome}</h3><p>R$ ${b.preco.toFixed(2)}</p></div><button>Adicionar bebida</button>`;
      d.querySelector("button").onclick=()=>{
        carrinho.push({tipo:"bebida",nome:b.nome,preco:b.preco});
        atualizarCarrinho();
      };
      produtos.appendChild(d);
    });
    return;
  }
  if(cat==="Ofertas"){
    data.ofertas.forEach(o=>{
      const d=document.createElement("div");
      d.className="produto";
      d.innerHTML=`<div class="info"><h3>${o.nome}</h3><p>${o.descricao}</p><p><strong>R$ ${o.preco.toFixed(2)}</strong></p></div><button>Adicionar</button>`;
      d.querySelector("button").onclick=()=>{
        carrinho.push({tipo:"combo",nome:o.nome,descricao:o.descricao,preco:o.preco});
        atualizarCarrinho();
      };
      produtos.appendChild(d);
    });
    return;
  }
  data.produtos.filter(p=>!cat||p.categoria===cat).forEach(p=>{
    const d=document.createElement("div");
    d.className="produto";
    d.innerHTML=`<img src="${p.imagem}"><div class="info"><h3>${p.nome} ${p.maisVendido?"🔥":""}</h3><p>${p.descricao}</p><p>A partir de R$ ${p.precos.P.toFixed(2)}</p></div><button>Adicionar</button>`;
    d.querySelector("button").onclick=()=>abrirModal(p);
    produtos.appendChild(d);
  });
}

function abrirModal(p){
  produtoAtual=p;
  selecao={tamanho:null,sabores:[],extras:[],obs:""};
  avisoLimite.style.display="none";
  modalNome.innerText=p.nome;
  modalDesc.innerText=p.descricao;
  renderTamanhos();renderSabores();renderExtras();atualizarModalTotal();
  pizzaModal.style.display="flex";
}

function renderTamanhos(){
  tamanhos.innerHTML="";
  Object.entries(produtoAtual.precos).forEach(([k,v])=>{
    const b=document.createElement("button");
    b.innerText=`${k} R$ ${v.toFixed(2)}`;
    b.onclick=()=>{selecao.tamanho=k;atualizarModalTotal()};
    tamanhos.appendChild(b);
  });
}

function renderSabores(){
  sabores.innerHTML="";
  data.produtos.forEach(s=>{
    const b=document.createElement("button");
    b.innerText=s.nome;
    b.onclick=()=>{
      if(selecao.sabores.includes(s))selecao.sabores=selecao.sabores.filter(x=>x!==s);
      else if(selecao.sabores.length<2)selecao.sabores.push(s);
      atualizarModalTotal();
      atualizarFeedbackSabores();
    };
    sabores.appendChild(b);
  });
}

function atualizarFeedbackSabores(){
  const buttons=[...sabores.children];
  if(selecao.sabores.length===2){
    avisoLimite.style.display="block";
    avisoLimite.innerText="Limite de 2 sabores atingido";
    buttons.forEach(b=>{
      if(!selecao.sabores.some(s=>s.nome===b.innerText))b.classList.add("disabled");
    });
  }else{
    avisoLimite.style.display="none";
    buttons.forEach(b=>b.classList.remove("disabled"));
  }
}

function renderExtras(){
  extrasModal.innerHTML="";
  [...data.bordas,...data.adicionais].forEach(e=>{
    const b=document.createElement("button");
    b.innerText=`${e.nome} +R$ ${e.preco.toFixed(2)}`;
    b.onclick=()=>{
      selecao.extras.includes(e)?selecao.extras=selecao.extras.filter(x=>x!==e):selecao.extras.push(e);
      atualizarModalTotal();
    };
    extrasModal.appendChild(b);
  });
}

function atualizarModalTotal(){
  if(!selecao.tamanho||!selecao.sabores.length){modalTotal.innerText="0,00";return}
  let total=Math.max(...selecao.sabores.map(s=>s.precos[selecao.tamanho]));
  selecao.extras.forEach(e=>total+=e.preco);
  modalTotal.innerText=total.toFixed(2);
}

addPizza.onclick=()=>{
  carrinho.push({tipo:"pizza",nome:produtoAtual.nome,sabores:selecao.sabores.map(s=>s.nome),extras:selecao.extras,preco:parseFloat(modalTotal.innerText)});
  pizzaModal.style.display="none";
  atualizarCarrinho();
};

function atualizarCarrinho(){
  cartItems.innerHTML="";
  let subtotal=0;
  carrinho.forEach(i=>{
    subtotal+=i.preco;
    const d=document.createElement("div");
    d.innerHTML=`<strong>${i.nome}</strong><br>${i.sabores?i.sabores.join(" / "):""}<br>R$ ${i.preco.toFixed(2)}<hr>`;
    cartItems.appendChild(d);
  });
  subtotalEl.innerText=`R$ ${subtotal.toFixed(2)}`;
  calcularTaxa(subtotal);
  cartQtd.innerText=carrinho.length;
}

function calcularTaxa(sub){
  if(distanciaKm!==null){aplicarTaxa(sub);return}
  if(!navigator.geolocation){taxaEntrega=0;atualizarTotais(sub);return}
  navigator.geolocation.getCurrentPosition(pos=>{
    distanciaKm=haversine(data.config.lojaLat,data.config.lojaLng,pos.coords.latitude,pos.coords.longitude);
    aplicarTaxa(sub);
  },()=>{taxaEntrega=0;atualizarTotais(sub)});
}

function aplicarTaxa(sub){
  if(distanciaKm>data.config.limiteKm){alert("🚫 Fora da área de entrega");taxaEntrega=0;atualizarTotais(sub);return}
  taxaEntrega=distanciaKm<=data.config.kmGratis?0:(distanciaKm-data.config.kmGratis)*data.config.valorKm;
  atualizarTotais(sub);
}

function atualizarTotais(sub){
  taxaEl.innerText=`R$ ${taxaEntrega.toFixed(2)}`;
  cartTotal.innerText=`R$ ${(sub+taxaEntrega).toFixed(2)}`;
}

function haversine(lat1,lon1,lat2,lon2){
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function bindEventos(){
  openCart.onclick=()=>cart.classList.toggle("active");
  closeModal.onclick=()=>pizzaModal.style.display="none";
  btnWhats.onclick=e=>{e.preventDefault();cart.classList.add("active")};
  finalizar.onclick=finalizarPedido;
}

function finalizarPedido(){
  if(!data.config.lojaAberta)return alert("Loja fechada");
  if(!carrinho.length)return alert("Carrinho vazio");
  const total=parseFloat(cartTotal.innerText.replace("R$",""));
  if(total<data.config.pedidoMinimo)return alert(`Pedido mínimo R$ ${data.config.pedidoMinimo.toFixed(2)}`);
  if(distanciaKm>data.config.limiteKm)return;
  if(!endereco.value.trim())return alert("Informe o endereço");

  let msg="🍕 *Pedido Bella Massa* 🍕\n\n";
  carrinho.forEach(i=>{
    msg+=`• ${i.nome}\n`;
    if(i.sabores)msg+=`  Sabores: ${i.sabores.join(" / ")}\n`;
    msg+=`  Valor: R$ ${i.preco.toFixed(2)}\n\n`;
  });
  if(obsGeral.value.trim())msg+=`📝 Obs: ${obsGeral.value}\n\n`;
  msg+=`🚚 Taxa: R$ ${taxaEntrega.toFixed(2)}\n`;
  msg+=`📍 Endereço: ${endereco.value}\n`;
  msg+=`💰 Total: R$ ${total.toFixed(2)}`;
  window.open(`https://wa.me/${data.config.whatsapp}?text=${encodeURIComponent(msg)}`);
}