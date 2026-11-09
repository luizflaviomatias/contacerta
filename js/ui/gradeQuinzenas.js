import { ErroValorInvalido, converterParaCentavos, formatarMoeda, formatarParaEdicao } from '../dominio/dinheiro.js';
import {
  QUINZENA, TIPO, intervaloDaQuinzena, lancamentosDaQuinzena, totalizar,
} from '../dominio/orcamento.js';
import { escaparHtml } from './formatacao.js';
import { ICONE } from './icones.js';

const QUINZENAS = [
  { quinzena: QUINZENA.PRIMEIRA, titulo: '1ª quinzena' },
  { quinzena: QUINZENA.SEGUNDA, titulo: '2ª quinzena' },
];

/**
 * Grade do mês com a 1ª e a 2ª quinzena em abas.
 * Ao digitar um valor, só os totais são redesenhados — o campo em edição mantém o foco.
 * Gasto marcado como pago fica riscado e travado até ser desmarcado.
 */
export function criarGradeQuinzenas(container, acoes) {
  container.addEventListener('input', (evento) => {
    if (evento.target.matches('.campo-valor')) tratarDigitacaoDeValor(evento.target, acoes);
  });
  container.addEventListener('change', (evento) => {
    const campo = evento.target;
    if (campo.matches('.campo-valor')) reformatarValor(campo);
    if (campo.matches('.campo-descricao')) acoes.aoAlterarDescricao(idDaLinha(campo), campo.value);
    if (campo.matches('.campo-pago')) acoes.aoMarcarPagamento(idDaLinha(campo), campo.checked);
  });
  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;
    const acoesDosBotoes = {
      excluir: () => acoes.aoExcluir(idDaLinha(botao)),
      adicionar: () => acoes.aoAdicionar(botao.dataset.tipo, botao.dataset.quinzena),
      'trocar-quinzena': () => acoes.aoTrocarQuinzena(botao.dataset.quinzena),
    };
    acoesDosBotoes[botao.dataset.acao]?.();
  });

  function renderizar({ ano, mes, lancamentos, quinzenaAtiva }) {
    const definicaoAtiva = QUINZENAS.find(({ quinzena }) => quinzena === quinzenaAtiva);
    container.innerHTML = `
      <div class="abas-quinzena" role="tablist" aria-label="Quinzenas">
        ${QUINZENAS.map((definicao) => abaDaQuinzena(definicao, quinzenaAtiva)).join('')}
      </div>
      ${cartaoDaQuinzena({ ...definicaoAtiva, ano, mes, lancamentos })}
      <section class="resumo-mes" aria-label="Resumo do mês">
        ${blocoDeTotal('Recebido no mês', 'mes-recebido')}
        ${blocoDeTotal('Gasto no mês', 'mes-gasto')}
        ${blocoDeTotal('Saldo do mês', 'mes-saldo')}
      </section>`;
    atualizarTotais(lancamentos);
  }

  function atualizarTotais(lancamentos) {
    exibirTotais('mes', totalizar(lancamentos));
    for (const { quinzena } of QUINZENAS) {
      exibirTotais(quinzena, totalizar(lancamentosDaQuinzena(lancamentos, quinzena)));
    }
  }

  function exibirTotais(prefixo, { recebido, gasto, saldo }) {
    escreverTotal(`${prefixo}-recebido`, recebido);
    escreverTotal(`${prefixo}-gasto`, gasto);
    for (const elementoSaldo of escreverTotal(`${prefixo}-saldo`, saldo)) {
      elementoSaldo.classList.toggle('valor--negativo', saldo < 0);
    }
  }

  /** A mesma chave pode aparecer na aba e no rodapé; a quinzena oculta não tem rodapé. */
  function escreverTotal(chave, centavos) {
    const elementos = container.querySelectorAll(`[data-total="${chave}"]`);
    for (const elemento of elementos) elemento.textContent = formatarMoeda(centavos);
    return elementos;
  }

  return { renderizar, atualizarTotais };
}

function tratarDigitacaoDeValor(campo, acoes) {
  try {
    const centavos = converterParaCentavos(campo.value);
    campo.removeAttribute('aria-invalid');
    acoes.aoAlterarValor(idDaLinha(campo), centavos);
  } catch (erro) {
    if (!(erro instanceof ErroValorInvalido)) throw erro;
    campo.setAttribute('aria-invalid', 'true');
  }
}

function reformatarValor(campo) {
  if (campo.getAttribute('aria-invalid') === 'true') return;
  campo.value = formatarParaEdicao(converterParaCentavos(campo.value));
}

function idDaLinha(elemento) {
  return elemento.closest('[data-id]').dataset.id;
}

function blocoDeTotal(rotulo, chave) {
  return `<div class="total"><span class="total__rotulo">${rotulo}</span>
          <strong class="total__valor" data-total="${chave}"></strong></div>`;
}

function abaDaQuinzena({ quinzena, titulo }, quinzenaAtiva) {
  const ativa = quinzena === quinzenaAtiva;
  return `
    <button class="aba-quinzena" role="tab" aria-selected="${ativa}" data-acao="trocar-quinzena" data-quinzena="${quinzena}">
      <span class="aba-quinzena__titulo">${titulo}</span>
      <span class="aba-quinzena__saldo">Saldo <strong data-total="${quinzena}-saldo"></strong></span>
    </button>`;
}

function cartaoDaQuinzena({ quinzena, titulo, ano, mes, lancamentos }) {
  const { primeiroDia, ultimoDia } = intervaloDaQuinzena(quinzena, ano, mes);
  const daQuinzena = lancamentosDaQuinzena(lancamentos, quinzena);
  const doTipo = (tipo) => daQuinzena.filter((lancamento) => lancamento.tipo === tipo);

  return `
    <section class="quinzena" aria-label="${titulo}">
      <header class="quinzena__cabecalho">
        <h3>${titulo}</h3><span class="quinzena__periodo">dias ${primeiroDia} a ${ultimoDia}</span>
      </header>
      ${grupoDeLancamentos({ titulo: 'Recebimentos', tipo: TIPO.RECEITA, quinzena, itens: doTipo(TIPO.RECEITA) })}
      ${grupoDeLancamentos({ titulo: 'Gastos', tipo: TIPO.DESPESA, quinzena, itens: doTipo(TIPO.DESPESA) })}
      <footer class="quinzena__rodape">
        ${blocoDeTotal('Recebido', `${quinzena}-recebido`)}
        ${blocoDeTotal('Gasto', `${quinzena}-gasto`)}
        ${blocoDeTotal('Saldo', `${quinzena}-saldo`)}
      </footer>
    </section>`;
}

function grupoDeLancamentos({ titulo, tipo, quinzena, itens }) {
  const rotuloDoBotao = tipo === TIPO.RECEITA ? 'Recebimento' : 'Gasto';
  return `
    <div class="grupo grupo--${tipo}">
      <div class="grupo__cabecalho">
        <h4>${titulo}</h4>
        <button class="botao-adicionar" data-acao="adicionar" data-tipo="${tipo}" data-quinzena="${quinzena}">
          ${ICONE.mais}<span>${rotuloDoBotao}</span>
        </button>
      </div>
      <ul class="lista-lancamentos">
        ${itens.length === 0 ? '<li class="lista-vazia">Nenhum lançamento</li>' : ''}
        ${itens.map(linhaDoLancamento).join('')}
      </ul>
    </div>`;
}

function linhaDoLancamento(lancamento) {
  const { id, descricao, valorCentavos, dia, pago } = lancamento;
  const nome = escaparHtml(descricao);
  const travado = estaPago(lancamento) ? 'disabled' : '';
  return `
    <li class="lancamento ${estaPago(lancamento) ? 'lancamento--pago' : ''}" data-id="${escaparHtml(id)}">
      ${ehGasto(lancamento) ? caixaDePago(nome, pago) : '<span class="lancamento__marcador" aria-hidden="true"></span>'}
      <input class="campo-descricao" value="${nome}" aria-label="Descrição" enterkeyhint="done" ${travado}>
      <span class="lancamento__dia">Dia ${dia}</span>
      <input class="campo-valor" value="${formatarParaEdicao(valorCentavos)}" inputmode="decimal"
             aria-label="Valor de ${nome}" enterkeyhint="done" ${travado}>
      <button class="botao-icone botao-excluir" data-acao="excluir" aria-label="Excluir ${nome}" ${travado}>${ICONE.excluir}</button>
    </li>`;
}

function caixaDePago(nome, pago) {
  return `<input type="checkbox" class="campo-pago" aria-label="${nome} pago" ${pago ? 'checked' : ''}>`;
}

function ehGasto(lancamento) {
  return lancamento.tipo === TIPO.DESPESA;
}

function estaPago(lancamento) {
  return ehGasto(lancamento) && lancamento.pago;
}
