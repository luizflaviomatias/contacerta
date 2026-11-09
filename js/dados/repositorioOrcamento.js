// Guarda os lançamentos por ano. O armazenamento é injetado (localStorage no app, memória nos testes).
import { MESES_NO_ANO, criarLancamento } from '../dominio/orcamento.js';

// Nome antigo do app mantido de propósito: trocar a chave apagaria os lançamentos de quem já usa.
const PREFIXO_DA_CHAVE = 'orcamento-quinzenal:ano:';

export class ErroArmazenamento extends Error {
  constructor(mensagem, causa) {
    super(mensagem, { cause: causa });
    this.name = 'ErroArmazenamento';
  }
}

/**
 * @param {{ armazenamento: Pick<Storage, 'getItem' | 'setItem'>,
 *           criarAnoInicial: (ano: number) => Array<Array> }} dependencias
 */
export function criarRepositorioOrcamento({ armazenamento, criarAnoInicial }) {
  const anosCarregados = new Map();

  function obterAno(ano) {
    if (!anosCarregados.has(ano)) anosCarregados.set(ano, lerOuCriarAno(ano));
    return anosCarregados.get(ano);
  }

  function lerOuCriarAno(ano) {
    const salvo = armazenamento.getItem(chaveDoAno(ano));
    if (salvo !== null) return desserializarAno(ano, salvo);
    const anoInicial = criarAnoInicial(ano);
    gravarAno(ano, anoInicial);
    return anoInicial;
  }

  function salvarMes(ano, mes, lancamentos) {
    const meses = [...obterAno(ano)];
    meses[mes] = lancamentos;
    anosCarregados.set(ano, meses);
    gravarAno(ano, meses);
  }

  function gravarAno(ano, meses) {
    try {
      armazenamento.setItem(chaveDoAno(ano), JSON.stringify(meses));
    } catch (erro) {
      throw new ErroArmazenamento(`Não foi possível salvar o ano ${ano}`, erro);
    }
  }

  return {
    obterMes: (ano, mes) => obterAno(ano)[mes],
    obterAno,
    salvarMes,
  };
}

function chaveDoAno(ano) {
  return `${PREFIXO_DA_CHAVE}${ano}`;
}

function desserializarAno(ano, json) {
  try {
    const meses = JSON.parse(json);
    if (!Array.isArray(meses) || meses.length !== MESES_NO_ANO) throw new Error('formato inesperado');
    return meses.map((lancamentos) => lancamentos.map(criarLancamento));
  } catch (erro) {
    throw new ErroArmazenamento(`Dados salvos do ano ${ano} estão corrompidos`, erro);
  }
}
