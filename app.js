/* =====================================================
   APP.JS FINAL DEFINITIVO – BELLA MASSA
   Status: 100% funcional | Produção
===================================================== */

let data = {};
let cart = [];
let currentProduct = null;
let selectedSize = null;
let basePrice = 0;
let userLocation = null;
let deliveryFee = 0;

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
  data.storeInfo ||= { deliveryTime:"30 - 50 min", address:"", minOrder:0 };

  storeName.textContent = data.store.name || "Delivery";
  storePhone.href = "https://wa.me/" + (data.store.phone || "");
  storeDeliveryTime.textContent = data.storeInfo.deliveryTime;
  storeAddress.textContent = data.storeInfo.address || "";
  storeMinOrder.textContent = "R$ " + Number(data.storeInfo.minOrder).toFixed(2);

  btnCart.onclick = () => cartBox.classList.toggle("hidden");

  checkStoreStatus();
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
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div class="store-closed">🚫 Loja Fechada no momento</div>`
    );
  }
}

/* ================= CATEGORIAS ================= */
function renderCategories(){
  categories.innerHTML="";
  data.categories.filter(c=>c.active)
    .sort((a,b)=>a.order-b.order)
    .forEach(c=>{
      categories.innerHTML+=`
        <button onclick="renderProducts(${c.id})">${c.name}</button>`;
    });

  if(data.categories.length){
    renderProducts(data.categories[0].id);
  }
}

/* ================= PRODUTOS ================= */
function renderProducts(catId){
  products.innerHTML="";
  data.products
    .filter(p=>p.active && p.categoryId===catId)
    .forEach(p=>{
      const prices = Object.values(p.prices||{}).filter(v=>v);
      const minPrice = prices.length ? Math.min(...prices) : 0;

      products.innerHTML+=`
        <div class="product-card">
          ${p.image?`<img src="${p.image}">`:""}
          <h3>${p.name}</h3>
          <p>${p.desc||""}</p>
          <strong>A partir de R$ ${minPrice.toFixed(2)}</strong>
          <button onclick="openModal(${p.id})">Adicionar ao pedido</button>
        </div>`;
    });
}

/* ================= MODAL ================= */
function openModal(id){
  currentProduct = data.products.find(p=>p.id===id);
  selectedSize = null;
  basePrice = 0;

  modalTitle.textContent = currentProduct.name;
  sizeOptions.innerHTML = "";
  borderOptions.innerHTML = "";
  extraOptions.innerHTML = "";

  sizeOptions.innerHTML += `
    <h4>Tamanho</h4>
    ${renderSize("P","Pequena")}
    ${renderSize("M","Média")}
    ${renderSize("G","Grande")}
    <h4>Sabores (até ${currentProduct.maxFlavors||1})</h4>
    <div class="half-alert">ℹ️ Meio a meio é cobrado pelo maior valor</div>
  `;

  data.products
    .filter(p=>p.categoryId===currentProduct.categoryId && p.active)
    .forEach(p=>{
      sizeOptions.innerHTML+=`
        <label class="option">
          <input type="checkbox" class="flavorCheck"
            data-name="${p.name}"
            data-p="${p.prices.P||0}"
            data-m="${p.prices.M||0}"
            data-g="${p.prices.G||0}">
          <b>${p.name}</b>
          <small>${p.desc||""}</small>
        </label>`;
    });

  borderOptions.innerHTML="<h4>Borda (opcional)</h4>";
  data.borders.filter(b=>b.active).forEach(b=>{
    borderOptions.innerHTML+=`
      <label class="option">
        <input type="radio" name="border"
          data-name="${b.name}" data-price="${b.price}">
        ${b.name} (+ R$ ${Number(b.price).toFixed(2)})
      </label>`;
  });

  extraOptions.innerHTML="<h4>Adicionais (opcional)</h4>";
  data.extras.filter(e=>e.active).forEach(e=>{
    extraOptions.innerHTML+=`
      <label class="option">
        <input type="checkbox" class="extraCheck"
          data-name="${e.name}" data-price="${e.price}">
        ${e.name} (+ R$ ${Number(e.price).toFixed(2)})
      </label>`;
  });

  sizeOptions.innerHTML+=`
    <div class="live-total">
      Total: R$ <span id="liveTotal">0.00</span>
    </div>`;

  modal.classList.remove("hidden");

  modal.onchange = updateLiveTotal;
}

/* ================= TAMANHO ================= */
function renderSize(k,label){
  return `
    <label class="option">
      <input type="radio" name="size" onchange="selectSize('${k}')">
      ${label} – R$ ${currentProduct.prices[k].toFixed(2)}
    </label>`;
}
function selectSize(k){
  selectedSize = k;
  basePrice = currentProduct.prices[k];
  updateLiveTotal();
}

/* ================= TOTAL EM TEMPO REAL ================= */
function updateLiveTotal(){
  let total = basePrice || 0;

  const flavors = document.querySelectorAll(".flavorCheck:checked");
  if(flavors.length && selectedSize){
    flavors.forEach(f=>{
      total = Math.max(total, Number(f.dataset[selectedSize.toLowerCase()]));
    });
  }

  document.querySelectorAll("input[name=border]:checked")
    .forEach(b=> total += Number(b.dataset.price));

  document.querySelectorAll(".extraCheck:checked")
    .forEach(e=> total += Number(e.dataset.price));

  $("liveTotal").textContent = total.toFixed(2);
}

/* ================= CONFIRMAR PRODUTO ================= */
function confirmProduct(){
  if(!selectedSize) return alert("Escolha o tamanho");

  const total = Number($("liveTotal").textContent);

  cart.push({
    name: `${currentProduct.name} (${selectedSize})`,
    price: total
  });

  renderCart();
  closeModal();
}

/* ================= CARRINHO ================= */
function renderCart(){
  cartItems.innerHTML="";
  let total = 0;

  cart.forEach((i,idx)=>{
    total += i.price;
    cartItems.innerHTML+=`
      <div class="cart-item">
        ${i.name}
        <span>R$ ${i.price.toFixed(2)}</span>
        <button onclick="removeItem(${idx})">✖</button>
      </div>`;
  });

  cartTotal.textContent = "Total: R$ " + total.toFixed(2);
}

/* ================= REMOVER ================= */
function removeItem(i){
  cart.splice(i,1);
  renderCart();
}

/* ================= LOCALIZAÇÃO ================= */
function useMyLocation(){
  if(!navigator.geolocation){
    return alert("Geolocalização não suportada");
  }
  navigator.geolocation.getCurrentPosition(pos=>{
    userLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };
    calculateDelivery();
  });
}

/* ================= TAXA DE ENTREGA ================= */
function calculateDelivery(){
  if(!userLocation || !data.delivery.lat) return;

  const R = 6371;
  const dLat = (userLocation.lat - data.delivery.lat) * Math.PI/180;
  const dLon = (userLocation.lng - data.delivery.lng) * Math.PI/180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(data.delivery.lat*Math.PI/180) *
    Math.cos(userLocation.lat*Math.PI/180) *
    Math.sin(dLon/2)**2;

  const km = R * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  if(km > data.delivery.maxKm){
    return alert("Endereço fora da área de entrega");
  }

  deliveryFee = km <= data.delivery.freeKm
    ? 0
    : (km - data.delivery.freeKm) * data.delivery.priceKm;

  deliveryInfo.textContent = "Taxa de entrega: R$ " + deliveryFee.toFixed(2);
}

/* ================= WHATSAPP ================= */
function sendWhats(){
  if(!cart.length) return alert("Carrinho vazio");

  let subtotal = cart.reduce((s,i)=>s+i.price,0);
  const min = Number(data.storeInfo.minOrder)||0;

  if(subtotal < min){
    return alert("Pedido mínimo de R$ " + min.toFixed(2));
  }

  const total = subtotal + deliveryFee;

  let msg = `🛒 *Pedido Bella Massa*\n\n`;
  cart.forEach(i=>{
    msg += `• ${i.name} – R$ ${i.price.toFixed(2)}\n`;
  });

  msg += `\n🚚 Taxa: R$ ${deliveryFee.toFixed(2)}`;
  msg += `\n💰 Total: R$ ${total.toFixed(2)}\n\n`;
  msg += `📍 ${street.value}, ${number.value} – ${district.value}\n`;
  msg += `💳 Pagamento: ${payment.value}\n`;
  if(obs.value) msg += `📝 Obs: ${obs.value}`;

  window.open(`https://wa.me/${data.store.phone}?text=${encodeURIComponent(msg)}`);
}

/* ================= FECHAR MODAL ================= */
function closeModal(){
  modal.classList.add("hidden");
}