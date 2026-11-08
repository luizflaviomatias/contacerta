import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroValorInvalido, converterParaCentavos, formatarParaEdicao } from '../js/dominio/dinheiro.js';

test('converte formato brasileiro com milhar e centavos', () => {
  assert.equal(converterParaCentavos('5.250,00'), 525000);
});

test('converte vírgula com uma casa decimal', () => {
  assert.equal(converterParaCentavos('5250,5'), 525050);
});

test('converte ponto como separador decimal', () => {
  assert.equal(converterParaCentavos('5250.50'), 525050);
});

test('trata ponto seguido de três dígitos como milhar', () => {
  assert.equal(converterParaCentavos('1.240'), 124000);
});

test('ignora símbolo de moeda e espaços', () => {
  assert.equal(converterParaCentavos('R$ 870,00'), 87000);
});

test('campo vazio vale zero', () => {
  assert.equal(converterParaCentavos(''), 0);
});

test('não perde centavo por arredondamento de ponto flutuante', () => {
  assert.equal(converterParaCentavos('0,29'), 29);
});

test('rejeita texto, negativo e mais de duas casas', () => {
  for (const invalido of ['abc', '-10', '1,234']) {
    assert.throws(() => converterParaCentavos(invalido), ErroValorInvalido, invalido);
  }
});

test('formata para edição no padrão brasileiro', () => {
  assert.equal(formatarParaEdicao(525000), '5.250,00');
});
