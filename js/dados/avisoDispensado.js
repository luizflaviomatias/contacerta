// Lembra que a pessoa tocou em "Entendi" no aviso de contas do dia; no dia seguinte o aviso volta.

const CHAVE = 'contacerta:avisoDeVencimentoDispensadoEm';

/** @param {{ armazenamento: Pick<Storage, 'getItem' | 'setItem'> }} dependencias */
export function criarAvisoDispensado({ armazenamento }) {
  return {
    /** @param {{ ano: number, mes: number, dia: number }} dia */
    foiDispensadoEm: (dia) => armazenamento.getItem(CHAVE) === chaveDoDia(dia),
    dispensarEm: (dia) => armazenamento.setItem(CHAVE, chaveDoDia(dia)),
  };
}

function chaveDoDia({ ano, mes, dia }) {
  return `${ano}-${mes + 1}-${dia}`;
}
