// O que vem do aparelho: armazenamento, relógio e funcionamento sem internet.

const CHAVE_DE_TESTE_DO_ARMAZENAMENTO = 'orcamento-quinzenal:teste';

/** No modo privado do Safari o localStorage pode falhar: aí os dados ficam só em memória. */
export function obterArmazenamentoDoAparelho() {
  try {
    window.localStorage.setItem(CHAVE_DE_TESTE_DO_ARMAZENAMENTO, '1');
    window.localStorage.removeItem(CHAVE_DE_TESTE_DO_ARMAZENAMENTO);
    return window.localStorage;
  } catch {
    const memoria = new Map();
    return { getItem: (chave) => memoria.get(chave) ?? null, setItem: (chave, valor) => memoria.set(chave, valor) };
  }
}

/**
 * Relógio lido sempre na hora, para o app aberto de um dia para o outro não ficar preso na data da abertura.
 * @param {() => Date} [lerDataEHora] trocável nos testes
 */
export function criarRelogio(lerDataEHora = () => new Date()) {
  return {
    hoje() {
      const agora = lerDataEHora();
      return { ano: agora.getFullYear(), mes: agora.getMonth(), dia: agora.getDate() };
    },
  };
}

export function gerarId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** No APK os arquivos já vêm dentro do app; o service worker só serve à versão web. */
export function registrarFuncionamentoOffline() {
  const ehAppNativo = window.Capacitor?.isNativePlatform?.() ?? false;
  if (!ehAppNativo && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
}
