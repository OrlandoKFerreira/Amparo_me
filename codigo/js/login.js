const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"

const form = document.getElementById("login-form");
const emailEl = document.getElementById("email");
const senhaEl = document.getElementById("senha");
const erroEl = document.getElementById("login-erro");

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // impede o POST para login.html

  const email = emailEl.value.trim();
  const senha = senhaEl.value.trim();

  if (!email || !senha) {
    erroEl.textContent = "Preencha e-mail e senha.";
    return;
  }

  try {
    erroEl.textContent = "";

    // Busca no JSON Server
    const resp = await fetch(
      `${API_URL}/usuarios?email=${encodeURIComponent(
        email
      )}&senha=${encodeURIComponent(senha)}`
    );

    if (!resp.ok) {
      throw new Error("Erro ao acessar o servidor.");
    }

    const usuarios = await resp.json();

    if (usuarios.length === 0) {
      erroEl.textContent = "E-mail ou senha inválidos.";
      return;
    }

    const usuario = usuarios[0];

    // Salva usuário logado
    await sessionStorage.setItem("usuarioLogado", JSON.stringify(usuario));

    // Redireciona para a página de humor
    window.location.href = "humor.html"; // ajuste o caminho se estiver em outra pasta
  } catch (error) {
    console.error(error);
    erroEl.textContent =
      "Erro ao fazer login. Verifique o JSON Server e tente novamente.";
  }
});
