// =========================
// CONFIG
// =========================
const API_URL = window.API_URL;

// =========================
// ESTADO GLOBAL
// =========================
const state = {
  usuario: null,
  hojeISO: null,
  diaSelecionado: null,
  diariosSemana: [],
};

// =========================
// ELEMENTOS UI
// =========================
const UI = {
  form: document.getElementById("formDiario"),
  dataInput: document.getElementById("data"),
  dataTexto: document.getElementById("data-formatada"),
  pageNumber: document.getElementById("page-number"),
  week: document.getElementById("diario-week"),
  textarea: document.getElementById("conteudo"),

  setDataTexto(texto) {
    this.dataTexto.textContent = texto;
  },

  setTexto(valor) {
    this.textarea.value = valor;
  },

  setPlaceholder(texto) {
    this.textarea.placeholder = texto;
  },

  travarEdicao(travar) {
    this.textarea.readOnly = travar;
    this.textarea.style.opacity = travar ? 0.6 : 1;
  },

  limparSemana() {
    this.week.innerHTML = "";
  },

  criarDot(dataISO, isHoje) {
    const dot = document.createElement("div");
    dot.classList.add("day-dot");

    if (isHoje) {
      dot.classList.add("today");
    }

    dot.dataset.date = dataISO;
    return dot;
  },

  marcarDot(dot, estado) {
    dot.classList.remove("active", "filled", "empty");
    dot.classList.add(estado);
  },
};
function getQueryData() {
  const params = new URLSearchParams(window.location.search);
  return params.get("data");
}

// =========================
// SERVIÇO DE TEMPO
// =========================
const TimeService = {
  async getHojeISO() {
    try {
      const resp = await fetch(`${API_URL}/time`);
      const data = await resp.json();
      return data.iso.split("T")[0];
    } catch {
      const hoje = new Date();
      return this.formatISO(hoje);
    }
  },

  formatISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  },

  formatarTexto(dataISO) {
    const [y, m, d] = dataISO.split("-");
    const date = new Date(y, m - 1, d); // local, sem UTC
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  },

  gerarUltimos7Dias(baseISO) {
    const [y, m, d] = baseISO.split("-").map(Number);
    const base = new Date(y, m - 1, d); // local, sem UTC

    const dias = [];

    for (let i = 6; i >= 0; i--) {
      const dt = new Date(base);
      dt.setDate(base.getDate() - i);

      const ano = dt.getFullYear();
      const mes = String(dt.getMonth() + 1).padStart(2, "0");
      const dia = String(dt.getDate()).padStart(2, "0");

      dias.push(`${ano}-${mes}-${dia}`);
    }

    return dias;
  },
};

// =========================
// SERVIÇO DE API
// =========================
const DiarioAPI = {
  async listar(userId) {
    const resp = await fetch(`${API_URL}/progressos?user_id=${userId}`);
    return resp.json();
  },
  async atualizar(id, payload) {
    return fetch(`${API_URL}/progressos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  async salvar(payload) {
    return fetch(`${API_URL}/progressos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },
};

// =========================
// CONTROLLER
// =========================
const DiarioController = {
  async init() {
    this.carregarUsuario();
    const hoje = await TimeService.getHojeISO();
    const queryData = getQueryData();

    state.hojeISO = hoje;
    state.diaSelecionado = queryData || hoje;

    UI.dataInput.value = state.diaSelecionado;
    UI.setDataTexto(TimeService.formatarTexto(state.diaSelecionado));

    this.renderSemana();
    await this.carregarDiarios();
    await this.carregarNumeroPagina();
    this.bind();
    this.selecionarDia(state.diaSelecionado);
  },

  carregarUsuario() {
    const json =
      sessionStorage.getItem("usuarioLogado") ||
      localStorage.getItem("usuarioLogado");

    if (!json) {
      alert("Você precisa estar logado.");
      window.location.href = "login.html";
      return;
    }

    state.usuario = JSON.parse(json);
  },

  bind() {
    UI.form.addEventListener("submit", (e) => this.salvar(e));
  },

  renderSemana() {
    UI.limparSemana();

    const dias = TimeService.gerarUltimos7Dias(state.hojeISO);

    dias.forEach((iso) => {
      const isHoje = iso === state.hojeISO;
      const dot = UI.criarDot(iso, isHoje);

      dot.title = TimeService.formatarTexto(iso);

      dot.addEventListener("click", () => this.selecionarDia(iso));

      UI.week.appendChild(dot);
    });
  },

  async carregarDiarios() {
    try {
      state.diariosSemana = await DiarioAPI.listar(state.usuario.id);
      this.marcarDias();
    } catch (e) {
      console.error("Erro ao carregar diários", e);
    }
  },

  marcarDias() {
    const dots = document.querySelectorAll(".day-dot");

    dots.forEach((dot) => {
      const data = dot.dataset.date;
      const existe = state.diariosSemana.find(
        (d) => d.data.slice(0, 10) === data,
      );

      if (existe) {
        UI.marcarDot(dot, "filled");
      } else {
        UI.marcarDot(dot, "empty");
      }
    });
  },

  selecionarDia(dataISO) {
    const dots = document.querySelectorAll(".day-dot");
    dots.forEach((d) => d.classList.remove("active"));

    const dot = [...dots].find((d) => d.dataset.date === dataISO);
    if (dot) dot.classList.add("active");

    state.diaSelecionado = dataISO;
    UI.dataInput.value = dataISO;
    UI.setDataTexto(TimeService.formatarTexto(dataISO));

    const diario = state.diariosSemana.find(
      (d) => d.data.slice(0, 10) === dataISO,
    );

    if (diario) {
      UI.setTexto(diario.diario);
      UI.setPlaceholder("");
    } else {
      UI.setTexto("");
      UI.setPlaceholder(
        "Nenhum registro neste dia. Que tal escrever algo para hoje?",
      );
    }

    const ehHoje = dataISO === state.hojeISO;
    UI.travarEdicao(!ehHoje);
  },

  async carregarNumeroPagina() {
    try {
      const lista = await DiarioAPI.listar(state.usuario.id);
      UI.pageNumber.textContent = lista.length + 1;
    } catch {
      UI.pageNumber.textContent = "—";
    }
  },

  async salvar(e) {
    e.preventDefault();
    const existente = state.diariosSemana.find(
      (d) => d.data.slice(0, 10) === state.diaSelecionado,
    );

    const payload = {
      pagina: Number(UI.pageNumber.textContent),
      data: state.diaSelecionado,
      dataFormatada: UI.dataTexto.textContent,
      diario: UI.textarea.value,
      user_id: state.usuario.id,
    };
    if (state.diaSelecionado !== state.hojeISO) {
      alert("Você só pode escrever no diário de hoje.");
      return;
    }

    try {
      if (existente) {
        await DiarioAPI.atualizar(existente.id, payload);
      } else {
        await DiarioAPI.salvar(payload);
      }

      window.location.href = "paginainicial.html#progresso";
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar o diário.");
    }
  },
};

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
  DiarioController.init();
});
