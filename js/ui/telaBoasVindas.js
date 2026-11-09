import { MODO } from '../dominio/orcamento.js';

const ICONE_DO_MODO = {
  [MODO.MENSAL]: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  [MODO.QUINZENAL]: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M12 10v11"/>',
};

/** Primeira abertura: pergunta, com dois cartões grandes, se a pessoa controla o dinheiro por mês ou por quinzena. */
export function criarTelaBoasVindas(container, { local, aoEscolherModo }) {
  container.addEventListener('click', (evento) => {
    const cartao = evento.target.closest('[data-modo]');
    if (cartao) aoEscolherModo(cartao.dataset.modo);
  });

  function renderizar() {
    const { t } = local;
    container.innerHTML = `
      <div class="boas-vindas">
        <p class="boas-vindas__saudacao">${t('modo.boasVindas')}</p>
        <h2 class="boas-vindas__pergunta">${t('modo.pergunta')}</h2>
        <div class="boas-vindas__opcoes">
          ${[MODO.MENSAL, MODO.QUINZENAL].map((modo) => `
            <button type="button" class="cartao-modo" data-modo="${modo}">
              <svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONE_DO_MODO[modo]}</svg>
              <span class="cartao-modo__texto">
                <strong>${t(`modo.${modo}`)}</strong>
                <span>${t(`modo.${modo}.descricao`)}</span>
              </span>
            </button>`).join('')}
        </div>
        <p class="boas-vindas__nota">${t('modo.explicacao')}</p>
      </div>`;
  }

  return { renderizar };
}
