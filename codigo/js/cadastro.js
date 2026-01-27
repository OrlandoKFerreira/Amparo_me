// js/cadastro.js

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"

const USERS_API = API_URL+"/usuarios";

const formEl = document.querySelector(".cadastro-form");
const nomeEl = document.getElementById("nome");
const usernameEl = document.getElementById("username");
const emailEl = document.getElementById("email");
const telefoneEl = document.getElementById("telefone");
const senhaEl = document.getElementById("senha");
const confirmarSenhaEl = document.getElementById("confirmar-senha");
const bioEl = document.getElementById("bio");

const tituloCard = document.querySelector(".cadastro-card h1");
const subtituloCard = document.querySelector(".cadastro-subtitle");

let userId = null; // se tiver id => edição, senão => criação

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  userId = params.get("id"); // ex: cadastro.html?id=3

  if (userId) {
    // modo ediçãoa
    carregarUsuario(userId);
    if (tituloCard) tituloCard.textContent = "Editar perfil";
    if (subtituloCard)
      subtituloCard.textContent =
        "Atualize seus dados para manter seu perfil em dia.";
  } else {
    // modo criação
    if (tituloCard) tituloCard.textContent = "Cadastro";
    if (subtituloCard)
      subtituloCard.textContent =
        "Crie sua conta para começar a usar a plataforma.";
  }

  if (formEl) {
    formEl.addEventListener("submit", handleSubmit);
  }
});

async function carregarUsuario(id) {
  try {
    const resp = await fetch(`${USERS_API}/${id}`);
    if (!resp.ok) {
      throw new Error("Usuário não encontrado");
    }

    const usuario = await resp.json();

    if (nomeEl) nomeEl.value = usuario.nome || "";
    if (usernameEl) usernameEl.value = usuario.username || "";
    if (emailEl) emailEl.value = usuario.email || "";
    if (telefoneEl) telefoneEl.value = usuario.telefone || "";
    if (bioEl) bioEl.value = usuario.bio || "";

    if (senhaEl) senhaEl.value = "";
    if (confirmarSenhaEl) confirmarSenhaEl.value = "";
  } catch (erro) {
    console.error("Erro ao carregar usuário:", erro);
    alert("Não foi possível carregar os dados do usuário.");
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const nome = nomeEl.value.trim();
  const username = usernameEl.value.trim();
  const email = emailEl.value.trim();
  const telefone = telefoneEl.value.trim();
  const senha = senhaEl.value;
  const confirmarSenha = confirmarSenhaEl.value;
  const bio = bioEl.value.trim();

  // validações básicas
  if (!nome || !username || !email || !senha) {
    alert("Preencha pelo menos Nome, Usuário, E-mail e Senha.");
    return;
  }

  if (senha !== confirmarSenha) {
    alert("As senhas não conferem.");
    return;
  }

  const usuarioPayload = {
    nome,
    username,
    email,
    telefone,
    senha, // em produção seria hash, aqui é só protótipo
    bio,
  };

  try {
    let resposta;

    if (userId) {
      // EDITAR
      resposta = await fetch(`${USERS_API}/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuarioPayload),
      });
    } else {
      // CRIAR
      resposta = await fetch(USERS_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuarioPayload),
      });
    }

    if (!resposta.ok) {
      throw new Error("Erro ao salvar usuário");
    }

    const usuarioSalvo = await resposta.json();

    alert(
      userId
        ? "Dados salvos com sucesso!"
        : `Cadastro criado! Bem-vindo(a), ${usuarioSalvo.nome}.`
    );

    // redireciona (ajusta para onde você quiser mandar depois do cadastro/edição)
    window.location.href = "/codigo/login.html";
  } catch (erro) {
    console.error("Erro ao salvar usuário:", erro);
    alert("Não foi possível salvar seus dados. Tente novamente.");
  }
}
