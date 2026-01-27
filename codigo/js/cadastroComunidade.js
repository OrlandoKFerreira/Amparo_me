const imageEdit = document.querySelector('#imagem-comunidade>img');
const imageInp = document.querySelector('#imagem-comunidade>input');
const imageSend = document.getElementById("send-image")

const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"

var communityId = 0;
const nameElement = document.getElementById("input-name");
const topicElement = document.getElementById("input-tags");
const descElement = document.getElementById("input-description");
const btnCreate = document.getElementById("btn-criar");
let img;

//caso algum parâmetro seja passado, carrega a página relacionada para ser editada
async function loadCommunity () {
    const params = new URLSearchParams(window.location.search);
    communityId = params.get("id");
    if (communityId > 0) {
       const response = await fetch(API_URL+`/communities/${communityId}`);
       const community = await response.json(); 
       nameElement.value = community.name;
       topicElement.value = community.tags
       descElement.value = community.description;
       imageEdit.src = community.imagem;
       imageInp.value = community.imagem;
       btnCreate.innerHTML = "Salvar";
       btnCreate.onclick = salvarGrupo;

    } else {
        //caso não haja parâmetro, a página simplesmente cria uma nova
        btnCreate.onclick = criarGrupo;
    }
}

imageSend.addEventListener('click', () => {
    let url = imageInp.value;
    //valida a URL e só coloca como src da img caso seja válida
    try {
        new URL(url);
        imageEdit.src = url;
    } catch (e) {
        console.error(e)
    }
})

async function criarGrupo() {
    //coloca as tags como minúsculas sem whitespace
    const topics = topicElement.value.toLowerCase().split(',').map(topic => topic.trim());

    const community =  {
        name: nameElement.value,
        description: descElement.value,
        imagem: imageInp.value,
        tags:topics
    }
    try{
        
        const response = await fetch(API_URL+'/communities', {
            method:'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body:JSON.stringify(community)
        });
        const newCommunity = await response.json();
        alert(`Comunidade "${newCommunity.name}" criada com sucesso!`);
        window.location.href = `paginaComunidade.html?id=${newCommunity.id}`

    } catch(e) {
        alert("Erro na criação de comunidade!");
        console.error(e);
    }

}

async function salvarGrupo() {
    //coloca as tags como minúsculas sem whitespace
    const topics = topicElement.value.toLowerCase().split(',').map(topic => topic.trim());
    const community =  {
        name: nameElement.value,
        description: descElement.value,
        imagem: imageInp.value,
        tags:topics
    }
     try{
        
        const response = await fetch(API_URL+`/communities/${communityId}`, {
            method:'PUT',
            headers: {
            'Content-Type': 'application/json',
            },
            body:JSON.stringify(community)
        });
        const newCommunity = await response.json();
        alert(`Comunidade "${newCommunity.name}" editada com sucesso!`);
        window.location.href = `paginaComunidade.html?id=${newCommunity.id}`

    } catch(e) {
        alert("Erro na criação de comunidade!");
        console.error(e);
    }
}

window.onload = () => {
    loadCommunity();
}
