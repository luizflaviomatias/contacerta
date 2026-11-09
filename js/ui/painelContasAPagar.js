import { SITUACAO } from '../dominio/contasAPagar.js';
import { formatarMoeda } from '../dominio/dinheiro.js';
import { escaparHtml, nomeDoMes } from './formatacao.js';
import { ICONE } from './icones.js';

const TITULO_DO_GRUPO = {
  [SITUACAO.ATRASADA]: 'Atrasadas',
  [SITUACAO.VENCE_HOJE]: 'Vencem hoje',
  [SITUACAO.A_VENCER]: 'Próximas',
  [SITUACAO.PAGA]: 'Já pagas',
};

const DESCREVER_VENCIMENTO = {
  [SITUACAO.ATRASADA]: (dia) => `Venceu dia ${dia}`,
  [SITUACAO.VENCE_HOJE]: () => 'Vence hoje',
  [SITUACAO.A_VENCER]: (dia) => `Vence dia ${dia}`,
  [SITUACAO.PAGA]: (dia) => `Dia ${dia} · paga`,
};

/** Aba "A pagar": quanto falta pagar no mês e as contas por situação, marcáveis como pagas. */
export function criarPainelContasAPagar(container, { aoTrocarMes, aoMarcarPagamento }) {
  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (botao?.dataset.acao === 'mes-anterior') aoTrocarMes(-1);
    if (botao?.dataset.acao === 'mes-seguinte') aoTrocarMes(+1);
  });
  container.addEventListener('change', (evento) => {
    const caixa = evento.target;
    if (caixa.matches('.campo-pago')) aoMarcarPagamento(caixa.closest('[data-id]').dataset.id, caixa.checked);
  });

  function renderizar({ ano, mes, resumo }) {
    container.innerHTML = `
      <div class="seletor-mes__cabecalho">
        <button class="botao-icone" data-acao="mes-anterior" aria-label="Mês anterior">${ICONE.anterior}</button>
        <h2 class="seletor-mes__titulo">${nomeDoMes(mes)} de ${ano}</h2>
        <button class="botao-icone" data-acao="mes-seguinte" aria-label="Próximo mês">${ICONE.seguinte}</button>
      </div>
      ${resumoDoMes(resumo)}
      ${resumo.grupos.length === 0
        ? '<p class="cartao lista-vazia">Nenhuma conta com valor neste mês.</p>'
        : resumo.grupos.map(grupoDeContas).join('')}`;
  }

  return { renderizar };
}

function resumoDoMes({ quantidadeEmAberto, totalEmAberto, totalPago, totalDoMes }) {
  const percentualPago = totalDoMes === 0 ? 0 : Math.round((totalPago / totalDoMes) * 100);
  return `
    <section class="resumo-contas" aria-label="Resumo das contas do mês">
      <span class="resumo-contas__rotulo">Falta pagar</span>
      <strong class="resumo-contas__valor">${formatarMoeda(totalEmAberto)}</strong>
      <span class="resumo-contas__detalhe">${totalDoMes === 0 ? 'Nenhuma conta neste mês' : descreverQuantidadeEmAberto(quantidadeEmAberto)}</span>
      <div class="barra-progresso" role="progressbar" aria-label="Parte já paga"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentualPago}">
        <span style="width: ${percentualPago}%"></span>
      </div>
      <span class="resumo-contas__detalhe">Pago ${formatarMoeda(totalPago)} de ${formatarMoeda(totalDoMes)}</span>
    </section>`;
}

function descreverQuantidadeEmAberto(quantidade) {
  if (quantidade === 0) return 'Tudo pago neste mês';
  return quantidade === 1 ? '1 conta em aberto' : `${quantidade} contas em aberto`;
}

function grupoDeContas({ situacao, contas }) {
  return `
    <section class="cartao grupo-contas grupo-contas--${situacao}">
      <h3>${TITULO_DO_GRUPO[situacao]} <span class="grupo-contas__quantidade">${contas.length}</span></h3>
      <ul class="lista-contas">${contas.map(linhaDaConta).join('')}</ul>
    </section>`;
}

function linhaDaConta({ id, descricao, valorCentavos, dia, situacao }) {
  const nome = escaparHtml(descricao);
  const paga = situacao === SITUACAO.PAGA;
  return `
    <li class="conta ${paga ? 'conta--paga' : ''}" data-id="${escaparHtml(id)}">
      <input type="checkbox" class="campo-pago" aria-label="${nome} pago" ${paga ? 'checked' : ''}>
      <span class="conta__texto">
        <span class="conta__descricao">${nome}</span>
        <span class="conta__vencimento">${DESCREVER_VENCIMENTO[situacao](dia)}</span>
      </span>
      <strong class="conta__valor">${formatarMoeda(valorCentavos)}</strong>
    </li>`;
}
