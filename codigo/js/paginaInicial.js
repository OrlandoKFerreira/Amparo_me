// /codigo/js/paginaInicial.js

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"
const PAGINA_FORM_POST = "criacaoDePost.html";

var comunidades = {};

document.addEventListener("DOMContentLoaded", () => {
  carregarListaTextos();
  carregarComunidades();

  if (typeof initAcoesPosts === "function") {
    initAcoesPosts();
  }
});

// carrega posts do JSON Server
async function carregarListaTextos() {
  const container = document.getElementById("lista-textos");
  if (!container) return;

  try {
    const resposta = await fetch(
      `${API_URL}/posts?_sort=createdAt&_order=desc`
    );
    if (!resposta.ok) throw new Error("Erro ao buscar posts");

    const posts = await resposta.json();

    if (!posts.length) {
      container.innerHTML = `
        <p class="sem-posts">
          Nenhum post publicado ainda.
        </p>
      `;
      return;
    }

    container.innerHTML = posts.map(montarCardPost).join("");
  } catch (erro) {
    console.error(erro);
    container.innerHTML = `
      <p class="erro-posts">
        Não foi possível carregar os posts.
      </p>
    `;
  }
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

    pesquisarComunidades('')
  } catch (erro) {
    console.error("Erro ao carregar comunidades:", erro);
    lista.innerHTML =
      '<li class="sem-comunidades">Não foi possível carregar as comunidades.</li>';
  }
}

function pesquisarComunidades(term) {
  const lista = document.getElementById("lista-comunidades");
  if (!lista) return;

  const normalizedTerm = term.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const filteredComs = comunidades.filter(com => com.name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(normalizedTerm));

  lista.innerHTML = filteredComs.map(montarItemComunidade).join("");
}

// monta item de comunidade na sidebar
function montarItemComunidade(comunidade) {
  return `
    <li class="item-comunidade" data-id="${comunidade.id}">
      <a href="paginaComunidade.html?id=${comunidade.id}">
        <div class="item-comunidade-avatar"></div>
        <span class="comunidade-nome">${comunidade.name}</span>
      </a>
    </li>
  `;
}

// monta card de post na área principal
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

