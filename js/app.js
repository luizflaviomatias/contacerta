// Ponto de composição: cria as dependências, liga a interface às regras e guarda o estado da tela.
import { criarAnoConformePlanilha } from './dados/modeloPlanilha.js';
import { MODO, criarPreferencias } from './dados/preferencias.js';
import { criarRepositorioOrcamento } from './dados/repositorioOrcamento.js';
import { compararMeses } from './dominio/comparacaoDeMeses.js';
import { resumirContasAPagar } from './dominio/contasAPagar.js';
import {
  ErroLancamentoInvalido, adicionarLancamento, alterarLancamento, copiarLancamentosParaMes, criarLancamento,
  deslocarMes, mesesSeguintes, periodoDoDia, removerLancamento, resumirAno,
} from './dominio/orcamento.js';
import { aplicarTextosNaPagina, criarLocalizacao } from './i18n/localizacao.js';
import { criarAviso } from './ui/aviso.js';
import { criarDialogoCopia } from './ui/dialogoCopia.js';
import { criarDialogoLancamento } from './ui/dialogoLancamento.js';
import { criarGradeDoMes } from './ui/gradeDoMes.js';
import { criarMenuLateral } from './ui/menuLateral.js';
import { criarPainelAnual } from './ui/painelAnual.js';
import { criarPainelComparacao } from './ui/painelComparacao.js';
import { criarPainelContasAPagar } from './ui/painelContasAPagar.js';
import { criarSeletorDeIdioma } from './ui/seletorDeIdioma.js';
import { criarSeletorDeMes } from './ui/seletorDeMes.js';

const MESES_OFERECIDOS_NA_COPIA = 12;

const hoje = new Date();
const armazenamento = obterArmazenamentoDoAparelho();
const repositorio = criarRepositorioOrcamento({
  armazenamento,
  criarAnoInicial: (ano) => criarAnoConformePlanilha(ano, gerarId, modeloDoAnoNovo()),
});
const preferencias = criarPreferencias({
  armazenamento,
  idiomasDoAparelho: navigator.languages ?? [navigator.language],
  jaUsavaOApp: repositorio.existeAnoSalvo(hoje.getFullYear()) || repositorio.existeAnoSalvo(hoje.getFullYear() - 1),
});
const local = criarLocalizacao(preferencias.obter());

const estado = {
  ano: hoje.getFullYear(),
  mes: hoje.getMonth(),
  periodo: periodoDoDia(modoDeControle(), hoje.getDate()),
  anoDoPainel: hoje.getFullYear(),
  tela: 'mes',
};

const seletorDeMes = criarSeletorDeMes(document.getElementById('seletor-mes'), {
  local,
  aoSelecionarMes: selecionarMes,
  aoTrocarAno: trocarAno,
});
const grade = criarGradeDoMes(document.getElementById('grade-do-mes'), {
  local,
  aoAlterarValor: (id, valorCentavos) => atualizarLancamento(id, { valorCentavos }),
  aoAlterarDescricao: (id, descricao) => atualizarLancamento(id, { descricao }),
  aoMarcarPagamento: marcarPagamento,
  aoExcluir: excluirLancamento,
  aoAdicionar: incluirLancamento,
  aoTrocarPeriodo: trocarPeriodo,
});
const painelContas = criarPainelContasAPagar(document.getElementById('painel-contas'), {
  local,
  aoTrocarMes: trocarMesNaTela,
  aoMarcarPagamento: marcarPagamento,
});
const painelComparacao = criarPainelComparacao(document.getElementById('painel-comparacao'), {
  local,
  aoTrocarMes: trocarMesNaTela,
});
const painelAnual = criarPainelAnual(document.getElementById('painel-anual'), { local, aoTrocarAno: trocarAnoDoPainel });
const menuLateral = criarMenuLateral(document.getElementById('menu-lateral'), document.getElementById('botao-menu'), {
  aoEscolherTela: abrirTela,
  aoAlterarPreferencia: alterarPreferencia,
});
const seletorDeIdioma = criarSeletorDeIdioma(document.getElementById('seletor-de-idioma'), {
  local,
  aoEscolherIdioma: (idioma) => alterarPreferencia('idioma', idioma),
});
const dialogoLancamento = criarDialogoLancamento(document.getElementById('dialogo-lancamento'), { local });
const dialogoCopia = criarDialogoCopia(document.getElementById('dialogo-copia'), { local });
const aviso = criarAviso(document.getElementById('aviso'));
const tituloDoMes = document.getElementById('titulo-mes');
document.getElementById('botao-copiar-mes').addEventListener('click', copiarMesParaSeguintes);

/** Enquanto a pessoa não escolheu, o app mostra o modo quinzenal (o de quem já usava). */
function modoDeControle() {
  return preferencias.obter().modo ?? MODO.QUINZENAL;
}

/** Anos ainda não abertos nascem no idioma e no modo atuais. */
function modeloDoAnoNovo() {
  return { idioma: preferencias.obter().idioma, modo: modoDeControle() };
}

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
  tituloDoMes.textContent = local.mesEAno(estado);
  grade.renderizar({
    modo: modoDeControle(),
    ano: estado.ano,
    mes: estado.mes,
    lancamentos: lancamentosDoMes(),
    periodoAtivo: estado.periodo,
  });
}

function trocarPeriodo(periodo) {
  estado.periodo = periodo;
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
  aviso.mostrar(local.t('copia.concluida', { n: destinos.length }));
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
  if (!window.confirm(local.t('lancamento.confirmarExclusao', { descricao: lancamento.descricao }))) return;
  salvarMes(removerLancamento(lancamentosDoMes(), id));
  renderizarMes();
}

/** @param {{ primeiroDia: number, ultimoDia: number }} intervalo dias do período onde o botão foi tocado */
async function incluirLancamento(tipo, intervalo) {
  const digitado = await dialogoLancamento.abrir({ tipo, intervalo, diaSugerido: intervalo.primeiroDia });
  if (!digitado) return;

  try {
    const dia = Math.min(Math.max(digitado.dia, intervalo.primeiroDia), intervalo.ultimoDia);
    const novo = criarLancamento({ ...digitado, dia, tipo, id: gerarId() });
    salvarMes(adicionarLancamento(lancamentosDoMes(), novo));
    renderizarMes();
  } catch (erro) {
    if (!(erro instanceof ErroLancamentoInvalido)) throw erro;
    window.alert(local.t('dialogo.erroDescricao'));
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

function alterarPreferencia(nome, valor) {
  aplicarPreferencias(preferencias.alterar({ [nome]: valor }));
  renderizarTelaAtual();
}

/** Tema, idioma, moeda e modo valem para a página inteira: textos fixos, menu e tela aberta. */
function aplicarPreferencias(atuais) {
  document.documentElement.dataset.tema = atuais.tema;
  document.documentElement.lang = atuais.idioma;
  local.configurar(atuais);
  document.getElementById('descricao-lancamentos').dataset.i18n = `menu.lancamentos.${modoDeControle()}`;
  aplicarTextosNaPagina(document, local);
  menuLateral.marcarPreferencias(atuais);
  seletorDeIdioma.renderizar(atuais.idioma);
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

aplicarPreferencias(preferencias.obter());
ouvirBotoesDeVoltar();
abrirTela('mes');
registrarFuncionamentoOffline();
