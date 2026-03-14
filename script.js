const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");
const navLinks = document.querySelectorAll(".main-nav a");
const orderForm = document.querySelector("#order-form");

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

if (orderForm) {
  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#customer-name")?.value.trim();
    const phone = document.querySelector("#customer-phone")?.value.trim();
    const storePhone = document.querySelector("#order-store")?.value;
    const storeName = document.querySelector("#order-store")?.selectedOptions[0]?.textContent.trim();
    const cut = document.querySelector("#order-cut")?.value.trim();
    const weight = document.querySelector("#order-weight")?.value.trim();
    const notes = document.querySelector("#order-notes")?.value.trim();

    const message = [
      "Ola! Quero fazer um pedido no Frigorifico Carne Boa.",
      `Loja escolhida: ${storeName}`,
      `Nome: ${name}`,
      `Telefone: ${phone}`,
      `Corte: ${cut}`,
      `Peso desejado: ${weight} kg`,
      notes ? `Observacoes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(`https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`, "_blank");
  });
}
