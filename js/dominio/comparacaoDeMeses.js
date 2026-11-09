// Relatório "este mês contra o anterior": totais dos dois meses e o que mudou em cada gasto.
import { agruparGastosPorCategoria, totalizar } from './orcamento.js';

export const VARIACAO = Object.freeze({ SUBIU: 'subiu', DESCEU: 'desceu', IGUAL: 'igual' });

/**
 * Gastos com a mesma descrição são somados e comparados entre si; os que mudaram vêm primeiro
 * pela maior diferença. Uma descrição que só existe em um dos meses conta como zero no outro.
 */
export function compararMeses(lancamentosDoMes, lancamentosDoMesAnterior) {
  const gastosAtuais = totaisPorDescricao(lancamentosDoMes);
  const gastosAnteriores = totaisPorDescricao(lancamentosDoMesAnterior);
  const descricoes = new Set([...gastosAtuais.keys(), ...gastosAnteriores.keys()]);

  const gastos = [...descricoes]
    .map((descricao) => compararGasto(descricao, gastosAtuais.get(descricao) ?? 0, gastosAnteriores.get(descricao) ?? 0))
    .sort((a, b) => Math.abs(b.diferencaCentavos) - Math.abs(a.diferencaCentavos) || a.descricao.localeCompare(b.descricao));

  return {
    atual: totalizar(lancamentosDoMes),
    anterior: totalizar(lancamentosDoMesAnterior),
    subiram: gastos.filter((gasto) => gasto.variacao === VARIACAO.SUBIU),
    desceram: gastos.filter((gasto) => gasto.variacao === VARIACAO.DESCEU),
    quantidadeSemMudanca: gastos.filter((gasto) => gasto.variacao === VARIACAO.IGUAL).length,
  };
}

function totaisPorDescricao(lancamentos) {
  return new Map(agruparGastosPorCategoria(lancamentos).map(({ descricao, totalCentavos }) => [descricao, totalCentavos]));
}

function compararGasto(descricao, atualCentavos, anteriorCentavos) {
  const diferencaCentavos = atualCentavos - anteriorCentavos;
  return { descricao, atualCentavos, anteriorCentavos, diferencaCentavos, variacao: variacaoDa(diferencaCentavos) };
}

function variacaoDa(diferencaCentavos) {
  if (diferencaCentavos > 0) return VARIACAO.SUBIU;
  return diferencaCentavos < 0 ? VARIACAO.DESCEU : VARIACAO.IGUAL;
}
