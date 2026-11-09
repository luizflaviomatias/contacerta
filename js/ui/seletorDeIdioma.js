import { IDIOMA } from '../dados/preferencias.js';

// Bandeiras simplificadas (3:2), desenhadas aqui porque emojis de bandeira não aparecem em todo aparelho.
const BANDEIRA = {
  [IDIOMA.PORTUGUES]: `
    <rect width="30" height="20" fill="#009c3b"/>
    <path d="M15 2.5 27.5 10 15 17.5 2.5 10z" fill="#ffdf00"/>
    <circle cx="15" cy="10" r="4.6" fill="#002776"/>
    <path d="M10.6 9.1c3-.9 6.1-.6 8.8.9" stroke="#fff" stroke-width=".9" fill="none"/>`,
  [IDIOMA.ESPANHOL]: `
    <rect width="30" height="20" fill="#aa151b"/>
    <rect y="5" width="30" height="10" fill="#f1bf00"/>`,
  [IDIOMA.INGLES]: `
    <rect width="30" height="20" fill="#fff"/>
    <path d="M0 0h30M0 3.08h30M0 6.15h30M0 9.23h30M0 12.3h30M0 15.38h30M0 18.46h30" stroke="#b22234" stroke-width="1.54" transform="translate(0 .77)"/>
    <rect width="13" height="10.77" fill="#3c3b6e"/>
    <g fill="#fff">
      <circle cx="2.2" cy="2" r=".7"/><circle cx="6.5" cy="2" r=".7"/><circle cx="10.8" cy="2" r=".7"/>
      <circle cx="4.3" cy="4.2" r=".7"/><circle cx="8.6" cy="4.2" r=".7"/>
      <circle cx="2.2" cy="6.4" r=".7"/><circle cx="6.5" cy="6.4" r=".7"/><circle cx="10.8" cy="6.4" r=".7"/>
      <circle cx="4.3" cy="8.6" r=".7"/><circle cx="8.6" cy="8.6" r=".7"/>
    </g>`,
};

/** Nome de cada idioma escrito nele mesmo: é assim que a pessoa o reconhece, qualquer que seja o idioma atual. */
const NOME_DO_IDIOMA = {
  [IDIOMA.PORTUGUES]: 'Português (Brasil)',
  [IDIOMA.ESPANHOL]: 'Español (España)',
  [IDIOMA.INGLES]: 'English (US)',
};

function bandeira(idioma) {
  return `<svg class="bandeira" viewBox="0 0 30 20" aria-hidden="true" focusable="false">${BANDEIRA[idioma]}</svg>`;
}

/**
 * Botão com a bandeira do idioma atual que abre uma lista só de bandeiras.
 * Fecha ao escolher, ao tocar fora ou com Esc; avisa `aoEscolherIdioma(idioma)`.
 */
export function criarSeletorDeIdioma(container, { local, aoEscolherIdioma }) {
  container.innerHTML = `
    <button type="button" class="botao-idioma" aria-haspopup="true" aria-expanded="false" aria-controls="lista-de-idiomas"></button>
    <ul class="lista-de-idiomas" id="lista-de-idiomas" hidden>
      ${Object.values(IDIOMA).map((idioma) => `
        <li>
          <button type="button" class="opcao-idioma" data-idioma="${idioma}" lang="${idioma}" aria-label="${NOME_DO_IDIOMA[idioma]}">
            ${bandeira(idioma)}
          </button>
        </li>`).join('')}
    </ul>`;
  const botao = container.querySelector('.botao-idioma');
  const lista = container.querySelector('.lista-de-idiomas');

  botao.addEventListener('click', () => (lista.hidden ? abrir() : fechar()));
  lista.addEventListener('click', (evento) => {
    const opcao = evento.target.closest('[data-idioma]');
    if (!opcao) return;
    fechar();
    aoEscolherIdioma(opcao.dataset.idioma);
  });
  document.addEventListener('click', (evento) => {
    if (!lista.hidden && !container.contains(evento.target)) fechar();
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && !lista.hidden) fechar({ devolverFoco: true });
  });

  function abrir() {
    lista.hidden = false;
    botao.setAttribute('aria-expanded', 'true');
    lista.querySelector('[aria-current]')?.focus();
  }

  function fechar({ devolverFoco = false } = {}) {
    lista.hidden = true;
    botao.setAttribute('aria-expanded', 'false');
    if (devolverFoco) botao.focus();
  }

  /** Mostra a bandeira do idioma atual e o marca na lista. */
  function renderizar(idiomaAtual) {
    botao.innerHTML = bandeira(idiomaAtual);
    botao.setAttribute('aria-label', `${local.t('idioma.escolher')}. ${local.t('idioma.atual', { idioma: NOME_DO_IDIOMA[idiomaAtual] })}`);
    for (const opcao of lista.querySelectorAll('[data-idioma]')) {
      opcao.toggleAttribute('aria-current', opcao.dataset.idioma === idiomaAtual);
    }
  }

  return { renderizar };
}
