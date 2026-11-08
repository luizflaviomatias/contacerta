import { nomeDoMes } from './formatacao.js';

/**
 * Janela para escolher para quais meses seguintes copiar o mês aberto.
 * `abrir` devolve uma Promise com os meses marcados ({ ano, mes }[]), ou `undefined` se a pessoa cancelar.
 */
export function criarDialogoCopia(dialogo) {
  const formulario = dialogo.querySelector('form');
  const titulo = dialogo.querySelector('[data-campo="titulo"]');
  const listaDeMeses = dialogo.querySelector('[data-campo="meses"]');
  const erro = dialogo.querySelector('[data-campo="erro"]');
  let opcoesAbertas = [];
  let resolverAberto = () => {};

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (evento.submitter?.value === 'cancelar') return fechar(undefined);
    const marcados = opcoesAbertas.filter((_, indice) => formulario.elements[`mes-${indice}`].checked);
    if (marcados.length === 0) {
      erro.textContent = 'Marque pelo menos um mês.';
      return;
    }
    fechar(marcados.map(({ ano, mes }) => ({ ano, mes })));
  });
  dialogo.addEventListener('cancel', () => resolverAberto(undefined));

  function fechar(resultado) {
    dialogo.close();
    resolverAberto(resultado);
  }

  /** @param {{ origem: {ano:number, mes:number}, opcoes: Array<{ano:number, mes:number, marcado:boolean}> }} dados */
  function abrir({ origem, opcoes }) {
    opcoesAbertas = opcoes;
    titulo.textContent = `Copiar ${nomeDoMes(origem.mes)} ${origem.ano}`;
    erro.textContent = '';
    listaDeMeses.innerHTML = opcoes.map(({ ano, mes, marcado }, indice) => `
      <label class="opcao-mes">
        <input type="checkbox" name="mes-${indice}" ${marcado ? 'checked' : ''}>
        <span>${nomeDoMes(mes)} ${ano}</span>
      </label>`).join('');
    dialogo.showModal();
    return new Promise((resolver) => { resolverAberto = resolver; });
  }

  return { abrir };
}
