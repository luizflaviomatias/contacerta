// Adaptador do plugin Capgo Capacitor Updater: o resto do app fala só com estas funções.

const PACOTE_BAIXADO_COM_SUCESSO = 'success';

/** @param {object} plugin `window.Capacitor.Plugins.CapacitorUpdater` */
export function criarAtualizacaoNativa(plugin) {
  return {
    /** Sem este aviso logo na abertura, o plugin acha que o pacote quebrou e volta para o anterior. */
    confirmarQueAbriu: () => plugin.notifyAppReady(),
    versaoDoApk: async () => (await plugin.current()).native,
    pacoteJaBaixado: async (versao) => (await plugin.list()).bundles
      .find((pacote) => pacote.version === versao && pacote.status === PACOTE_BAIXADO_COM_SUCESSO)?.id,
    baixar: async ({ endereco, versao, sha256 }) => (await plugin.download({ url: endereco, version: versao, checksum: sha256 })).id,
    /** O plugin troca de pacote quando o app vai para segundo plano ou é aberto de novo. */
    usarNaProximaAbertura: (id) => plugin.next({ id }),
    usarAgora: (id) => plugin.set({ id }),
  };
}

/** Só existe no app instalado (APK); no navegador o service worker já entrega a versão nova. */
export function obterPluginDeAtualizacao() {
  const capacitor = window.Capacitor;
  if (!capacitor?.isNativePlatform?.()) return undefined;
  return capacitor.Plugins?.CapacitorUpdater;
}
