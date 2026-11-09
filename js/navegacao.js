/**
 * Troca de telas: mostra a seção da tela escolhida, esconde as outras e a redesenha.
 * @param {{ telas: Record<string, { renderizar: () => void, aoAbrir?: () => void }>,
 *           secoes: NodeListOf<HTMLElement>, topo: HTMLElement, aoTrocarTela: (nome: string) => void }} dependencias
 */
export function criarNavegacao({ telas, secoes, topo, aoTrocarTela }) {
  let telaAtual;

  function abrirTela(nome) {
    telaAtual = nome;
    telas[nome].aoAbrir?.();
    for (const secao of secoes) secao.hidden = secao.dataset.telaConteudo !== nome;
    topo.dataset.tela = nome;
    aoTrocarTela(nome);
    renderizarTelaAtual();
    window.scrollTo(0, 0);
  }

  /** Cada tela se redesenha ao abrir e depois de cada mudança, porque o mês pode ter mudado em outra. */
  function renderizarTelaAtual() {
    telas[telaAtual].renderizar();
  }

  return { abrirTela, renderizarTelaAtual };
}
