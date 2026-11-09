import { cabecalhoDePeriodo, ouvirTrocaDePeriodo } from './cabecalhoDePeriodo.js';
import { escaparHtml } from './formatacao.js';

/**
 * Relatório "Este mês × anterior": uma frase direta sobre o gasto, a tabela dos totais
 * e os gastos que subiram ou baixaram. Gasto que sobe é ruim (vermelho); recebimento e saldo que sobem são bons (verde).
 */
export function criarPainelComparacao(container, { local, aoTrocarMes }) {
  ouvirTrocaDePeriodo(container, aoTrocarMes);

  /** @param {{ mes:{ano:number,mes:number}, mesAnterior:{ano:number,mes:number}, comparacao:object }} dados */
  function renderizar({ mes, mesAnterior, comparacao }) {
    const { t } = local;
    container.innerHTML = `
      ${cabecalhoDePeriodo({
        titulo: local.mesEAno(mes),
        subtitulo: t('comparacao.comparadoCom', { mes: local.mesEAno(mesAnterior) }),
        rotuloAnterior: t('periodo.mesAnterior'),
        rotuloSeguinte: t('periodo.mesSeguinte'),
      })}
      ${resumoDaComparacao(comparacao, local.nomeDoMes(mes.mes), local.nomeDoMes(mesAnterior.mes), local)}
      ${listaDeGastos(t('comparacao.subiram'), 'subiram', comparacao.subiram, local)}
      ${listaDeGastos(t('comparacao.desceram'), 'desceram', comparacao.desceram, local)}
      ${rodapeDaComparacao(comparacao, t)}`;
  }

  return { renderizar };
}

function resumoDaComparacao({ atual, anterior }, nomeAtual, nomeAnterior, local) {
  const { t } = local;
  const linha = (rotulo, anteriorCentavos, atualCentavos) => `
    <tr>
      <th scope="row">${rotulo}</th>
      <td class="${classeDeNegativo(anteriorCentavos)}">${local.formatarMoeda(anteriorCentavos)}</td>
      <td class="${classeDeNegativo(atualCentavos)}"><strong>${local.formatarMoeda(atualCentavos)}</strong></td>
    </tr>`;
  return `
    <section class="resumo-comparacao" aria-label="${t('comparacao.totais')}">
      <p class="resumo-comparacao__frase">${fraseDoGasto(atual.gasto - anterior.gasto, nomeAnterior, local)}</p>
      <table class="tabela-comparacao">
        <thead><tr><td></td><th scope="col">${nomeAnterior}</th><th scope="col">${nomeAtual}</th></tr></thead>
        <tbody>
          ${linha(t('comparacao.recebido'), anterior.recebido, atual.recebido)}
          ${linha(t('comparacao.gasto'), anterior.gasto, atual.gasto)}
          ${linha(t('comparacao.saldo'), anterior.saldo, atual.saldo)}
        </tbody>
      </table>
    </section>`;
}

function fraseDoGasto(diferencaCentavos, nomeAnterior, { t, formatarMoeda }) {
  if (diferencaCentavos === 0) return t('comparacao.gastouIgual', { mes: nomeAnterior });
  const chave = diferencaCentavos > 0 ? 'comparacao.gastouMais' : 'comparacao.gastouMenos';
  return t(chave, { valor: formatarMoeda(Math.abs(diferencaCentavos)), mes: nomeAnterior });
}

function classeDeNegativo(centavos) {
  return centavos < 0 ? 'valor--negativo' : '';
}

function listaDeGastos(titulo, tipoDeMudanca, gastos, local) {
  if (gastos.length === 0) return '';
  return `
    <section class="cartao gastos-comparados gastos-comparados--${tipoDeMudanca}">
      <h3>${titulo} <span class="grupo-contas__quantidade">${gastos.length}</span></h3>
      <ul class="lista-contas">${gastos.map((gasto) => linhaDoGasto(gasto, local)).join('')}</ul>
    </section>`;
}

function linhaDoGasto({ descricao, anteriorCentavos, atualCentavos, diferencaCentavos }, { t, formatarMoeda }) {
  const comparativo = diferencaCentavos > 0 ? t('comparacao.aMais') : t('comparacao.aMenos');
  return `
    <li class="gasto-comparado">
      <span class="conta__texto">
        <span class="conta__descricao">${escaparHtml(descricao)}</span>
        <span class="conta__vencimento">${formatarMoeda(anteriorCentavos)} → ${formatarMoeda(atualCentavos)}</span>
      </span>
      <strong class="gasto-comparado__diferenca">${formatarMoeda(Math.abs(diferencaCentavos))}<small>${comparativo}</small></strong>
    </li>`;
}

function rodapeDaComparacao({ subiram, desceram, quantidadeSemMudanca }, t) {
  if (subiram.length === 0 && desceram.length === 0) {
    return `<p class="cartao lista-vazia">${t('comparacao.nadaMudou')}</p>`;
  }
  if (quantidadeSemMudanca === 0) return '';
  return `<p class="nota-rodape">${t('comparacao.iguais', { n: quantidadeSemMudanca })}</p>`;
}
