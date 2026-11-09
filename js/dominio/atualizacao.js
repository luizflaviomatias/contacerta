// Decide o que fazer com o anúncio de versão nova publicado no site (atualizacao.json).
import { compararVersoes, ehMaisNova } from './versoes.js';

export const ACAO_DE_ATUALIZACAO = Object.freeze({
  NENHUMA: 'nenhuma',
  BAIXAR_PACOTE: 'baixar-pacote',
  INSTALAR_APK: 'instalar-apk',
});

export class ErroAnuncioInvalido extends Error {
  constructor(motivo) {
    super(`Anúncio de atualização inválido: ${motivo}`);
    this.name = 'ErroAnuncioInvalido';
  }
}

const SHA256_EM_HEXADECIMAL = /^[0-9a-f]{64}$/;
const ENDERECO_PERMITIDO = /^https:\/\/(github\.com\/luizflaviomatias\/contacerta\/|luizflaviomatias\.github\.io\/contacerta\/)/;

/**
 * Confere o anúncio antes de usá-lo: versões no formato certo, SHA-256 do pacote e
 * endereços só do repositório e do site do ContaCerta.
 */
export function validarAnuncio(anuncio) {
  const { versao, pacote, sha256, versaoMinimaDoApk, apk } = anuncio ?? {};
  for (const [nome, valor] of Object.entries({ versao, versaoMinimaDoApk })) {
    try { compararVersoes(valor, valor); } catch { throw new ErroAnuncioInvalido(`${nome} "${valor}"`); }
  }
  if (!SHA256_EM_HEXADECIMAL.test(String(sha256))) throw new ErroAnuncioInvalido('sha256');
  for (const [nome, endereco] of Object.entries({ pacote, apk })) {
    if (!ENDERECO_PERMITIDO.test(String(endereco))) throw new ErroAnuncioInvalido(`endereço ${nome}`);
  }
  return { versao, pacote, sha256, versaoMinimaDoApk, apk };
}

/**
 * @param {{ versaoEmUso: string, versaoDoApk: string, anuncio: ReturnType<typeof validarAnuncio> }} situacao
 * `versaoEmUso`: a versão das telas e regras rodando agora (pode ser um pacote já baixado);
 * `versaoDoApk`: a versão do app instalado, que define quais recursos nativos existem.
 */
export function decidirAtualizacao({ versaoEmUso, versaoDoApk, anuncio }) {
  if (!ehMaisNova(anuncio.versao, versaoEmUso)) return { acao: ACAO_DE_ATUALIZACAO.NENHUMA };
  if (ehMaisNova(anuncio.versaoMinimaDoApk, versaoDoApk)) {
    return { acao: ACAO_DE_ATUALIZACAO.INSTALAR_APK, versao: anuncio.versao, endereco: anuncio.apk };
  }
  return { acao: ACAO_DE_ATUALIZACAO.BAIXAR_PACOTE, versao: anuncio.versao, endereco: anuncio.pacote, sha256: anuncio.sha256 };
}
