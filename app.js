/* =====================================================
   APP.JS FINAL DEFINITIVO – DELIVERY
   Status: PRODUÇÃO | 100% FECHADO
===================================================== */

let data = {};
let cart = [];
let currentProduct = null;
let selectedSize = null;
let basePrice = 0;
let deliveryFee = 0;
let storeOpen = true;
let userLocation = null;

const $ = id => document.getElementById(id);

/* ================= LOAD ================= */
async function loadData(){
  const r = await fetch("app.json?" + Date.now());
  return r.json();
}

document.addEventListener("DOMContentLoaded", async () => {
  data = await loadData();

  data.store ||= {};
  data.storeInfo ||= { deliveryTime:"", address:"", minOrder:0 };
  data.delivery ||= {};
  data.categories ||= [];
  data.products ||= [];
  data.extras ||= [];
  data.borders ||= [];

  storeName.textContent = data.store.name || "Delivery";
  storePhone.href = "https://wa.me/" + (data.store.phone || "");
  storeDeliveryTime.textContent = data.storeInfo.deliveryTime || "";
  storeAddress.textContent = data.storeInfo.address || "";
  storeMinOrder.textContent =
    "R$ " + Number(data.storeInfo.minOrder || 0).toFixed(2);

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

  storeOpen = now >= open && now <= close;

  if(!storeOpen){
    document.body.insertAdjacentHTML(
      "afterbegin",
      `<div class="store-closed">🚫 Loja fechada no momento</div>`
    );
  }
}

/* ================= CATEGORIAS ================= */
function renderCategories(){
  categories.innerHTML = "";

  const activeCats = data.categories
    .filter(c => c.active)
    .sort((a,b)=>a.order-b.order);

  activeCats.forEach(c=>{
    categories.innerHTML +=
      `<button onclick="renderProducts(${c.id})">${c.name}</button>`;
  });

  if(activeCats.length){
    renderProducts(activeCats[0].id);
  }
}

/* ================= PRODUTOS ================= */
function renderProducts(catId){
  products.innerHTML = "";

  data.products
    .filter(p => p.active && p.categoryId === catId)
    .sort((a,b)=>a.order-b.order)
    .forEach(p=>{
      const prices = Object.values(p.prices||{}).filter(v=>v);
      const minPrice = prices.length ? Math.min(...prices) : 0;

      products.innerHTML += `
        <div class="product-card">
          ${p.image ? `<img src="${p.image}">` : ""}
          <h3>${p.name}</h3>
          <p>${p.desc || ""}</p>
          <strong>A partir de R$ ${minPrice.toFixed(2)}</strong>
          <button onclick="openModal(${p.id})">Adicionar</button>
        </div>`;
    });
}

/* ================= MODAL ================= */
function openModal(id){
  if(!storeOpen){
    alert("A loja está fechada no momento");
    return;
  }

  currentProduct = data.products.find(p=>p.id===id);
  selectedSize = null;
  basePrice = 0;

  modalTitle.textContent = currentProduct.name;
  sizeOptions.innerHTML = "";
  borderOptions.innerHTML = "";
  extraOptions.innerHTML = "";

  sizeOptions.innerHTML += "<h4>Tamanho</h4>";
  ["P","M","G"].forEach(k=>{
    if(currentProduct.prices[k]){
      sizeOptions.innerHTML += `
        <label class="option">
          <input type="radio" name="size" onchange="selectSize('${k}')">
          ${k==="P"?"Pequena":k==="M"?"Média":"Grande"} –
          R$ ${currentProduct.prices[k].toFixed(2)}
        </label>`;
    }
  });

  sizeOptions.innerHTML += `
    <h4>Sabores (até ${currentProduct.maxFlavors || 1})</h4>
    <div class="half-alert">
      Meio a meio será cobrado pelo maior valor
    </div>`;

  data.products
    .filter(p=>p.categoryId===currentProduct.categoryId && p.active)
    .forEach(p=>{
      sizeOptions.innerHTML += `
        <label class="option">
          <input type="checkbox" class="flavorCheck"
            data-p="${p.prices.P||0}"
            data-m="${p.prices.M||0}"
            data-g="${p.prices.G||0}">
          ${p.name}
        </label>`;
    });

  borderOptions.innerHTML = "<h4>Borda (opcional)</h4>";
  data.borders.filter(b=>b.active).forEach(b=>{
    borderOptions.innerHTML += `
      <label class="option">
        <input type="radio" name="border" data-price="${b.price}">
        ${b.name} (+ R$ ${Number(b.price).toFixed(2)})
      </label>`;
  });

  extraOptions.innerHTML = "<h4>Adicionais (opcional)</h4>";
  data.extras.filter(e=>e.active).forEach(e=>{
    extraOptions.innerHTML += `
      <label class="option">
        <input type="checkbox" class="extraCheck" data-price="${e.price}">
        ${e.name} (+ R$ ${Number(e.price).toFixed(2)})
      </label>`;
  });

  modal.onchange = updateLiveTotal;
  updateLiveTotal();
  modal.classList.remove("hidden");
}

/* ================= TAMANHO ================= */
function selectSize(k){
  selectedSize = k;
  basePrice = currentProduct.prices[k];
  updateLiveTotal();
}

/* ================= TOTAL ================= */
function updateLiveTotal(){
  let total = basePrice || 0;

  if(selectedSize){
    document.querySelectorAll(".flavorCheck:checked").forEach(f=>{
      total = Math.max(
        total,
        Number(f.dataset[selectedSize.toLowerCase()])
      );
    });
  }

  document
    .querySelectorAll("input[name=border]:checked")
    .forEach(b=> total += Number(b.dataset.price));

  document
    .querySelectorAll(".extraCheck:checked")
    .forEach(e=> total += Number(e.dataset.price));

  $("liveTotal").textContent = total.toFixed(2);
}

/* ================= CONFIRMAR ================= */
function confirmProduct(){
  if(!selectedSize){
    alert("Escolha o tamanho");
    return;
  }

  const price = Number($("liveTotal").textContent);

  cart.push({
    name: `${currentProduct.name} (${selectedSize})`,
    price
  });

  renderCart();
  closeModal();
}

/* ================= CARRINHO ================= */
function renderCart(){
  cartItems.innerHTML = "";
  let subtotal = 0;

  cart.forEach(i=>{
    subtotal += i.price;
    cartItems.innerHTML += `
      <div class="cart-item">
        ${i.name}
        <span>R$ ${i.price.toFixed(2)}</span>
      </div>`;
  });

  cartTotal.textContent =
    `Subtotal: R$ ${subtotal.toFixed(2)} | ` +
    `Entrega: R$ ${deliveryFee.toFixed(2)} | ` +
    `Total: R$ ${(subtotal + deliveryFee).toFixed(2)}`;
}

/* ================= LOCALIZAÇÃO ================= */
function useMyLocation(){
  if(!navigator.geolocation){
    alert("Geolocalização não suportada");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos=>{
    userLocation = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude
    };
    calculateDelivery();
  });
}

/* ================= ENTREGA ================= */
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

  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  if(km > data.delivery.maxKm){
    alert("Endereço fora da área de entrega");
    deliveryFee = 0;
    return;
  }

  deliveryFee =
    km <= data.delivery.freeKm
      ? 0
      : (km - data.delivery.freeKm) * data.delivery.priceKm;

  deliveryInfo.textContent =
    "Taxa de entrega: R$ " + deliveryFee.toFixed(2);

  renderCart();
}

/* ================= WHATSAPP ================= */
function sendWhats(){
  if(!cart.length){
    alert("Carrinho vazio");
    return;
  }

  const subtotal = cart.reduce((s,i)=>s+i.price,0);
  const min = Number(data.storeInfo.minOrder || 0);

  if(subtotal < min){
    alert("Pedido mínimo de R$ " + min.toFixed(2));
    return;
  }

  const total = subtotal + deliveryFee;

  let msg = `🛒 *Pedido Bella Massa*\n\n`;
  cart.forEach(i=>{
    msg += `• ${i.name} – R$ ${i.price.toFixed(2)}\n`;
  });

  msg += `\n🚚 Entrega: R$ ${deliveryFee.toFixed(2)}`;
  msg += `\n💰 Total: R$ ${total.toFixed(2)}`;

  msg += `\n\n📍 Endereço: ${street.value}, ${number.value} – ${district.value}`;
  msg += `\n💳 Pagamento: ${payment.value || "Não informado"}`;
  if(obs.value) msg += `\n📝 Obs: ${obs.value}`;

  window.open(
    `https://wa.me/${data.store.phone}?text=${encodeURIComponent(msg)}`
  );
}

/* ================= FECHAR ================= */
function closeModal(){
  modal.classList.add("hidden");
}