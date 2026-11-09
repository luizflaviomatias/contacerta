// Guarda os lançamentos por ano. O armazenamento é injetado (localStorage no app, memória nos testes).
import { MESES_NO_ANO, criarLancamento } from '../dominio/orcamento.js';

const PREFIXO_DA_CHAVE = 'contacerta:ano:';
/** Nome usado quando o app se chamava Orçamento Quinzenal: lido uma vez e copiado para o nome novo. */
const PREFIXO_DA_CHAVE_ANTIGA = 'orcamento-quinzenal:ano:';
const SUFIXO_DA_COPIA_CORROMPIDA = ':corrompido';

export class ErroArmazenamento extends Error {
  constructor(mensagem, causa) {
    super(mensagem, { cause: causa });
    this.name = 'ErroArmazenamento';
  }
}

/** O ano salvo não pôde ser lido; `ano` diz qual, para a tela oferecer recomeçar só ele. */
export class ErroAnoCorrompido extends ErroArmazenamento {
  constructor(ano, causa) {
    super(`Dados salvos do ano ${ano} estão corrompidos`, causa);
    this.name = 'ErroAnoCorrompido';
    this.ano = ano;
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
    const salvo = armazenamento.getItem(chaveDoAno(ano)) ?? migrarDoNomeAntigo(ano);
    return salvo === null ? criarEGravarAno(ano) : desserializarAno(ano, salvo);
  }

  /** Copia o ano salvo com o nome antigo para o nome novo; a cópia antiga fica guardada por segurança. */
  function migrarDoNomeAntigo(ano) {
    const salvoComNomeAntigo = armazenamento.getItem(chaveAntigaDoAno(ano));
    if (salvoComNomeAntigo !== null) gravar(chaveDoAno(ano), salvoComNomeAntigo, ano);
    return salvoComNomeAntigo;
  }

  function criarEGravarAno(ano) {
    const anoInicial = criarAnoInicial(ano);
    gravarAno(ano, anoInicial);
    return anoInicial;
  }

  /** Grava primeiro e só então atualiza a memória: se a gravação falhar, a tela não mostra algo que não foi salvo. */
  function salvarMes(ano, mes, lancamentos) {
    const meses = [...obterAno(ano)];
    meses[mes] = lancamentos;
    gravarAno(ano, meses);
    anosCarregados.set(ano, meses);
  }

  /** Guarda o conteúdo ilegível numa chave à parte (para não perdê-lo de vez) e cria o ano do zero. */
  function recomecarAno(ano) {
    const conteudoAntigo = armazenamento.getItem(chaveDoAno(ano));
    if (conteudoAntigo !== null) gravar(chaveDoAno(ano) + SUFIXO_DA_COPIA_CORROMPIDA, conteudoAntigo, ano);
    anosCarregados.set(ano, criarEGravarAno(ano));
  }

  function gravarAno(ano, meses) {
    gravar(chaveDoAno(ano), JSON.stringify(meses), ano);
  }

  function gravar(chave, conteudo, ano) {
    try {
      armazenamento.setItem(chave, conteudo);
    } catch (erro) {
      throw new ErroArmazenamento(`Não foi possível salvar o ano ${ano}`, erro);
    }
  }

  function existeAnoSalvo(ano) {
    return anosCarregados.has(ano)
      || armazenamento.getItem(chaveDoAno(ano)) !== null
      || armazenamento.getItem(chaveAntigaDoAno(ano)) !== null;
  }

  return {
    existeAnoSalvo,
    obterMes: (ano, mes) => obterAno(ano)[mes],
    /** Como obterMes, mas não cria o ano se ele ainda não existe no aparelho (devolve lista vazia). */
    obterMesSalvo: (ano, mes) => (existeAnoSalvo(ano) ? obterAno(ano)[mes] : []),
    obterAno,
    salvarMes,
    recomecarAno,
  };
}

function chaveDoAno(ano) {
  return `${PREFIXO_DA_CHAVE}${ano}`;
}

function chaveAntigaDoAno(ano) {
  return `${PREFIXO_DA_CHAVE_ANTIGA}${ano}`;
}

function desserializarAno(ano, json) {
  try {
    const meses = JSON.parse(json);
    if (!Array.isArray(meses) || meses.length !== MESES_NO_ANO) throw new Error('formato inesperado');
    return meses.map((lancamentos) => lancamentos.map(criarLancamento));
  } catch (erro) {
    throw new ErroAnoCorrompido(ano, erro);
  }
}
