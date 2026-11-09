/**
 * Menu lateral (hambúrguer) que desliza da direita. Cada opção tem `data-tela`;
 * ao escolher, o menu fecha e avisa `aoEscolherTela(nome)`. Toque fora do painel também fecha.
 */
export function criarMenuLateral(dialogo, botaoDeAbrir, { aoEscolherTela }) {
  botaoDeAbrir.addEventListener('click', abrir);
  dialogo.addEventListener('close', () => botaoDeAbrir.setAttribute('aria-expanded', 'false'));
  dialogo.addEventListener('click', (evento) => {
    if (evento.target === dialogo) return dialogo.close();
    if (evento.target.closest('[data-acao="fechar-menu"]')) return dialogo.close();
    const opcao = evento.target.closest('[data-tela]');
    if (!opcao) return;
    dialogo.close();
    aoEscolherTela(opcao.dataset.tela);
  });

  function abrir() {
    botaoDeAbrir.setAttribute('aria-expanded', 'true');
    dialogo.showModal();
  }

  function marcarTelaAtual(nome) {
    for (const opcao of dialogo.querySelectorAll('[data-tela]')) {
      opcao.toggleAttribute('aria-current', opcao.dataset.tela === nome);
    }
  }

  return { marcarTelaAtual };
}
