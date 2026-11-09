// Monta o atualizacao.json que o app instalado lê para saber da versão nova.

const RELEASES = 'https://github.com/luizflaviomatias/contacerta/releases/download';

export const nomeDoPacote = (versao) => `ContaCerta-web-${versao}.zip`;
export const etiquetaDoPacote = (versao) => `v${versao}`;

/**
 * @param {{ versao: string, sha256: string, versaoMinimaDoApk: string }} dados
 * `versaoMinimaDoApk`: APK mais antigo que tem tudo de nativo que esta versão usa (fica no package.json).
 */
export function montarAnuncio({ versao, sha256, versaoMinimaDoApk }) {
  return {
    versao,
    pacote: `${RELEASES}/${etiquetaDoPacote(versao)}/${nomeDoPacote(versao)}`,
    sha256,
    versaoMinimaDoApk,
    apk: `${RELEASES}/v${versaoMinimaDoApk}-apk/ContaCerta-${versaoMinimaDoApk}.apk`,
  };
}
