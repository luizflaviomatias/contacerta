// Adaptador do plugin @capacitor/local-notifications: o resto do app fala só com estas funções.

export const CANAL_DE_VENCIMENTOS = 'vencimentos';
const IMPORTANCIA_ALTA = 4;
const VISIVEL_NA_TELA_BLOQUEADA = 1;
const PERMISSAO_CONCEDIDA = 'granted';

/** @param {object} plugin `window.Capacitor.Plugins.LocalNotifications` */
export function criarNotificacoesNativas(plugin) {
  return {
    temPermissao: async () => (await plugin.checkPermissions()).display === PERMISSAO_CONCEDIDA,
    pedirPermissao: async () => (await plugin.requestPermissions()).display === PERMISSAO_CONCEDIDA,
    prepararCanal: (nome) => plugin.createChannel({
      id: CANAL_DE_VENCIMENTOS, name: nome, importance: IMPORTANCIA_ALTA, visibility: VISIVEL_NA_TELA_BLOQUEADA,
    }),
    /** O app só agenda avisos de vencimento: tudo o que está pendente é dele. */
    cancelarTodas: async () => {
      const { notifications: pendentes } = await plugin.getPending();
      if (pendentes.length > 0) await plugin.cancel({ notifications: pendentes.map(({ id }) => ({ id })) });
    },
    agendar: async (notificacoes) => {
      if (notificacoes.length > 0) await plugin.schedule({ notifications: notificacoes });
    },
    aoTocar: (reagir) => plugin.addListener('localNotificationActionPerformed', ({ notification }) => reagir(notification.extra)),
  };
}

export function obterPluginDeNotificacoes() {
  const capacitor = window.Capacitor;
  if (!capacitor?.isNativePlatform?.()) return undefined;
  return capacitor.Plugins?.LocalNotifications;
}
