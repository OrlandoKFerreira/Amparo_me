const API_URL = window.API_URL;

let user_id = JSON.parse(sessionStorage.getItem("usuarioLogado")).id;
let username = JSON.parse(sessionStorage.getItem("usuarioLogado")).nome;
document.addEventListener("DOMContentLoaded", async function () {
  await receberProgressos();

  // Verifica se estamos na PÁGINA INICIAL (Grade de Cards)
  const gridContainer = document.getElementById("gridCards");
  if (gridContainer) {
    iniciarPaginaInicial(gridContainer);
  }

  // Verifica se estamos na PÁGINA DE DETALHES (Diário/Humor)
  const diarioContainer = document.getElementById("diario");
  if (diarioContainer) {
    await receberHumores();
    iniciarPaginaDetalhes(diarioContainer);
  }
});

/* ===========================================================
   LÓGICA DA PÁGINA INICIAL (Excluir cards, Estado Vazio)
   =========================================================== */
let progressos = [];
async function receberProgressos() {
  try {
    const res = await fetch(API_URL + "/progressos");
    const prog = await res.json();
    progressos = prog.filter((prog) => prog.user_id == user_id);
  } catch (e) {
    console.error(e);
  }
}
async function iniciarPaginaInicial(containerGrid) {
  const profilename = document.getElementById("profile-name");
  profilename.innerHTML = username;

  containerGrid.innerHTML = progressos
    .map(
      (prog) => `
        <div class="card-resumo" id="card-resumo-${prog.id}">
                <button class="btn-card-delete" onclick="deletarDiario(${prog.id})" title="Excluir registro">🗑</button>
                    <a href="pagina_progresso.html?data=${prog.data}" class="card-click-area">
                        <div class="card-header">
                            <span>Diário</span>
                            <span>${prog.dataFormatada.slice(0, 5)}</span>
                        </div>
                        <div class="card-preview">
                            ${prog.diario.slice(0, 75)}...
                        </div>
                    </a>
                </div>
        `,
    )
    .join("");
}
async function deletarDiario(id) {
  if (confirm("Tem certeza que deseja excluir este registro?")) {
    const card = document.getElementById(`card-resumo-${id}`);

    // Adiciona uma animaçãozinha de saída antes de remover (opcional)
    card.style.opacity = "0";
    card.style.transform = "scale(0.9)";

    setTimeout(async function () {
      card.remove();
      try {
        await fetch(API_URL + `/progressos/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (e) {
        console.error(e);
      }
    }, 300); // Espera 0.3s da animação CSS
  }
}

/* ===========================================================
   LÓGICA DA PÁGINA DE DETALHES (Carregar dados, Abas)
   =========================================================== */
let diaAtualKey = null; // Variáveis globais para esta página

const params = new URLSearchParams(window.location.search);
diaAtualKey = params.get("data");

if (!diaAtualKey) {
  const dataHj = new Date();
  diaAtualKey = dataHj.toJSON().slice(0, 10); // Padrão se der erro
}

let humores = [];

async function receberHumores() {
  try {
    const res = await fetch(API_URL + "/registrosHumor");
    const hum = await res.json();

    humores = hum.filter((humo) => humo.usuarioId == user_id);
    humores = humores.filter((hum) => hum.data == diaAtualKey);
  } catch (e) {
    console.error(e);
  }
}

function iniciarPaginaDetalhes(diarioContainer) {
  const humorContainer = document.getElementById("humor");
  const profilename = document.getElementById("profile-name");
  profilename.innerHTML = username;

  // Atualizar Título da Data
  const dateElement = document.querySelector(".date");
  const diaFormatado = `${diaAtualKey.slice(8, 10)}/${diaAtualKey.slice(5, 7)}/${diaAtualKey.slice(0, 4)}`;
  if (dateElement) dateElement.textContent = `Data: ${diaFormatado}`;

  // 2. Carregar Conteúdos
  carregarDiario(diarioContainer);
  carregarHumor(humorContainer);

  // 3. Lógica das Abas
  configurarAbas();
}

function carregarDiario(container) {
  const textoDiario = progressos.find(
    (prog) => prog.data == diaAtualKey,
  ).diario;

  // Adicionei o id="btnDeleteDiario" no botão de excluir para facilitar
  const htmlDiario = `
        <div class="diary-entry">
            <p>${textoDiario.replace(/\n/g, "<br>")}</p>
            <div class="entry-actions">
                <button class="btn-action btn-edit" id="btnEditDiario">Editar</button>
                <button class="btn-action btn-delete" id="btnDeleteDiario">Excluir</button>
            </div>
        </div>
    `;
  container.innerHTML = htmlDiario;

  // Configura botão EDITAR (Mantive sua lógica)
  document
    .getElementById("btnEditDiario")
    .addEventListener("click", () => mostrarEditorDiario(container));

  // Configura botão EXCLUIR ---
  document.getElementById("btnDeleteDiario").addEventListener("click", () => {
    // Pergunta de confirmação
    if (
      confirm("Tem certeza que deseja excluir este diário permanentemente?")
    ) {
      // Remove do "banco de dados" (simulação)

      alert("Registro excluído com sucesso!");

      // Redireciona para a página inicial
      window.location.href = "pagina_progresso_inicio.html";
    }
  });
}

async function mostrarEditorDiario(container) {
  const progAtual = progressos.find((prog) => prog.data == diaAtualKey);
  const textoDiario = progAtual.diario;
  const htmlEditor = `
        <div class="diary-entry">
            <textarea class="diary-edit-area">${textoDiario}</textarea>
            <div class="entry-actions">
                <button class="btn-action btn-edit btn-save">Salvar</button>
                <button class="btn-action btn-delete btn-cancel">Cancelar</button>
            </div>
        </div>
    `;
  container.innerHTML = htmlEditor;

  container.querySelector(".btn-save").addEventListener("click", async () => {
    const progressoNv = {
      data: progAtual.data,
      dataFormatada: progAtual.dataFormatada,
      diario: container.querySelector(".diary-edit-area").value,
      id: progAtual.id,
      user_id: progAtual.user_id,
    };
    try {
      await fetch(API_URL + `/progressos/${progressoNv.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progressoNv),
      });

      await receberProgressos();
      carregarDiario(container);
    } catch (e) {
      console.error(e);
    }
  });
  container
    .querySelector(".btn-cancel")
    .addEventListener("click", () => carregarDiario(container));
}
const perguntas = [
  { id: "geral", texto: "De forma geral, como você está se sentindo agora?" },
  { id: "sono", texto: "Como está a qualidade do seu sono recentemente?" },
  { id: "energia", texto: "Como está seu nível de energia hoje?" },
  { id: "ansiedade", texto: "Como está seu nível de ansiedade hoje?" },
  {
    id: "social",
    texto: "Como você se sente em relação a contato com outras pessoas hoje?",
  },
];

const escala = [
  { valor: 1, emoji: "😫", label: "Muito mal" },
  { valor: 2, emoji: "😔", label: "Mal" },
  { valor: 3, emoji: "😐", label: "Ok" },
  { valor: 4, emoji: "🙂", label: "Bem" },
  { valor: 5, emoji: "😄", label: "Muito bem" },
];
function carregarHumor(container) {
  if (humores.length > 0) {
    const respostas = humores[0].respostas;

    container.innerHTML = respostas
      .map(
        (resp) => `
            <div class='humor-resposta'>
                <h1>${perguntas.find((per) => per.id == resp.perguntaId).texto}</h1>
                <p>${escala.find((esc) => esc.valor == resp.valor).emoji}</p>
                <h2>${escala.find((esc) => esc.valor == resp.valor).label}</h2>
            </div>
            `,
      )
      .join("");
  }
}

function configurarAbas() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active-tab"));
      button.classList.add("active-tab");

      tabPanels.forEach((panel) => panel.classList.remove("active-content"));
      const targetId = button.getAttribute("data-target");
      document.getElementById(targetId).classList.add("active-content");
    });
  });

  // Ativa a primeira aba se existir
  const defaultTab = document.querySelector(
    '.tab-button[data-target="diario"]',
  );
  if (defaultTab) defaultTab.click();
}
