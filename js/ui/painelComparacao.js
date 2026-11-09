import { formatarMoeda } from '../dominio/dinheiro.js';
import { cabecalhoDePeriodo, ouvirTrocaDePeriodo } from './cabecalhoDePeriodo.js';
import { escaparHtml, nomeDoMes } from './formatacao.js';

/**
 * Relatório "Este mês × anterior": uma frase direta sobre o gasto, a tabela dos totais
 * e os gastos que subiram ou baixaram. Gasto que sobe é ruim (vermelho); recebimento e saldo que sobem são bons (verde).
 */
export function criarPainelComparacao(container, { aoTrocarMes }) {
  ouvirTrocaDePeriodo(container, aoTrocarMes);

  /** @param {{ mes:{ano:number,mes:number}, mesAnterior:{ano:number,mes:number}, comparacao:object }} dados */
  function renderizar({ mes, mesAnterior, comparacao }) {
    const nomeAtual = nomeDoMes(mes.mes);
    const nomeAnterior = nomeDoMes(mesAnterior.mes);
    container.innerHTML = `
      ${cabecalhoDePeriodo({
        titulo: `${nomeAtual} de ${mes.ano}`,
        subtitulo: `comparado com ${nomeAnterior} de ${mesAnterior.ano}`,
        rotuloAnterior: 'Mês anterior',
        rotuloSeguinte: 'Próximo mês',
      })}
      ${resumoDaComparacao(comparacao, nomeAtual, nomeAnterior)}
      ${listaDeGastos('Gastos que subiram', 'subiram', comparacao.subiram)}
      ${listaDeGastos('Gastos que baixaram', 'desceram', comparacao.desceram)}
      ${rodapeDaComparacao(comparacao)}`;
  }

  return { renderizar };
}

function resumoDaComparacao({ atual, anterior }, nomeAtual, nomeAnterior) {
  return `
    <section class="resumo-comparacao" aria-label="Totais dos dois meses">
      <p class="resumo-comparacao__frase">${fraseDoGasto(atual.gasto - anterior.gasto, nomeAnterior)}</p>
      <table class="tabela-comparacao">
        <thead><tr><td></td><th scope="col">${nomeAnterior}</th><th scope="col">${nomeAtual}</th></tr></thead>
        <tbody>
          ${linhaDeTotal('Recebido', anterior.recebido, atual.recebido)}
          ${linhaDeTotal('Gasto', anterior.gasto, atual.gasto)}
          ${linhaDeTotal('Saldo', anterior.saldo, atual.saldo)}
        </tbody>
      </table>
    </section>`;
}

function fraseDoGasto(diferencaCentavos, nomeAnterior) {
  if (diferencaCentavos === 0) return `Você gastou o mesmo que em ${nomeAnterior}.`;
  const comparativo = diferencaCentavos > 0 ? 'a mais' : 'a menos';
  return `Você gastou <strong>${formatarMoeda(Math.abs(diferencaCentavos))} ${comparativo}</strong> que em ${nomeAnterior}.`;
}

function linhaDeTotal(rotulo, anteriorCentavos, atualCentavos) {
  return `
    <tr>
      <th scope="row">${rotulo}</th>
      <td class="${classeDeNegativo(anteriorCentavos)}">${formatarMoeda(anteriorCentavos)}</td>
      <td class="${classeDeNegativo(atualCentavos)}"><strong>${formatarMoeda(atualCentavos)}</strong></td>
    </tr>`;
}

function classeDeNegativo(centavos) {
  return centavos < 0 ? 'valor--negativo' : '';
}

function listaDeGastos(titulo, tipoDeMudanca, gastos) {
  if (gastos.length === 0) return '';
  return `
    <section class="cartao gastos-comparados gastos-comparados--${tipoDeMudanca}">
      <h3>${titulo} <span class="grupo-contas__quantidade">${gastos.length}</span></h3>
      <ul class="lista-contas">${gastos.map(linhaDoGasto).join('')}</ul>
    </section>`;
}

function linhaDoGasto({ descricao, anteriorCentavos, atualCentavos, diferencaCentavos }) {
  const comparativo = diferencaCentavos > 0 ? 'a mais' : 'a menos';
  return `
    <li class="gasto-comparado">
      <span class="conta__texto">
        <span class="conta__descricao">${escaparHtml(descricao)}</span>
        <span class="conta__vencimento">${formatarMoeda(anteriorCentavos)} → ${formatarMoeda(atualCentavos)}</span>
      </span>
      <strong class="gasto-comparado__diferenca">${formatarMoeda(Math.abs(diferencaCentavos))}<small>${comparativo}</small></strong>
    </li>`;
}

function rodapeDaComparacao({ subiram, desceram, quantidadeSemMudanca }) {
  if (subiram.length === 0 && desceram.length === 0) {
    return '<p class="cartao lista-vazia">Nenhum gasto mudou de valor entre os dois meses.</p>';
  }
  if (quantidadeSemMudanca === 0) return '';
  const texto = quantidadeSemMudanca === 1 ? '1 gasto ficou igual' : `${quantidadeSemMudanca} gastos ficaram iguais`;
  return `<p class="nota-rodape">${texto}.</p>`;
}
