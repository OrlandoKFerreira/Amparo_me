const API_URL = window.API_URL;

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("header-root");
  if (!root) return;

  const resp = await fetch("/componentes/header.html");
  root.innerHTML = await resp.text();

  const json =
    sessionStorage.getItem("usuarioLogado") ||
    localStorage.getItem("usuarioLogado");

  if (!json) return;

  const user = JSON.parse(json);
  const avatar = document.getElementById("header-avatar");

  if (avatar && user.foto) {
    avatar.src = user.foto;
  }
});
