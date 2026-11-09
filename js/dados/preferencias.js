// Preferências da pessoa (controle, tema, idioma e moeda), guardadas no aparelho.
// O armazenamento é injetado (localStorage no app, memória nos testes).
import { MODO } from '../dominio/orcamento.js';

export { MODO };
export const TEMA = Object.freeze({ CLARO: 'claro', ESCURO: 'escuro' });
export const IDIOMA = Object.freeze({ PORTUGUES: 'pt-BR', ESPANHOL: 'es-ES', INGLES: 'en-US' });
export const MOEDA = Object.freeze({ REAL: 'BRL', EURO: 'EUR', DOLAR: 'USD' });

const CHAVE = 'contacerta:preferencias';
const IDIOMA_PADRAO = IDIOMA.INGLES;
const IDIOMA_POR_PREFIXO = { pt: IDIOMA.PORTUGUES, es: IDIOMA.ESPANHOL, en: IDIOMA.INGLES };
const MOEDA_POR_IDIOMA = {
  [IDIOMA.PORTUGUES]: MOEDA.REAL,
  [IDIOMA.ESPANHOL]: MOEDA.EURO,
  [IDIOMA.INGLES]: MOEDA.DOLAR,
};

/** O primeiro idioma do aparelho que o app fala; se nenhum, inglês. */
export function escolherIdiomaDoAparelho(idiomasDoAparelho) {
  for (const idioma of idiomasDoAparelho) {
    const suportado = IDIOMA_POR_PREFIXO[String(idioma).toLowerCase().split('-')[0]];
    if (suportado) return suportado;
  }
  return IDIOMA_PADRAO;
}

export function moedaDoIdioma(idioma) {
  return MOEDA_POR_IDIOMA[idioma];
}

/**
 * @param {{ armazenamento: Pick<Storage, 'getItem' | 'setItem'>,
 *           idiomasDoAparelho: readonly string[],
 *           jaUsavaOApp: boolean }} dependencias
 * `jaUsavaOApp`: quem já tinha lançamentos continua no modo quinzenal, sem a pergunta inicial.
 */
export function criarPreferencias({ armazenamento, idiomasDoAparelho, jaUsavaOApp }) {
  let atuais = lerOuCriar();

  function lerOuCriar() {
    const salvas = lerSalvas();
    if (salvas) return completarComPadroes(salvas);
    const idioma = escolherIdiomaDoAparelho(idiomasDoAparelho);
    const iniciais = {
      modo: jaUsavaOApp ? MODO.QUINZENAL : undefined,
      tema: TEMA.CLARO,
      idioma,
      moeda: moedaDoIdioma(idioma),
    };
    gravar(iniciais);
    return iniciais;
  }

  function lerSalvas() {
    try {
      const salvas = JSON.parse(armazenamento.getItem(CHAVE));
      return salvas && typeof salvas === 'object' ? salvas : undefined;
    } catch {
      return undefined;
    }
  }

  /** Valores desconhecidos (dados corrompidos ou de outra versão) voltam ao padrão. */
  function completarComPadroes(salvas) {
    const idioma = valorValido(salvas.idioma, IDIOMA) ?? escolherIdiomaDoAparelho(idiomasDoAparelho);
    return {
      modo: valorValido(salvas.modo, MODO) ?? (jaUsavaOApp ? MODO.QUINZENAL : undefined),
      tema: valorValido(salvas.tema, TEMA) ?? TEMA.CLARO,
      idioma,
      moeda: valorValido(salvas.moeda, MOEDA) ?? moedaDoIdioma(idioma),
    };
  }

  function gravar(preferencias) {
    armazenamento.setItem(CHAVE, JSON.stringify(preferencias));
  }

  function alterar(alteracoes) {
    atuais = completarComPadroes({ ...atuais, ...alteracoes });
    gravar(atuais);
    return atuais;
  }

  return {
    obter: () => atuais,
    alterar,
    precisaEscolherModo: () => atuais.modo === undefined,
  };
}

function valorValido(valor, opcoes) {
  return Object.values(opcoes).includes(valor) ? valor : undefined;
}
