import { MESES_NO_ANO } from '../dominio/orcamento.js';
import { nomeAbreviadoDoMes, nomeDoMes } from './formatacao.js';

/** Seletor só de meses: ano com setas e os 12 meses clicáveis. Listeners registrados uma única vez. */
export function criarSeletorDeMes(container, { aoSelecionarMes, aoTrocarAno }) {
  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;
    const acoes = {
      'ano-anterior': () => aoTrocarAno(-1),
      'ano-seguinte': () => aoTrocarAno(+1),
      'selecionar-mes': () => aoSelecionarMes(Number(botao.dataset.mes)),
    };
    acoes[botao.dataset.acao]?.();
  });

  function renderizar({ ano, mesSelecionado, mesAtual }) {
    container.innerHTML = `
      <div class="seletor-mes__cabecalho">
        <button class="botao-icone" data-acao="ano-anterior" aria-label="Ano anterior">‹</button>
        <h2 class="seletor-mes__titulo">${ano}</h2>
        <button class="botao-icone" data-acao="ano-seguinte" aria-label="Próximo ano">›</button>
      </div>
      <div class="seletor-mes__grade">
        ${Array.from({ length: MESES_NO_ANO }, (_, mes) => botaoDoMes(mes, mesSelecionado, mesAtual)).join('')}
      </div>`;
  }

  return { renderizar };
}

function botaoDoMes(mes, mesSelecionado, mesAtual) {
  const classes = [
    'seletor-mes__mes',
    mes === mesSelecionado && 'seletor-mes__mes--selecionado',
    mes === mesAtual && 'seletor-mes__mes--atual',
  ].filter(Boolean).join(' ');
  return `
    <button class="${classes}" data-acao="selecionar-mes" data-mes="${mes}"
            aria-pressed="${mes === mesSelecionado}" aria-label="${nomeDoMes(mes)}">
      ${nomeAbreviadoDoMes(mes)}
    </button>`;
}
