// Regras do orçamento, por mês ou por quinzena. Funções puras: recebem dados, devolvem dados novos.

export const TIPO = Object.freeze({ RECEITA: 'receita', DESPESA: 'despesa' });
export const QUINZENA = Object.freeze({ PRIMEIRA: 'primeira', SEGUNDA: 'segunda' });
/** Forma de controlar o orçamento: o mês inteiro de uma vez ou dividido em duas quinzenas. */
export const MODO = Object.freeze({ MENSAL: 'mensal', QUINZENAL: 'quinzenal' });
/** Parte do mês mostrada na tela: o mês inteiro (modo mensal) ou uma das quinzenas (modo quinzenal). */
export const PERIODO = Object.freeze({ MES_INTEIRO: 'mes', ...QUINZENA });
export const MESES_NO_ANO = 12;

const ULTIMO_DIA_DA_PRIMEIRA_QUINZENA = 15;
const MAIOR_DIA_POSSIVEL = 31;

export class ErroLancamentoInvalido extends Error {
  constructor(motivo) {
    super(`Lançamento inválido: ${motivo}`);
    this.name = 'ErroLancamentoInvalido';
  }
}

export class ErroCopiaParaMesAnterior extends Error {
  constructor(origem, destino) {
    super(`Só é possível copiar para meses seguintes: ${rotuloDoMes(origem)} → ${rotuloDoMes(destino)}`);
    this.name = 'ErroCopiaParaMesAnterior';
  }
}

function rotuloDoMes({ ano, mes }) {
  return `${String(mes + 1).padStart(2, '0')}/${ano}`;
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

/**
 * Partes do mês exibidas na tela: uma só no modo mensal, as duas quinzenas no quinzenal.
 * @returns {Array<{ periodo: string, primeiroDia: number, ultimoDia: number }>}
 */
export function periodosDoMes(modo, ano, mes) {
  if (modo === MODO.MENSAL) return [{ periodo: PERIODO.MES_INTEIRO, primeiroDia: 1, ultimoDia: diasNoMes(ano, mes) }];
  return [QUINZENA.PRIMEIRA, QUINZENA.SEGUNDA].map((quinzena) => ({ periodo: quinzena, ...intervaloDaQuinzena(quinzena, ano, mes) }));
}

/** Período em que o dia cai, para abrir a tela já na parte do mês em que estamos. */
export function periodoDoDia(modo, dia) {
  return modo === MODO.MENSAL ? PERIODO.MES_INTEIRO : quinzenaDoDia(dia);
}

/** O mês `deslocamento` meses depois (ou antes, se negativo) de `referencia`, atravessando o ano se preciso. */
export function deslocarMes(referencia, deslocamento) {
  const primeiroDia = new Date(referencia.ano, referencia.mes + deslocamento, 1);
  return { ano: primeiroDia.getFullYear(), mes: primeiroDia.getMonth() };
}

/** Os `quantidade` meses depois de `referencia`. */
export function mesesSeguintes(referencia, quantidade) {
  return Array.from({ length: quantidade }, (_, indice) => deslocarMes(referencia, indice + 1));
}

export function ehMesPosterior(mes, referencia) {
  return mes.ano > referencia.ano || (mes.ano === referencia.ano && mes.mes > referencia.mes);
}

/**
 * Cópias (com ids novos) dos lançamentos de `origem` para `destino`, que precisa ser um mês seguinte.
 * Dias que não existem no destino (ex.: 30 em fevereiro) vão para o último dia do mês.
 * As cópias chegam como não pagas: o pagamento de um mês não quita o do outro.
 */
export function copiarLancamentosParaMes(lancamentos, { origem, destino, gerarId }) {
  if (!ehMesPosterior(destino, origem)) throw new ErroCopiaParaMesAnterior(origem, destino);
  return lancamentos.map((lancamento) => criarLancamento({
    ...lancamento,
    id: gerarId(),
    pago: false,
    dia: limitarDiaAoMes(lancamento.dia, destino.ano, destino.mes),
  }));
}

/** `pago` marca o gasto já quitado; dados salvos antes dessa marca chegam sem ela e valem como não pagos. */
export function criarLancamento({ id, descricao, tipo, valorCentavos, dia, pago = false }) {
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
  if (typeof pago !== 'boolean') throw new ErroLancamentoInvalido(`marca de pago ${pago}`);
  return Object.freeze({ id, descricao: descricaoLimpa, tipo, valorCentavos, dia, pago });
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

/** Lançamentos com dia dentro do intervalo: recebimentos primeiro, depois gastos; em cada grupo, por dia. */
export function lancamentosDoIntervalo(lancamentos, { primeiroDia, ultimoDia }) {
  return ordenarParaExibicao(lancamentos.filter(({ dia }) => dia >= primeiroDia && dia <= ultimoDia));
}

function ordenarParaExibicao(lancamentos) {
  return [...lancamentos].sort((a, b) => pesoDoTipo(a) - pesoDoTipo(b) || a.dia - b.dia);
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
    mediaMensalDeGasto: mediaDosMesesComGasto(totaisPorMes),
    percentualComprometido: recebido === 0 ? 0 : Math.round((gasto / recebido) * 100),
    gastosPorMes: totaisPorMes.map((total) => total.gasto),
    gastosPorCategoria,
    maiorCategoria: gastosPorCategoria[0] ?? { descricao: '—', totalCentavos: 0 },
  };
}

/** Média só dos meses que têm gasto: meses futuros ainda zerados não puxam a média para baixo. */
function mediaDosMesesComGasto(totaisPorMes) {
  const gastosDosMeses = totaisPorMes.map((total) => total.gasto).filter((gasto) => gasto > 0);
  return gastosDosMeses.length === 0 ? 0 : Math.round(somar(gastosDosMeses) / gastosDosMeses.length);
}

function somar(valores) {
  return valores.reduce((soma, valor) => soma + valor, 0);
}

/** Soma dos gastos por descrição, do maior para o menor; gastos sem valor ficam de fora. */
export function agruparGastosPorCategoria(lancamentos) {
  const totais = new Map();
  for (const { tipo, descricao, valorCentavos } of lancamentos) {
    if (tipo !== TIPO.DESPESA || valorCentavos === 0) continue;
    totais.set(descricao, (totais.get(descricao) ?? 0) + valorCentavos);
  }
  return [...totais]
    .map(([descricao, totalCentavos]) => ({ descricao, totalCentavos }))
    .sort((a, b) => b.totalCentavos - a.totalCentavos);
}
