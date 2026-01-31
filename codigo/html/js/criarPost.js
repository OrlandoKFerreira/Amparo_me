// /codigo/js/criarPost.js

const API_URL = window.API_URL;

const HOME_PAGE = "PaginaInicial.html"; // página inicial
const ARTICLE_PAGE = "paginaArtigo.html"; // página do artigo
const FORM_PAGE = "criacaoDePost.html"; // esta mesma página
const USER_ID = JSON.parse(sessionStorage.getItem("usuarioLogado")).id; //usuario logado

// vamos guardar o post atual quando estiver em modo edição
let postAtual = null;
let imageFile = null;

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

// ---- Preview da imagem ----
function initImagePreview() {
  const input = document.getElementById("cp-imagem");
  const preview = document.getElementById("cp-preview");

  if (!input || !preview) return;

  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    imageFile = file;
    preview.innerHTML = `<img src="${URL.createObjectURL(file)}">`;
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
  // NÃO tente setar value de input file
  // Só mostra no preview

  if (preview && (post.imageUrl || post.imagem)) {
    const imgUrl = post.imageUrl || post.imagem;

    preview.innerHTML = "";
    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = "Pré-visualização da imagem";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "8px";
    preview.appendChild(img);

    // mantém a imagem original se o usuário não trocar
    imagemBase64 = imgUrl;
  }

  if (linkEl) linkEl.value = post.link || "";

  // define aba baseada nos dados salvos
  const tipo =
    post.tipo ||
    (post.imageUrl || post.imagem ? "imagem" : post.link ? "link" : "texto");
  setActiveTab(tipo);

  if (botao) botao.textContent = "Salvar alterações";

  // devolve o post pra quem chamou
  return post;
}
async function uploadParaCloudinary(file) {
  const CLOUD_NAME = "dhgbvydnm";
  const UPLOAD_PRESET = "amparo_unsigned";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const resp = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const text = await resp.text();
  console.log("Cloudinary status:", resp.status);
  console.log("Cloudinary response:", text);

  if (!resp.ok) {
    throw new Error(text);
  }

  const data = JSON.parse(text);
  return data.secure_url;
}

// ---- Criar / Atualizar post ----
async function salvarPost(idExistente) {
  const btn = document.getElementById("cp-publicar");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Publicando...";
  }

  const comunidadeEl = document.getElementById("comunidade");
  const tituloEl = document.getElementById("titulo");
  const categoriaEl = document.getElementById("categoria");
  const textoEl = document.getElementById("cp-texto");
  const linkEl = document.getElementById("cp-url");

  const likes = postAtual?.likes ?? 0;
  const dislikes = postAtual?.dislikes ?? 0;

  const comunidade = comunidadeEl?.value || null;

  const titulo = tituloEl?.value.trim() || "";
  const categoria = categoriaEl?.value || "";
  const texto = textoEl?.value.trim() || "";
  const link = linkEl?.value.trim() || "";

  // validações mínimas
  if (!titulo) {
    const btn = document.getElementById("cp-publicar");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Publicar";
    }
    return alert("Preencha o título do post.");
  }

  if (!texto && !imagem && !link) {
    const btn = document.getElementById("cp-publicar");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Publicar";
    }
    return alert("Adicione texto, imagem ou link ao post.");
  }

  // tipo automático
  let tipo = "texto";
  let imageUrl = postAtual?.imageUrl || postAtual?.imagem || "";

  if (imageFile) {
    try {
      imageUrl = await uploadParaCloudinary(imageFile);
    } catch (e) {
      const btn = document.getElementById("cp-publicar");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Publicar";
      }
      return alert("Falha ao enviar a imagem. Tente novamente.");
    }
  }

  const payload = {
    comunidade,
    categoria,
    tipo,
    title: titulo,
    text: texto,
    imageUrl: imageUrl,
    link,
    user_id: USER_ID,
    likes,
    dislikes,
  };

  // createdAt
  if (idExistente && postAtual?.createdAt) {
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
    headers: {
      "Content-Type": "application/json",
      "x-user-id": USER_ID,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const btn = document.getElementById("cp-publicar");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Publicar";
    }
    return alert(
      "Voce postou rapido demais. Aguarde alguns minutos antes de tentar novamente.",
    );
    throw new Error("Erro ao salvar o post");
  }

  const saved = await resp.json();
  const idFinal = idExistente || saved.id;

  alert(
    idExistente ? "Post atualizado com sucesso!" : "Post criado com sucesso!",
  );

  window.location.href = idExistente
    ? `${ARTICLE_PAGE}?id=${idFinal}`
    : HOME_PAGE;
}

// ---- Inicialização da página ----
document.addEventListener("DOMContentLoaded", async () => {
  initImagePreview();

  const id = getQueryParam("id");

  try {
    if (id) {
      // 1. Carrega comunidades primeiro
      await carregarComunidadesSelect();

      // 2. Depois carrega o post
      const post = await carregarPostParaEdicao(id);

      // 3. Agora seleciona a comunidade certa
      const select = document.getElementById("comunidade");
      if (select && post?.comunidade) {
        select.value = post.comunidade;
      }
    } else {
      await carregarComunidadesSelect();
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao carregar o post para edição.");
  }

  const btnSalvar = document.getElementById("cp-publicar");
  if (btnSalvar) {
    btnSalvar.addEventListener("click", () => {
      salvarPost(id).catch(() => {
        alert("Erro ao salvar o post.");
      });
    });
  }
  const btnDescartar = document.getElementById("cp-descartar");

  if (btnDescartar) {
    btnDescartar.addEventListener("click", () => {
      if (id) {
        // modo edição → volta para o artigo
        window.location.href = `${ARTICLE_PAGE}?id=${id}`;
      } else {
        // modo criação → volta para a home
        window.location.href = HOME_PAGE;
      }
    });
  }
});
