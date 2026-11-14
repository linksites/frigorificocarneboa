const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const navLinks = document.querySelectorAll(".main-nav a");

const orderForm = document.querySelector("#order-form");
const quickCut = document.querySelector("#quick-cut");
const quickWeight = document.querySelector("#quick-weight");
const addQuickItemButton = document.querySelector("#add-quick-item");
const cartItemsElement = document.querySelector("#cart-items");
const cartCountElement = document.querySelector("#cart-count");

const cart = [];

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
  cartCountElement.textContent = `${totalItems} ${totalItems === 1 ? "item" : "itens"}`;
}

function renderCart() {
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
            <strong>${item.cut}</strong>
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

      if (!Number.isNaN(value) && value >= 0.5) {
        cart[index].weight = value;
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
    cart.push({ cut, weight });
  }

  renderCart();
}

if (addQuickItemButton && quickCut && quickWeight) {
  addQuickItemButton.addEventListener("click", () => {
    const cut = quickCut.value.trim();
    const weight = Number(quickWeight.value || "1");

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

    const items = cart.map((item) => `- ${item.cut}: ${item.weight} kg`).join("\n");

    const message = [
      "Ola! Quero solicitar um orcamento no Frigorifico Carne Boa.",
      `Loja escolhida: ${storeName}`,
      `Nome: ${name}`,
      `Endereco: ${address}`,
      "Itens do carrinho:",
      items,
      notes ? `Observacoes: ${notes}` : null,
      "Favor informar os valores pelo WhatsApp desta loja.",
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`, "_blank");
  });
}

renderCart();
