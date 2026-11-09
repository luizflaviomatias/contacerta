// Valores monetários circulam sempre como inteiros em centavos (nunca float).

const NUMERO_COM_ATE_DUAS_CASAS = /^\d+(\.\d{1,2})?$/;
const SIMBOLOS_DE_MOEDA_E_ESPACOS = /US\$|R\$|[$€\s]/g;
const SEPARADOR_DECIMAL_PADRAO = ',';

export class ErroValorInvalido extends Error {
  constructor(textoDigitado) {
    super(`Valor inválido: "${textoDigitado}"`);
    this.name = 'ErroValorInvalido';
  }
}

/**
 * Formato de dinheiro de um idioma e de uma moeda, ex.: { idioma: 'pt-BR', moeda: 'BRL' } → "R$ 1.234,56";
 * { idioma: 'en-US', moeda: 'USD' } → "$1,234.56". O que se digita é lido com o separador decimal do idioma.
 */
export function criarFormatoDeDinheiro({ idioma, moeda }) {
  const formatadorMoeda = new Intl.NumberFormat(idioma, { style: 'currency', currency: moeda });
  const formatadorEdicao = new Intl.NumberFormat(idioma, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const separadorDecimal = parteDoFormato(formatadorEdicao, 'decimal');
  return {
    formatarMoeda: (centavos) => formatadorMoeda.format(centavos / 100),
    formatarParaEdicao: (centavos) => formatadorEdicao.format(centavos / 100),
    converterParaCentavos: (textoDigitado) => converterParaCentavos(textoDigitado, separadorDecimal),
    simboloDaMoeda: parteDoFormato(formatadorMoeda, 'currency'),
  };
}

function parteDoFormato(formatador, tipo) {
  return formatador.formatToParts(1234.5).find((parte) => parte.type === tipo).value;
}

/**
 * Aceita "5.250,00", "5250,5", "R$ 10" e vazio (= 0) com separador decimal ",";
 * "5,250.00" e "$10" com separador ".". O outro separador seguido de 1 ou 2 dígitos no fim
 * também vale como decimal ("5250.50" em português), porque é o jeito mais comum de errar.
 */
export function converterParaCentavos(textoDigitado, separadorDecimal = SEPARADOR_DECIMAL_PADRAO) {
  const semSimbolos = String(textoDigitado).replace(SIMBOLOS_DE_MOEDA_E_ESPACOS, '');
  if (semSimbolos === '') return 0;

  const normalizado = normalizarSeparadores(semSimbolos, separadorDecimal);
  if (!NUMERO_COM_ATE_DUAS_CASAS.test(normalizado)) {
    throw new ErroValorInvalido(textoDigitado);
  }
  return Math.round(Number(normalizado) * 100);
}

function normalizarSeparadores(texto, separadorDecimal) {
  const separadorDeMilhar = separadorDecimal === ',' ? '.' : ',';
  if (texto.includes(separadorDecimal)) {
    return texto.split(separadorDeMilhar).join('').replace(separadorDecimal, '.');
  }
  const partes = texto.split(separadorDeMilhar);
  const ultima = partes.at(-1);
  const terminaComCasasDecimais = partes.length > 1 && ultima.length <= 2;
  return terminaComCasasDecimais ? `${partes.slice(0, -1).join('')}.${ultima}` : partes.join('');
}
