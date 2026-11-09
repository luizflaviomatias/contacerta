import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODO, PERIODO, TIPO, criarLancamento } from '../js/dominio/orcamento.js';
import { criarGradeDoMes } from '../js/ui/gradeDoMes.js';
import { criarEspiao, criarTela, digitar, localEmPortugues } from './apoio/telaSimulada.js';

const salario = criarLancamento({ id: 's', descricao: 'Salário', tipo: TIPO.RECEITA, valorCentavos: 300000, dia: 5 });
const aluguel = criarLancamento({ id: 'a', descricao: 'Aluguel', tipo: TIPO.DESPESA, valorCentavos: 90000, dia: 10 });
const luzPaga = criarLancamento({ id: 'l', descricao: 'Luz', tipo: TIPO.DESPESA, valorCentavos: 15000, dia: 20, pago: true });

function montarGrade({ modo = MODO.QUINZENAL, periodoAtivo = PERIODO.PRIMEIRA, lancamentos = [salario, aluguel, luzPaga] } = {}) {
  const documento = criarTela('<div id="grade"></div>');
  const acoes = {
    aoAlterarValor: criarEspiao(), aoAlterarDescricao: criarEspiao(), aoMarcarPagamento: criarEspiao(),
    aoExcluir: criarEspiao(), aoAdicionar: criarEspiao(), aoTrocarPeriodo: criarEspiao(),
  };
  const container = documento.getElementById('grade');
  criarGradeDoMes(container, { local: localEmPortugues(), ...acoes })
    .renderizar({ modo, ano: 2026, mes: 10, lancamentos, periodoAtivo });
  return { container, acoes };
}

const descricoesNaTela = (container) => [...container.querySelectorAll('.campo-descricao')].map((campo) => campo.value);

test('modo mensal mostra um cartão só, com o mês inteiro e sem abas', () => {
  const { container } = montarGrade({ modo: MODO.MENSAL, periodoAtivo: PERIODO.MES_INTEIRO });
  assert.equal(container.querySelectorAll('.aba-quinzena').length, 0);
  assert.equal(container.querySelector('.quinzena h3').textContent, 'Mês inteiro');
  assert.deepEqual(descricoesNaTela(container), ['Salário', 'Aluguel', 'Luz']);
});

test('modo quinzenal mostra as duas abas e só os lançamentos da quinzena aberta', () => {
  const { container } = montarGrade({ periodoAtivo: PERIODO.SEGUNDA });
  assert.equal(container.querySelectorAll('.aba-quinzena').length, 2);
  assert.deepEqual(descricoesNaTela(container), ['Luz']);
});

test('valor digitado chega em centavos', () => {
  const { container, acoes } = montarGrade();
  digitar(container.querySelector('[data-id="a"] .campo-valor'), '1.234,56');
  assert.deepEqual(acoes.aoAlterarValor.chamadas.at(-1), ['a', 123456]);
});

test('valor inválido fica marcado e não é enviado', () => {
  const { container, acoes } = montarGrade();
  const campo = container.querySelector('[data-id="a"] .campo-valor');
  digitar(campo, 'abc');
  assert.equal(campo.getAttribute('aria-invalid'), 'true');
  assert.equal(acoes.aoAlterarValor.chamadas.length, 0);
});

test('gasto pago fica riscado e travado; recebimento não tem caixa de pago', () => {
  const { container } = montarGrade({ modo: MODO.MENSAL, periodoAtivo: PERIODO.MES_INTEIRO });
  const linhaPaga = container.querySelector('[data-id="l"]');
  assert.ok(linhaPaga.classList.contains('lancamento--pago'));
  assert.ok(linhaPaga.querySelector('.campo-valor').disabled);
  assert.ok(linhaPaga.querySelector('.botao-excluir').disabled);
  assert.equal(container.querySelector('[data-id="s"] .campo-pago'), null);
});

test('marcar a caixa avisa que o gasto foi pago', () => {
  const { container, acoes } = montarGrade();
  const caixa = container.querySelector('[data-id="a"] .campo-pago');
  caixa.checked = true;
  caixa.dispatchEvent(new window.Event('change', { bubbles: true }));
  assert.deepEqual(acoes.aoMarcarPagamento.chamadas, [['a', true]]);
});

test('botão de incluir envia os dias do período em que foi tocado', () => {
  const { container, acoes } = montarGrade({ periodoAtivo: PERIODO.SEGUNDA });
  container.querySelector('.botao-adicionar[data-tipo="despesa"]').click();
  assert.deepEqual(acoes.aoAdicionar.chamadas, [['despesa', { primeiroDia: 16, ultimoDia: 30 }]]);
});

test('totais do mês aparecem formatados em reais', () => {
  const { container } = montarGrade();
  const texto = (chave) => container.querySelector(`[data-total="${chave}"]`).textContent.replace(/\s/g, ' ');
  assert.equal(texto('mes-recebido'), 'R$ 3.000,00');
  assert.equal(texto('mes-saldo'), 'R$ 1.950,00');
});
