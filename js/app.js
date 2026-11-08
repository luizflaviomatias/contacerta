// Ponto de composição: cria as dependências, liga a interface às regras e guarda o estado da tela.
import { criarAnoConformePlanilha } from './dados/modeloPlanilha.js';
import { criarRepositorioOrcamento } from './dados/repositorioOrcamento.js';
import {
  ErroLancamentoInvalido, adicionarLancamento, alterarLancamento, criarLancamento,
  intervaloDaQuinzena, limitarDiaAoMes, marcadoresDoMes, quinzenaDoDia, removerLancamento, resumirAno,
} from './dominio/orcamento.js';
import { criarCalendario } from './ui/calendario.js';
import { criarDialogoLancamento } from './ui/dialogoLancamento.js';
import { criarGradeQuinzenas } from './ui/gradeQuinzenas.js';
import { criarPainelAnual } from './ui/painelAnual.js';

const hoje = new Date();
const estado = {
  ano: hoje.getFullYear(),
  mes: hoje.getMonth(),
  diaSelecionado: hoje.getDate(),
  anoDoPainel: hoje.getFullYear(),
};

const repositorio = criarRepositorioOrcamento({
  armazenamento: obterArmazenamentoDoAparelho(),
  criarAnoInicial: (ano) => criarAnoConformePlanilha(ano, gerarId),
});

const calendario = criarCalendario(document.getElementById('calendario'), {
  aoSelecionarDia: selecionarDia,
  aoTrocarMes: trocarMes,
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
  const lancamentos = lancamentosDoMes();
  const ehMesAtual = estado.ano === hoje.getFullYear() && estado.mes === hoje.getMonth();
  calendario.renderizar({
    ano: estado.ano,
    mes: estado.mes,
    diaSelecionado: estado.diaSelecionado,
    diaDeHoje: ehMesAtual ? hoje.getDate() : undefined,
    marcadores: marcadoresDoMes(lancamentos),
  });
  grade.renderizar({ ano: estado.ano, mes: estado.mes, lancamentos, diaSelecionado: estado.diaSelecionado });
}

function renderizarPainelAnual() {
  painelAnual.renderizar({ ano: estado.anoDoPainel, resumo: resumirAno(repositorio.obterAno(estado.anoDoPainel)) });
}

function selecionarDia(dia) {
  estado.diaSelecionado = dia;
  renderizarMes();
}

function trocarMes(deslocamento) {
  const primeiroDiaDoNovoMes = new Date(estado.ano, estado.mes + deslocamento, 1);
  estado.ano = primeiroDiaDoNovoMes.getFullYear();
  estado.mes = primeiroDiaDoNovoMes.getMonth();
  estado.diaSelecionado = limitarDiaAoMes(estado.diaSelecionado, estado.ano, estado.mes);
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
  const diaSugerido = quinzenaDoDia(estado.diaSelecionado) === quinzena ? estado.diaSelecionado : intervalo.primeiroDia;
  const digitado = await dialogo.abrir({ tipo, intervalo, diaSugerido });
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

function registrarFuncionamentoOffline() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
}

configurarAbas();
renderizarMes();
registrarFuncionamentoOffline();
