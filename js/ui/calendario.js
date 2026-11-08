import { diasNoMes } from '../dominio/orcamento.js';
import { nomeDoMes } from './formatacao.js';

const INICIAIS_DOS_DIAS_DA_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Calendário somente com visão de mês. Listeners registrados uma única vez (delegação). */
export function criarCalendario(container, { aoSelecionarDia, aoTrocarMes }) {
  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) return;
    const acoes = {
      'mes-anterior': () => aoTrocarMes(-1),
      'mes-seguinte': () => aoTrocarMes(+1),
      'selecionar-dia': () => aoSelecionarDia(Number(botao.dataset.dia)),
    };
    acoes[botao.dataset.acao]?.();
  });

  function renderizar({ ano, mes, diaSelecionado, diaDeHoje, marcadores }) {
    container.innerHTML = `
      <div class="calendario__cabecalho">
        <button class="botao-icone" data-acao="mes-anterior" aria-label="Mês anterior">‹</button>
        <h2 class="calendario__titulo">${nomeDoMes(mes)} ${ano}</h2>
        <button class="botao-icone" data-acao="mes-seguinte" aria-label="Próximo mês">›</button>
      </div>
      <div class="calendario__grade" role="grid">
        ${INICIAIS_DOS_DIAS_DA_SEMANA.map((inicial) => `<span class="calendario__semana">${inicial}</span>`).join('')}
        ${celulasVaziasAntesDoDia1(ano, mes)}
        ${celulasDosDias({ ano, mes, diaSelecionado, diaDeHoje, marcadores })}
      </div>`;
  }

  return { renderizar };
}

function celulasVaziasAntesDoDia1(ano, mes) {
  const diaDaSemanaDoDia1 = new Date(ano, mes, 1).getDay();
  return '<span></span>'.repeat(diaDaSemanaDoDia1);
}

function celulasDosDias({ ano, mes, diaSelecionado, diaDeHoje, marcadores }) {
  return Array.from({ length: diasNoMes(ano, mes) }, (_, indice) => {
    const dia = indice + 1;
    const marcador = marcadores.get(dia);
    const classes = [
      'calendario__dia',
      dia === diaSelecionado && 'calendario__dia--selecionado',
      dia === diaDeHoje && 'calendario__dia--hoje',
    ].filter(Boolean).join(' ');
    return `
      <button class="${classes}" data-acao="selecionar-dia" data-dia="${dia}"
              aria-pressed="${dia === diaSelecionado}">
        <span>${dia}</span>
        <span class="calendario__marcas">
          ${marcador?.temReceita ? '<i class="marca marca--receita"></i>' : ''}
          ${marcador?.temDespesa ? '<i class="marca marca--despesa"></i>' : ''}
        </span>
      </button>`;
  }).join('');
}
