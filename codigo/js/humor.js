// URL base do JSON Server
const API_URL = window.API_URL;

// Tenta pegar usuário logado da SESSÃO
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
  alert("Você precisa estar logado para responder seu humor.");
  window.location.href = "login.html";
}

// Perguntas de bem-estar
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

// Escala de humor (1 = pior, 5 = melhor)
const escala = [
  { valor: 1, emoji: "😫", label: "Muito mal" },
  { valor: 2, emoji: "😔", label: "Mal" },
  { valor: 3, emoji: "😐", label: "Ok" },
  { valor: 4, emoji: "🙂", label: "Bem" },
  { valor: 5, emoji: "😄", label: "Muito bem" },
];

const perguntasContainer = document.getElementById("perguntas-container");
const form = document.getElementById("humor-form");
const statusEl = document.getElementById("status");
const btnProximo = document.getElementById("btn-proximo");

// Guarda as respostas: { [perguntaId]: numeroDe1a5 }
let respostas = {};
let jaRespondeuHoje = false;
let dataHoje = null;

// Helper pra data de hoje em yyyy-mm-dd
function getDataHoje() {
  const agora = new Date();
  const yyyy = agora.getFullYear();
  const mm = String(agora.getMonth() + 1).padStart(2, "0");
  const dd = String(agora.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Renderiza as perguntas e emojis na tela
function montarPerguntas() {
  perguntasContainer.innerHTML = "";

  perguntas.forEach((pergunta) => {
    const card = document.createElement("div");
    card.className = "pergunta-card";

    card.innerHTML = `
      <p class="pergunta-texto">${pergunta.texto}</p>
      <div class="opcoes" data-pergunta-id="${pergunta.id}">
        ${escala
          .map(
            (item) => `
          <button
            type="button"
            class="emoji-btn"
            data-valor="${item.valor}"
            aria-label="${item.label}"
          >
            <span class="emoji">${item.emoji}</span>
            <span class="valor">${item.valor}</span>
          </button>
        `,
          )
          .join("")}
      </div>
    `;

    perguntasContainer.appendChild(card);
  });
}

function setStatus(mensagem, tipo) {
  statusEl.textContent = mensagem || "";
  statusEl.className = "status " + (tipo || "");
}

// Aplica visualmente um registro já salvo (marca os emojis)
function aplicarRegistroNoFormulario(registro) {
  if (!registro || !Array.isArray(registro.respostas)) return;

  registro.respostas.forEach((r) => {
    const perguntaId = r.perguntaId;
    const valor = Number(r.valor);

    // guarda também em "respostas" pra manter a estrutura
    respostas[perguntaId] = valor;

    const opcoesDiv = perguntasContainer.querySelector(
      `.opcoes[data-pergunta-id="${perguntaId}"]`,
    );
    if (!opcoesDiv) return;

    opcoesDiv.querySelectorAll(".emoji-btn").forEach((btn) => {
      btn.classList.remove("selecionado");
    });

    const btnSelecionado = opcoesDiv.querySelector(
      `.emoji-btn[data-valor="${valor}"]`,
    );
    if (btnSelecionado) {
      btnSelecionado.classList.add("selecionado");
    }
  });
}

// Desabilita interação (quando já respondeu hoje)
function desativarInteracao() {
  jaRespondeuHoje = true;

  perguntasContainer
    .querySelectorAll(".emoji-btn")
    .forEach((btn) => (btn.disabled = true));

  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  // mostra o botão Próximo quando já respondeu hoje
  if (btnProximo) {
    btnProximo.style.display = "inline-flex";
  }
}

// Verifica no servidor se já existe registro de humor hoje
async function verificarRegistroHoje() {
  dataHoje = getDataHoje();

  try {
    const resp = await fetch(
      `${API_URL}/registrosHumor?usuarioId=${encodeURIComponent(
        usuarioLogado.id,
      )}&data=${encodeURIComponent(dataHoje)}&_limit=1`,
    );

    if (!resp.ok) throw new Error("Erro ao verificar registro de humor.");

    const registros = await resp.json();

    if (registros.length > 0) {
      // já respondeu hoje → mostra o que foi respondido e trava
      const registro = registros[0];
      setStatus(
        "Você já registrou seu humor hoje. Estas foram suas respostas:",
        "info",
      );
      aplicarRegistroNoFormulario(registro);
      desativarInteracao();
    } else {
      setStatus("Como você está hoje?", "info");
      // aqui o botão Próximo continua escondido; ele só aparece se já respondeu hoje
    }
  } catch (error) {
    console.error(error);
    setStatus(
      "Não foi possível verificar seus registros de humor. Tente novamente mais tarde.",
      "error",
    );
  }
}

// Clique nos emojis (delegação de evento)
perguntasContainer.addEventListener("click", (event) => {
  if (jaRespondeuHoje) return; // trava se já respondeu

  const btn = event.target.closest(".emoji-btn");
  if (!btn) return;

  const valor = Number(btn.dataset.valor);
  const opcoesDiv = btn.closest(".opcoes");
  const perguntaId = opcoesDiv.dataset.perguntaId;

  // Marca a resposta na memória
  respostas[perguntaId] = valor;

  // Visualmente, marca o botão selecionado
  opcoesDiv.querySelectorAll(".emoji-btn").forEach((b) => {
    b.classList.remove("selecionado");
  });
  btn.classList.add("selecionado");
});

// Envio do formulário (primeira resposta do dia)
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (jaRespondeuHoje) {
    setStatus(
      "Você já respondeu seu humor hoje. Use o botão Próximo para continuar.",
      "error",
    );
    return;
  }

  // Verifica se todas as perguntas foram respondidas
  const todasRespondidas = perguntas.every(
    (p) => respostas[p.id] !== undefined,
  );

  if (!todasRespondidas) {
    setStatus("Responda todas as perguntas antes de salvar.", "error");
    return;
  }

  const usuarioId = usuarioLogado.id;
  const agora = new Date();
  const dataDia = dataHoje || getDataHoje();

  const payload = {
    usuarioId,
    data: dataDia, // yyyy-mm-dd
    dataHora: agora.toISOString(),
    respostas: perguntas.map((p) => ({
      perguntaId: p.id,
      valor: respostas[p.id],
    })),
  };

  try {
    setStatus("Salvando seu registro...", "info");
    form.querySelector('button[type="submit"]').disabled = true;

    const resp = await fetch(`${API_URL}/registrosHumor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      throw new Error("Erro ao salvar no servidor");
    }

    sessionStorage.setItem("ultimoRegistroHumor", JSON.stringify(payload));

    // Depois de salvar, segue para o próximo passo: novo diário
    window.location.href = "novo_diario.html";
  } catch (error) {
    console.error(error);
    setStatus(
      "Erro ao salvar. Verifique o JSON Server e tente novamente.",
      "error",
    );
    form.querySelector('button[type="submit"]').disabled = false;
  }
});

// Clique no botão Próximo (quando já respondeu hoje)
if (btnProximo) {
  btnProximo.addEventListener("click", () => {
    // aqui você pode mandar direto pro diário do dia atual
    window.location.href = "novo_diario.html";
    // ou, se quiser já mandar para a página de progresso:
    // window.location.href = `pagina_progresso.html?data=${encodeURIComponent(dataHoje || getDataHoje())}`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  montarPerguntas(); // cria os botões na tela
  verificarRegistroHoje(); // vê se já respondeu hoje e, se sim, marca e mostra Próximo
});
