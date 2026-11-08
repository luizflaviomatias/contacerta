import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ErroCopiaParaMesAnterior, TIPO, copiarLancamentosParaMes, criarLancamento, ehMesPosterior, mesesSeguintes,
} from '../js/dominio/orcamento.js';

let contador = 0;
const gerarId = () => `novo-${++contador}`;
const NOVEMBRO_2026 = { ano: 2026, mes: 10 };
const adiantamento = criarLancamento({ id: 'a', descricao: 'Adiantamento', tipo: TIPO.RECEITA, valorCentavos: 150000, dia: 30 });
const aluguel = criarLancamento({ id: 'b', descricao: 'Aluguel', tipo: TIPO.DESPESA, valorCentavos: 87000, dia: 10 });

test('meses seguintes atravessam a virada do ano', () => {
  assert.deepEqual(mesesSeguintes(NOVEMBRO_2026, 3), [
    { ano: 2026, mes: 11 }, { ano: 2027, mes: 0 }, { ano: 2027, mes: 1 },
  ]);
});

test('mês seguinte é posterior; o mesmo mês e os anteriores não são', () => {
  assert.equal(ehMesPosterior({ ano: 2026, mes: 11 }, NOVEMBRO_2026), true);
  assert.equal(ehMesPosterior({ ano: 2027, mes: 0 }, NOVEMBRO_2026), true);
  assert.equal(ehMesPosterior(NOVEMBRO_2026, NOVEMBRO_2026), false);
  assert.equal(ehMesPosterior({ ano: 2026, mes: 9 }, NOVEMBRO_2026), false);
  assert.equal(ehMesPosterior({ ano: 2025, mes: 11 }, NOVEMBRO_2026), false);
});

test('copia descrição, tipo, valor e dia com ids novos', () => {
  const copia = copiarLancamentosParaMes([aluguel], { origem: NOVEMBRO_2026, destino: { ano: 2026, mes: 11 }, gerarId });
  assert.equal(copia.length, 1);
  assert.notEqual(copia[0].id, aluguel.id);
  assert.deepEqual({ ...copia[0], id: aluguel.id }, { ...aluguel });
});

test('dia 30 copiado para fevereiro vai para o último dia do mês', () => {
  const [copia] = copiarLancamentosParaMes([adiantamento], { origem: NOVEMBRO_2026, destino: { ano: 2027, mes: 1 }, gerarId });
  assert.equal(copia.dia, 28);
});

test('recusa copiar para o mesmo mês ou para mês anterior', () => {
  for (const destino of [NOVEMBRO_2026, { ano: 2026, mes: 0 }, { ano: 2025, mes: 11 }]) {
    assert.throws(
      () => copiarLancamentosParaMes([aluguel], { origem: NOVEMBRO_2026, destino, gerarId }),
      ErroCopiaParaMesAnterior,
    );
  }
});
