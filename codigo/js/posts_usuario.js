const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"
let user_id = JSON.parse(sessionStorage.getItem("usuarioLogado")).id;
let username = JSON.parse(sessionStorage.getItem("usuarioLogado")).nome;
const profilename = document.getElementById("profile-name");
profilename.innerHTML = username;

let userPosts = [];

async function loadPosts() {
    const res = await fetch(API_URL+'/posts');
    const posts = await res.json();

    userPosts = posts.filter(post => post.user_id == user_id);
}

async function buildPosts() {
    const postList = document.getElementById("post-list");

    postList.innerHTML = await Promise.all(
        userPosts.map(async post => {
            const likes = post.likes ?? 0;       
            const dislikes = post.dislikes ?? 0; 

            const res = await fetch(API_URL+`/communities/${post.comunidade}`);
            const comunidade = await res.json();

            const nomeComunidade = comunidade.name;


            return `
            <div class="post">
                ${post.imageUrl ? `<img src="${post.imageUrl}">` : ""}
                <div class="post-text">
                <h1>${post.title}</h1>
                <p>${post.text}</p>
                </div>
                <div class="post-meta">
                <p>${nomeComunidade} ● ${post.categoria} ● ${new Date(post.createdAt).toLocaleString(
                    "pt-BR"
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
    )
}

window.onload = async function () {
    await loadPosts();
    buildPosts();
}