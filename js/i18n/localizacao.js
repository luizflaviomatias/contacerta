// Textos, nomes de meses e dinheiro no idioma e na moeda escolhidos.
import { criarFormatoDeDinheiro } from '../dominio/dinheiro.js';
import enUS from './textos/en-US.js';
import esES from './textos/es-ES.js';
import ptBR from './textos/pt-BR.js';

export const TEXTOS_POR_IDIOMA = Object.freeze({ 'pt-BR': ptBR, 'es-ES': esES, 'en-US': enUS });

const ANO_DE_REFERENCIA = 2000;
const TAMANHO_DO_NOME_ABREVIADO = 3;
const VALOR_DE_EXEMPLO_CENTAVOS = 15000;

export class ErroTextoSemTraducao extends Error {
  constructor(chave, idioma) {
    super(`Texto "${chave}" sem tradução para ${idioma}`);
    this.name = 'ErroTextoSemTraducao';
  }
}

/**
 * Localização trocável em tempo de execução: quem a recebe sempre usa o idioma e a moeda atuais.
 * @param {{ idioma: string, moeda: string }} configuracaoInicial
 */
export function criarLocalizacao(configuracaoInicial) {
  let idioma;
  let textos;
  let regrasDePlural;
  let formatoDoMes;
  let dinheiro;

  function configurar(configuracao) {
    idioma = configuracao.idioma;
    textos = TEXTOS_POR_IDIOMA[idioma];
    regrasDePlural = new Intl.PluralRules(idioma);
    formatoDoMes = new Intl.DateTimeFormat(idioma, { month: 'long' });
    dinheiro = criarFormatoDeDinheiro(configuracao);
  }

  /** `t('contas.emAberto', { n: 3 })` → "3 contas em aberto". */
  function t(chave, valores = {}) {
    const entrada = textos[chave];
    if (entrada === undefined) throw new ErroTextoSemTraducao(chave, idioma);
    const modelo = typeof entrada === 'string' ? entrada : entrada[regrasDePlural.select(valores.n)] ?? entrada.other;
    return modelo.replace(/\{(\w+)\}/g, (marcador, nome) => (nome in valores ? String(valores[nome]) : marcador));
  }

  function nomeDoMes(mes) {
    const nome = formatoDoMes.format(new Date(ANO_DE_REFERENCIA, mes, 1));
    return nome.charAt(0).toLocaleUpperCase(idioma) + nome.slice(1);
  }

  configurar(configuracaoInicial);

  return {
    configurar,
    t,
    nomeDoMes,
    nomeAbreviadoDoMes: (mes) => nomeDoMes(mes).slice(0, TAMANHO_DO_NOME_ABREVIADO),
    mesEAno: ({ ano, mes }) => t('data.mesEAno', { mes: nomeDoMes(mes), ano }),
    formatarMoeda: (centavos) => dinheiro.formatarMoeda(centavos),
    formatarParaEdicao: (centavos) => dinheiro.formatarParaEdicao(centavos),
    converterParaCentavos: (texto) => dinheiro.converterParaCentavos(texto),
    simboloDaMoeda: () => dinheiro.simboloDaMoeda,
    valorDeExemplo: () => dinheiro.formatarParaEdicao(VALOR_DE_EXEMPLO_CENTAVOS),
    idioma: () => idioma,
  };
}

/**
 * Preenche os textos fixos da página: `data-i18n` (texto), `data-i18n-html` (texto com marcação
 * vinda dos dicionários), `data-i18n-aria` (aria-label) e `data-i18n-title` (dica ao segurar).
 */
export function aplicarTextosNaPagina(raiz, local) {
  for (const elemento of raiz.querySelectorAll('[data-i18n]')) elemento.textContent = local.t(elemento.dataset.i18n);
  for (const elemento of raiz.querySelectorAll('[data-i18n-html]')) elemento.innerHTML = local.t(elemento.dataset.i18nHtml);
  for (const elemento of raiz.querySelectorAll('[data-i18n-aria]')) {
    elemento.setAttribute('aria-label', local.t(elemento.dataset.i18nAria));
  }
  for (const elemento of raiz.querySelectorAll('[data-i18n-title]')) elemento.title = local.t(elemento.dataset.i18nTitle);
}
