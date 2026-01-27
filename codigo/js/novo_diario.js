const formDiario = document.getElementById("formDiario");
let user_id = JSON.parse(sessionStorage.getItem("usuarioLogado")).id;
let username = JSON.parse(sessionStorage.getItem("usuarioLogado")).nome;
const profilename = document.getElementById("profile-name");
profilename.innerHTML = username;
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? "http://localhost:3000"
  : "https://plf-es-2025-2-ti1-5567100-amparo-me-production.up.railway.app"

window.onload = () => {
    document.getElementById("data").value = new Date().toJSON().split("T")[0]; //inicia com o dia de hoje
}

formDiario.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const data = new FormData(e.target);

    const progressoData = data.get("data");
    const progressoText = data.get("progresso");
    const dataFormatada = `${progressoData.slice(8,10)}/${progressoData.slice(5,7)}/${progressoData.slice(0,4)}`;

    const progresso = {
        data:progressoData,
        diario:progressoText,
        dataFormatada,
        user_id:user_id

    }
    try{
        await fetch(API_URL+'/progressos', {
            method:'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body:JSON.stringify(progresso)
        });
        window.location.href = 'pagina_progresso_inicio.html';

    } catch(e) {
        alert("Erro na criação de diário!");
        console.error(e);
    }
})