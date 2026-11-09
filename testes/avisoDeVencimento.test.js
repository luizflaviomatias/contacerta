import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAvisoDispensado } from '../js/dados/avisoDispensado.js';
import { criarFaixaDeVencimentos } from '../js/ui/faixaDeVencimentos.js';
import { criarEspiao, criarTela, localEmPortugues } from './apoio/telaSimulada.js';

const luz = { descricao: 'Luz', valorCentavos: 14830 };
const agua = { descricao: 'Água', valorCentavos: 9000 };
const gas = { descricao: 'Gás <b>', valorCentavos: 11000 };

function montarFaixa() {
  const documento = criarTela('<aside id="faixa" hidden></aside>');
  const aoVerContas = criarEspiao();
  const aoDispensar = criarEspiao();
  const faixa = criarFaixaDeVencimentos(documento.getElementById('faixa'), { local: localEmPortugues(), aoVerContas, aoDispensar });
  return { elemento: documento.getElementById('faixa'), faixa, aoVerContas, aoDispensar };
}

const textoDa = (elemento) => elemento.querySelector('.faixa-vencimentos__texto').textContent.replace(/\s/g, ' ');

test('uma conta: mostra o nome e o valor', () => {
  const { elemento, faixa } = montarFaixa();
  faixa.renderizar({ contas: [luz], totalCentavos: 14830 });
  assert.equal(elemento.hidden, false);
  assert.equal(textoDa(elemento), 'Hoje vence: Luz — R$ 148,30');
});

test('várias contas: lista os nomes em português e mostra o total', () => {
  const { elemento, faixa } = montarFaixa();
  faixa.renderizar({ contas: [luz, agua, gas], totalCentavos: 34830 });
  assert.equal(textoDa(elemento), 'Hoje vencem 3 contas: Luz, Água e Gás <b>. Total de R$ 348,30');
  assert.equal(elemento.querySelector('b'), null, 'o nome digitado não vira marcação');
});

test('sem contas, a faixa fica escondida', () => {
  const { elemento, faixa } = montarFaixa();
  faixa.renderizar({ contas: [], totalCentavos: 0 });
  assert.equal(elemento.hidden, true);
});

test('botões avisam ver contas e entendi', () => {
  const { elemento, faixa, aoVerContas, aoDispensar } = montarFaixa();
  faixa.renderizar({ contas: [luz], totalCentavos: 14830 });
  elemento.querySelector('[data-acao="ver-contas"]').click();
  elemento.querySelector('[data-acao="dispensar"]').click();
  assert.equal(aoVerContas.chamadas.length, 1);
  assert.equal(aoDispensar.chamadas.length, 1);
});

test('"Entendi" vale só para o dia em que foi tocado', () => {
  const dados = new Map();
  const avisoDispensado = criarAvisoDispensado({
    armazenamento: { getItem: (chave) => dados.get(chave) ?? null, setItem: (chave, valor) => dados.set(chave, valor) },
  });
  const hoje = { ano: 2026, mes: 10, dia: 9 };
  avisoDispensado.dispensarEm(hoje);
  assert.equal(avisoDispensado.foiDispensadoEm(hoje), true);
  assert.equal(avisoDispensado.foiDispensadoEm({ ...hoje, dia: 10 }), false);
});
