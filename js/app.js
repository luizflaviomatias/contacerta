// Ponto de composição: cria as dependências, liga a interface às regras e guarda o estado da tela.
import { criarAnoConformePlanilha } from './dados/modeloPlanilha.js';
import { criarRepositorioOrcamento } from './dados/repositorioOrcamento.js';
import { compararMeses } from './dominio/comparacaoDeMeses.js';
import { resumirContasAPagar } from './dominio/contasAPagar.js';
import {
  ErroLancamentoInvalido, adicionarLancamento, alterarLancamento, copiarLancamentosParaMes, criarLancamento,
  deslocarMes, intervaloDaQuinzena, mesesSeguintes, quinzenaDoDia, removerLancamento, resumirAno,
} from './dominio/orcamento.js';
import { criarAviso } from './ui/aviso.js';
import { criarDialogoCopia } from './ui/dialogoCopia.js';
import { criarDialogoLancamento } from './ui/dialogoLancamento.js';
import { nomeDoMes } from './ui/formatacao.js';
import { criarGradeQuinzenas } from './ui/gradeQuinzenas.js';
import { criarMenuLateral } from './ui/menuLateral.js';
import { criarPainelAnual } from './ui/painelAnual.js';
import { criarPainelComparacao } from './ui/painelComparacao.js';
import { criarPainelContasAPagar } from './ui/painelContasAPagar.js';
import { criarSeletorDeMes } from './ui/seletorDeMes.js';

const MESES_OFERECIDOS_NA_COPIA = 12;

const hoje = new Date();
const estado = {
  ano: hoje.getFullYear(),
  mes: hoje.getMonth(),
  quinzena: quinzenaDoDia(hoje.getDate()),
  anoDoPainel: hoje.getFullYear(),
  tela: 'mes',
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
  aoMarcarPagamento: marcarPagamento,
  aoExcluir: excluirLancamento,
  aoAdicionar: incluirLancamento,
  aoTrocarQuinzena: trocarQuinzena,
});
const painelContas = criarPainelContasAPagar(document.getElementById('painel-contas'), {
  aoTrocarMes: trocarMesNaTela,
  aoMarcarPagamento: marcarPagamento,
});
const painelComparacao = criarPainelComparacao(document.getElementById('painel-comparacao'), {
  aoTrocarMes: trocarMesNaTela,
});
const menuLateral = criarMenuLateral(document.getElementById('menu-lateral'), document.getElementById('botao-menu'), {
  aoEscolherTela: abrirTela,
});
const painelAnual = criarPainelAnual(document.getElementById('painel-anual'), { aoTrocarAno: trocarAnoDoPainel });
const dialogoLancamento = criarDialogoLancamento(document.getElementById('dialogo-lancamento'));
const dialogoCopia = criarDialogoCopia(document.getElementById('dialogo-copia'));
const aviso = criarAviso(document.getElementById('aviso'));
const tituloDoMes = document.getElementById('titulo-mes');
document.getElementById('botao-copiar-mes').addEventListener('click', copiarMesParaSeguintes);

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
  tituloDoMes.textContent = `${nomeDoMes(estado.mes)} de ${estado.ano}`;
  grade.renderizar({
    ano: estado.ano,
    mes: estado.mes,
    lancamentos: lancamentosDoMes(),
    quinzenaAtiva: estado.quinzena,
  });
}

function trocarQuinzena(quinzena) {
  estado.quinzena = quinzena;
  renderizarMes();
}

/** Por padrão, marca os meses que faltam no ano; os do ano seguinte ficam disponíveis, desmarcados. */
async function copiarMesParaSeguintes() {
  const origem = { ano: estado.ano, mes: estado.mes };
  const opcoes = mesesSeguintes(origem, MESES_OFERECIDOS_NA_COPIA)
    .map((destino) => ({ ...destino, marcado: destino.ano === origem.ano }));
  const destinos = await dialogoCopia.abrir({ origem, opcoes });
  if (!destinos) return;

  const lancamentosDaOrigem = lancamentosDoMes();
  for (const destino of destinos) {
    const copia = copiarLancamentosParaMes(lancamentosDaOrigem, { origem, destino, gerarId });
    repositorio.salvarMes(destino.ano, destino.mes, copia);
  }
  aviso.mostrar(destinos.length === 1 ? '1 mês recebeu a cópia.' : `${destinos.length} meses receberam a cópia.`);
}

function renderizarContas() {
  const agora = new Date();
  const hojeNoCalendario = { ano: agora.getFullYear(), mes: agora.getMonth(), dia: agora.getDate() };
  const mesAberto = { ano: estado.ano, mes: estado.mes };
  painelContas.renderizar({ ...mesAberto, resumo: resumirContasAPagar(lancamentosDoMes(), mesAberto, hojeNoCalendario) });
}

function renderizarComparacao() {
  const mes = { ano: estado.ano, mes: estado.mes };
  const mesAnterior = deslocarMes(mes, -1);
  const comparacao = compararMeses(lancamentosDoMes(), repositorio.obterMes(mesAnterior.ano, mesAnterior.mes));
  painelComparacao.renderizar({ mes, mesAnterior, comparacao });
}

function trocarMesNaTela(deslocamento) {
  Object.assign(estado, deslocarMes(estado, deslocamento));
  renderizarTelaAtual();
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

/** Marcar ou desmarcar trava a linha e muda o que falta pagar: a tela aberta é redesenhada. */
function marcarPagamento(id, pago) {
  salvarMes(alterarLancamento(lancamentosDoMes(), id, { pago }));
  renderizarTelaAtual();
}

function excluirLancamento(id) {
  const lancamento = lancamentosDoMes().find((item) => item.id === id);
  if (!window.confirm(`Excluir "${lancamento.descricao}"?`)) return;
  salvarMes(removerLancamento(lancamentosDoMes(), id));
  renderizarMes();
}

async function incluirLancamento(tipo, quinzena) {
  const intervalo = intervaloDaQuinzena(quinzena, estado.ano, estado.mes);
  const digitado = await dialogoLancamento.abrir({ tipo, intervalo, diaSugerido: intervalo.primeiroDia });
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

/** Cada tela se redesenha ao abrir, porque o mês pode ter mudado em outra. */
const RENDERIZAR_TELA = {
  mes: renderizarMes,
  contas: renderizarContas,
  comparacao: renderizarComparacao,
  anual: renderizarPainelAnual,
};

function abrirTela(nome) {
  if (nome === 'anual') estado.anoDoPainel = estado.ano;
  estado.tela = nome;
  for (const secao of document.querySelectorAll('[data-tela-conteudo]')) {
    secao.hidden = secao.dataset.telaConteudo !== nome;
  }
  menuLateral.marcarTelaAtual(nome);
  renderizarTelaAtual();
  window.scrollTo(0, 0);
}

function renderizarTelaAtual() {
  RENDERIZAR_TELA[estado.tela]();
}

/** Botões "Voltar para o mês" dentro das telas de relatório. */
function ouvirBotoesDeVoltar() {
  document.querySelector('.conteudo').addEventListener('click', (evento) => {
    const botao = evento.target.closest('.botao-voltar[data-tela]');
    if (botao) abrirTela(botao.dataset.tela);
  });
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

ouvirBotoesDeVoltar();
abrirTela('mes');
registrarFuncionamentoOffline();
