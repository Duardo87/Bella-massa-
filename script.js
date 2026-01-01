const WHATSAPP = "5562993343622";
const PIX_CHAVE = "62999193066";

// Local fixo da pizzaria (Estação das Fontes 2)
const LAT_PIZZA = -16.622820;
const LON_PIZZA = -49.264789;

const KM_VALOR = 2;
let valorPedido = 0;
let taxa = 0;
let linkMapa = "";

function selecionarCombo(nome,valor){
  valorPedido = valor;
  abrirPix();
}

function finalizarPedido(){
  const tamanho = parseInt(document.getElementById("tamanho").value);
  const borda = parseInt(document.getElementById("borda").value);

  let extras = 0;
  document.querySelectorAll("[data-extra]:checked").forEach(e=>{
    extras += parseInt(e.dataset.extra);
  });

  valorPedido = tamanho + borda + extras;
  abrirPix();
}

function abrirPix(){
  document.getElementById("resumo").innerText =
    `Pedido: R$ ${valorPedido.toFixed(2)}\nEntrega: calcular`;

  document.getElementById("pix").value = PIX_CHAVE;
  document.getElementById("qr").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${PIX_CHAVE}`;

  document.getElementById("pixModal").style.display = "flex";
}

function copiarPix(){
  const p = document.getElementById("pix");
  p.select(); document.execCommand("copy");
  alert("PIX copiado!");
}

function pegarLocalizacao(){
  navigator.geolocation.getCurrentPosition(pos=>{
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const km = distancia(lat,lon,LAT_PIZZA,LON_PIZZA);
    taxa = km * KM_VALOR;

    linkMapa = `https://www.google.com/maps?q=${lat},${lon}`;

    document.getElementById("resumo").innerText =
      `Pedido: R$ ${valorPedido.toFixed(2)}
Entrega: R$ ${taxa.toFixed(2)} (${km.toFixed(1)} km)
Total: R$ ${(valorPedido+taxa).toFixed(2)}`;
  });
}

function confirmar(){
  const total = valorPedido + taxa;
  const msg =
`🍕 *Pedido Bella Massa*
💰 Total: R$ ${total.toFixed(2)}
📍 Localização: ${linkMapa}
🧾 Enviar comprovante`;

  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`);
}

function distancia(lat1,lon1,lat2,lon2){
  const R=6371;
  const dLat=(lat2-lat1)*Math.PI/180;
  const dLon=(lon2-lon1)*Math.PI/180;
  const a=
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
    Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// CONTADOR PROMO
let t=15*60;
setInterval(()=>{
  if(t<=0)return;
  t--;
  document.getElementById("tempo").innerText=
    Math.floor(t/60)+":"+String(t%60).padStart(2,"0");
},1000);