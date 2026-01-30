//comunidade atual e lista de todas as comunidades, para uso durante a página
var community;
var communities;
const API_URL = window.API_URL;

const titleElement = document.getElementById("banner-title");
const tagsElement = document.getElementById("banner-tags");
const bannerElement = document.getElementById("banner");
const descriptionElement = document.getElementById("community-description");
const communityList = document.getElementById("community-list");
const searchBar = document.getElementById("search-community");
const editBtn = document.getElementById("edit-community");
const communityImage = document.getElementById("banner-image");
const postList = document.getElementById("post-list");

//recebe o id passado como parâmetro e pesquisa a comunidade relacionada
async function loadData() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  const response = await fetch(API_URL + `/communities`);
  communities = await response.json();

  community = communities.find((com) => com.id == id);

  loadCommunity();
  loadPosts();
}

function loadCommunity() {
  //pesquisa por um valor vazio para mostrar todas as comunidades
  searchCommunity("");

  titleElement.innerHTML = community.name;
  tagsElement.innerHTML = community.tags;
  descriptionElement.innerHTML = community.description;
  //caso não haja imagem cadastrada, usa uma imagem placeholder
  communityImage.src = community.imagem
    ? community.imagem
    : "https://placehold.co/400";
  editBtn.href = `cadastroComunidade.html?id=${community.id}`;
  searchBar.oninput = (e) => {
    searchCommunity(e.target.value);
  };
  bannerElement.style.setProperty(
    "--banner-img",
    `url('${community.imagem ? community.imagem : "https://placehold.co/400"}')`,
  );
}

function searchCommunity(term) {
  //pesquisa sem acento e sem diferença de maiúscula para minúscula
  const normalizedTerm = term
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const filteredComs = communities.filter((com) =>
    com.name
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(normalizedTerm),
  );

  communityList.innerHTML = filteredComs
    .map(
      (com) =>
        `<div>
            <a href="paginaComunidade.html?id=${com.id}">
                <img src="${com.imagem ? com.imagem : "https://placehold.co/400"}">
                <p>${com.name}</p>
            </a>
            <button onclick="deleteCommunity(${com.id})"><i class="fa-solid fa-trash-can"></i></button>
        </div>`,
    )
    .join("");
}
async function deleteCommunity(id) {
  try {
    await fetch(API_URL + `/communities/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    alert("Comunidade deletada!");
    if (community.id == id) {
      window.location.href = `cadastroComunidade.html`;
    } else {
      loadData();
    }
  } catch (e) {
    alert("Erro em deletar comunidade!");
  }
}
async function loadPosts() {
  try {
    const res = await fetch(API_URL + `/posts`);
    let posts = await res.json();

    console.log(posts, community.id);

    // filtra pelos posts dessa comunidade
    posts = posts.filter((post) => post.comunidade == community.id);
    console.log(posts);

    postList.innerHTML = posts
      .map((post) => {
        const likes = post.likes ?? 0; // 👈 pega curtidas
        const dislikes = post.dislikes ?? 0; // 👈 pega não curtidas

        return `
          <div class="post">
            ${post.imageUrl ? `<img src="${post.imageUrl}">` : ""}
            <div class="post-text">
              <h1>${post.title}</h1>
              <p>${post.text}</p>
            </div>
            <div class="post-meta">
              <p>${post.categoria} ● ${new Date(post.createdAt).toLocaleString(
                "pt-BR",
              )}</p>
            </div>
            <div class="post-vote">
              <span class="post-like-count">
                <i class="fa-solid fa-thumbs-up"></i> ${likes}
              </span>
              <span class="post-dislike-count">
                <i class="fa-solid fa-thumbs-down"></i> ${dislikes}
              </span>
            </div>
            <a href="paginaArtigo.html?id=${post.id}" class="post-link">Ver mais</a>
          </div>
        `;
      })
      .join("");
  } catch (e) {
    console.error(e);
  }
}

//carrega os dados assim que a página carregar
window.onload = () => {
  loadData();
};
