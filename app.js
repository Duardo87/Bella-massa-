let data, cart = [];

fetch('app.json')
  .then(r => r.json())
  .then(json => {
    data = json;
    init();
  });

function init() {
  document.getElementById('time').innerText = data.store.estimatedTime;
  renderStatus();
  renderPromo();
  renderMenu();
}

function renderStatus() {
  const now = new Date();
  const [oh, om] = data.store.openTime.split(':');
  const [ch, cm] = data.store.closeTime.split(':');

  const open = new Date();
  open.setHours(oh, om);
  const close = new Date();
  close.setHours(ch, cm);

  document.getElementById('status').innerText =
    now >= open && now <= close ? '🟢 Aberto' : '🔴 Fechado';
}

function renderPromo() {
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  document.getElementById('promo').innerText = data.promotions[day] || '';
}

function renderMenu() {
  const menu = document.getElementById('menu');
  data.pizzas.forEach(p => {
    menu.innerHTML += `
      <div class="card">
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <select onchange="addPizza('${p.name}', this.value)">
          <option value="">Escolha o tamanho</option>
          ${Object.keys(data.sizes).map(s =>
            `<option value="${s}">${s} - R$ ${data.sizes[s]}</option>`).join('')}
        </select>
      </div>
    `;
  });
}

function addPizza(name, size) {
  if (!size) return;
  cart.push({ name, size, price: data.sizes[size] });
  updateCart();
}

function updateCart() {
  const el = document.getElementById('cartItems');
  el.innerHTML = '';
  let total = 0;
  cart.forEach(i => {
    total += i.price;
    el.innerHTML += `<p>${i.name} (${i.size}) - R$ ${i.price}</p>`;
  });
  document.getElementById('total').innerText = total.toFixed(2);
}

function checkout() {
  let msg = `🍕 *Bella Massa*%0A`;
  cart.forEach(i => msg += `- ${i.name} (${i.size}) R$${i.price}%0A`);
  msg += `%0ATotal: R$ ${document.getElementById('total').innerText}`;
  window.open(`https://wa.me/${data.store.whatsapp}?text=${msg}`);
}