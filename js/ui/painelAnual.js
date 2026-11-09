import { formatarMoeda } from '../dominio/dinheiro.js';
import { escaparHtml, nomeDoMes } from './formatacao.js';
import { ICONE } from './icones.js';

/** Aba anual em "big numbers". */
export function criarPainelAnual(container, { aoTrocarAno }) {
  container.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (botao?.dataset.acao === 'ano-anterior') aoTrocarAno(-1);
    if (botao?.dataset.acao === 'ano-seguinte') aoTrocarAno(+1);
  });

  function renderizar({ ano, resumo }) {
    container.innerHTML = `
      <div class="seletor-mes__cabecalho">
        <button class="botao-icone" data-acao="ano-anterior" aria-label="Ano anterior">${ICONE.anterior}</button>
        <h2 class="seletor-mes__titulo">Visão anual ${ano}</h2>
        <button class="botao-icone" data-acao="ano-seguinte" aria-label="Próximo ano">${ICONE.seguinte}</button>
      </div>
      <div class="big-numbers">
        ${numeroGrande('Gasto no ano', formatarMoeda(resumo.gasto), 'destaque')}
        ${numeroGrande('Recebido no ano', formatarMoeda(resumo.recebido))}
        ${numeroGrande('Saldo do ano', formatarMoeda(resumo.saldo), resumo.saldo < 0 ? 'negativo' : 'positivo')}
        ${numeroGrande('Média de gasto por mês', formatarMoeda(resumo.mediaMensalDeGasto))}
        ${numeroGrande('Renda comprometida', `${resumo.percentualComprometido}%`)}
        ${numeroGrande('Maior gasto do ano', formatarMoeda(resumo.maiorCategoria.totalCentavos), '', resumo.maiorCategoria.descricao)}
      </div>
      <section class="cartao">
        <h3>Gastos por mês</h3>
        <ul class="lista-resumo">
          ${resumo.gastosPorMes.map((gasto, mes) => linhaDeResumo(nomeDoMes(mes), gasto)).join('')}
        </ul>
      </section>
      <section class="cartao">
        <h3>Gastos por categoria</h3>
        <ul class="lista-resumo">
          ${resumo.gastosPorCategoria.length === 0 ? '<li class="lista-vazia">Nenhum gasto no ano</li>' : ''}
          ${resumo.gastosPorCategoria.map(({ descricao, totalCentavos }) =>
            linhaDeResumo(descricao, totalCentavos, percentualDe(totalCentavos, resumo.gasto))).join('')}
        </ul>
      </section>`;
  }

  return { renderizar };
}

function numeroGrande(rotulo, valor, variante = '', detalhe = '') {
  return `
    <div class="numero-grande ${variante ? `numero-grande--${variante}` : ''}">
      <span class="numero-grande__rotulo">${rotulo}</span>
      <strong class="numero-grande__valor">${valor}</strong>
      ${detalhe ? `<span class="numero-grande__detalhe">${escaparHtml(detalhe)}</span>` : ''}
    </div>`;
}

function linhaDeResumo(rotulo, centavos, percentual) {
  const complemento = percentual === undefined ? '' : `<small>${percentual}%</small>`;
  return `<li><span>${escaparHtml(rotulo)}</span><span>${complemento} ${formatarMoeda(centavos)}</span></li>`;
}

function percentualDe(parte, todo) {
  return todo === 0 ? 0 : Math.round((parte / todo) * 100);
}
