import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SITUACAO, resumirContasAPagar, situacaoDaConta, vencimentosDoDia } from '../js/dominio/contasAPagar.js';
import { TIPO, criarLancamento, deslocarMes } from '../js/dominio/orcamento.js';

const NOVEMBRO_2026 = { ano: 2026, mes: 10 };
const HOJE = { ...NOVEMBRO_2026, dia: 10 };
const conta = (dia, { pago = false, valorCentavos = 1000, descricao = `Conta dia ${dia}` } = {}) =>
  criarLancamento({ id: `${descricao}-${dia}`, descricao, tipo: TIPO.DESPESA, valorCentavos, dia, pago });

test('no mês atual, a situação depende do dia de hoje', () => {
  assert.equal(situacaoDaConta(conta(9), NOVEMBRO_2026, HOJE), SITUACAO.ATRASADA);
  assert.equal(situacaoDaConta(conta(10), NOVEMBRO_2026, HOJE), SITUACAO.VENCE_HOJE);
  assert.equal(situacaoDaConta(conta(11), NOVEMBRO_2026, HOJE), SITUACAO.A_VENCER);
});

test('conta paga é paga em qualquer mês, mesmo com o dia já passado', () => {
  assert.equal(situacaoDaConta(conta(1, { pago: true }), NOVEMBRO_2026, HOJE), SITUACAO.PAGA);
  assert.equal(situacaoDaConta(conta(1, { pago: true }), { ano: 2026, mes: 0 }, HOJE), SITUACAO.PAGA);
});

test('conta não paga de mês passado está atrasada, mesmo com dia maior que hoje', () => {
  assert.equal(situacaoDaConta(conta(28), { ano: 2026, mes: 9 }, HOJE), SITUACAO.ATRASADA);
  assert.equal(situacaoDaConta(conta(28), { ano: 2025, mes: 11 }, HOJE), SITUACAO.ATRASADA);
});

test('conta de mês futuro ainda vai vencer, mesmo com dia menor que hoje', () => {
  assert.equal(situacaoDaConta(conta(1), { ano: 2026, mes: 11 }, HOJE), SITUACAO.A_VENCER);
  assert.equal(situacaoDaConta(conta(1), { ano: 2027, mes: 0 }, HOJE), SITUACAO.A_VENCER);
});

test('resumo soma o que falta pagar e o que já foi pago, ignorando recebimentos', () => {
  const salario = criarLancamento({ id: 's', descricao: 'Salário', tipo: TIPO.RECEITA, valorCentavos: 500000, dia: 5 });
  const resumo = resumirContasAPagar(
    [salario, conta(5, { valorCentavos: 3000 }), conta(20, { valorCentavos: 2000 }), conta(1, { pago: true, valorCentavos: 7000 })],
    NOVEMBRO_2026,
    HOJE,
  );
  assert.equal(resumo.quantidadeEmAberto, 2);
  assert.equal(resumo.totalEmAberto, 5000);
  assert.equal(resumo.totalPago, 7000);
  assert.equal(resumo.totalDoMes, 12000);
});

test('grupos seguem a ordem atrasadas, hoje, próximas, pagas e omitem grupos vazios', () => {
  const resumo = resumirContasAPagar([conta(20), conta(3, { pago: true }), conta(7), conta(2)], NOVEMBRO_2026, HOJE);
  assert.deepEqual(resumo.grupos.map((grupo) => grupo.situacao), [SITUACAO.ATRASADA, SITUACAO.A_VENCER, SITUACAO.PAGA]);
  assert.deepEqual(resumo.grupos[0].contas.map((item) => item.dia), [2, 7]);
});

test('mês sem gastos não tem grupos nem valores', () => {
  assert.deepEqual(resumirContasAPagar([], NOVEMBRO_2026, HOJE), {
    grupos: [], quantidadeEmAberto: 0, totalEmAberto: 0, totalPago: 0, totalDoMes: 0,
  });
});

test('deslocar mês atravessa a virada do ano para trás e para a frente', () => {
  assert.deepEqual(deslocarMes({ ano: 2026, mes: 0 }, -1), { ano: 2025, mes: 11 });
  assert.deepEqual(deslocarMes({ ano: 2026, mes: 11 }, 1), { ano: 2027, mes: 0 });
});

test('gasto ainda sem valor não aparece como conta em aberto', () => {
  const resumo = resumirContasAPagar([conta(5, { valorCentavos: 0 }), conta(6)], NOVEMBRO_2026, HOJE);
  assert.equal(resumo.quantidadeEmAberto, 1);
  assert.deepEqual(resumo.grupos.flatMap((grupo) => grupo.contas).map((item) => item.dia), [6]);
});

test('vencimentos do dia: só gastos com valor, não pagos, daquele dia', () => {
  const salario = criarLancamento({ id: 's', descricao: 'Salário', tipo: TIPO.RECEITA, valorCentavos: 100, dia: 10 });
  const lista = [salario, conta(10, { valorCentavos: 3000 }), conta(10, { valorCentavos: 2000, descricao: 'Água' }),
    conta(10, { pago: true }), conta(10, { valorCentavos: 0, descricao: 'Sem valor' }), conta(11)];

  const { contas, totalCentavos } = vencimentosDoDia(lista, 10);

  assert.deepEqual(contas.map((item) => item.descricao), ['Conta dia 10', 'Água']);
  assert.equal(totalCentavos, 5000);
});

test('dia sem contas não tem vencimentos', () => {
  assert.deepEqual(vencimentosDoDia([conta(3)], 4), { contas: [], totalCentavos: 0 });
});
