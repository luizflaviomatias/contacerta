import { ErroValorInvalido } from '../dominio/dinheiro.js';
import { TIPO } from '../dominio/orcamento.js';

/**
 * Janela para incluir um recebimento ou gasto.
 * `abrir` devolve uma Promise com os dados digitados, ou `undefined` se a pessoa cancelar.
 */
export function criarDialogoLancamento(dialogo, { local }) {
  const formulario = dialogo.querySelector('form');
  const campos = {
    titulo: dialogo.querySelector('[data-campo="titulo"]'),
    rotuloDoValor: dialogo.querySelector('[data-campo="rotulo-valor"]'),
    descricao: formulario.elements.descricao,
    valor: formulario.elements.valor,
    dia: formulario.elements.dia,
    erro: dialogo.querySelector('[data-campo="erro"]'),
  };
  let resolverAberto = () => {};

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (evento.submitter?.value === 'cancelar') return fechar(undefined);
    try {
      fechar({
        descricao: campos.descricao.value,
        valorCentavos: local.converterParaCentavos(campos.valor.value),
        dia: Number(campos.dia.value),
      });
    } catch (erro) {
      if (!(erro instanceof ErroValorInvalido)) throw erro;
      campos.erro.textContent = local.t('dialogo.erroValor', { exemplo: local.valorDeExemplo() });
      campos.valor.focus();
    }
  });
  dialogo.addEventListener('cancel', () => resolverAberto(undefined));

  function fechar(resultado) {
    dialogo.close();
    resolverAberto(resultado);
  }

  function abrir({ tipo, intervalo, diaSugerido }) {
    campos.titulo.textContent = local.t(tipo === TIPO.RECEITA ? 'dialogo.novoRecebimento' : 'dialogo.novoGasto');
    campos.rotuloDoValor.textContent = local.t('dialogo.valor', { simbolo: local.simboloDaMoeda() });
    campos.valor.placeholder = local.formatarParaEdicao(0);
    campos.descricao.value = '';
    campos.valor.value = '';
    campos.erro.textContent = '';
    campos.dia.min = intervalo.primeiroDia;
    campos.dia.max = intervalo.ultimoDia;
    campos.dia.value = diaSugerido;
    dialogo.showModal();
    campos.descricao.focus();
    return new Promise((resolver) => { resolverAberto = resolver; });
  }

  return { abrir };
}
