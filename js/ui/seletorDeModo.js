import { MODO } from '../dominio/orcamento.js';

const OUTRO_MODO = { [MODO.MENSAL]: MODO.QUINZENAL, [MODO.QUINZENAL]: MODO.MENSAL };

const DESENHO_DO_MODO = {
  [MODO.MENSAL]: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  [MODO.QUINZENAL]: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M12 10v11"/>',
};

/**
 * Botão no topo que mostra a visualização atual (mês inteiro ou quinzenas) e, ao tocar, troca para a outra.
 * Avisa `aoTrocarModo(novoModo)`.
 */
export function criarSeletorDeModo(botao, { local, aoTrocarModo }) {
  let modoAtual = MODO.QUINZENAL;
  botao.addEventListener('click', () => aoTrocarModo(OUTRO_MODO[modoAtual]));

  function renderizar(modo) {
    const { t } = local;
    modoAtual = modo;
    const nome = t(`visualizacao.${modo}`);
    const dica = t(OUTRO_MODO[modo] === MODO.MENSAL ? 'visualizacao.trocarParaMensal' : 'visualizacao.trocarParaQuinzenal');
    botao.innerHTML = `
      <svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${DESENHO_DO_MODO[modo]}</svg>
      <span>${nome}</span>`;
    botao.setAttribute('aria-label', `${t('visualizacao.atual', { modo: nome })}. ${dica}`);
    botao.title = dica;
  }

  return { renderizar };
}
