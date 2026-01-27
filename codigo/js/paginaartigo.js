// /codigo/js/paginaArtigo.js

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"

const FORM_PAGE = "criacaoDePost.html";
const HOME_PAGE = "PaginaInicial.html";

const tituloEl = document.getElementById("artigo-titulo");
const metaEl = document.getElementById("artigo-meta");
const imagemEl = document.getElementById("artigo-imagem");
const corpoEl = document.getElementById("artigo-corpo");

// elementos de like / dislike
const likeBtn = document.getElementById("btn-like");
const dislikeBtn = document.getElementById("btn-dislike");
const likesCountEl = document.getElementById("likes-count");
const dislikesCountEl = document.getElementById("dislikes-count");
const reacoesTextoEl = document.getElementById("artigo-reacoes-texto");

let postAtual = null; // vamos guardar o post carregado aqui

const sugestoesEl =
  document.getElementById("sugestoes-container") ||
  document.querySelector(".grade-sugestoes");

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

async function getCommunityName(id) {
  const res = await fetch(API_URL+`/communities/${id}`);
  const community = await res.json();
  return community.name;
}
function atualizarTextoReacoes() {
  if (!reacoesTextoEl || !postAtual) return;

  const likes = Number(postAtual.likes ?? 0);
  const dislikes = Number(postAtual.dislikes ?? 0);

  reacoesTextoEl.textContent = `👍 ${likes} curtida${
    likes === 1 ? "" : "s"
  } • 👎 ${dislikes} não curtida${dislikes === 1 ? "" : "s"}`;
}

// ----------- REAÇÕES (LIKE / DISLIKE) -----------

async function atualizarReacao(tipo) {
  // tipo será "likes" ou "dislikes"
  if (!postAtual) return;

  const valorAtual = Number(postAtual[tipo] ?? 0);
  const novoValor = valorAtual + 1;

  try {
    const resp = await fetch(`${API_URL}/posts/${postAtual.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ [tipo]: novoValor }),
    });

    if (!resp.ok) {
      alert("Erro ao salvar sua reação. Tente novamente.");
      return;
    }

    // Atualiza o objeto em memória
    postAtual[tipo] = novoValor;

    // Atualiza a tela
    if (tipo === "likes" && likesCountEl) {
      likesCountEl.textContent = novoValor;
    } else if (tipo === "dislikes" && dislikesCountEl) {
      dislikesCountEl.textContent = novoValor;
    }
  } catch (erro) {
    console.error("Erro ao atualizar reação:", erro);
    alert("Erro de conexão ao salvar sua reação.");
  }
}
    atualizarTextoReacoes();

// ----------- INICIALIZAÇÃO DA PÁGINA -----------

document.addEventListener("DOMContentLoaded", () => {
  const id = getQueryParam("id");

  if (!id) {
    if (tituloEl) tituloEl.textContent = "Artigo não encontrado";
    if (metaEl) metaEl.textContent = "Nenhum ID foi informado na URL.";
    if (corpoEl) corpoEl.textContent = "";
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
      const ok = confirm("Tem certeza que deseja excluir este post?");
      if (!ok) return;

      try {
        const resp = await fetch(`${API_URL}/posts/${id}`, {
          method: "DELETE",
        });

        if (!resp.ok) {
          throw new Error("Erro ao excluir post");
        }

        alert("Post excluído com sucesso.");
        window.location.href = HOME_PAGE;
      } catch (erro) {
        console.error("Erro ao excluir post:", erro);
        alert("Não foi possível excluir o post. Tente novamente.");
      }
    });
  }

  // listeners de like / dislike
  if (likeBtn) {
    likeBtn.addEventListener("click", () => atualizarReacao("likes"));
  }

  if (dislikeBtn) {
    dislikeBtn.addEventListener("click", () => atualizarReacao("dislikes"));
  }
});

// ----------- CARREGAR POST -----------

async function carregarPost(id) {
  try {
    const resposta = await fetch(`${API_URL}/posts/${id}`);

    if (!resposta.ok) {
      if (resposta.status === 404) {
        throw new Error("Artigo não encontrado.");
      }
      throw new Error("Erro ao buscar o artigo.");
    }

    const post = await resposta.json();
    console.log("POST CARREGADO:", post);

    // guarda o post atual para o sistema de like/dislike
    postAtual = post;

    // inicializa contadores na tela
    if (likesCountEl) likesCountEl.textContent = post.likes ?? 0;
    if (dislikesCountEl) dislikesCountEl.textContent = post.dislikes ?? 0;
    atualizarTextoReacoes();

    renderizarPost(post);
    carregarSugestoes(post);
  } catch (erro) {
    console.error(erro);
    if (tituloEl) tituloEl.textContent = "Ocorreu um erro";
    if (metaEl)
      metaEl.textContent =
        erro.message || "Não foi possível carregar o artigo.";
    if (corpoEl) corpoEl.textContent = "";
  }
}

// ----------- RENDERIZAR POST -----------

async function renderizarPost(post) {
  if (tituloEl) {
    tituloEl.textContent = post.title || "Artigo sem título";
  }

  const comunidade = (await getCommunityName(post.comunidade)) || "";
  const categoria = post.categoria || "";
  const data = post.createdAt
    ? new Date(post.createdAt).toLocaleString("pt-BR")
    : "";

  const partesMeta = [];
  if (comunidade) partesMeta.push(comunidade);
  if (categoria) partesMeta.push(categoria);
  if (data) partesMeta.push(data);

  if (metaEl) {
    metaEl.textContent = partesMeta.join(" • ");
  }

  const capa = (post.imageUrl || post.imagem || "").trim();

  if (imagemEl) {
    if (capa) {
      imagemEl.src = capa;
    } else {
      imagemEl.src = "/codigo/img/img2.png";
    }
  }

  if (!corpoEl) return;
  corpoEl.innerHTML = "";

  const texto = (post.text || post.texto || post.content || "").trim();
  if (texto) {
    const p = document.createElement("p");
    p.textContent = texto;
    corpoEl.appendChild(p);
  }

  const linkDireto = (post.link || "").trim();
  const linkLegacy =
    !linkDireto &&
    post.contentType === "link" &&
    typeof post.content === "string"
      ? post.content.trim()
      : "";

  const linkFinal = linkDireto || linkLegacy;

  if (linkFinal) {
    const p = document.createElement("p");
    p.textContent = "Acesse também:";

    const a = document.createElement("a");
    a.href = linkFinal;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = linkFinal;

    corpoEl.appendChild(p);
    corpoEl.appendChild(a);
  }

  if (!texto && !linkFinal) {
    const p = document.createElement("p");
    p.textContent = "Este artigo ainda não possui conteúdo cadastrado.";
    corpoEl.appendChild(p);
  }
}

// ----------- SUGESTÕES -----------

async function carregarSugestoes(postAtual) {
  if (!sugestoesEl) return;

  try {
    const resp = await fetch(`${API_URL}/posts`);
    if (!resp.ok) throw new Error("Erro ao buscar sugestões");

    const todosPosts = await resp.json();

    let sugeridos = todosPosts.filter((p) => p.id !== postAtual.id);
    sugeridos = sugeridos.slice(0, 4);

    if (!sugeridos.length) {
      sugestoesEl.innerHTML =
        '<p class="sem-sugestoes">Ainda não há outros conteúdos sugeridos.</p>';
      return;
    }

    const html = sugeridos
      .map((post) => {
        const img =
          (post.imageUrl && post.imageUrl.trim()) ||
          (post.imagem && post.imagem.trim()) ||
          "https://placehold.co/300x200";

        const titulo = post.title || "Post sem título";
        const categoria = post.category || post.categoria || "";

        return `
          <a href="paginaArtigo.html?id=${post.id}" class="cartao-link">
            <article class="cartao">
              <img src="${img}" alt="${titulo}">
              <h3>${titulo}</h3>
              <p>${categoria}</p>
            </article>
          </a>
        `;
      })
      .join("");

    sugestoesEl.innerHTML = html;
  } catch (erro) {
    console.error("Erro ao carregar sugestões:", erro);
    sugestoesEl.innerHTML =
      '<p class="sem-sugestoes">Não foi possível carregar conteúdos sugeridos.</p>';
  }
}
