const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const navLinks = document.querySelectorAll(".main-nav a");

const orderForm = document.querySelector("#order-form");
const quickCut = document.querySelector("#quick-cut");
const quickWeight = document.querySelector("#quick-weight");
const addQuickItemButton = document.querySelector("#add-quick-item");
const cartItemsElement = document.querySelector("#cart-items");
const cartCountElement = document.querySelector("#cart-count");

const products = [...quickCut.options].map(o => o.textContent.trim()).filter(n => n !== 'Selecione um corte');
const cart = [];
try {
  const saved = JSON.parse(localStorage.getItem('carneboa-cart-v1') || '[]');
  if (Array.isArray(saved)) cart.push(...saved.filter(i => products.includes(i.cut) && Number.isFinite(i.weight) && i.weight >= 0.5).map(i => ({cut:i.cut,weight:i.weight,preparation:preparations(i.cut).includes(i.preparation)?i.preparation:'Sem preferência',note:typeof i.note==='string'?i.note.slice(0,300):''})));
} catch { /* Storage may be unavailable. */ }
function persistCart() { try { localStorage.setItem('carneboa-cart-v1', JSON.stringify(cart)); } catch { /* Keep the current order usable. */ } }
function escapeHtml(value) { return value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    mainNav.classList.toggle("is-open", !isOpen);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      mainNav.classList.remove("is-open");
    });
  });
}

function formatCartCount() {
  const totalItems = cart.length;
  const totalWeight = cart.reduce((sum,item) => sum + item.weight,0);
  cartCountElement.textContent = `${totalItems} ${totalItems === 1 ? "item" : "itens"} · ${totalWeight.toLocaleString('pt-BR')} kg`;
}

function renderCart() {
  persistCart();
  if (!cartItemsElement || !cartCountElement) {
    return;
  }

  formatCartCount();

  if (cart.length === 0) {
    cartItemsElement.innerHTML = '<p class="cart-empty">Seu carrinho esta vazio. Adicione cortes pela tabela ou pelo seletor acima.</p>';
    return;
  }

  cartItemsElement.innerHTML = cart
    .map(
      (item, index) => `
        <article class="cart-item" data-index="${index}">
          <div class="cart-item-top">
            <strong>${escapeHtml(item.cut)}</strong>
            <button type="button" data-remove-item="${index}">Remover</button>
          </div>
          <div class="cart-item-controls">
            <input
              type="number"
              min="0.5"
              step="0.5"
              value="${item.weight}"
              data-weight-input="${index}"
              aria-label="Peso em kg para ${item.cut}"
            />
            <button class="cart-stepper" type="button" data-step-down="${index}" aria-label="Diminuir peso">-</button>
            <button class="cart-stepper" type="button" data-step-up="${index}" aria-label="Aumentar peso">+</button>
          </div>
        </article>
      `
    )
    .join("");

  cartItemsElement.querySelectorAll('.cart-item').forEach((row,index) => {
    const label=document.createElement('label'); label.textContent='Preparo (confirmar com a loja)';
    const select=document.createElement('select'); select.setAttribute('aria-label',`Preparo de ${cart[index].cut}`);
    preparations(cart[index].cut).forEach(value=>{const option=document.createElement('option');option.textContent=value;select.append(option);});
    select.value=cart[index].preparation||'Sem preferência';select.addEventListener('change',()=>{cart[index].preparation=select.value;persistCart();});label.append(select);
    const note=document.createElement('input');note.placeholder='Observação deste corte';note.maxLength=300;note.value=cart[index].note||'';note.setAttribute('aria-label',`Observação de ${cart[index].cut}`);note.addEventListener('input',()=>{cart[index].note=note.value;persistCart();});
    row.append(label,note);
  });

  cartItemsElement.querySelectorAll("[data-remove-item]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-remove-item"));
      cart.splice(index, 1);
      renderCart();
    });
  });

  cartItemsElement.querySelectorAll("[data-weight-input]").forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.getAttribute("data-weight-input"));
      const value = Number(input.value);

      if (Number.isFinite(value) && value >= 0.5 && input.validity.valid) {
        cart[index].weight = value;
        persistCart();
        formatCartCount();
      }
    });
  });

  cartItemsElement.querySelectorAll("[data-step-up]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-step-up"));
      cart[index].weight = Number((cart[index].weight + 0.5).toFixed(1));
      renderCart();
    });
  });

  cartItemsElement.querySelectorAll("[data-step-down]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-step-down"));
      cart[index].weight = Math.max(0.5, Number((cart[index].weight - 0.5).toFixed(1)));
      renderCart();
    });
  });
}

function addItemToCart(cut, weight = 1) {
  const existingItem = cart.find((item) => item.cut === cut);

  if (existingItem) {
    existingItem.weight = Number((existingItem.weight + weight).toFixed(1));
  } else {
    cart.push({ cut, weight, preparation:'Sem preferência', note:'' });
  }

  renderCart();
}

if (addQuickItemButton && quickCut && quickWeight) {
  addQuickItemButton.addEventListener("click", () => {
    const cut = quickCut.value.trim();
    const weight = Number(quickWeight.value || "1");
    if (!Number.isFinite(weight) || weight < 0.5 || (quickWeight.value && !quickWeight.checkValidity())) { quickWeight.reportValidity(); return; }

    if (!cut) {
      quickCut.focus();
      return;
    }

    addItemToCart(cut, weight >= 0.5 ? weight : 1);
    quickCut.value = "";
    quickWeight.value = "";
  });
}

if (orderForm) {
  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      cartItemsElement.innerHTML = '<p class="cart-empty">Adicione pelo menos um corte antes de solicitar o orcamento.</p>';
      return;
    }

    const name = document.querySelector("#customer-name")?.value.trim();
    const address = document.querySelector("#customer-address")?.value.trim();
    const storePhone = document.querySelector("#order-store")?.value;
    const storeName = document.querySelector("#order-store")?.selectedOptions[0]?.textContent.trim();
    const notes = document.querySelector("#order-notes")?.value.trim();

    const items = cart.map((item) => `- ${item.cut}: ${item.weight} kg; preparo: ${item.preparation||'Sem preferência'}${item.note ? '; '+item.note : ''}`).join("\n");

    const message = [
      "Ola! Quero solicitar um orcamento no Frigorifico Carne Boa.",
      `Loja escolhida: ${storeName}`,
      `Nome: ${name}`,
      address ? `Endereco para consultar entrega: ${address}` : 'Retirada/entrega: combinar com a loja.',
      "Itens do carrinho:",
      items,
      notes ? `Observacoes: ${notes}` : null,
      "Favor informar os valores pelo WhatsApp desta loja.",
    ]
      .filter(Boolean)
      .join("\n");

    const dialog=document.querySelector('#order-review');
    dialog.querySelector('pre').textContent=message;
    dialog.querySelector('a').href=`https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
    dialog.showModal();
  });
}

renderCart();
const search = document.querySelector('#catalog-search');
const category = document.querySelector('#catalog-category');
function productCategory(name) {
  if (/figado|rabada/i.test(name)) return 'Miúdos';
  if (/linguica|toscana/i.test(name)) return 'Linguiças';
  if (/frango|\bcoxa\b|sobrecoxa|\basa\b|drumette|file de peito|peito com osso/i.test(name)) return 'Aves';
  return 'Bovinos';
}
function preparations(name){
  if(productCategory(name)!=='Bovinos'||/moida|costela|t-bone|chuleta/i.test(name)) return ['Sem preferência','Separar em porções'];
  return ['Sem preferência','Em bifes','Em cubos','Peça inteira','Separar em porções'];
}
function renderCatalog() {
  const list = document.querySelector('#catalog-items');
  const query = search.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const filtered = products.filter(name => name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query) && (category.value === 'Todos' || productCategory(name) === category.value));
  list.replaceChildren();
  for (const name of filtered) {
    const row = document.createElement('article');
    const title = document.createElement('strong'); title.textContent = name;
    const button = document.createElement('button'); button.type = 'button'; button.textContent = '+ 1 kg'; button.setAttribute('aria-label', `Adicionar 1 kg de ${name}`);
    const weight=document.createElement('input');weight.type='number';weight.min='0.5';weight.step='0.5';weight.value='1';weight.setAttribute('aria-label',`Quilos de ${name}`);
    button.textContent='Adicionar';
    button.addEventListener('click', () => { if(!weight.reportValidity()||!weight.value)return;addItemToCart(name,Number(weight.value)); document.querySelector('#catalog-feedback').textContent = `${name}: ${weight.value} kg adicionado ao carrinho.`; });
    const categoryLabel = document.createElement('small'); categoryLabel.textContent = productCategory(name) + ' · vendido por kg';
    const details = document.createElement('div'); details.append(categoryLabel,title);
    const externalPhotos = {
      'Asa de frango': {src:'assets/asas-commons.jpg',author:'ProjectManhattan',page:'https://commons.wikimedia.org/wiki/File:Raw_chicken_wings.jpg'},
      'File mignon': {src:'assets/file-mignon-commons.jpg',author:'Rangermike',page:'https://commons.wikimedia.org/wiki/File:Beef_tenderloin.jpg'}
    };
    const external = externalPhotos[name];
    const imagePath = external?.src || (name === 'Alcatra' ? 'assets/carne-alcatra-inteira.jpeg' : name === 'Contra file' ? 'assets/carne-contra-file.jpeg' : null);
    if (imagePath) { const photo = document.createElement('img'); photo.src=imagePath; photo.alt=name; photo.loading='lazy'; photo.width=360; photo.height=240; row.append(photo); row.classList.add('has-product-photo'); }
    if (external) {
      const credit = document.createElement('a'); credit.href=external.page; credit.target='_blank'; credit.rel='noopener noreferrer'; credit.textContent=`Foto ilustrativa · ${external.author} · CC BY-SA 3.0`; credit.className='photo-credit'; row.append(credit);
    }
    const controls=document.createElement('div');controls.className='product-controls';controls.append(weight,button);row.append(details,controls); list.append(row);
  }
  if (!filtered.length) list.textContent = 'Nenhum corte encontrado.';
}
search.addEventListener('input',renderCatalog); category.addEventListener('change',renderCatalog); renderCatalog();
