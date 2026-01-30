// =========================
// API CONFIG
// =========================
const API_URL = window.API_URL;

// =========================
// SESSION
// =========================
const usuarioLogadoJSON =
  sessionStorage.getItem("usuarioLogado") ||
  localStorage.getItem("usuarioLogado");

let usuarioLogado = null;

try {
  if (usuarioLogadoJSON) {
    usuarioLogado = JSON.parse(usuarioLogadoJSON);
  }
} catch (e) {
  console.error("Erro ao ler usuarioLogado:", e);
}

// Redireciona se não estiver logado
if (!usuarioLogado || !usuarioLogado.id) {
  alert("Você precisa estar logado para ver o perfil.");
  window.location.href = "login.html";
}

// =========================
// ELEMENTOS
// =========================
const avatarEl = document.getElementById("user-avatar");
const nomeEl = document.getElementById("user-name");
const bioEl = document.getElementById("user-bio");
const linksEl = document.getElementById("user-links");
const gridConteudosEl = document.getElementById("conteudos-grid");
const conteudosEmptyEl = document.getElementById("conteudos-empty");
const btnEditarPerfil = document.getElementById("btn-editar-perfil");

// =========================
// PERFIL
// =========================
function preencherPerfil(usuario) {
  nomeEl.textContent = usuario.nome || usuario.username || "Usuário";

  // FOTO (Cloudinary)
  if (usuario.foto) {
    avatarEl.src = usuario.foto;
  } else {
    avatarEl.src =
      "https://res.cloudinary.com/dhgbvydnm/image/upload/v1/amparo/default-avatar.png";
  }

  bioEl.textContent =
    usuario.bio ||
    "Você ainda não preencheu sua descrição. Edite seu perfil para adicionar algo sobre você.";

  preencherLinks(usuario);
}

// =========================
// LINKS
// =========================
function preencherLinks(usuario) {
  linksEl.innerHTML = "";

  const links = [];

  if (usuario.site) {
    links.push({ href: usuario.site, label: "Site" });
  }
  if (usuario.linkedin) {
    links.push({ href: usuario.linkedin, label: "LinkedIn" });
  }
  if (usuario.instagram) {
    links.push({ href: usuario.instagram, label: "Instagram" });
  }

  if (!links.length) {
    if (usuario.email) {
      links.push({
        href: `mailto:${usuario.email}`,
        label: usuario.email,
      });
    }
    if (usuario.telefone) {
      links.push({
        href: `tel:${usuario.telefone}`,
        label: usuario.telefone,
      });
    }
  }

  if (!links.length) {
    const li = document.createElement("li");
    li.textContent = "Nenhum contato cadastrado.";
    linksEl.appendChild(li);
    return;
  }

  links.forEach((link) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.label;
    li.appendChild(a);
    linksEl.appendChild(li);
  });
}

// =========================
// FETCH USER
// =========================
async function carregarUsuarioDoServidor() {
  try {
    const resp = await fetch(`${API_URL}/usuarios/${usuarioLogado.id}`);
    if (!resp.ok) throw new Error("Erro ao buscar usuário");

    const usuarioServidor = await resp.json();
    preencherPerfil(usuarioServidor);
  } catch (error) {
    console.error(error);
    preencherPerfil(usuarioLogado);
  }
}

// =========================
// EDITAR PERFIL
// =========================
btnEditarPerfil.addEventListener("click", () => {
  window.location.href = `cadastro.html?id=${usuarioLogado.id}`;
});

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  carregarUsuarioDoServidor();
});
