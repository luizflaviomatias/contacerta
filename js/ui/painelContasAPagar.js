import { SITUACAO } from '../dominio/contasAPagar.js';
import { cabecalhoDePeriodo, ouvirTrocaDePeriodo } from './cabecalhoDePeriodo.js';
import { escaparHtml } from './formatacao.js';

/** Aba "A pagar": quanto falta pagar no mês e as contas por situação, marcáveis como pagas. */
export function criarPainelContasAPagar(container, { local, aoTrocarMes, aoMarcarPagamento }) {
  ouvirTrocaDePeriodo(container, aoTrocarMes);
  container.addEventListener('change', (evento) => {
    const caixa = evento.target;
    if (caixa.matches('.campo-pago')) aoMarcarPagamento(caixa.closest('[data-id]').dataset.id, caixa.checked);
  });

  function renderizar({ ano, mes, resumo }) {
    const { t } = local;
    container.innerHTML = `
      ${cabecalhoDePeriodo({
        titulo: local.mesEAno({ ano, mes }), rotuloAnterior: t('periodo.mesAnterior'), rotuloSeguinte: t('periodo.mesSeguinte'),
      })}
      ${resumoDoMes(resumo, local)}
      ${resumo.grupos.length === 0
        ? `<p class="cartao lista-vazia">${t('contas.nenhumaComValor')}</p>`
        : resumo.grupos.map((grupo) => grupoDeContas(grupo, local)).join('')}`;
  }

  return { renderizar };
}

function resumoDoMes({ quantidadeEmAberto, totalEmAberto, totalPago, totalDoMes }, { t, formatarMoeda }) {
  const percentualPago = totalDoMes === 0 ? 0 : Math.round((totalPago / totalDoMes) * 100);
  return `
    <section class="resumo-contas" aria-label="${t('contas.resumo')}">
      <span class="resumo-contas__rotulo">${t('contas.faltaPagar')}</span>
      <strong class="resumo-contas__valor">${formatarMoeda(totalEmAberto)}</strong>
      <span class="resumo-contas__detalhe">${descreverContasEmAberto(quantidadeEmAberto, totalDoMes, t)}</span>
      <div class="barra-progresso" role="progressbar" aria-label="${t('contas.partePaga')}"
           aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentualPago}">
        <span style="width: ${percentualPago}%"></span>
      </div>
      <span class="resumo-contas__detalhe">${t('contas.pagoDe', { pago: formatarMoeda(totalPago), total: formatarMoeda(totalDoMes) })}</span>
    </section>`;
}

function descreverContasEmAberto(quantidade, totalDoMes, t) {
  if (totalDoMes === 0) return t('contas.nenhumaNoMes');
  return quantidade === 0 ? t('contas.tudoPago') : t('contas.emAberto', { n: quantidade });
}

function grupoDeContas({ situacao, contas }, local) {
  return `
    <section class="cartao grupo-contas grupo-contas--${situacao}">
      <h3>${local.t(`contas.grupo.${situacao}`)} <span class="grupo-contas__quantidade">${contas.length}</span></h3>
      <ul class="lista-contas">${contas.map((conta) => linhaDaConta(conta, local)).join('')}</ul>
    </section>`;
}

function linhaDaConta({ id, descricao, valorCentavos, dia, situacao }, { t, formatarMoeda }) {
  const nome = escaparHtml(descricao);
  const paga = situacao === SITUACAO.PAGA;
  return `
    <li class="conta ${paga ? 'conta--paga' : ''}" data-id="${escaparHtml(id)}">
      <input type="checkbox" class="campo-pago" aria-label="${t('lancamento.pago', { descricao: nome })}" ${paga ? 'checked' : ''}>
      <span class="conta__texto">
        <span class="conta__descricao">${nome}</span>
        <span class="conta__vencimento">${t(`contas.vencimento.${situacao}`, { dia })}</span>
      </span>
      <strong class="conta__valor">${formatarMoeda(valorCentavos)}</strong>
    </li>`;
}
