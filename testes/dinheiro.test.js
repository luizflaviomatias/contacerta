import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroValorInvalido, converterParaCentavos, criarFormatoDeDinheiro } from '../js/dominio/dinheiro.js';

const real = criarFormatoDeDinheiro({ idioma: 'pt-BR', moeda: 'BRL' });
const dolar = criarFormatoDeDinheiro({ idioma: 'en-US', moeda: 'USD' });
const euro = criarFormatoDeDinheiro({ idioma: 'es-ES', moeda: 'EUR' });

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

test('formata para edição no padrão de cada idioma', () => {
  assert.equal(real.formatarParaEdicao(525000), '5.250,00');
  assert.equal(dolar.formatarParaEdicao(525000), '5,250.00');
  assert.equal(euro.formatarParaEdicao(12345678), '123.456,78');
});

test('formata a moeda escolhida, independente do idioma', () => {
  assert.equal(dolar.formatarMoeda(123456), '$1,234.56');
  assert.equal(criarFormatoDeDinheiro({ idioma: 'en-US', moeda: 'BRL' }).formatarMoeda(100), 'R$1.00');
  assert.equal(euro.simboloDaMoeda, '€');
});

test('em inglês o ponto é decimal e a vírgula é milhar', () => {
  assert.equal(dolar.converterParaCentavos('5,250.00'), 525000);
  assert.equal(dolar.converterParaCentavos('1,234'), 123400);
  assert.equal(dolar.converterParaCentavos('$ 870.5'), 87050);
});

test('vírgula com uma ou duas casas no fim também vale como decimal em inglês', () => {
  assert.equal(dolar.converterParaCentavos('870,50'), 87050);
});

test('em espanhol aceita o símbolo do euro', () => {
  assert.equal(euro.converterParaCentavos('1.234,56 €'), 123456);
});

test('o que é formatado para edição é lido de volta igual, em cada idioma', () => {
  for (const formato of [real, dolar, euro]) {
    assert.equal(formato.converterParaCentavos(formato.formatarParaEdicao(9876543)), 9876543);
  }
});
