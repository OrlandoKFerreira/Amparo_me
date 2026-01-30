const API_URL = window.API_URL;

const form = document.getElementById("login-form");
const emailEl = document.getElementById("email");
const senhaEl = document.getElementById("senha");
const erroEl = document.getElementById("login-erro");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = emailEl.value.trim();
  const senha = senhaEl.value.trim();

  if (!email || !senha) {
    erroEl.textContent = "Preencha e-mail e senha.";
    return;
  }

  try {
    erroEl.textContent = "";

    const resp = await fetch(
      `${API_URL}/usuarios?email=${encodeURIComponent(
        email,
      )}&senha=${encodeURIComponent(senha)}`,
    );

    if (!resp.ok) throw new Error("Erro ao acessar o servidor.");

    const usuarios = await resp.json();

    if (!usuarios.length) {
      erroEl.textContent = "E-mail ou senha inválidos.";
      return;
    }

    const usuario = usuarios[0];

    sessionStorage.setItem("usuarioLogado", JSON.stringify(usuario));

    window.location.href = "humor.html";
  } catch (error) {
    console.error(error);
    erroEl.textContent =
      "Erro ao fazer login. Verifique o servidor e tente novamente.";
  }
});
