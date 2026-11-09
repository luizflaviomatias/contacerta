import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compararMeses } from '../js/dominio/comparacaoDeMeses.js';
import { TIPO, criarLancamento } from '../js/dominio/orcamento.js';

let contador = 0;
const gasto = (descricao, valorCentavos) =>
  criarLancamento({ id: `g-${++contador}`, descricao, tipo: TIPO.DESPESA, valorCentavos, dia: 10 });
const receita = (valorCentavos) =>
  criarLancamento({ id: `r-${++contador}`, descricao: 'Salário', tipo: TIPO.RECEITA, valorCentavos, dia: 5 });

test('compara recebido, gasto e saldo dos dois meses', () => {
  const comparacao = compararMeses([receita(300000), gasto('Luz', 20000)], [receita(280000), gasto('Luz', 15000)]);
  assert.deepEqual(comparacao.atual, { recebido: 300000, gasto: 20000, saldo: 280000 });
  assert.deepEqual(comparacao.anterior, { recebido: 280000, gasto: 15000, saldo: 265000 });
});

test('separa gastos que subiram, que desceram e conta os que não mudaram', () => {
  const comparacao = compararMeses(
    [gasto('Luz', 20000), gasto('Água', 8000), gasto('Aluguel', 90000)],
    [gasto('Luz', 15000), gasto('Água', 9000), gasto('Aluguel', 90000)],
  );
  assert.deepEqual(comparacao.subiram.map((item) => [item.descricao, item.diferencaCentavos]), [['Luz', 5000]]);
  assert.deepEqual(comparacao.desceram.map((item) => [item.descricao, item.diferencaCentavos]), [['Água', -1000]]);
  assert.equal(comparacao.quantidadeSemMudanca, 1);
});

test('gastos com a mesma descrição são somados antes de comparar', () => {
  const comparacao = compararMeses([gasto('Mercado', 30000), gasto('Mercado', 20000)], [gasto('Mercado', 40000)]);
  assert.deepEqual(comparacao.subiram[0], {
    descricao: 'Mercado', atualCentavos: 50000, anteriorCentavos: 40000, diferencaCentavos: 10000, variacao: 'subiu',
  });
});

test('gasto que só existe em um dos meses conta como zero no outro', () => {
  const comparacao = compararMeses([gasto('Farmácia', 6000)], [gasto('Presente', 12000)]);
  assert.equal(comparacao.subiram[0].anteriorCentavos, 0);
  assert.equal(comparacao.desceram[0].atualCentavos, 0);
});

test('maiores diferenças vêm primeiro', () => {
  const comparacao = compararMeses([gasto('Luz', 16000), gasto('Gás', 20000)], [gasto('Luz', 15000), gasto('Gás', 10000)]);
  assert.deepEqual(comparacao.subiram.map((item) => item.descricao), ['Gás', 'Luz']);
});

test('gastos sem valor nos dois meses não aparecem', () => {
  const comparacao = compararMeses([gasto('Carro', 0)], [gasto('Carro', 0)]);
  assert.deepEqual([comparacao.subiram, comparacao.desceram, comparacao.quantidadeSemMudanca], [[], [], 0]);
});
