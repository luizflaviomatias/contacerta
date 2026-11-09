import { cabecalhoDePeriodo, ouvirTrocaDePeriodo } from './cabecalhoDePeriodo.js';
import { escaparHtml } from './formatacao.js';

/** Aba anual em "big numbers". */
export function criarPainelAnual(container, { local, aoTrocarAno }) {
  ouvirTrocaDePeriodo(container, aoTrocarAno);

  function renderizar({ ano, resumo }) {
    const { t, formatarMoeda } = local;
    const linhaDeResumo = (rotulo, centavos, percentual) => {
      const complemento = percentual === undefined ? '' : `<small>${percentual}%</small>`;
      return `<li><span>${escaparHtml(rotulo)}</span><span>${complemento} ${formatarMoeda(centavos)}</span></li>`;
    };
    container.innerHTML = `
      ${cabecalhoDePeriodo({
        titulo: t('anual.titulo', { ano }), rotuloAnterior: t('periodo.anoAnterior'), rotuloSeguinte: t('periodo.anoSeguinte'),
      })}
      <div class="big-numbers">
        ${numeroGrande(t('anual.gasto'), formatarMoeda(resumo.gasto), 'destaque')}
        ${numeroGrande(t('anual.recebido'), formatarMoeda(resumo.recebido))}
        ${numeroGrande(t('anual.saldo'), formatarMoeda(resumo.saldo), resumo.saldo < 0 ? 'negativo' : 'positivo')}
        ${numeroGrande(t('anual.media'), formatarMoeda(resumo.mediaMensalDeGasto))}
        ${numeroGrande(t('anual.rendaComprometida'), `${resumo.percentualComprometido}%`)}
        ${numeroGrande(t('anual.maiorGasto'), formatarMoeda(resumo.maiorCategoria.totalCentavos), '', resumo.maiorCategoria.descricao)}
      </div>
      <section class="cartao">
        <h3>${t('anual.gastosPorMes')}</h3>
        <ul class="lista-resumo">
          ${resumo.gastosPorMes.map((gasto, mes) => linhaDeResumo(local.nomeDoMes(mes), gasto)).join('')}
        </ul>
      </section>
      <section class="cartao">
        <h3>${t('anual.gastosPorCategoria')}</h3>
        <ul class="lista-resumo">
          ${resumo.gastosPorCategoria.length === 0 ? `<li class="lista-vazia">${t('anual.nenhumGasto')}</li>` : ''}
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

function percentualDe(parte, todo) {
  return todo === 0 ? 0 : Math.round((parte / todo) * 100);
}
