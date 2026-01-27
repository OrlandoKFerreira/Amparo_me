const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"

const usuarioLogadoJSON = sessionStorage.getItem("usuarioLogado");
let usuarioLogado = null;

if (usuarioLogadoJSON) {
  try {
    usuarioLogado = JSON.parse(usuarioLogadoJSON);
  } catch (e) {
    console.error("Erro ao ler usuarioLogado:", e);
  }
}

if (!usuarioLogado) {
  alert("Você precisa estar logado para ver o perfil.");
  window.location.href = "login.html";
}

// 2) Pega elementos da tela
const avatarEl = document.getElementById("user-avatar");
const nomeEl = document.getElementById("user-name");
const bioEl = document.getElementById("user-bio");
const linksEl = document.getElementById("user-links");
const gridConteudosEl = document.getElementById("conteudos-grid");
const conteudosEmptyEl = document.getElementById("conteudos-empty");
const btnEditarPerfil = document.getElementById("btn-editar-perfil");

// 3) Preenche os dados básicos do usuário
function preencherPerfil(usuario) {
  // nome
  nomeEl.textContent = usuario.nome || usuario.username || "Usuário";

  // foto (se um dia você adicionar campo fotoPerfil no JSON)
  if (usuario.fotoPerfil) {
    avatarEl.src = usuario.fotoPerfil;
  } else {
    avatarEl.src = "img/img_perfil.png";
  }

  // bio
  bioEl.textContent =
    usuario.bio ||
    "Você ainda não preencheu sua descrição. Edite seu perfil para adicionar algo sobre você.";

  // links externos
  preencherLinks(usuario);
}

// 4) Monta a lista de links externos (site, linkedin, etc.)
function preencherLinks(usuario) {
  linksEl.innerHTML = "";

  const links = [];

  // Aqui você adapta pros campos que tiver no seu JSON
  if (usuario.site) {
    links.push({ href: usuario.site, label: usuario.site });
  }
  if (usuario.linkedin) {
    links.push({ href: usuario.linkedin, label: "LinkedIn" });
  }
  if (usuario.instagram) {
    links.push({ href: usuario.instagram, label: "Instagram" });
  }

  // Se não tiver campos específicos, dá pra usar email/telefone como contato:
  if (!links.length) {
    if (usuario.email) {
      links.push({
        href: `mailto:${usuario.email}`,
        label: usuario.email,
      });
    }
    if (usuario.telefone) {
      links.push({
        href: `tel:${usuario.telefone}`,
        label: usuario.telefone,
      });
    }
  }

  if (!links.length) {
    const li = document.createElement("li");
    li.textContent = "Nenhum link cadastrado.";
    linksEl.appendChild(li);
    return;
  }

  links.forEach((link) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link.href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = link.label;
    li.appendChild(a);
    linksEl.appendChild(li);
  });
}

// 5) Busca o usuário atualizado no JSON Server
async function carregarUsuarioDoServidor() {
  try {
    // Se seu db.json tiver "usuario": [ ... ]
    const resp = await fetch(`${API_URL}/usuarios/${usuarioLogado.id}`);

    if (!resp.ok) {
      throw new Error("Erro ao buscar usuário no servidor");
    }

    const usuarioServidor = await resp.json();
    preencherPerfil(usuarioServidor);
  } catch (error) {
    console.error(error);
    // Se der erro, usa o usuário do localStorage mesmo
    preencherPerfil(usuarioLogado);
  }
}

// 6) (Opcional) Carregar conteúdos publicados do usuário
async function carregarConteudos() {
  try {
    // Ajuste "/posts" para o nome da coleção que você tiver (ex: /meuConteudo)
    const resp = await fetch(
      `${API_URL}/posts?usuarioId=${encodeURIComponent(
        usuarioLogado.id
      )}&_sort=data&_order=desc&_limit=8`
    );

    if (!resp.ok) throw new Error("Erro ao buscar conteúdos.");

    const posts = await resp.json();

    if (!posts.length) {
      conteudosEmptyEl.style.display = "block";
      return;
    }

    conteudosEmptyEl.style.display = "none";
    gridConteudosEl.innerHTML = "";

    posts.forEach((post) => {
      const card = criarCardConteudo(post);
      gridConteudosEl.appendChild(card);
    });
  } catch (error) {
    console.error(error);
    conteudosEmptyEl.style.display = "block";
    conteudosEmptyEl.textContent =
      "Não foi possível carregar seus conteúdos publicados.";
  }
}

// se está editando ou não
let toggleEdit = false;
let nomeInput;
let bioInput;
let telInput;
let emailInput;

// 7) Clique no botão "Editar Perfil"
// Por enquanto só deixei um alerta; depois você pode trocar pra abrir uma página
// ou ativar um modo de edição com formulário e PATCH no JSON Server.
btnEditarPerfil.addEventListener("click", async () => {
  

  if (toggleEdit) {
    const newUsuario = {
      id:usuarioLogado.id,
      nome:nomeInput.value,
      username:usuarioLogado.username,
      email:emailInput.value,
      bio:bioInput.value,
      telefone:telInput.value,
      senha:usuarioLogado.senha
    }
    try{
      await fetch(API_URL+`/usuarios/${newUsuario.id}`, {
          method:'PUT',
          headers: {
          'Content-Type': 'application/json',
          },
          body:JSON.stringify(newUsuario)
      });
      await carregarUsuarioDoServidor();
      nomeInput.replaceWith(nomeEl);
      bioInput.replaceWith(bioEl);
    
    } catch(e) {
        console.error(e);
    }

    toggleEdit = false;
  } else {

    const linkList = Array.from(linksEl.children);
  

    nomeInput = document.createElement("input");
    bioInput = document.createElement("textarea");

    telInput = document.createElement("input");
    emailInput = document.createElement("input");

    nomeInput.id = "username-input";
    bioInput.id = "bio-input";
    telInput.id = "tel-input";
    emailInput.id = "email-input";

    nomeInput.value = nomeEl.innerHTML;
    bioInput.value = bioEl.innerHTML;
    emailInput.value = linkList[0].textContent;
    telInput.value = linkList[1].textContent;


    nomeEl.replaceWith(nomeInput);
    bioEl.replaceWith(bioInput);
    linksEl.innerHTML = "";
    linksEl.appendChild(emailInput);
    linksEl.appendChild(telInput);


    toggleEdit = true;
  }

});

document.addEventListener("DOMContentLoaded", () => {
  carregarUsuarioDoServidor();
  // Se quiser já listar conteúdos do usuário:
  // carregarConteudos();
});
