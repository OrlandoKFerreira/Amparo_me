// =========================
// APP BASE
// =========================
const App = {
  state: {
    user: null,
    posts: [],
    progressos: [],
  },

  api: {
    base:
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app",

    get(path) {
      return fetch(this.base + path).then((r) => r.json());
    },

    post(path, body) {
      return fetch(this.base + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },

    put(path, body) {
      return fetch(this.base + path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },

    delete(path) {
      return fetch(this.base + path, { method: "DELETE" });
    },
  },
};

// =========================
// AUTH
// =========================
App.state.user =
  JSON.parse(sessionStorage.getItem("usuarioLogado")) ||
  JSON.parse(localStorage.getItem("usuarioLogado"));

if (!App.state.user?.id) {
  alert("Você precisa estar logado");
  window.location.href = "login.html";
}

// =========================
// PERFIL
// =========================
App.perfil = {
  async carregar() {
    const usuario = await App.api.get(`/usuarios/${App.state.user.id}`);

    document.getElementById("user-name").textContent =
      usuario.nome || usuario.username || "Usuário";

    document.getElementById("user-avatar").src =
      usuario.foto ||
      "https://res.cloudinary.com/dhgbvydnm/image/upload/v1/amparo/default-avatar.png";

    document.getElementById("user-bio").textContent =
      usuario.bio || "Você ainda não escreveu sua descrição.";

    this.preencherLinks(usuario);
  },

  preencherLinks(usuario) {
    const linksEl = document.getElementById("user-links");
    linksEl.innerHTML = "";

    const links = [];
    if (usuario.site) links.push({ label: "Site", href: usuario.site });
    if (usuario.linkedin)
      links.push({ label: "LinkedIn", href: usuario.linkedin });
    if (usuario.instagram)
      links.push({ label: "Instagram", href: usuario.instagram });

    if (!links.length && usuario.email) {
      links.push({
        label: usuario.email,
        href: `mailto:${usuario.email}`,
      });
    }

    if (!links.length) {
      linksEl.innerHTML = "<li>Nenhum contato cadastrado</li>";
      return;
    }

    links.forEach((l) => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${l.href}" target="_blank" rel="noopener noreferrer">${l.label}</a>`;
      linksEl.appendChild(li);
    });
  },
};

// =========================
// CONTEÚDO
// =========================
App.conteudo = {
  async carregar() {
    const posts = await App.api.get("/posts");

    App.state.posts = posts.filter((p) => p.user_id == App.state.user.id);

    this.render();
  },

  async render() {
    const list = document.getElementById("conteudo-list");
    list.innerHTML = "";

    if (!App.state.posts.length) {
      list.innerHTML = "<p>Você ainda não publicou nada.</p>";
      return;
    }

    for (const post of App.state.posts) {
      const comunidade = await App.api.get(`/communities/${post.comunidade}`);

      list.innerHTML += `
        <div class="post">
          ${post.imageUrl ? `<img src="${post.imageUrl}">` : ""}
          <div class="post-text">
            <h1>${post.title}</h1>
            <p>${post.text}</p>
          </div>
          <div class="post-meta">
            ${comunidade.name} • ${post.categoria} •
            ${new Date(post.createdAt).toLocaleString("pt-BR")}
          </div>
          <a href="paginaArtigo.html?id=${post.id}" class="post-link">
            Ver mais
          </a>
        </div>
      `;
    }
  },
};

// =========================
// PROGRESSO
// =========================
App.progresso = {
  async carregar() {
    const lista = await App.api.get("/progressos");

    App.state.progressos = lista
      .filter((p) => p.user_id == App.state.user.id)
      .sort((a, b) => new Date(b.data) - new Date(a.data)); // mais recente primeiro

    this.render();
  },

  render() {
    const grid = document.getElementById("progresso-grid");
    grid.innerHTML = "";

    if (!App.state.progressos.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>Você ainda não escreveu nenhum diário.</p>
          <a href="novo_diario.html" class="btn-new">+ Novo Registro</a>
        </div>
      `;
      return;
    }

    App.state.progressos.forEach((p) => {
      grid.innerHTML += `
        <div class="card-resumo">
          <div class="card-header">
            <span>Diário</span>
            <span>${p.dataFormatada}</span>
          </div>

          <div class="card-preview">
            ${p.diario.slice(0, 120)}${p.diario.length > 120 ? "..." : ""}
          </div>

          <a
            href="pagina_progresso.html?data=${p.data}"
            class="card-click-area"
          >
            Abrir
          </a>
        </div>
      `;
    });
  },
};

// =========================
// UI / SPA NAV
// =========================
App.ui = {
  initTabs() {
    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.trocarAba(btn.dataset.tab, true);
      });
    });
  },

  async trocarAba(nome, atualizarHash = false) {
    // Esconde abas
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));

    // Reseta botões
    document.querySelectorAll(".profile-btn").forEach((b) => {
      b.classList.remove("primary");
      b.classList.add("secondary");
    });

    // Ativa aba
    const tab = document.getElementById(`tab-${nome}`);
    if (tab) tab.classList.add("active");

    // Ativa botão
    const btn = document.querySelector(`[data-tab="${nome}"]`);
    if (btn) {
      btn.classList.remove("secondary");
      btn.classList.add("primary");
    }

    // URL
    if (atualizarHash) {
      history.replaceState(null, "", `#${nome}`);
    }

    // Dados
    if (nome === "perfil") await App.perfil.carregar();
    if (nome === "conteudo") await App.conteudo.carregar();
    if (nome === "progresso") await App.progresso.carregar();
  },
};

// =========================
// BOOT (ESSA PARTE FALTAVA)
// =========================
document.addEventListener("DOMContentLoaded", () => {
  App.ui.initTabs();

  const hash = window.location.hash.replace("#", "");
  const abaInicial =
    hash === "conteudo" || hash === "progresso" ? hash : "perfil";

  App.ui.trocarAba(abaInicial, false);
});
