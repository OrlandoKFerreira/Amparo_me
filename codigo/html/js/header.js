document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("header-root");
  if (!root) return;

  // NÃO MEXI NO SEU FETCH
  const resp = await fetch("componentes/header.html");
  root.innerHTML = await resp.text();

  // Avatar
  const json =
    sessionStorage.getItem("usuarioLogado") ||
    localStorage.getItem("usuarioLogado");

  if (json) {
    const user = JSON.parse(json);
    const avatar = document.getElementById("header-avatar");

    if (avatar && user.foto) {
      avatar.src = user.foto;
    }
  }

  // AGORA os elementos existem → registra eventos
  const wrapper = document.getElementById("avatar-wrapper");
  const menu = document.getElementById("avatar-menu");
  const btnPerfil = document.getElementById("btn-perfil");
  const btnLogout = document.getElementById("btn-logout");

  if (wrapper && menu) {
    wrapper.addEventListener("click", (e) => {
      e.preventDefault(); // impede navegação do <a>
      e.stopPropagation(); // não fecha o menu imediatamente
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    });
  }

  // Fecha ao clicar fora
  document.addEventListener("click", () => {
    if (menu) menu.style.display = "none";
  });

  if (btnPerfil) {
    btnPerfil.addEventListener("click", (e) => {
      e.stopPropagation();
      window.location.href = "perfil.html";
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", (e) => {
      e.stopPropagation();
      sessionStorage.removeItem("usuarioLogado");
      localStorage.removeItem("usuarioLogado");
      window.location.href = "login.html";
    });
  }
});
