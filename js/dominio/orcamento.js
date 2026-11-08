// Regras do orçamento quinzenal. Funções puras: recebem dados, devolvem dados novos.

export const TIPO = Object.freeze({ RECEITA: 'receita', DESPESA: 'despesa' });
export const QUINZENA = Object.freeze({ PRIMEIRA: 'primeira', SEGUNDA: 'segunda' });
export const MESES_NO_ANO = 12;

const ULTIMO_DIA_DA_PRIMEIRA_QUINZENA = 15;
const MAIOR_DIA_POSSIVEL = 31;

export class ErroLancamentoInvalido extends Error {
  constructor(motivo) {
    super(`Lançamento inválido: ${motivo}`);
    this.name = 'ErroLancamentoInvalido';
  }
}

export function diasNoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

export function limitarDiaAoMes(dia, ano, mes) {
  return Math.min(Math.max(dia, 1), diasNoMes(ano, mes));
}

export function quinzenaDoDia(dia) {
  return dia <= ULTIMO_DIA_DA_PRIMEIRA_QUINZENA ? QUINZENA.PRIMEIRA : QUINZENA.SEGUNDA;
}

export function intervaloDaQuinzena(quinzena, ano, mes) {
  return quinzena === QUINZENA.PRIMEIRA
    ? { primeiroDia: 1, ultimoDia: ULTIMO_DIA_DA_PRIMEIRA_QUINZENA }
    : { primeiroDia: ULTIMO_DIA_DA_PRIMEIRA_QUINZENA + 1, ultimoDia: diasNoMes(ano, mes) };
}

export function criarLancamento({ id, descricao, tipo, valorCentavos, dia }) {
  const descricaoLimpa = String(descricao ?? '').trim();
  if (!id) throw new ErroLancamentoInvalido('id ausente');
  if (descricaoLimpa === '') throw new ErroLancamentoInvalido('descrição vazia');
  if (!Object.values(TIPO).includes(tipo)) throw new ErroLancamentoInvalido(`tipo "${tipo}"`);
  if (!Number.isInteger(valorCentavos) || valorCentavos < 0) {
    throw new ErroLancamentoInvalido(`valor ${valorCentavos}`);
  }
  if (!Number.isInteger(dia) || dia < 1 || dia > MAIOR_DIA_POSSIVEL) {
    throw new ErroLancamentoInvalido(`dia ${dia}`);
  }
  return Object.freeze({ id, descricao: descricaoLimpa, tipo, valorCentavos, dia });
}

export function adicionarLancamento(lancamentos, novoLancamento) {
  return [...lancamentos, novoLancamento];
}

export function removerLancamento(lancamentos, id) {
  return lancamentos.filter((lancamento) => lancamento.id !== id);
}

export function alterarLancamento(lancamentos, id, alteracoes) {
  if (!lancamentos.some((lancamento) => lancamento.id === id)) {
    throw new ErroLancamentoInvalido(`id "${id}" não encontrado`);
  }
  return lancamentos.map((lancamento) =>
    lancamento.id === id ? criarLancamento({ ...lancamento, ...alteracoes, id }) : lancamento,
  );
}

/** Recebimentos primeiro, depois gastos; dentro de cada grupo, por dia (ordem estável). */
export function lancamentosDaQuinzena(lancamentos, quinzena) {
  return lancamentos
    .filter((lancamento) => quinzenaDoDia(lancamento.dia) === quinzena)
    .sort((a, b) => pesoDoTipo(a) - pesoDoTipo(b) || a.dia - b.dia);
}

function pesoDoTipo(lancamento) {
  return lancamento.tipo === TIPO.RECEITA ? 0 : 1;
}

export function totalizar(lancamentos) {
  const recebido = somarPorTipo(lancamentos, TIPO.RECEITA);
  const gasto = somarPorTipo(lancamentos, TIPO.DESPESA);
  return { recebido, gasto, saldo: recebido - gasto };
}

function somarPorTipo(lancamentos, tipo) {
  return lancamentos
    .filter((lancamento) => lancamento.tipo === tipo)
    .reduce((soma, lancamento) => soma + lancamento.valorCentavos, 0);
}

/** Dias do mês que têm lançamentos, para o calendário marcar. */
export function marcadoresDoMes(lancamentos) {
  const marcadores = new Map();
  for (const { dia, tipo } of lancamentos) {
    const marcador = marcadores.get(dia) ?? { temReceita: false, temDespesa: false };
    if (tipo === TIPO.RECEITA) marcador.temReceita = true;
    else marcador.temDespesa = true;
    marcadores.set(dia, marcador);
  }
  return marcadores;
}

/** @param {Array<Array>} lancamentosPorMes - 12 listas, de janeiro (0) a dezembro (11). */
export function resumirAno(lancamentosPorMes) {
  const totaisPorMes = lancamentosPorMes.map(totalizar);
  const recebido = somar(totaisPorMes.map((total) => total.recebido));
  const gasto = somar(totaisPorMes.map((total) => total.gasto));
  const gastosPorCategoria = agruparGastosPorCategoria(lancamentosPorMes.flat());

  return {
    recebido,
    gasto,
    saldo: recebido - gasto,
    mediaMensalDeGasto: Math.round(gasto / MESES_NO_ANO),
    percentualComprometido: recebido === 0 ? 0 : Math.round((gasto / recebido) * 100),
    gastosPorMes: totaisPorMes.map((total) => total.gasto),
    gastosPorCategoria,
    maiorCategoria: gastosPorCategoria[0] ?? { descricao: '—', totalCentavos: 0 },
  };
}

function somar(valores) {
  return valores.reduce((soma, valor) => soma + valor, 0);
}

function agruparGastosPorCategoria(lancamentos) {
  const totais = new Map();
  for (const { tipo, descricao, valorCentavos } of lancamentos) {
    if (tipo !== TIPO.DESPESA || valorCentavos === 0) continue;
    totais.set(descricao, (totais.get(descricao) ?? 0) + valorCentavos);
  }
  return [...totais]
    .map(([descricao, totalCentavos]) => ({ descricao, totalCentavos }))
    .sort((a, b) => b.totalCentavos - a.totalCentavos);
}
