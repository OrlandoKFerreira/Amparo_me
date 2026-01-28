// =========================
// API CONFIG
// =========================
const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app";

const USERS_API = API_URL + "/usuarios";

// =========================
// CLOUDINARY CONFIG
// =========================
const CLOUD_NAME = "dhgbvydnm";
const UPLOAD_PRESET = "amparo_unsigned";

// =========================
// ELEMENTOS
// =========================
const formEl = document.querySelector(".cadastro-form");

const nomeEl = document.getElementById("nome");
const usernameEl = document.getElementById("username");
const emailEl = document.getElementById("email");
const telefoneEl = document.getElementById("telefone");
const senhaEl = document.getElementById("senha");
const confirmarSenhaEl = document.getElementById("confirmar-senha");
const bioEl = document.getElementById("bio");

const fotoEl = document.getElementById("foto");
const avatarPreviewEl = document.getElementById("avatarPreview");

const tituloCard = document.querySelector(".cadastro-title");
const subtituloCard = document.querySelector(".cadastro-subtitle");

let userId = null;

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  userId = params.get("id");

  if (userId) {
    carregarUsuario(userId);
    if (tituloCard) tituloCard.textContent = "Editar perfil";
    if (subtituloCard) {
      subtituloCard.textContent =
        "Atualize seus dados para manter seu perfil em dia.";
    }
  } else {
    if (tituloCard) tituloCard.textContent = "Cadastro";
    if (subtituloCard) {
      subtituloCard.textContent =
        "Crie sua conta para começar a usar a plataforma.";
    }
  }

  if (formEl) {
    formEl.addEventListener("submit", handleSubmit);
  }

  if (fotoEl) {
    fotoEl.addEventListener("change", atualizarPreviewFoto);
  }
});

// =========================
// PREVIEW
// =========================
function atualizarPreviewFoto() {
  const file = fotoEl.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Selecione apenas imagens.");
    fotoEl.value = "";
    return;
  }

  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.alt = "Foto de perfil";

  avatarPreviewEl.innerHTML = "";
  avatarPreviewEl.appendChild(img);
}

// =========================
// CLOUDINARY UPLOAD
// =========================
async function uploadFotoCloudinary(file) {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: data,
    },
  );

  const json = await res.json();

  if (!json.secure_url) {
    throw new Error("Erro no upload da imagem");
  }

  return json.secure_url;
}

// =========================
// LOAD USER
// =========================
async function carregarUsuario(id) {
  try {
    const resp = await fetch(`${USERS_API}/${id}`);
    if (!resp.ok) throw new Error("Usuário não encontrado");

    const usuario = await resp.json();

    nomeEl.value = usuario.nome || "";
    usernameEl.value = usuario.username || "";
    emailEl.value = usuario.email || "";
    telefoneEl.value = usuario.telefone || "";
    bioEl.value = usuario.bio || "";

    if (usuario.foto) {
      const img = document.createElement("img");
      img.src = usuario.foto;
      img.alt = "Foto de perfil";

      avatarPreviewEl.innerHTML = "";
      avatarPreviewEl.appendChild(img);
    }

    senhaEl.value = "";
    confirmarSenhaEl.value = "";
  } catch (erro) {
    console.error("Erro ao carregar usuário:", erro);
    alert("Não foi possível carregar os dados.");
  }
}

// =========================
// SUBMIT
// =========================
async function handleSubmit(event) {
  event.preventDefault();

  const nome = nomeEl.value.trim();
  const username = usernameEl.value.trim();
  const email = emailEl.value.trim();
  const telefone = telefoneEl.value.trim();
  const senha = senhaEl.value;
  const confirmarSenha = confirmarSenhaEl.value;
  const bio = bioEl.value.trim();
  const file = fotoEl.files[0];

  if (!nome || !username || !email || !senha) {
    alert("Preencha Nome, Usuário, E-mail e Senha.");
    return;
  }

  if (senha !== confirmarSenha) {
    alert("As senhas não conferem.");
    return;
  }

  let fotoUrl = "";

  try {
    if (file) {
      fotoUrl = await uploadFotoCloudinary(file);
    }

    const usuarioPayload = {
      nome,
      username,
      email,
      telefone,
      senha,
      bio,
      foto: fotoUrl,
    };

    let resposta;

    if (userId) {
      resposta = await fetch(`${USERS_API}/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuarioPayload),
      });
    } else {
      resposta = await fetch(USERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(usuarioPayload),
      });
    }

    if (!resposta.ok) throw new Error("Erro ao salvar");

    const usuarioSalvo = await resposta.json();

    alert(
      userId
        ? "Dados atualizados com sucesso!"
        : `Cadastro criado! Bem-vindo(a), ${usuarioSalvo.nome}`,
    );

    window.location.href = "/codigo/login.html";
  } catch (erro) {
    console.error(erro);
    alert("Erro ao salvar usuário ou imagem.");
  }
}
