// Valores monetários circulam sempre como inteiros em centavos (nunca float).

const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatadorEdicao = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMERO_COM_ATE_DUAS_CASAS = /^\d+(\.\d{1,2})?$/;
const TERMINA_COM_CASAS_DECIMAIS = /\.\d{1,2}$/;
const PONTOS_EXCETO_O_ULTIMO = /\.(?=.*\.)/g;

export class ErroValorInvalido extends Error {
  constructor(textoDigitado) {
    super(`Valor inválido: "${textoDigitado}"`);
    this.name = 'ErroValorInvalido';
  }
}

export function formatarMoeda(centavos) {
  return formatadorMoeda.format(centavos / 100);
}

export function formatarParaEdicao(centavos) {
  return formatadorEdicao.format(centavos / 100);
}

/** Aceita "5.250,00", "5250,5", "5250.50", "R$ 10" e vazio (= 0). */
export function converterParaCentavos(textoDigitado) {
  const semSimbolos = String(textoDigitado).replace(/[R$\s]/g, '');
  if (semSimbolos === '') return 0;

  const normalizado = normalizarSeparadores(semSimbolos);
  if (!NUMERO_COM_ATE_DUAS_CASAS.test(normalizado)) {
    throw new ErroValorInvalido(textoDigitado);
  }
  return Math.round(Number(normalizado) * 100);
}

function normalizarSeparadores(texto) {
  if (texto.includes(',')) return texto.replace(/\./g, '').replace(',', '.');
  if (TERMINA_COM_CASAS_DECIMAIS.test(texto)) return texto.replace(PONTOS_EXCETO_O_ULTIMO, '');
  return texto.replace(/\./g, '');
}
