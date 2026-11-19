/**
 * Formulário de agendamento: máscara, validação, feedback e envio demonstrativo.
 * Sem backend: a "submissão" é simulada e oferece a mensagem pronta para o WhatsApp.
 */
(function () {
  "use strict";

  var form = document.getElementById("form-agendamento");
  if (!form) return;

  var modal = document.getElementById("modal-agendamento");
  var sucesso = modal.querySelector("[data-success]");
  var botao = form.querySelector("[data-submit]");
  var botaoLabel = botao.querySelector("[data-submit-label]");
  var botaoIcone = botao.querySelector("[data-submit-icon]");
  var campoFamiliar = form.querySelector('[data-field="nomePaciente"]');
  var contador = form.querySelector("[data-counter]");

  var ROTULOS = {
    paciente: { mim: "Para mim", familiar: "Para um familiar" },
    modalidade: { consultorio: "Consultório (Centro Médico Jardins)", domiciliar: "Consulta domiciliar", telemedicina: "Telemedicina" },
    periodo: { manha: "Manhã", tarde: "Tarde", indiferente: "Qualquer período" }
  };

  /* ---------------- Máscara de telefone (BR) ---------------- */
  var tel = form.elements.telefone;
  tel.addEventListener("input", function () {
    var d = tel.value.replace(/\D/g, "").slice(0, 11);
    var out = d;
    if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length > 6) {
      var corte = d.length === 11 ? 7 : 6;
      out = "(" + d.slice(0, 2) + ") " + d.slice(2, corte) + " " + d.slice(corte);
    }
    tel.value = out;
  });

  /* ---------------- Campo condicional ---------------- */
  form.elements.paciente.addEventListener("change", function () {
    var familiar = this.value === "familiar";
    campoFamiliar.hidden = !familiar;
    form.elements.nomePaciente.required = familiar;
    if (!familiar) limparErro("nomePaciente");
  });

  form.elements.mensagem.addEventListener("input", function () {
    contador.textContent = String(this.value.length);
  });

  /* ---------------- Regras de validação ---------------- */
  function validar(nome) {
    var el = form.elements[nome];
    var v = el.type === "checkbox" ? el.checked : (el.value || "").trim();

    switch (nome) {
      case "nome":
        if (!v) return "Informe seu nome.";
        if (v.split(/\s+/).length < 2 || v.length < 5) return "Informe nome e sobrenome.";
        return "";
      case "telefone":
        var dig = v.replace(/\D/g, "");
        if (!dig) return "Informe um telefone para contato.";
        if (dig.length < 10 || dig.length > 11) return "Telefone incompleto. Use DDD + número.";
        if (dig.length === 11 && dig[2] !== "9") return "Celular deve começar com 9 após o DDD.";
        return "";
      case "email":
        if (!v) return "";
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "E-mail inválido. Ex.: nome@email.com";
      case "paciente":
        return v ? "" : "Selecione para quem é a consulta.";
      case "nomePaciente":
        if (campoFamiliar.hidden) return "";
        return v.length >= 3 ? "" : "Informe o nome do familiar.";
      case "modalidade":
        return v ? "" : "Selecione a forma de atendimento.";
      case "periodo":
        return v ? "" : "Selecione o período de preferência.";
      case "consentimento":
        return v ? "" : "É preciso autorizar o contato para prosseguir.";
      default:
        return "";
    }
  }

  var CAMPOS = ["nome", "telefone", "email", "paciente", "nomePaciente", "modalidade", "periodo", "consentimento"];

  function caixa(nome) { return form.querySelector('[data-field="' + nome + '"]'); }

  function mostrarErro(nome, msg) {
    var box = caixa(nome);
    if (!box) return;
    box.classList.add("has-error");
    box.querySelector("[data-msg]").textContent = msg;
    form.elements[nome].setAttribute("aria-invalid", "true");
  }
  function limparErro(nome) {
    var box = caixa(nome);
    if (!box) return;
    box.classList.remove("has-error");
    form.elements[nome].removeAttribute("aria-invalid");
  }
  function checar(nome) {
    var msg = validar(nome);
    if (msg) mostrarErro(nome, msg); else limparErro(nome);
    return !msg;
  }

  // Valida ao sair do campo e revalida enquanto o usuário corrige
  CAMPOS.forEach(function (nome) {
    var el = form.elements[nome];
    el.addEventListener("blur", function () {
      if (el.type === "checkbox") return;
      if ((el.value || "").trim() || caixa(nome).classList.contains("has-error")) checar(nome);
    });
    el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", function () {
      if (caixa(nome).classList.contains("has-error")) checar(nome);
    });
  });

  /* ---------------- Envio (simulado) ---------------- */
  function carregando(ativo) {
    botao.disabled = ativo;
    botao.setAttribute("aria-busy", String(ativo));
    botaoLabel.textContent = ativo ? "Enviando…" : "Solicitar agendamento";
    if (ativo) {
      botaoIcone.outerHTML = '<span class="spinner" data-submit-icon aria-hidden="true"></span>';
    } else {
      botao.querySelector("[data-submit-icon]").outerHTML = '<span class="icon icon--20" aria-hidden="true" data-submit-icon>event_available</span>';
    }
    botaoIcone = botao.querySelector("[data-submit-icon]");
  }

  function montarMensagem(dados) {
    var linhas = [
      "Olá! Gostaria de agendar uma consulta com o Dr. Alexandre Constantino.",
      "",
      "Nome: " + dados.nome,
      "Telefone: " + dados.telefone
    ];
    if (dados.email) linhas.push("E-mail: " + dados.email);
    linhas.push("Consulta: " + ROTULOS.paciente[dados.paciente] + (dados.nomePaciente ? " (" + dados.nomePaciente + ")" : ""));
    linhas.push("Atendimento: " + ROTULOS.modalidade[dados.modalidade]);
    linhas.push("Período: " + ROTULOS.periodo[dados.periodo]);
    if (dados.mensagem) linhas.push("Motivo: " + dados.mensagem);
    return linhas.join("\n");
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var primeiroErro = null;
    CAMPOS.forEach(function (nome) {
      if (!checar(nome) && !primeiroErro) primeiroErro = form.elements[nome];
    });
    if (primeiroErro) {
      var gatilho = primeiroErro.id && document.getElementById(primeiroErro.id + "-btn");
      (gatilho || primeiroErro).focus();
      window.UI && UI.toast("Revise os campos destacados.");
      return;
    }

    var dados = {};
    ["nome", "telefone", "email", "paciente", "nomePaciente", "modalidade", "periodo", "mensagem"].forEach(function (n) {
      dados[n] = (form.elements[n].value || "").trim();
    });
    if (dados.paciente !== "familiar") dados.nomePaciente = "";

    carregando(true);
    setTimeout(function () {
      carregando(false);
      sucesso.querySelector("[data-success-name]").textContent = dados.nome.split(" ")[0];
      sucesso.querySelector("[data-success-whatsapp]").href = UI.whatsappUrl(montarMensagem(dados));
      form.hidden = true;
      sucesso.hidden = false;
      sucesso.focus();
    }, 1200);
  });

  function reiniciar() {
    form.reset();
    CAMPOS.forEach(limparErro);
    campoFamiliar.hidden = true;
    form.elements.nomePaciente.required = false;
    contador.textContent = "0";
    form.hidden = false;
    sucesso.hidden = true;
  }

  sucesso.querySelector("[data-form-reset]").addEventListener("click", function () {
    reiniciar();
    form.elements.nome.focus();
  });

  // Ao reabrir depois de um envio concluído, começa um formulário novo
  modal.addEventListener("modal:open", function () {
    if (!sucesso.hidden) reiniciar();
  });
})();
