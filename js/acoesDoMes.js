import {
  adicionarLancamento, alterarLancamento, copiarLancamentosParaMes, criarLancamento, mesesSeguintes, removerLancamento,
} from './dominio/orcamento.js';

const MESES_OFERECIDOS_NA_COPIA = 12;

/**
 * O que a pessoa faz com os lançamentos do mês aberto: incluir, alterar, marcar como pago, excluir e copiar.
 * Cada ação salva e pede para a tela se redesenhar; erros de armazenamento são tratados por quem chama.
 */
export function criarAcoesDoMes({
  repositorio, mesAberto, local, gerarId, dialogoLancamento, dialogoCopia, confirmacao, aviso, aoSalvar, aoDigitarValor,
}) {
  function lancamentosDoMes() {
    const { ano, mes } = mesAberto();
    return repositorio.obterMes(ano, mes);
  }

  function salvarMes(lancamentos) {
    const { ano, mes } = mesAberto();
    repositorio.salvarMes(ano, mes, lancamentos);
  }

  /** Durante a digitação só os totais mudam, para o campo em edição não perder o foco. */
  function alterarValor(id, valorCentavos) {
    const lancamentos = alterarLancamento(lancamentosDoMes(), id, { valorCentavos });
    salvarMes(lancamentos);
    aoDigitarValor(lancamentos);
  }

  /** Descrição apagada não é aceita: a tela volta a mostrar a descrição salva. */
  function alterarDescricao(id, descricao) {
    if (descricao.trim() !== '') salvarMes(alterarLancamento(lancamentosDoMes(), id, { descricao }));
    aoSalvar();
  }

  function marcarPagamento(id, pago) {
    salvarMes(alterarLancamento(lancamentosDoMes(), id, { pago }));
    aoSalvar();
  }

  async function excluir(id) {
    const lancamento = lancamentosDoMes().find((item) => item.id === id);
    const confirmou = await confirmacao.perguntar({
      texto: local.t('lancamento.confirmarExclusao', { descricao: lancamento.descricao }),
      rotuloDeConfirmar: local.t('confirmacao.excluir'),
    });
    if (!confirmou) return;
    salvarMes(removerLancamento(lancamentosDoMes(), id));
    aoSalvar();
  }

  /** @param {{ primeiroDia: number, ultimoDia: number }} intervalo dias do período onde o botão foi tocado */
  async function incluir(tipo, intervalo) {
    const digitado = await dialogoLancamento.abrir({ tipo, intervalo, diaSugerido: intervalo.primeiroDia });
    if (!digitado) return;
    const dia = Math.min(Math.max(digitado.dia, intervalo.primeiroDia), intervalo.ultimoDia);
    salvarMes(adicionarLancamento(lancamentosDoMes(), criarLancamento({ ...digitado, dia, tipo, id: gerarId() })));
    aoSalvar();
  }

  /** Por padrão, marca os meses que faltam no ano; os do ano seguinte ficam disponíveis, desmarcados. */
  async function copiarParaMesesSeguintes() {
    const origem = mesAberto();
    const opcoes = mesesSeguintes(origem, MESES_OFERECIDOS_NA_COPIA)
      .map((destino) => ({ ...destino, marcado: destino.ano === origem.ano }));
    const destinos = await dialogoCopia.abrir({ origem, opcoes });
    if (!destinos) return;

    const lancamentosDaOrigem = lancamentosDoMes();
    for (const destino of destinos) {
      repositorio.salvarMes(destino.ano, destino.mes, copiarLancamentosParaMes(lancamentosDaOrigem, { origem, destino, gerarId }));
    }
    aviso.mostrar(local.t('copia.concluida', { n: destinos.length }));
  }

  return { lancamentosDoMes, alterarValor, alterarDescricao, marcarPagamento, excluir, incluir, copiarParaMesesSeguintes };
}
