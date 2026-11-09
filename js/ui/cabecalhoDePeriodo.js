import { ICONE } from './icones.js';

/**
 * Título do período com setas para voltar e avançar. Os botões levam `data-acao="periodo-anterior"`
 * e `data-acao="periodo-seguinte"`; quem usa trata o clique.
 */
export function cabecalhoDePeriodo({ titulo, rotuloAnterior, rotuloSeguinte, subtitulo = '' }) {
  return `
    <div class="seletor-mes__cabecalho">
      <button class="botao-icone" data-acao="periodo-anterior" aria-label="${rotuloAnterior}">${ICONE.anterior}</button>
      <div class="cabecalho-periodo">
        <h2 class="seletor-mes__titulo">${titulo}</h2>
        ${subtitulo ? `<span class="cabecalho-periodo__subtitulo">${subtitulo}</span>` : ''}
      </div>
      <button class="botao-icone" data-acao="periodo-seguinte" aria-label="${rotuloSeguinte}">${ICONE.seguinte}</button>
    </div>`;
}

/** Liga as setas do cabeçalho a `aoTrocarPeriodo(-1 | +1)`. */
export function ouvirTrocaDePeriodo(container, aoTrocarPeriodo) {
  container.addEventListener('click', (evento) => {
    const acao = evento.target.closest('button[data-acao]')?.dataset.acao;
    if (acao === 'periodo-anterior') aoTrocarPeriodo(-1);
    if (acao === 'periodo-seguinte') aoTrocarPeriodo(+1);
  });
}
