/**
 * Pergunta de sim ou não no visual e no idioma do app (no lugar de `window.confirm`, que usa o idioma do aparelho).
 * `perguntar` devolve uma Promise com `true` se a pessoa confirmar.
 */
export function criarDialogoConfirmacao(dialogo, { local }) {
  const formulario = dialogo.querySelector('form');
  const mensagem = dialogo.querySelector('[data-campo="mensagem"]');
  const botaoDeConfirmar = dialogo.querySelector('button[value="confirmar"]');
  let resolverAberta = () => {};

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    responder(evento.submitter?.value === 'confirmar');
  });
  dialogo.addEventListener('cancel', () => resolverAberta(false));

  function responder(confirmou) {
    dialogo.close();
    resolverAberta(confirmou);
  }

  /** @param {{ texto: string, rotuloDeConfirmar: string }} pergunta */
  function perguntar({ texto, rotuloDeConfirmar }) {
    mensagem.textContent = texto;
    botaoDeConfirmar.textContent = rotuloDeConfirmar;
    dialogo.querySelector('button[value="cancelar"]').textContent = local.t('dialogo.cancelar');
    dialogo.showModal();
    return new Promise((resolver) => { resolverAberta = resolver; });
  }

  return { perguntar };
}
