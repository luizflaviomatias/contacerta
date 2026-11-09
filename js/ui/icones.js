// Ícones em traço único (SVG), herdando a cor do texto. Decorativos: o nome acessível fica no botão.
function icone(desenho) {
  return `<svg class="icone" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${desenho}</svg>`;
}

export const ICONE = Object.freeze({
  anterior: icone('<path d="m15 18-6-6 6-6"/>'),
  seguinte: icone('<path d="m9 18 6-6-6-6"/>'),
  excluir: icone('<path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"/><path d="M9 7V4h6v3"/>'),
  mais: icone('<path d="M12 5v14M5 12h14"/>'),
});
