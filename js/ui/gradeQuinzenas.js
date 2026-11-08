import { ErroValorInvalido, converterParaCentavos, formatarMoeda, formatarParaEdicao } from '../dominio/dinheiro.js';
import {
  QUINZENA, TIPO, intervaloDaQuinzena, lancamentosDaQuinzena, totalizar,
} from '../dominio/orcamento.js';
import { escaparHtml } from './formatacao.js';

const QUINZENAS = [
  { quinzena: QUINZENA.PRIMEIRA, titulo: '1ª quinzena' },
  { quinzena: QUINZENA.SEGUNDA, titulo: '2ª quinzena' },
];

/**
 * Grade do mês dividida em 1ª e 2ª quinzena.
 * Ao digitar um valor, só os totais são redesenhados — o campo em edição mantém o foco.
 */
export function criarGradeQuinzenas(container, acoes) {
  container.addEventListener('input', (evento) => {
    if (evento.target.matches('.campo-valor')) tratarDigitacaoDeValor(evento.target, acoes);
  });
  container.addEventListener('change', (evento) => {
    const campo = evento.target;
    if (campo.matches('.campo-valor')) reformatarValor(campo);
    if (campo.matches('.campo-descricao')) acoes.aoAlterarDescricao(idDaLinha(campo), campo.value);
  });
  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;
    if (botao.dataset.acao === 'excluir') acoes.aoExcluir(idDaLinha(botao));
    if (botao.dataset.acao === 'adicionar') acoes.aoAdicionar(botao.dataset.tipo, botao.dataset.quinzena);
  });

  function renderizar({ ano, mes, lancamentos, diaSelecionado }) {
    container.innerHTML = `
      <section class="resumo-mes" aria-label="Resumo do mês">
        ${blocoDeTotal('Recebido no mês', 'mes-recebido')}
        ${blocoDeTotal('Gasto no mês', 'mes-gasto')}
        ${blocoDeTotal('Saldo do mês', 'mes-saldo')}
      </section>
      ${QUINZENAS.map((definicao) => cartaoDaQuinzena({ ...definicao, ano, mes, lancamentos, diaSelecionado })).join('')}`;
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
    const elementoSaldo = escreverTotal(`${prefixo}-saldo`, saldo);
    elementoSaldo.classList.toggle('valor--negativo', saldo < 0);
  }

  function escreverTotal(chave, centavos) {
    const elemento = container.querySelector(`[data-total="${chave}"]`);
    elemento.textContent = formatarMoeda(centavos);
    return elemento;
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

function cartaoDaQuinzena({ quinzena, titulo, ano, mes, lancamentos, diaSelecionado }) {
  const { primeiroDia, ultimoDia } = intervaloDaQuinzena(quinzena, ano, mes);
  const daQuinzena = lancamentosDaQuinzena(lancamentos, quinzena);
  const doTipo = (tipo) => daQuinzena.filter((lancamento) => lancamento.tipo === tipo);

  return `
    <section class="quinzena" aria-label="${titulo}">
      <header class="quinzena__cabecalho">
        <h3>${titulo}</h3><span class="quinzena__periodo">dias ${primeiroDia} a ${ultimoDia}</span>
      </header>
      ${grupoDeLancamentos({ titulo: 'Recebimentos', tipo: TIPO.RECEITA, quinzena, itens: doTipo(TIPO.RECEITA), diaSelecionado })}
      ${grupoDeLancamentos({ titulo: 'Gastos', tipo: TIPO.DESPESA, quinzena, itens: doTipo(TIPO.DESPESA), diaSelecionado })}
      <footer class="quinzena__rodape">
        ${blocoDeTotal('Recebido', `${quinzena}-recebido`)}
        ${blocoDeTotal('Total', `${quinzena}-gasto`)}
        ${blocoDeTotal('Saldo', `${quinzena}-saldo`)}
      </footer>
    </section>`;
}

function grupoDeLancamentos({ titulo, tipo, quinzena, itens, diaSelecionado }) {
  const rotuloDoBotao = tipo === TIPO.RECEITA ? '+ Recebimento' : '+ Gasto';
  return `
    <div class="grupo grupo--${tipo}">
      <div class="grupo__cabecalho">
        <h4>${titulo}</h4>
        <button class="botao-texto" data-acao="adicionar" data-tipo="${tipo}" data-quinzena="${quinzena}">${rotuloDoBotao}</button>
      </div>
      <ul class="lista-lancamentos">
        ${itens.length === 0 ? '<li class="lista-vazia">Nenhum lançamento</li>' : ''}
        ${itens.map((lancamento) => linhaDoLancamento(lancamento, diaSelecionado)).join('')}
      </ul>
    </div>`;
}

function linhaDoLancamento({ id, descricao, valorCentavos, dia }, diaSelecionado) {
  const destaque = dia === diaSelecionado ? ' lancamento--do-dia' : '';
  return `
    <li class="lancamento${destaque}" data-id="${escaparHtml(id)}">
      <span class="lancamento__dia" title="Dia do lançamento">${dia}</span>
      <input class="campo-descricao" value="${escaparHtml(descricao)}" aria-label="Descrição" enterkeyhint="done">
      <input class="campo-valor" value="${formatarParaEdicao(valorCentavos)}" inputmode="decimal"
             aria-label="Valor de ${escaparHtml(descricao)}" enterkeyhint="done">
      <button class="botao-icone botao-excluir" data-acao="excluir" aria-label="Excluir ${escaparHtml(descricao)}">✕</button>
    </li>`;
}
