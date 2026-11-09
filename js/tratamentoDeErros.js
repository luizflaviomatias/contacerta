import { ErroAnoCorrompido, ErroArmazenamento } from './dados/repositorioOrcamento.js';

/**
 * Fronteira entre a interface e o armazenamento: `proteger(acao)` devolve a mesma ação, que em vez de
 * derrubar a tela avisa a pessoa quando não dá para salvar e oferece recomeçar um ano ilegível.
 * Outros erros continuam subindo (são defeitos e precisam aparecer).
 */
export function criarTratamentoDeErros({ local, aviso, confirmacao, repositorio, aoRecuperarAno }) {
  function proteger(acao) {
    return (...argumentos) => {
      try {
        const resultado = acao(...argumentos);
        return resultado instanceof Promise ? resultado.catch(tratar) : resultado;
      } catch (erro) {
        return tratar(erro);
      }
    };
  }

  function tratar(erro) {
    if (erro instanceof ErroAnoCorrompido) return oferecerRecomeco(erro.ano);
    if (erro instanceof ErroArmazenamento) return aviso.mostrar(local.t('erro.salvar'));
    throw erro;
  }

  async function oferecerRecomeco(ano) {
    const recomecar = await confirmacao.perguntar({
      texto: local.t('erro.anoCorrompido', { ano }),
      rotuloDeConfirmar: local.t('erro.recomecarAno', { ano }),
    });
    if (!recomecar) return aviso.mostrar(local.t('erro.anoIndisponivel', { ano }));
    repositorio.recomecarAno(ano);
    aoRecuperarAno();
  }

  return { proteger };
}
