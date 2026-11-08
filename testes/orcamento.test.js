import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ErroLancamentoInvalido, QUINZENA, TIPO, adicionarLancamento, alterarLancamento, criarLancamento,
  intervaloDaQuinzena, lancamentosDaQuinzena, limitarDiaAoMes, quinzenaDoDia, removerLancamento,
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
