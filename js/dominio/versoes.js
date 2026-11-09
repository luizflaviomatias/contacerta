// Comparação de versões no formato maior.menor.correção (ex.: 3.1.0).

export class ErroVersaoInvalida extends Error {
  constructor(texto) {
    super(`Versão inválida: "${texto}"`);
    this.name = 'ErroVersaoInvalida';
  }
}

const FORMATO_DA_VERSAO = /^(\d+)\.(\d+)\.(\d+)$/;

function partesDa(versao) {
  const partes = FORMATO_DA_VERSAO.exec(String(versao));
  if (!partes) throw new ErroVersaoInvalida(versao);
  return partes.slice(1).map(Number);
}

/** Negativo se `a` é mais antiga que `b`, zero se iguais, positivo se mais nova. */
export function compararVersoes(a, b) {
  const partesDeA = partesDa(a);
  const partesDeB = partesDa(b);
  for (let indice = 0; indice < partesDeA.length; indice++) {
    const diferenca = partesDeA[indice] - partesDeB[indice];
    if (diferenca !== 0) return diferenca;
  }
  return 0;
}

export function ehMaisNova(versao, referencia) {
  return compararVersoes(versao, referencia) > 0;
}
