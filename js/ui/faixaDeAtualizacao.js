import { escaparHtml } from './formatacao.js';

/**
 * Aviso de versão nova: pacote já baixado (com "Usar agora") ou APK novo para instalar (com "Baixar").
 */
export function criarFaixaDeAtualizacao(elemento, { local }) {
  let usarAgora = async () => {};
  elemento.addEventListener('click', (evento) => {
    if (evento.target.closest('[data-acao="usar-agora"]')) usarAgora();
  });

  /** @param {{ versao: string, usarAgora: () => Promise<void> }} pronto */
  function mostrarPacotePronto(pronto) {
    usarAgora = pronto.usarAgora;
    mostrar(`
      <p class="faixa-atualizacao__texto">${local.t('atualizacao.pronta', { versao: pronto.versao })}</p>
      <button type="button" class="faixa-atualizacao__botao" data-acao="usar-agora">${local.t('atualizacao.usarAgora')}</button>`);
  }

  /** @param {{ versao: string, endereco: string }} disponivel */
  function mostrarApkDisponivel({ versao, endereco }) {
    mostrar(`
      <p class="faixa-atualizacao__texto">${local.t('atualizacao.apk', { versao })}</p>
      <a class="faixa-atualizacao__botao" href="${escaparHtml(endereco)}" target="_blank" rel="noopener">${local.t('atualizacao.baixarApk')}</a>`);
  }

  function mostrar(conteudo) {
    elemento.innerHTML = conteudo;
    elemento.hidden = false;
  }

  return { mostrarPacotePronto, mostrarApkDisponivel };
}
