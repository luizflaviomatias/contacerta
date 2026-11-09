// Ponto de composição: cria as dependências, liga telas, ações e preferências, e guarda o estado da tela.
import { criarAcoesDoMes } from './acoesDoMes.js';
import {
  criarRelogio, gerarId, obterArmazenamentoDoAparelho, registrarFuncionamentoOffline,
} from './ambiente.js';
import { criarAvisoDispensado } from './dados/avisoDispensado.js';
import { criarAnoConformePlanilha } from './dados/modeloPlanilha.js';
import { criarPreferencias } from './dados/preferencias.js';
import { criarRepositorioOrcamento } from './dados/repositorioOrcamento.js';
import { compararMeses } from './dominio/comparacaoDeMeses.js';
import { resumirContasAPagar, vencimentosDoDia } from './dominio/contasAPagar.js';
import { MODO, deslocarMes, periodoDoDia, resumirAno } from './dominio/orcamento.js';
import { aplicarTextosNaPagina, criarLocalizacao } from './i18n/localizacao.js';
import { criarNavegacao } from './navegacao.js';
import { criarTratamentoDeErros } from './tratamentoDeErros.js';
import { criarAviso } from './ui/aviso.js';
import { criarDialogoConfirmacao } from './ui/dialogoConfirmacao.js';
import { criarDialogoCopia } from './ui/dialogoCopia.js';
import { criarDialogoLancamento } from './ui/dialogoLancamento.js';
import { criarFaixaDeVencimentos } from './ui/faixaDeVencimentos.js';
import { criarGradeDoMes } from './ui/gradeDoMes.js';
import { criarMenuLateral } from './ui/menuLateral.js';
import { criarPainelAnual } from './ui/painelAnual.js';
import { criarPainelComparacao } from './ui/painelComparacao.js';
import { criarPainelContasAPagar } from './ui/painelContasAPagar.js';
import { criarSeletorDeIdioma } from './ui/seletorDeIdioma.js';
import { criarSeletorDeMes } from './ui/seletorDeMes.js';
import { criarSeletorDeModo } from './ui/seletorDeModo.js';
import { criarTelaBoasVindas } from './ui/telaBoasVindas.js';
import { VERSAO_DO_APP } from './versao.js';

const elemento = (id) => document.getElementById(id);

// ── Dados e preferências ────────────────────────────────────────────────────
const relogio = criarRelogio();
const hojeNaAbertura = relogio.hoje();
const armazenamento = obterArmazenamentoDoAparelho();
const repositorio = criarRepositorioOrcamento({
  armazenamento,
  criarAnoInicial: (ano) => criarAnoConformePlanilha(ano, gerarId, modeloDoAnoNovo()),
});
const preferencias = criarPreferencias({
  armazenamento,
  idiomasDoAparelho: navigator.languages ?? [navigator.language],
  jaUsavaOApp: repositorio.existeAnoSalvo(hojeNaAbertura.ano) || repositorio.existeAnoSalvo(hojeNaAbertura.ano - 1),
});
const local = criarLocalizacao(preferencias.obter());
const avisoDispensado = criarAvisoDispensado({ armazenamento });

const estado = {
  ano: hojeNaAbertura.ano,
  mes: hojeNaAbertura.mes,
  periodo: periodoDoDia(modoDeControle(), hojeNaAbertura.dia),
  anoDoPainel: hojeNaAbertura.ano,
};

// ── Componentes de interface ────────────────────────────────────────────────
const aviso = criarAviso(elemento('aviso'));
const confirmacao = criarDialogoConfirmacao(elemento('dialogo-confirmacao'), { local });
const { proteger } = criarTratamentoDeErros({
  local, aviso, confirmacao, repositorio, aoRecuperarAno: () => navegacao.renderizarTelaAtual(),
});
const acoes = criarAcoesDoMes({
  repositorio,
  mesAberto: () => ({ ano: estado.ano, mes: estado.mes }),
  local,
  gerarId,
  dialogoLancamento: criarDialogoLancamento(elemento('dialogo-lancamento'), { local }),
  dialogoCopia: criarDialogoCopia(elemento('dialogo-copia'), { local }),
  confirmacao,
  aviso,
  aoSalvar: () => navegacao.renderizarTelaAtual(),
  aoDigitarValor: (lancamentos) => grade.atualizarTotais(lancamentos),
});

const faixaDeVencimentos = criarFaixaDeVencimentos(elemento('faixa-vencimentos'), {
  local,
  aoVerContas: () => { mudarMesSemRedesenhar(relogio.hoje()); navegacao.abrirTela('contas'); },
  aoDispensar: () => { avisoDispensado.dispensarEm(relogio.hoje()); faixaDeVencimentos.esconder(); },
});
const seletorDeMes = criarSeletorDeMes(elemento('seletor-mes'), {
  local,
  aoSelecionarMes: proteger((mes) => mudarMes({ mes })),
  aoTrocarAno: proteger((deslocamento) => mudarMes({ ano: estado.ano + deslocamento })),
});
const grade = criarGradeDoMes(elemento('grade-do-mes'), {
  local,
  aoAlterarValor: proteger(acoes.alterarValor),
  aoAlterarDescricao: proteger(acoes.alterarDescricao),
  aoMarcarPagamento: proteger(acoes.marcarPagamento),
  aoExcluir: proteger(acoes.excluir),
  aoAdicionar: proteger(acoes.incluir),
  aoTrocarPeriodo: (periodo) => { estado.periodo = periodo; navegacao.renderizarTelaAtual(); },
});
const painelContas = criarPainelContasAPagar(elemento('painel-contas'), {
  local, aoTrocarMes: proteger(deslocarMesAberto), aoMarcarPagamento: proteger(acoes.marcarPagamento),
});
const painelComparacao = criarPainelComparacao(elemento('painel-comparacao'), {
  local, aoTrocarMes: proteger(deslocarMesAberto),
});
const painelAnual = criarPainelAnual(elemento('painel-anual'), {
  local, aoTrocarAno: proteger((deslocamento) => { estado.anoDoPainel += deslocamento; navegacao.renderizarTelaAtual(); }),
});
const telaBoasVindas = criarTelaBoasVindas(elemento('tela-boas-vindas'), {
  local, aoEscolherModo: (modo) => { alterarPreferencia('modo', modo); navegacao.abrirTela('mes'); },
});
const menuLateral = criarMenuLateral(elemento('menu-lateral'), elemento('botao-menu'), {
  aoEscolherTela: (nome) => navegacao.abrirTela(nome),
  aoAlterarPreferencia: alterarPreferencia,
});
const seletorDeIdioma = criarSeletorDeIdioma(elemento('seletor-de-idioma'), {
  local, aoEscolherIdioma: (idioma) => alterarPreferencia('idioma', idioma),
});
const seletorDeModo = criarSeletorDeModo(elemento('botao-visualizacao'), {
  local, aoTrocarModo: (modo) => alterarPreferencia('modo', modo),
});

const navegacao = criarNavegacao({
  telas: {
    'boas-vindas': { renderizar: () => telaBoasVindas.renderizar() },
    mes: { renderizar: proteger(renderizarMes) },
    contas: { renderizar: proteger(renderizarContas) },
    comparacao: { renderizar: proteger(renderizarComparacao) },
    anual: { renderizar: proteger(renderizarPainelAnual), aoAbrir: () => { estado.anoDoPainel = estado.ano; } },
  },
  secoes: document.querySelectorAll('[data-tela-conteudo]'),
  topo: document.querySelector('.topo'),
  aoTrocarTela: (nome) => menuLateral.marcarTelaAtual(nome),
});

elemento('botao-copiar-mes').addEventListener('click', proteger(acoes.copiarParaMesesSeguintes));
document.querySelector('.conteudo').addEventListener('click', (evento) => {
  const botaoDeVoltar = evento.target.closest('.botao-voltar[data-tela]');
  if (botaoDeVoltar) navegacao.abrirTela(botaoDeVoltar.dataset.tela);
});

// ── Telas ───────────────────────────────────────────────────────────────────
/** Enquanto a pessoa não escolheu, o app mostra o modo quinzenal (o de quem já usava). */
function modoDeControle() {
  return preferencias.obter().modo ?? MODO.QUINZENAL;
}

/** Anos ainda não abertos nascem no idioma e no modo atuais. */
function modeloDoAnoNovo() {
  return { idioma: preferencias.obter().idioma, modo: modoDeControle() };
}

/** O aviso é sempre sobre hoje, qualquer que seja o mês aberto na tela. */
function renderizarAvisoDeHoje() {
  const hoje = relogio.hoje();
  if (avisoDispensado.foiDispensadoEm(hoje)) return faixaDeVencimentos.esconder();
  faixaDeVencimentos.renderizar(vencimentosDoDia(repositorio.obterMes(hoje.ano, hoje.mes), hoje.dia));
}

function renderizarMes() {
  renderizarAvisoDeHoje();
  const hoje = relogio.hoje();
  seletorDeMes.renderizar({
    ano: estado.ano,
    mesSelecionado: estado.mes,
    mesAtual: estado.ano === hoje.ano ? hoje.mes : undefined,
  });
  elemento('titulo-mes').textContent = local.mesEAno(estado);
  grade.renderizar({
    modo: modoDeControle(),
    ano: estado.ano,
    mes: estado.mes,
    lancamentos: acoes.lancamentosDoMes(),
    periodoAtivo: estado.periodo,
  });
}

function renderizarContas() {
  const mesAberto = { ano: estado.ano, mes: estado.mes };
  painelContas.renderizar({ ...mesAberto, resumo: resumirContasAPagar(acoes.lancamentosDoMes(), mesAberto, relogio.hoje()) });
}

function renderizarComparacao() {
  const mes = { ano: estado.ano, mes: estado.mes };
  const mesAnterior = deslocarMes(mes, -1);
  const comparacao = compararMeses(acoes.lancamentosDoMes(), repositorio.obterMes(mesAnterior.ano, mesAnterior.mes));
  painelComparacao.renderizar({ mes, mesAnterior, comparacao });
}

function renderizarPainelAnual() {
  painelAnual.renderizar({ ano: estado.anoDoPainel, resumo: resumirAno(repositorio.obterAno(estado.anoDoPainel)) });
}

function mudarMes(alteracao) {
  mudarMesSemRedesenhar(alteracao);
  navegacao.renderizarTelaAtual();
}

function mudarMesSemRedesenhar({ ano = estado.ano, mes = estado.mes }) {
  Object.assign(estado, { ano, mes });
}

function deslocarMesAberto(deslocamento) {
  mudarMes(deslocarMes(estado, deslocamento));
}

// ── Preferências ────────────────────────────────────────────────────────────
function alterarPreferencia(nome, valor) {
  aplicarPreferencias(preferencias.alterar({ [nome]: valor }));
  if (nome === 'modo') estado.periodo = periodoDoDia(valor, relogio.hoje().dia);
  navegacao.renderizarTelaAtual();
}

/** Tema, idioma, moeda e modo valem para a página inteira: textos fixos, topo, menu e tela aberta. */
function aplicarPreferencias(atuais) {
  document.documentElement.dataset.tema = atuais.tema;
  document.documentElement.lang = atuais.idioma;
  local.configurar(atuais);
  elemento('descricao-lancamentos').dataset.i18n = `menu.lancamentos.${modoDeControle()}`;
  aplicarTextosNaPagina(document, local);
  menuLateral.marcarPreferencias(atuais);
  seletorDeIdioma.renderizar(atuais.idioma);
  seletorDeModo.renderizar(modoDeControle());
}

elemento('versao-do-app').textContent = `ContaCerta ${VERSAO_DO_APP}`;
aplicarPreferencias(preferencias.obter());
navegacao.abrirTela(preferencias.precisaEscolherModo() ? 'boas-vindas' : 'mes');
registrarFuncionamentoOffline();
