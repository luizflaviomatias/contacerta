const DURACAO_DO_AVISO_MS = 3500;

/** Mensagem curta que some sozinha (ex.: "3 meses receberam a cópia"). */
export function criarAviso(elemento) {
  let temporizador;

  function mostrar(texto) {
    clearTimeout(temporizador);
    elemento.textContent = texto;
    elemento.hidden = false;
    temporizador = setTimeout(() => { elemento.hidden = true; }, DURACAO_DO_AVISO_MS);
  }

  return { mostrar };
}
