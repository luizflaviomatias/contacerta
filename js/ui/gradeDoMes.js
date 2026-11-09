import { ErroValorInvalido } from '../dominio/dinheiro.js';
import {
  MES_INTEIRO, QUINZENA, TIPO, lancamentosDoIntervalo, periodosDoMes, totalizar,
} from '../dominio/orcamento.js';
import { escaparHtml } from './formatacao.js';
import { ICONE } from './icones.js';

const CHAVE_DO_TITULO = {
  [QUINZENA.PRIMEIRA]: 'mes.quinzena.primeira',
  [QUINZENA.SEGUNDA]: 'mes.quinzena.segunda',
  [MES_INTEIRO]: 'mes.mesInteiro',
};

const TEXTOS_DO_GRUPO = {
  [TIPO.RECEITA]: { titulo: 'mes.recebimentos', botao: 'mes.adicionarRecebimento' },
  [TIPO.DESPESA]: { titulo: 'mes.gastos', botao: 'mes.adicionarGasto' },
};

/**
 * Lançamentos do mês: no modo quinzenal, a 1ª e a 2ª quinzena em abas; no mensal, o mês inteiro num cartão só.
 * Ao digitar um valor, só os totais são redesenhados — o campo em edição mantém o foco.
 * Gasto marcado como pago fica riscado e travado até ser desmarcado.
 */
export function criarGradeDoMes(container, { local, ...acoes }) {
  let periodosExibidos = [];

  container.addEventListener('input', (evento) => {
    if (evento.target.matches('.campo-valor')) tratarDigitacaoDeValor(evento.target, acoes, local);
  });
  container.addEventListener('change', (evento) => {
    const campo = evento.target;
    if (campo.matches('.campo-valor')) reformatarValor(campo, local);
    if (campo.matches('.campo-descricao')) acoes.aoAlterarDescricao(idDaLinha(campo), campo.value);
    if (campo.matches('.campo-pago')) acoes.aoMarcarPagamento(idDaLinha(campo), campo.checked);
  });
  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;
    const acoesDosBotoes = {
      excluir: () => acoes.aoExcluir(idDaLinha(botao)),
      adicionar: () => acoes.aoAdicionar(botao.dataset.tipo, intervaloDoBotao(botao)),
      'trocar-periodo': () => acoes.aoTrocarPeriodo(botao.dataset.periodo),
    };
    acoesDosBotoes[botao.dataset.acao]?.();
  });

  /** @param {{ modo: string, ano: number, mes: number, lancamentos: object[], periodoAtivo: string }} dados */
  function renderizar({ modo, ano, mes, lancamentos, periodoAtivo }) {
    const { t } = local;
    periodosExibidos = periodosDoMes(modo, ano, mes);
    const ativo = periodosExibidos.find(({ periodo }) => periodo === periodoAtivo) ?? periodosExibidos[0];
    const temAbas = periodosExibidos.length > 1;
    container.innerHTML = `
      ${temAbas ? abasDosPeriodos(periodosExibidos, ativo.periodo, t) : ''}
      ${cartaoDoPeriodo(ativo, lancamentos, { comRodape: temAbas }, local)}
      <section class="resumo-mes" aria-label="${t('mes.resumo')}">
        ${blocoDeTotal(t('mes.recebidoNoMes'), 'mes-recebido')}
        ${blocoDeTotal(t('mes.gastoNoMes'), 'mes-gasto')}
        ${blocoDeTotal(t('mes.saldoDoMes'), 'mes-saldo')}
      </section>`;
    atualizarTotais(lancamentos);
  }

  function atualizarTotais(lancamentos) {
    exibirTotais('mes', totalizar(lancamentos));
    for (const intervalo of periodosExibidos) {
      exibirTotais(intervalo.periodo, totalizar(lancamentosDoIntervalo(lancamentos, intervalo)));
    }
  }

  function exibirTotais(prefixo, { recebido, gasto, saldo }) {
    escreverTotal(`${prefixo}-recebido`, recebido);
    escreverTotal(`${prefixo}-gasto`, gasto);
    for (const elementoSaldo of escreverTotal(`${prefixo}-saldo`, saldo)) {
      elementoSaldo.classList.toggle('valor--negativo', saldo < 0);
    }
  }

  /** A mesma chave pode aparecer na aba e no rodapé; o período oculto não tem rodapé. */
  function escreverTotal(chave, centavos) {
    const elementos = container.querySelectorAll(`[data-total="${chave}"]`);
    for (const elemento of elementos) elemento.textContent = local.formatarMoeda(centavos);
    return elementos;
  }

  return { renderizar, atualizarTotais };
}

function tratarDigitacaoDeValor(campo, acoes, local) {
  try {
    const centavos = local.converterParaCentavos(campo.value);
    campo.removeAttribute('aria-invalid');
    acoes.aoAlterarValor(idDaLinha(campo), centavos);
  } catch (erro) {
    if (!(erro instanceof ErroValorInvalido)) throw erro;
    campo.setAttribute('aria-invalid', 'true');
  }
}

function reformatarValor(campo, local) {
  if (campo.getAttribute('aria-invalid') === 'true') return;
  campo.value = local.formatarParaEdicao(local.converterParaCentavos(campo.value));
}

function idDaLinha(elemento) {
  return elemento.closest('[data-id]').dataset.id;
}

function intervaloDoBotao(botao) {
  return { primeiroDia: Number(botao.dataset.primeiroDia), ultimoDia: Number(botao.dataset.ultimoDia) };
}

function blocoDeTotal(rotulo, chave) {
  return `<div class="total"><span class="total__rotulo">${rotulo}</span>
          <strong class="total__valor" data-total="${chave}"></strong></div>`;
}

function abasDosPeriodos(periodos, periodoAtivo, t) {
  return `
    <div class="abas-quinzena" role="tablist" aria-label="${t('mes.quinzenas')}">
      ${periodos.map(({ periodo }) => `
        <button class="aba-quinzena" role="tab" aria-selected="${periodo === periodoAtivo}"
                data-acao="trocar-periodo" data-periodo="${periodo}">
          <span class="aba-quinzena__titulo">${t(CHAVE_DO_TITULO[periodo])}</span>
          <span class="aba-quinzena__saldo">${t('mes.saldo')} <strong data-total="${periodo}-saldo"></strong></span>
        </button>`).join('')}
    </div>`;
}

function cartaoDoPeriodo(intervalo, lancamentos, { comRodape }, local) {
  const { t } = local;
  const { periodo, primeiroDia, ultimoDia } = intervalo;
  const titulo = t(CHAVE_DO_TITULO[periodo]);
  const doPeriodo = lancamentosDoIntervalo(lancamentos, intervalo);
  const doTipo = (tipo) => doPeriodo.filter((lancamento) => lancamento.tipo === tipo);
  return `
    <section class="quinzena" aria-label="${titulo}">
      <header class="quinzena__cabecalho">
        <h3>${titulo}</h3><span class="quinzena__periodo">${t('mes.dias', { inicio: primeiroDia, fim: ultimoDia })}</span>
      </header>
      ${grupoDeLancamentos(TIPO.RECEITA, intervalo, doTipo(TIPO.RECEITA), local)}
      ${grupoDeLancamentos(TIPO.DESPESA, intervalo, doTipo(TIPO.DESPESA), local)}
      ${comRodape ? `
      <footer class="quinzena__rodape">
        ${blocoDeTotal(t('mes.recebido'), `${periodo}-recebido`)}
        ${blocoDeTotal(t('mes.gasto'), `${periodo}-gasto`)}
        ${blocoDeTotal(t('mes.saldo'), `${periodo}-saldo`)}
      </footer>` : ''}
    </section>`;
}

function grupoDeLancamentos(tipo, { primeiroDia, ultimoDia }, itens, local) {
  const { t } = local;
  const textos = TEXTOS_DO_GRUPO[tipo];
  return `
    <div class="grupo grupo--${tipo}">
      <div class="grupo__cabecalho">
        <h4>${t(textos.titulo)}</h4>
        <button class="botao-adicionar" data-acao="adicionar" data-tipo="${tipo}"
                data-primeiro-dia="${primeiroDia}" data-ultimo-dia="${ultimoDia}">
          ${ICONE.mais}<span>${t(textos.botao)}</span>
        </button>
      </div>
      <ul class="lista-lancamentos">
        ${itens.length === 0 ? `<li class="lista-vazia">${t('mes.nenhumLancamento')}</li>` : ''}
        ${itens.map((lancamento) => linhaDoLancamento(lancamento, local)).join('')}
      </ul>
    </div>`;
}

function linhaDoLancamento(lancamento, { t, formatarParaEdicao }) {
  const { id, descricao, valorCentavos, dia, pago } = lancamento;
  const nome = escaparHtml(descricao);
  const travado = estaPago(lancamento) ? 'disabled' : '';
  const marcador = ehGasto(lancamento)
    ? `<input type="checkbox" class="campo-pago" aria-label="${t('lancamento.pago', { descricao: nome })}" ${pago ? 'checked' : ''}>`
    : '<span class="lancamento__marcador" aria-hidden="true"></span>';
  return `
    <li class="lancamento ${estaPago(lancamento) ? 'lancamento--pago' : ''}" data-id="${escaparHtml(id)}">
      ${marcador}
      <input class="campo-descricao" value="${nome}" aria-label="${t('lancamento.descricao')}" enterkeyhint="done" ${travado}>
      <span class="lancamento__dia">${t('lancamento.dia', { dia })}</span>
      <input class="campo-valor" value="${formatarParaEdicao(valorCentavos)}" inputmode="decimal"
             aria-label="${t('lancamento.valorDe', { descricao: nome })}" enterkeyhint="done" ${travado}>
      <button class="botao-icone botao-excluir" data-acao="excluir"
              aria-label="${t('lancamento.excluirItem', { descricao: nome })}" ${travado}>${ICONE.excluir}</button>
    </li>`;
}

function ehGasto(lancamento) {
  return lancamento.tipo === TIPO.DESPESA;
}

function estaPago(lancamento) {
  return ehGasto(lancamento) && lancamento.pago;
}
