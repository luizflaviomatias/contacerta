// Ponto de composição: cria as dependências, liga a interface às regras e guarda o estado da tela.
import { criarAnoConformePlanilha } from './dados/modeloPlanilha.js';
import { criarRepositorioOrcamento } from './dados/repositorioOrcamento.js';
import {
  ErroLancamentoInvalido, adicionarLancamento, alterarLancamento, criarLancamento,
  intervaloDaQuinzena, removerLancamento, resumirAno,
} from './dominio/orcamento.js';
import { criarDialogoLancamento } from './ui/dialogoLancamento.js';
import { criarGradeQuinzenas } from './ui/gradeQuinzenas.js';
import { criarPainelAnual } from './ui/painelAnual.js';
import { criarSeletorDeMes } from './ui/seletorDeMes.js';

const hoje = new Date();
const estado = {
  ano: hoje.getFullYear(),
  mes: hoje.getMonth(),
  anoDoPainel: hoje.getFullYear(),
};

const repositorio = criarRepositorioOrcamento({
  armazenamento: obterArmazenamentoDoAparelho(),
  criarAnoInicial: (ano) => criarAnoConformePlanilha(ano, gerarId),
});

const seletorDeMes = criarSeletorDeMes(document.getElementById('seletor-mes'), {
  aoSelecionarMes: selecionarMes,
  aoTrocarAno: trocarAno,
});
const grade = criarGradeQuinzenas(document.getElementById('quinzenas'), {
  aoAlterarValor: (id, valorCentavos) => atualizarLancamento(id, { valorCentavos }),
  aoAlterarDescricao: (id, descricao) => atualizarLancamento(id, { descricao }),
  aoExcluir: excluirLancamento,
  aoAdicionar: incluirLancamento,
});
const painelAnual = criarPainelAnual(document.getElementById('painel-anual'), { aoTrocarAno: trocarAnoDoPainel });
const dialogo = criarDialogoLancamento(document.getElementById('dialogo-lancamento'));

function lancamentosDoMes() {
  return repositorio.obterMes(estado.ano, estado.mes);
}

function salvarMes(lancamentos) {
  repositorio.salvarMes(estado.ano, estado.mes, lancamentos);
}

function renderizarMes() {
  const ehAnoAtual = estado.ano === hoje.getFullYear();
  seletorDeMes.renderizar({
    ano: estado.ano,
    mesSelecionado: estado.mes,
    mesAtual: ehAnoAtual ? hoje.getMonth() : undefined,
  });
  grade.renderizar({ ano: estado.ano, mes: estado.mes, lancamentos: lancamentosDoMes() });
}

function renderizarPainelAnual() {
  painelAnual.renderizar({ ano: estado.anoDoPainel, resumo: resumirAno(repositorio.obterAno(estado.anoDoPainel)) });
}

function selecionarMes(mes) {
  estado.mes = mes;
  renderizarMes();
}

function trocarAno(deslocamento) {
  estado.ano += deslocamento;
  renderizarMes();
}

function trocarAnoDoPainel(deslocamento) {
  estado.anoDoPainel += deslocamento;
  renderizarPainelAnual();
}

function atualizarLancamento(id, alteracoes) {
  try {
    const lancamentos = alterarLancamento(lancamentosDoMes(), id, alteracoes);
    salvarMes(lancamentos);
    grade.atualizarTotais(lancamentos);
  } catch (erro) {
    if (!(erro instanceof ErroLancamentoInvalido)) throw erro;
    renderizarMes();
  }
}

function excluirLancamento(id) {
  const lancamento = lancamentosDoMes().find((item) => item.id === id);
  if (!window.confirm(`Excluir "${lancamento.descricao}"?`)) return;
  salvarMes(removerLancamento(lancamentosDoMes(), id));
  renderizarMes();
}

async function incluirLancamento(tipo, quinzena) {
  const intervalo = intervaloDaQuinzena(quinzena, estado.ano, estado.mes);
  const digitado = await dialogo.abrir({ tipo, intervalo, diaSugerido: intervalo.primeiroDia });
  if (!digitado) return;

  try {
    const dia = Math.min(Math.max(digitado.dia, intervalo.primeiroDia), intervalo.ultimoDia);
    const novo = criarLancamento({ ...digitado, dia, tipo, id: gerarId() });
    salvarMes(adicionarLancamento(lancamentosDoMes(), novo));
    renderizarMes();
  } catch (erro) {
    if (!(erro instanceof ErroLancamentoInvalido)) throw erro;
    window.alert('Preencha a descrição do lançamento.');
  }
}

function configurarAbas() {
  const botoes = document.querySelectorAll('[data-aba]');
  for (const botao of botoes) {
    botao.addEventListener('click', () => {
      for (const outro of botoes) {
        const ativo = outro === botao;
        outro.setAttribute('aria-selected', String(ativo));
        document.getElementById(outro.getAttribute('aria-controls')).hidden = !ativo;
      }
      if (botao.dataset.aba === 'anual') {
        estado.anoDoPainel = estado.ano;
        renderizarPainelAnual();
      }
      window.scrollTo(0, 0);
    });
  }
}

function gerarId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** No modo privado do Safari o localStorage pode falhar: aí os dados ficam só em memória. */
function obterArmazenamentoDoAparelho() {
  try {
    const chaveDeTeste = 'orcamento-quinzenal:teste';
    window.localStorage.setItem(chaveDeTeste, '1');
    window.localStorage.removeItem(chaveDeTeste);
    return window.localStorage;
  } catch {
    const memoria = new Map();
    return { getItem: (chave) => memoria.get(chave) ?? null, setItem: (chave, valor) => memoria.set(chave, valor) };
  }
}

/** No APK os arquivos já vêm dentro do app; o service worker só serve à versão web. */
function registrarFuncionamentoOffline() {
  const ehAppNativo = window.Capacitor?.isNativePlatform?.() ?? false;
  if (!ehAppNativo && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
}

configurarAbas();
renderizarMes();
registrarFuncionamentoOffline();
