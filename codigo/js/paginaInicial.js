// /codigo/js/paginaInicial.js
const state = {
  page: 1,
  limit: 6,
  communityId: null,
  loading: false,
  end: false,
};

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app";
const PAGINA_FORM_POST = "criacaoDePost.html";

var comunidades = {};

document.addEventListener("DOMContentLoaded", () => {
  carregarFeed(true);
  carregarComunidades();
  carregarAvatarHeader();

  if (typeof initAcoesPosts === "function") {
    initAcoesPosts();
  }
});
function carregarAvatarHeader() {
  const json =
    sessionStorage.getItem("usuarioLogado") ||
    localStorage.getItem("usuarioLogado");

  if (!json) return;

  const user = JSON.parse(json);
  const img = document.getElementById("header-avatar");

  if (img && user.foto) {
    img.src = user.foto;
  }
}

// carrega posts do JSON Server
async function carregarFeed(reset = false) {
  if (state.loading || state.end) return;
  state.loading = true;

  const container = document.getElementById("feed-posts");
  if (!container) return;

  if (reset) {
    state.page = 1;
    state.end = false;
    container.innerHTML = "";
  }

  try {
    let url = `${API_URL}/posts?_sort=createdAt&_order=desc&_page=${state.page}&_limit=${state.limit}`;

    if (state.communityId) {
      url += `&comunidade=${state.communityId}`;
    }

    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Erro ao buscar feed");

    const posts = await resp.json();

    if (!posts.length) {
      state.end = true;
      return;
    }

    container.insertAdjacentHTML(
      "beforeend",
      posts.map(montarCardPost).join(""),
    );

    state.page++;
  } catch (e) {
    console.error(e);
  } finally {
    state.loading = false;
  }
}
function filtrarComunidade(id) {
  state.communityId = id;
  carregarFeed(true);
}

// carrega comunidades do JSON Server na sidebar
async function carregarComunidades() {
  const lista = document.getElementById("lista-comunidades");
  if (!lista) return;

  try {
    const resp = await fetch(`${API_URL}/communities`);
    if (!resp.ok) throw new Error("Erro ao buscar comunidades");

    comunidades = await resp.json();

    if (!comunidades.length) {
      lista.innerHTML =
        '<li class="sem-comunidades">Nenhuma comunidade cadastrada.</li>';
      return;
    }

    pesquisarComunidades("");
  } catch (erro) {
    console.error("Erro ao carregar comunidades:", erro);
    lista.innerHTML =
      '<li class="sem-comunidades">Não foi possível carregar as comunidades.</li>';
  }
}

function pesquisarComunidades(term) {
  const lista = document.getElementById("lista-comunidades");
  if (!lista) return;

  const normalizedTerm = term
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const filteredComs = comunidades.filter((com) =>
    com.name
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(normalizedTerm),
  );

  lista.innerHTML = filteredComs.map(montarItemComunidade).join("");
}

// monta item de comunidade na sidebar
function montarItemComunidade(comunidade) {
  return `
    <li class="item-comunidade" data-id="${comunidade.id}">
      <a href="#" onclick="filtrarComunidade(${comunidade.id}); return false;">

        <div class="item-comunidade-avatar"></div>
        <span class="comunidade-nome">${comunidade.name}</span>
      </a>
    </li>
  `;
}

// monta card de post na área principal
function montarCardPost(post) {
  const capa =
    (post.imageUrl || post.imagem || "").trim() ||
    "https://placehold.co/300x400";

  const titulo = post.title || "Post sem título";
  const textoBruto = (post.text || post.texto || post.content || "").trim();
  const resumo =
    textoBruto.length > 140 ? textoBruto.slice(0, 140) + "..." : textoBruto;

  const likes = post.likes ?? 0; // 👈 NOVO

  return `
    <article class="Card" data-id="${post.id}">
      <a href="paginaArtigo.html?id=${post.id}" class="card-link">
        <div class="media">
          <img src="${capa}" alt="${titulo}" />
        </div>
        <h3>${titulo}</h3>
        <p>${resumo || "Clique para ver o conteúdo."}</p>
        <div class="card-meta">
          <span class="card-likes">👍 ${likes}</span>
        </div>
      </a>
    </article>
  `;
}
window.addEventListener("scroll", () => {
  const nearBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

  if (nearBottom) {
    carregarFeed();
  }
});
