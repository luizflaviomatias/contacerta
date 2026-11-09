import { escaparHtml } from './formatacao.js';

/**
 * Faixa no topo da tela principal com as contas que vencem hoje e ainda não foram pagas.
 * "Ver contas" avisa `aoVerContas`; "Entendi" avisa `aoDispensar`. Sem contas, a faixa some.
 */
export function criarFaixaDeVencimentos(elemento, { local, aoVerContas, aoDispensar }) {
  elemento.addEventListener('click', (evento) => {
    const acao = evento.target.closest('button[data-acao]')?.dataset.acao;
    if (acao === 'ver-contas') aoVerContas();
    if (acao === 'dispensar') aoDispensar();
  });

  /** @param {{ contas: Array<{ descricao: string, valorCentavos: number }>, totalCentavos: number }} vencimentos */
  function renderizar({ contas, totalCentavos }) {
    elemento.hidden = contas.length === 0;
    if (contas.length === 0) return;
    const { t } = local;
    elemento.innerHTML = `
      <p class="faixa-vencimentos__texto" role="status">${textoDoAviso(contas, totalCentavos, local)}</p>
      <div class="faixa-vencimentos__acoes">
        <button type="button" class="faixa-vencimentos__ver" data-acao="ver-contas">${t('vencimento.verContas')}</button>
        <button type="button" class="faixa-vencimentos__dispensar" data-acao="dispensar">${t('vencimento.entendi')}</button>
      </div>`;
  }

  function esconder() {
    elemento.hidden = true;
  }

  return { renderizar, esconder };
}

function textoDoAviso(contas, totalCentavos, local) {
  const nome = (conta) => `<strong>${escaparHtml(conta.descricao)}</strong>`;
  if (contas.length === 1) {
    return local.t('vencimento.hojeUma', { nome: nome(contas[0]), valor: local.formatarMoeda(totalCentavos) });
  }
  return local.t('vencimento.hojeVarias', {
    n: contas.length, nomes: local.listar(contas.map(nome)), valor: local.formatarMoeda(totalCentavos),
  });
}
