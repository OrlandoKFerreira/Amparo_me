// /codigo/js/criarPost.js

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"
const HOME_PAGE = "PaginaInicial.html"; // página inicial
const ARTICLE_PAGE = "paginaArtigo.html"; // página do artigo
const FORM_PAGE = "criacaoDePost.html"; // esta mesma página
const USER_ID = JSON.parse(sessionStorage.getItem("usuarioLogado")).id; //usuario logado

// vamos guardar o post atual quando estiver em modo edição
let postAtual = null;

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// ---- Abas (Texto / Imagem / Link) ----
function setActiveTab(tabName) {
  const tabs = document.querySelectorAll(".cp-aba");
  const panels = document.querySelectorAll(".cp-panel");

  tabs.forEach((tab) => {
    const ativo = tab.dataset.tab === tabName;
    tab.setAttribute("aria-selected", ativo ? "true" : "false");
  });

  panels.forEach((panel) => {
    const ativo = panel.dataset.panel === tabName;
    panel.classList.toggle("cp-hidden", !ativo);
  });
}

function initTabs() {
  const tabs = document.querySelectorAll(".cp-aba");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab.dataset.tab);
    });
  });

  // padrão: texto
  setActiveTab("texto");
}

// ---- Preview da imagem ----
function initImagePreview() {
  const input = document.getElementById("cp-imagem");
  const preview = document.getElementById("cp-preview");
  if (!input || !preview) return;

  input.addEventListener("input", () => {
    const url = input.value.trim();
    preview.innerHTML = "";

    if (!url) return;

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Pré-visualização da imagem";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";

    preview.appendChild(img);
  });
}

// ---- Carregar comunidades no <select> a partir de /communities ----
async function carregarComunidadesSelect(valorSelecionado) {
  const select = document.getElementById("comunidade");
  if (!select) return;

  // mantém o placeholder
  select.innerHTML = '<option value="">Escolha a comunidade</option>';

  try {
    const resp = await fetch(`${API_URL}/communities`);
    if (!resp.ok) throw new Error("Erro ao carregar comunidades");

    const comunidades = await resp.json();

    comunidades.forEach((c) => {
      const opt = document.createElement("option");
      //nota: melhor usar o id como value p/ evitar conflito de comunidades com mesmo nome 
      opt.value = c.id; 
      opt.textContent = c.name; // ex: "Ansiedade Social"
      select.appendChild(opt);
    });

    // se estiver em edição e vier um nome salvo no post, seleciona
    if (valorSelecionado) {
      select.value = valorSelecionado;
    }
  } catch (erro) {
    console.error("Erro ao carregar comunidades:", erro);
  }
}

// ---- Carregar dados para edição ----
async function carregarPostParaEdicao(id) {
  const resp = await fetch(`${API_URL}/posts/${id}`);
  if (!resp.ok) throw new Error("Post não encontrado");

  const post = await resp.json();
  postAtual = post; // guarda pra usar depois no salvar

  const comunidadeEl = document.getElementById("comunidade");
  const tituloEl = document.getElementById("titulo");
  const categoriaEl = document.getElementById("categoria");
  const textoEl = document.getElementById("cp-texto");
  const imagemEl = document.getElementById("cp-imagem");
  const linkEl = document.getElementById("cp-url");
  const preview = document.getElementById("cp-preview");
  const botao = document.getElementById("cp-publicar");

  // aqui só preenchemos os campos simples;
  // o select de comunidade será efetivamente selecionado
  // pela função carregarComunidadesSelect(post.comunidade)
  if (comunidadeEl) comunidadeEl.value = post.comunidade || 0;
  if (tituloEl) tituloEl.value = post.title || post.titulo || "";
  if (categoriaEl) categoriaEl.value = post.categoria || "";
  if (textoEl) textoEl.value = post.text || post.texto || "";
  if (imagemEl) imagemEl.value = post.imageUrl || post.imagem || "";
  if (linkEl) linkEl.value = post.link || "";

  // define aba baseada nos dados salvos
  const tipo =
    post.tipo ||
    (post.imageUrl || post.imagem ? "imagem" : post.link ? "link" : "texto");
  setActiveTab(tipo);

  if (preview && (post.imageUrl || post.imagem)) {
    preview.innerHTML = "";
    const img = document.createElement("img");
    img.src = post.imageUrl || post.imagem;
    img.alt = "Pré-visualização da imagem";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    preview.appendChild(img);
  }

  if (botao) botao.textContent = "Salvar alterações";

  // devolve o post pra quem chamou
  return post;
}

// ---- Criar / Atualizar post ----
async function salvarPost(idExistente) {
  const comunidadeEl = document.getElementById("comunidade");
  const tituloEl = document.getElementById("titulo");
  const categoriaEl = document.getElementById("categoria");
  const textoEl = document.getElementById("cp-texto");
  const imagemEl = document.getElementById("cp-imagem");
  const linkEl = document.getElementById("cp-url");

  const abaAtiva = document.querySelector('.cp-aba[aria-selected="true"]');
  const tipo = abaAtiva ? abaAtiva.dataset.tab : "texto";

  const comunidade = comunidadeEl?.value || 0;
  const titulo = tituloEl?.value.trim() || "";
  const categoria = categoriaEl?.value || "";
  const texto = textoEl?.value.trim() || "";
  const imagem = imagemEl?.value.trim() || "";
  const link = linkEl?.value.trim() || "";

  // validações básicas
  if (!titulo) {
    alert("Preencha o título do post.");
    return;
  }

  if (!comunidade) {
    alert("Escolha a comunidade.");
    return;
  }

  if (tipo === "texto" && !texto) {
    alert("Preencha o conteúdo em texto.");
    return;
  }
  if (tipo === "imagem" && !imagem) {
    alert("Informe a URL da imagem.");
    return;
  }
  if (tipo === "link" && !link) {
    alert("Informe o link.");
    return;
  }

  // payload compatível com a home (title/text/imageUrl) + extras
  const payload = {
    comunidade,
    categoria,
    tipo, // "texto" | "imagem" | "link"
    title: titulo,
    text: texto,
    imageUrl: imagem,
    link,
    user_id:USER_ID
  };

  // na criação, adiciona createdAt
  // na edição, preserva o createdAt original se existir
  if (idExistente && postAtual && postAtual.createdAt) {
    payload.createdAt = postAtual.createdAt;
  } else if (!idExistente) {
    payload.createdAt = new Date().toISOString();
  }

  const method = idExistente ? "PUT" : "POST";
  const url = idExistente
    ? `${API_URL}/posts/${idExistente}`
    : `${API_URL}/posts`;

  const resp = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) throw new Error("Erro ao salvar post");

  const saved = await resp.json();
  const idFinal = idExistente || saved.id;

  alert(
    idExistente ? "Post atualizado com sucesso!" : "Post criado com sucesso!"
  );

  // se estava editando, volta para a página do artigo
  if (idExistente) {
    window.location.href = `${ARTICLE_PAGE}?id=${idFinal}`;
  } else {
    // novo post: volta para a home
    window.location.href = HOME_PAGE;
  }
}

// ---- Inicialização da página ----
document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initImagePreview();

  const id = getQueryParam("id");

  if (id) {
    // modo edição
    carregarPostParaEdicao(id)
      .then((post) => {
        // depois que o post veio, carregamos as comunidades
        // e marcamos a que já estava salva em post.comunidade
        carregarComunidadesSelect(post?.comunidade);
      })
      .catch((err) => {
        console.error(err);
        alert("Erro ao carregar o post para edição.");
        // mesmo com erro, ainda tenta carregar a lista de comunidades
        carregarComunidadesSelect();
      });
  } else {
    // modo criação: só carrega a lista de comunidades
    carregarComunidadesSelect();
  }

  const btnSalvar = document.getElementById("cp-publicar");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", () => {
      salvarPost(id).catch((err) => {
        console.error(err);
        alert("Erro ao salvar o post.");
      });
    });
  }

  const btnDescartar = document.getElementById("cp-descartar");
  if (btnDescartar) {
    btnDescartar.addEventListener("click", () => {
      if (id) {
        // estava editando → volta pro artigo
        window.location.href = `${ARTICLE_PAGE}?id=${id}`;
      } else {
        // criação → volta pra home
        window.location.href = HOME_PAGE;
      }
    });
  }
});
