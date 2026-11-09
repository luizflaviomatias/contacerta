/**
 * Menu lateral (hambúrguer) que desliza da direita. Cada opção tem `data-tela`;
 * ao escolher, o menu fecha e avisa `aoEscolherTela(nome)`. Toque fora do painel também fecha.
 * Botões com `data-preferencia` e `data-valor` avisam `aoAlterarPreferencia(nome, valor)` e
 * deixam o menu aberto, para a pessoa ver o efeito da escolha.
 */
export function criarMenuLateral(dialogo, botaoDeAbrir, { aoEscolherTela, aoAlterarPreferencia }) {
  botaoDeAbrir.addEventListener('click', abrir);
  dialogo.addEventListener('close', () => botaoDeAbrir.setAttribute('aria-expanded', 'false'));
  dialogo.addEventListener('click', (evento) => {
    if (evento.target === dialogo) return dialogo.close();
    if (evento.target.closest('[data-acao="fechar-menu"]')) return dialogo.close();
    const escolha = evento.target.closest('[data-preferencia]');
    if (escolha) return aoAlterarPreferencia(escolha.dataset.preferencia, escolha.dataset.valor);
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

  /** @param {Record<string, string>} preferencias */
  function marcarPreferencias(preferencias) {
    for (const escolha of dialogo.querySelectorAll('[data-preferencia]')) {
      const escolhida = preferencias[escolha.dataset.preferencia] === escolha.dataset.valor;
      escolha.setAttribute('aria-pressed', String(escolhida));
    }
  }

  return { marcarTelaAtual, marcarPreferencias };
}
