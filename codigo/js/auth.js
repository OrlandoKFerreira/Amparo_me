// js/auth.js

const LOGIN_PAGE = "login.html";
const PUBLIC_PAGES = ["login.html", "cadastro.html"];

// lê o usuário salvo no localStorage
function obterUsuarioLogado() {
  try {
    const raw = localStorage.getItem("usuarioLogado");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Erro ao ler usuarioLogado:", e);
    return null;
  }
}

// salva usuário (se quiser usar em algum lugar depois)
function salvarUsuarioLogado(usuario) {
  localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
}

// remove usuário logado
function limparUsuarioLogado() {
  localStorage.removeItem("usuarioLogado");
}

// protege página: se não tiver usuário, manda pro login
function exigirLogin() {
  const path = window.location.pathname.split("/").pop() || "";
  if (PUBLIC_PAGES.includes(path)) {
    // páginas públicas não precisam de login
    return;
  }

  const usuario = obterUsuarioLogado();
  if (!usuario) {
    const redirect = encodeURIComponent(window.location.href);
    window.location.href = `${LOGIN_PAGE}?redirect=${redirect}`;
    return;
  }

  // se estiver logado, atualiza header
  mostrarUsuarioNoHeader(usuario);
}

// mostra nome e ativa botão de sair
function mostrarUsuarioNoHeader(usuario) {
  const nomeEl = document.getElementById("usuario-nome");
  const btnLogout = document.getElementById("btn-logout");

  if (nomeEl) {
    // escolhe o que tiver: username ou nome
    nomeEl.textContent = usuario.username || usuario.nome || "Usuário";
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      limparUsuarioLogado();
      window.location.href = LOGIN_PAGE;
    });
  }
}
