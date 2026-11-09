import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ErroLancamentoInvalido, QUINZENA, TIPO, adicionarLancamento, alterarLancamento, criarLancamento,
  MES_INTEIRO, MODO, intervaloDaQuinzena, lancamentosDaQuinzena, lancamentosDoIntervalo, limitarDiaAoMes,
  periodoDoDia, periodosDoMes, quinzenaDoDia, removerLancamento,
  resumirAno, totalizar,
} from '../js/dominio/orcamento.js';
import { criarAnoConformePlanilha } from '../js/dados/modeloPlanilha.js';

let contador = 0;
const gerarId = () => `id-${++contador}`;
const receita = (valorCentavos, dia = 15) =>
  criarLancamento({ id: gerarId(), descricao: 'Salário', tipo: TIPO.RECEITA, valorCentavos, dia });
const despesa = (valorCentavos, dia = 15, descricao = 'Carro') =>
  criarLancamento({ id: gerarId(), descricao, tipo: TIPO.DESPESA, valorCentavos, dia });

test('dia 15 é o último dia da primeira quinzena', () => {
  assert.equal(quinzenaDoDia(15), QUINZENA.PRIMEIRA);
  assert.equal(quinzenaDoDia(16), QUINZENA.SEGUNDA);
});

test('segunda quinzena termina no último dia do mês', () => {
  assert.deepEqual(intervaloDaQuinzena(QUINZENA.SEGUNDA, 2026, 1), { primeiroDia: 16, ultimoDia: 28 });
  assert.deepEqual(intervaloDaQuinzena(QUINZENA.SEGUNDA, 2028, 1), { primeiroDia: 16, ultimoDia: 29 });
});

test('dia 30 em fevereiro vira o último dia do mês', () => {
  assert.equal(limitarDiaAoMes(30, 2026, 1), 28);
});

test('modo mensal tem um único período com o mês inteiro', () => {
  assert.deepEqual(periodosDoMes(MODO.MENSAL, 2026, 1), [{ periodo: MES_INTEIRO, primeiroDia: 1, ultimoDia: 28 }]);
  assert.equal(periodoDoDia(MODO.MENSAL, 20), MES_INTEIRO);
});

test('modo quinzenal tem as duas quinzenas, a segunda até o fim do mês', () => {
  assert.deepEqual(periodosDoMes(MODO.QUINZENAL, 2026, 3), [
    { periodo: QUINZENA.PRIMEIRA, primeiroDia: 1, ultimoDia: 15 },
    { periodo: QUINZENA.SEGUNDA, primeiroDia: 16, ultimoDia: 30 },
  ]);
  assert.equal(periodoDoDia(MODO.QUINZENAL, 20), QUINZENA.SEGUNDA);
});

test('lançamentos do intervalo vêm com recebimentos antes dos gastos, por dia', () => {
  const gastoDia20 = despesa(10, 20);
  const salarioDia5 = receita(20, 5);
  const gastoDia3 = despesa(30, 3);
  assert.deepEqual(lancamentosDoIntervalo([gastoDia20, salarioDia5, gastoDia3], { primeiroDia: 1, ultimoDia: 31 }),
    [salarioDia5, gastoDia3, gastoDia20]);
  assert.deepEqual(lancamentosDoIntervalo([gastoDia20, gastoDia3], { primeiroDia: 16, ultimoDia: 31 }), [gastoDia20]);
});

test('totaliza recebido, gasto e saldo', () => {
  assert.deepEqual(totalizar([receita(525000), despesa(232000)]), { recebido: 525000, gasto: 232000, saldo: 293000 });
});

test('saldo pode ficar negativo', () => {
  assert.equal(totalizar([receita(100), despesa(500)]).saldo, -400);
});

test('quinzena lista recebimentos antes dos gastos e ignora a outra quinzena', () => {
  const gasto = despesa(10, 3);
  const salario = receita(20, 15);
  const daSegunda = despesa(30, 20);
  assert.deepEqual(lancamentosDaQuinzena([gasto, daSegunda, salario], QUINZENA.PRIMEIRA), [salario, gasto]);
});

test('incluir, alterar e excluir não modificam a lista original', () => {
  const original = [receita(100)];
  const comGasto = adicionarLancamento(original, despesa(50));
  const alterada = alterarLancamento(comGasto, comGasto[1].id, { valorCentavos: 70 });
  const semGasto = removerLancamento(alterada, comGasto[1].id);

  assert.equal(original.length, 1);
  assert.equal(alterada[1].valorCentavos, 70);
  assert.equal(comGasto[1].valorCentavos, 50);
  assert.deepEqual(semGasto, original);
});

test('rejeita lançamento sem descrição ou com valor negativo', () => {
  assert.throws(() => despesa(10, 1, '   '), ErroLancamentoInvalido);
  assert.throws(() => despesa(-1), ErroLancamentoInvalido);
});

test('alterar id inexistente é erro', () => {
  assert.throws(() => alterarLancamento([], 'nao-existe', { valorCentavos: 1 }), ErroLancamentoInvalido);
});

test('modelo da planilha cria as 24 categorias zeradas em cada mês', () => {
  const ano = criarAnoConformePlanilha(2026, gerarId);
  assert.equal(ano.length, 12);
  for (const mes of ano) {
    assert.equal(lancamentosDaQuinzena(mes, QUINZENA.PRIMEIRA).length, 12);
    assert.equal(lancamentosDaQuinzena(mes, QUINZENA.SEGUNDA).length, 12);
    assert.deepEqual(totalizar(mes), { recebido: 0, gasto: 0, saldo: 0 });
  }
});

test('modelo da planilha vem no idioma escolhido', () => {
  const [janeiro] = criarAnoConformePlanilha(2026, gerarId, { idioma: 'es-ES' });
  assert.ok(janeiro.some((lancamento) => lancamento.descricao === 'Nómina (día 15)'));
  assert.ok(janeiro.some((lancamento) => lancamento.descricao === 'Coche'));
});

test('modelo mensal tem um único salário e os mesmos gastos do quinzenal', () => {
  const [mensal] = criarAnoConformePlanilha(2026, gerarId, { modo: 'mensal' });
  const [quinzenal] = criarAnoConformePlanilha(2026, gerarId, { modo: 'quinzenal' });
  const recebimentos = mensal.filter((lancamento) => lancamento.tipo === TIPO.RECEITA);
  const descricoesDosGastos = (mes) => mes.filter((item) => item.tipo === TIPO.DESPESA).map((item) => item.descricao);
  assert.deepEqual(recebimentos.map((item) => item.descricao), ['Salário']);
  assert.deepEqual(descricoesDosGastos(mensal), descricoesDosGastos(quinzenal));
});

test('modelo da planilha põe o adiantamento no último dia de fevereiro', () => {
  const fevereiro = criarAnoConformePlanilha(2026, gerarId)[1];
  assert.equal(fevereiro.find((lancamento) => lancamento.descricao === 'Adiantamento (dia 30)').dia, 28);
});

test('resumo anual soma os meses e aponta a maior categoria', () => {
  const mesComGastos = () => [receita(525000), despesa(124000, 15, 'Carro'), despesa(87000, 15, 'Moradia'), despesa(21000, 15, 'Financiamento')];
  const resumo = resumirAno(Array.from({ length: 12 }, mesComGastos));
  assert.equal(resumo.recebido, 12 * 525000);
  assert.equal(resumo.gasto, 12 * 232000);
  assert.equal(resumo.saldo, 12 * 293000);
  assert.equal(resumo.mediaMensalDeGasto, 232000);
  assert.equal(resumo.percentualComprometido, 44);
  assert.deepEqual(resumo.maiorCategoria, { descricao: 'Carro', totalCentavos: 12 * 124000 });
  assert.equal(resumo.gastosPorCategoria.length, 3);
});

test('resumo anual de ano vazio não divide por zero', () => {
  const resumo = resumirAno(Array.from({ length: 12 }, () => []));
  assert.equal(resumo.percentualComprometido, 0);
  assert.equal(resumo.maiorCategoria.totalCentavos, 0);
});

test('lançamento novo nasce não pago e pode ser marcado como pago', () => {
  const lista = [despesa(100)];
  assert.equal(lista[0].pago, false);
  const paga = alterarLancamento(lista, lista[0].id, { pago: true });
  assert.equal(paga[0].pago, true);
  assert.equal(lista[0].pago, false);
});

test('rejeita marca de pago que não seja verdadeiro ou falso', () => {
  assert.throws(
    () => criarLancamento({ id: 'x', descricao: 'Luz', tipo: TIPO.DESPESA, valorCentavos: 1, dia: 1, pago: 'sim' }),
    ErroLancamentoInvalido,
  );
});
