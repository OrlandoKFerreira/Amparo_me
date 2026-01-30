// /codigo/js/paginaArtigo.js

const API_URL = window.API_URL;

const FORM_PAGE = "criacaoDePost.html";
const HOME_PAGE = "PaginaInicial.html";

// ELEMENTOS
const tituloEl = document.getElementById("artigo-titulo");
const metaEl = document.getElementById("artigo-meta");
const imagemEl = document.getElementById("artigo-imagem");
const corpoEl = document.getElementById("artigo-corpo");

const likeBtn = document.getElementById("btn-like");
const dislikeBtn = document.getElementById("btn-dislike");
const likesCountEl = document.getElementById("likes-count");
const dislikesCountEl = document.getElementById("dislikes-count");
const reacoesTextoEl = document.getElementById("artigo-reacoes-texto");

const sugestoesEl = document.getElementById("sugestoes-container");

let postAtual = null;

// =========================
// HELPERS
// =========================
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function getCommunityName(id) {
  if (!id) return "";
  try {
    const res = await fetch(`${API_URL}/communities/${id}`);
    if (!res.ok) return "";
    const community = await res.json();
    return community.name || "";
  } catch {
    return "";
  }
}
function getUsuarioLogado() {
  return (
    JSON.parse(sessionStorage.getItem("usuarioLogado")) ||
    JSON.parse(localStorage.getItem("usuarioLogado"))
  );
}
function jaReagiu(postId, tipo) {
  const user = getUsuarioLogado();
  if (!user) return false;

  const key = `reacao_${user.id}_${postId}_${tipo}`;
  return localStorage.getItem(key) === "1";
}

function marcarReagiu(postId, tipo) {
  const user = getUsuarioLogado();
  if (!user) return;

  const key = `reacao_${user.id}_${postId}_${tipo}`;
  localStorage.setItem(key, "1");
}

function atualizarTextoReacoes() {
  if (!reacoesTextoEl || !postAtual) return;

  const likes = Number(postAtual.likes ?? 0);
  const dislikes = Number(postAtual.dislikes ?? 0);

  reacoesTextoEl.textContent = `👍 ${likes} curtida${
    likes === 1 ? "" : "s"
  } • 👎 ${dislikes} não curtida${dislikes === 1 ? "" : "s"}`;
}
// =========================
// REAÇÕES
// =========================
async function atualizarReacao(tipo) {
  if (!postAtual) return;

  if (jaReagiu(postAtual.id, tipo)) {
    alert("Você já reagiu a este post.");
    return;
  }

  const novoValor = Number(postAtual[tipo] ?? 0) + 1;

  try {
    const resp = await fetch(`${API_URL}/posts/${postAtual.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [tipo]: novoValor }),
    });

    if (!resp.ok) return alert("Erro ao salvar sua reação.");

    postAtual[tipo] = novoValor;
    marcarReagiu(postAtual.id, tipo);

    if (tipo === "likes" && likesCountEl) likesCountEl.textContent = novoValor;
    if (tipo === "dislikes" && dislikesCountEl)
      dislikesCountEl.textContent = novoValor;

    atualizarTextoReacoes();
  } catch {
    alert("Erro de conexão ao salvar sua reação.");
  }
}

// =========================
// CARREGAR POST
// =========================
async function carregarPost(id) {
  try {
    const resposta = await fetch(`${API_URL}/posts/${id}`);
    if (!resposta.ok) throw new Error("Post não encontrado");

    const post = await resposta.json();
    postAtual = post;
    const user = getUsuarioLogado();
    const btnEditar = document.getElementById("btn-editar-artigo");
    const btnExcluir = document.getElementById("btn-excluir-artigo");

    const isDono = user && post.user_id == user.id;
    const isMod = user && (user.role === "moderador" || user.role === "admin");

    if (!isDono && !isMod) {
      if (btnEditar) btnEditar.style.display = "none";
      if (btnExcluir) btnExcluir.style.display = "none";
    }

    if (likesCountEl) likesCountEl.textContent = post.likes ?? 0;
    if (dislikesCountEl) dislikesCountEl.textContent = post.dislikes ?? 0;

    atualizarTextoReacoes();
    await renderizarPost(post);
    carregarSugestoes(post);
  } catch (erro) {
    if (tituloEl) tituloEl.textContent = "Erro ao carregar post";
    if (metaEl) metaEl.textContent = erro.message;
    if (corpoEl) corpoEl.textContent = "";
  }
}

// =========================
// RENDER
// =========================
async function renderizarPost(post) {
  if (tituloEl) {
    tituloEl.textContent = post.title || "Post sem título";
  }

  const comunidade = await getCommunityName(post.comunidade);
  const categoria = post.categoria || "";
  const data = post.createdAt
    ? new Date(post.createdAt).toLocaleString("pt-BR")
    : "";

  const partes = [comunidade, categoria, data].filter(Boolean);
  if (metaEl) metaEl.textContent = partes.join(" • ");

  const capa = (post.imageUrl || post.imagem || "").trim();
  if (imagemEl) {
    imagemEl.src = capa || "/codigo/img/img2.png";
  }

  if (!corpoEl) return;
  corpoEl.innerHTML = "";

  const texto = (post.text || post.texto || "").trim();
  const link = (post.link || "").trim();

  if (texto) {
    const p = document.createElement("p");
    p.textContent = texto;
    corpoEl.appendChild(p);
  }

  if (link) {
    const p = document.createElement("p");
    p.textContent = "Acesse também:";
    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link;

    corpoEl.appendChild(p);
    corpoEl.appendChild(a);
  }

  if (!texto && !link) {
    const p = document.createElement("p");
    p.textContent = "Este post ainda não possui conteúdo.";
    corpoEl.appendChild(p);
  }
}

// =========================
// SUGESTÕES
// =========================
async function carregarSugestoes(postAtual) {
  if (!sugestoesEl) return;

  try {
    const resp = await fetch(`${API_URL}/posts`);
    if (!resp.ok) throw new Error();

    const todos = await resp.json();

    const sugeridos = todos.filter((p) => p.id !== postAtual.id).slice(0, 4);

    if (!sugeridos.length) {
      sugestoesEl.innerHTML =
        '<p class="sem-sugestoes">Sem sugestões no momento.</p>';
      return;
    }

    sugestoesEl.innerHTML = sugeridos
      .map((post) => {
        const img =
          (post.imageUrl && post.imageUrl.trim()) ||
          (post.imagem && post.imagem.trim()) ||
          "https://placehold.co/300x200";

        const titulo = post.title || "Post";

        return `
          <a href="paginaArtigo.html?id=${post.id}" class="cartao-link">
            <article class="cartao">
              <img src="${img}" alt="${titulo}">
              <h3>${titulo}</h3>
              <p>${post.categoria || ""}</p>
            </article>
          </a>
        `;
      })
      .join("");
  } catch {
    sugestoesEl.innerHTML =
      '<p class="sem-sugestoes">Erro ao carregar sugestões.</p>';
  }
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const id = getQueryParam("id");

  if (!id) {
    if (tituloEl) tituloEl.textContent = "Post não encontrado";
    if (metaEl) metaEl.textContent = "ID não informado.";
    return;
  }

  carregarPost(id);

  const btnEditar = document.getElementById("btn-editar-artigo");
  if (btnEditar) {
    btnEditar.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = `${FORM_PAGE}?id=${id}`;
    });
  }

  const btnExcluir = document.getElementById("btn-excluir-artigo");
  if (btnExcluir) {
    btnExcluir.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!confirm("Deseja realmente excluir este post?")) return;

      try {
        const resp = await fetch(`${API_URL}/posts/${id}`, {
          method: "DELETE",
        });

        if (!resp.ok) throw new Error();
        window.location.href = HOME_PAGE;
      } catch {
        alert("Erro ao excluir o post.");
      }
    });
  }

  if (likeBtn)
    likeBtn.addEventListener("click", () => atualizarReacao("likes"));
  if (dislikeBtn)
    dislikeBtn.addEventListener("click", () => atualizarReacao("dislikes"));
});
