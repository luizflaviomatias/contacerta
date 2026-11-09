// Relatório "contas a pagar": os gastos de um mês, com a situação de cada um em relação a hoje.
import { TIPO, ehMesPosterior } from './orcamento.js';

export const SITUACAO = Object.freeze({
  ATRASADA: 'atrasada',
  VENCE_HOJE: 'vence-hoje',
  A_VENCER: 'a-vencer',
  PAGA: 'paga',
});

const ORDEM_DAS_SITUACOES = [SITUACAO.ATRASADA, SITUACAO.VENCE_HOJE, SITUACAO.A_VENCER, SITUACAO.PAGA];

/**
 * @param {{ pago: boolean, dia: number }} conta
 * @param {{ ano: number, mes: number }} mesDaConta
 * @param {{ ano: number, mes: number, dia: number }} hoje
 */
export function situacaoDaConta(conta, mesDaConta, hoje) {
  if (conta.pago) return SITUACAO.PAGA;
  if (ehMesPosterior(mesDaConta, hoje)) return SITUACAO.A_VENCER;
  if (ehMesPosterior(hoje, mesDaConta)) return SITUACAO.ATRASADA;
  if (conta.dia < hoje.dia) return SITUACAO.ATRASADA;
  return conta.dia === hoje.dia ? SITUACAO.VENCE_HOJE : SITUACAO.A_VENCER;
}

/**
 * Gastos do mês agrupados por situação (cada grupo ordenado por dia) e os totais pago / em aberto.
 * Recebimentos não entram (não são contas), nem gastos ainda sem valor (não há o que pagar).
 */
export function resumirContasAPagar(lancamentos, mesDaConta, hoje) {
  const contas = lancamentos
    .filter(ehContaComValor)
    .map((conta) => ({ ...conta, situacao: situacaoDaConta(conta, mesDaConta, hoje) }))
    .sort((a, b) => a.dia - b.dia);
  const emAberto = contas.filter((conta) => conta.situacao !== SITUACAO.PAGA);
  const pagas = contas.filter((conta) => conta.situacao === SITUACAO.PAGA);

  return {
    grupos: ORDEM_DAS_SITUACOES
      .map((situacao) => ({ situacao, contas: contas.filter((conta) => conta.situacao === situacao) }))
      .filter((grupo) => grupo.contas.length > 0),
    quantidadeEmAberto: emAberto.length,
    totalEmAberto: somarValores(emAberto),
    totalPago: somarValores(pagas),
    totalDoMes: somarValores(contas),
  };
}

function ehContaComValor(lancamento) {
  return lancamento.tipo === TIPO.DESPESA && lancamento.valorCentavos > 0;
}

function somarValores(contas) {
  return contas.reduce((soma, conta) => soma + conta.valorCentavos, 0);
}
