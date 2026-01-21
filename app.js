/* =====================================================
   APP.JS FINAL – DELIVERY 100% PROFISSIONAL
   Fluxo: TAMANHO → SABORES → BORDA → ADICIONAIS
===================================================== */

let data = {};
let cart = [];
let currentProduct = null;
let selectedSize = null;
let basePrice = 0;
let userLocation = null;
let deliveryFee = 0;
let storeClosed = false;

const $ = id => document.getElementById(id);

/* ================= LOAD ================= */
async function loadData(){
  const r = await fetch("app.json?" + Date.now());
  return await r.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  data = await loadData();

  data.store ||= {};
  data.delivery ||= {};
  data.categories ||= [];
  data.products ||= [];
  data.extras ||= [];
  data.borders ||= [];
  data.promoWeek ||= {};
  data.storeInfo ||= { deliveryTime:"30 - 50 min", address:"", minOrder:0 };

  storeName.textContent = data.store.name || "Delivery";
  storePhone.href = "https://wa.me/" + (data.store.phone || "");
  storeDeliveryTime.textContent = data.storeInfo.deliveryTime;
  storeAddress.textContent = data.storeInfo.address || "";
  storeMinOrder.textContent = "R$ " + Number(data.storeInfo.minOrder).toFixed(2);

  btnCart.onclick = () => cartBox.classList.toggle("hidden");

  checkStoreStatus();
  renderWeeklyPromo();
  renderCategories();
});

/* ================= HORÁRIO ================= */
function checkStoreStatus(){
  if(!data.store.open || !data.store.close) return;
  const now = new Date();
  const [oh,om] = data.store.open.split(":");
  const [ch,cm] = data.store.close.split(":");

  const open = new Date(); open.setHours(oh,om,0);
  const close = new Date(); close.setHours(ch,cm,0);

  if(now < open || now > close){
    document.body.insertAdjacentHTML("afterbegin",
      `<div style="background:#b40000;color:#fff;padding:10px;text-align:center;font-weight:700">
        🚫 Loja Fechada no momento
      </div>`
    );
    storeClosed = true;
  }
}

/* ================= PROMO ================= */
function renderWeeklyPromo(){
  const days=["sun","mon","tue","wed","thu","fri","sat"];
  const promo=data.promoWeek[days[new Date().getDay()]];
  if(!promo || !promo.active) return;

  const box=document.createElement("div");
  box.style.cssText="background:#0f0f0f;color:#fff;padding:14px;margin:10px;border-radius:16px;font-weight:700";
  box.innerHTML=`
    🔥 ${promo.title}
    <div style="font-size:14px;margin-top:4px">
      Apenas R$ ${Number(promo.price).toFixed(2)}
    </div>
    <button style="margin-top:8px;padding:10px 16px;border:none;border-radius:14px;font-weight:800"
      onclick="addPromo(${promo.price},'${promo.title}')">
      Adicionar promoção
    </button>`;
  document.body.prepend(box);
}
function addPromo(price,title){
  cart.push({name:title,desc:"Promoção do dia",price:Number(price)});
  renderCart();
}

/* ================= CATEGORIAS ================= */
function renderCategories(){
  categories.innerHTML="";
  data.categories.filter(c=>c.active).sort((a,b)=>a.order-b.order)
    .forEach(c=>{
      categories.innerHTML+=`
        <button onclick="renderProducts(${c.id})">${c.name}</button>`;
    });
  if(data.categories.length) renderProducts(data.categories[0].id);
}

/* ================= PRODUTOS ================= */
function renderProducts(catId){
  products.innerHTML="";
  data.products.filter(p=>p.active && p.categoryId===catId).forEach(p=>{
    const minPrice = Math.min(...Object.values(p.prices||{}).filter(v=>v));
    products.innerHTML+=`
      <div class="product-card">
        ${p.image?`<img src="${p.image}">`:""}
        <h3>${p.name}</h3>
        <p>${p.desc||""}</p>
        <strong>A partir de R$ ${minPrice.toFixed(2)}</strong>
        <button onclick="openModal(${p.id})">Escolher</button>
      </div>`;
  });
}

/* ================= MODAL ================= */
function openModal(id){
  currentProduct=data.products.find(p=>p.id===id);
  selectedSize=null;
  basePrice=0;
  modalTitle.textContent=currentProduct.name;

  sizeOptions.innerHTML=`
    <h4>Tamanho</h4>
    ${renderSize("P","Pequena")}
    ${renderSize("M","Média")}
    ${renderSize("G","Grande")}

    <div id="halfAlert" style="display:none;background:#fff3cd;color:#856404;
      padding:8px;border-radius:8px;margin:10px 0;font-size:13px">
      ℹ️ Meio a meio é cobrado pelo maior valor do tamanho escolhido
    </div>

    <h4>Sabores (até ${currentProduct.maxFlavors||2})</h4>
  `;

  data.products
    .filter(p=>p.categoryId===currentProduct.categoryId && p.active)
    .forEach(p=>{
      sizeOptions.innerHTML+=`
        <label>
          <input type="checkbox" class="flavorCheck"
            data-name="${p.name}"
            data-p="${p.prices.P}"
            data-m="${p.prices.M}"
            data-g="${p.prices.G}">
          ${p.name}
          <div style="font-size:13px;color:#666">${p.desc||""}</div>
        </label>`;
    });

  borderOptions.innerHTML="<h4>Borda</h4>";
  data.borders.filter(b=>b.active).forEach(b=>{
    borderOptions.innerHTML+=`
      <label>
        <input type="radio" name="border"
          data-name="${b.name}" data-price="${b.price}">
        ${b.name} (+ R$ ${Number(b.price).toFixed(2)})
      </label><br>`;
  });

  extraOptions.innerHTML="<h4>Adicionais</h4>";
  data.extras.filter(e=>e.active).forEach(e=>{
    extraOptions.innerHTML+=`
      <label>
        <input type="checkbox" class="extraCheck"
          data-name="${e.name}" data-price="${e.price}">
        ${e.name} (+ R$ ${Number(e.price).toFixed(2)})
      </label><br>`;
  });

  document.querySelectorAll(".flavorCheck").forEach(chk=>{
    chk.onchange=()=>{
      if(!selectedSize){
        chk.checked=false;
        return alert("Escolha o tamanho primeiro");
      }
      const max=currentProduct.maxFlavors||2;
      const sel=[...document.querySelectorAll(".flavorCheck:checked")];
      halfAlert.style.display=sel.length>1?"block":"none";
      if(sel.length>max){
        chk.checked=false;
        alert(`Máximo ${max} sabores`);
      }
    };
  });

  modal.classList.remove("hidden");
}

function renderSize(code,label){
  const price=currentProduct.prices?.[code];
  if(!price) return "";
  return `
    <label>
      <input type="radio" name="size"
        onclick="selectSize('${code}',${price})">
      ${label} – R$ ${Number(price).toFixed(2)}
    </label><br>`;
}

function selectSize(code,price){
  selectedSize=code;
  basePrice=price;
}

/* ================= CONFIRMAR ================= */
function confirmProduct(){
  if(!selectedSize) return alert("Escolha o tamanho");
  const flavors=[...document.querySelectorAll(".flavorCheck:checked")];
  if(!flavors.length) return alert("Escolha ao menos 1 sabor");

  let price = basePrice;
  let sizeLabel = selectedSize==="P"?"Pequena":selectedSize==="M"?"Média":"Grande";

  const flavorPrices = flavors.map(f=>+f.dataset[selectedSize.toLowerCase()]);
  price = Math.max(...flavorPrices);

  let desc = `${sizeLabel} | ${flavors.map(f=>f.dataset.name).join(" / ")}`;

  const border=document.querySelector("input[name=border]:checked");
  if(border){
    price+=+border.dataset.price;
    desc+=` | Borda ${border.dataset.name}`;
  }

  document.querySelectorAll(".extraCheck:checked").forEach(e=>{
    price+=+e.dataset.price;
    desc+=` | +${e.dataset.name}`;
  });

  cart.push({
    name:`${currentProduct.name} (${sizeLabel})`,
    desc,
    price
  });

  closeModal();
  renderCart();
}

function closeModal(){ modal.classList.add("hidden"); }

/* ================= CARRINHO ================= */
function renderCart(){
  cartItems.innerHTML="";
  cart.forEach((i,idx)=>{
    cartItems.innerHTML+=`
      <div>
        <strong>${i.name}</strong><br>
        <small>${i.desc}</small>
        <div>R$ ${i.price.toFixed(2)}</div>
        <button onclick="removeItem(${idx})">❌</button>
      </div>`;
  });
  updateTotal();
}
function removeItem(i){ cart.splice(i,1); renderCart(); }

/* ================= ENTREGA ================= */
function useMyLocation(){
  navigator.geolocation.getCurrentPosition(p=>{
    userLocation={lat:p.coords.latitude,lng:p.coords.longitude};
    updateDelivery();
  });
}
function calcDistance(a,b,c,d){
  const R=6371;
  const dLat=(c-a)*Math.PI/180;
  const dLng=(d-b)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+
    Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*
    Math.sin(dLng/2)**2;
  return R*(2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)));
}
function updateDelivery(){
  if(!userLocation) return;
  const d=calcDistance(
    data.delivery.lat,
    data.delivery.lng,
    userLocation.lat,
    userLocation.lng
  );
  if(d>data.delivery.maxKm){
    deliveryInfo.innerText="❌ Fora da área de entrega";
    deliveryFee=null;
    return;
  }
  deliveryFee=d>data.delivery.freeKm
    ? (d-data.delivery.freeKm)*data.delivery.priceKm
    : 0;
  deliveryInfo.innerText=deliveryFee===0
    ? "🚚 Entrega Grátis"
    : `🚚 Taxa: R$ ${deliveryFee.toFixed(2)}`;
  updateTotal();
}

/* ================= TOTAL ================= */
function updateTotal(){
  let t=cart.reduce((s,i)=>s+i.price,0);
  if(deliveryFee) t+=deliveryFee;
  cartTotal.innerText=`Total: R$ ${t.toFixed(2)}`;
  return t;
}

/* ================= WHATSAPP ================= */
function sendWhats(){
  if(storeClosed) return alert("Loja fechada");
  if(deliveryFee===null) return alert("Fora da área de entrega");
  if(!payment.value) return alert("Escolha a forma de pagamento");

  const total=updateTotal();
  if(total < data.storeInfo.minOrder)
    return alert("Pedido mínimo não atingido");

  let msg=`*Pedido ${data.store.name}*%0A`;
  cart.forEach(i=>{
    msg+=`🍕 ${i.name}%0A${i.desc}%0AR$ ${i.price.toFixed(2)}%0A`;
  });

  msg+=`%0A📍 Endereço:%0A${street.value}, ${number.value} - ${district.value}%0A`;
  msg+=`💳 Pagamento: ${payment.value}%0A`;

  if(deliveryFee) msg+=`🚚 Taxa: R$ ${deliveryFee.toFixed(2)}%0A`;
  msg+=`*Total: R$ ${total.toFixed(2)}*`;

  window.open(`https://wa.me/${data.store.phone}?text=${msg}`);
}