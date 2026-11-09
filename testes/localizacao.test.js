import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroTextoSemTraducao, TEXTOS_POR_IDIOMA, criarLocalizacao } from '../js/i18n/localizacao.js';

const [idiomaDeReferencia, ...outrosIdiomas] = Object.keys(TEXTOS_POR_IDIOMA);
const chavesDe = (idioma) => Object.keys(TEXTOS_POR_IDIOMA[idioma]).sort();
const marcadoresDe = (texto) => [...JSON.stringify(texto).matchAll(/\{(\w+)\}/g)].map(([, nome]) => nome).sort();

test('todos os idiomas têm exatamente os mesmos textos', () => {
  for (const idioma of outrosIdiomas) {
    assert.deepEqual(chavesDe(idioma), chavesDe(idiomaDeReferencia), `chaves de ${idioma}`);
  }
});

test('cada tradução usa os mesmos marcadores ({n}, {mes}...) do original', () => {
  const referencia = TEXTOS_POR_IDIOMA[idiomaDeReferencia];
  for (const idioma of outrosIdiomas) {
    for (const [chave, texto] of Object.entries(TEXTOS_POR_IDIOMA[idioma])) {
      assert.deepEqual([...new Set(marcadoresDe(texto))], [...new Set(marcadoresDe(referencia[chave]))], `${idioma}: ${chave}`);
    }
  }
});

test('troca valores e escolhe o plural certo', () => {
  const local = criarLocalizacao({ idioma: 'pt-BR', moeda: 'BRL' });
  assert.equal(local.t('contas.emAberto', { n: 1 }), '1 conta em aberto');
  assert.equal(local.t('contas.emAberto', { n: 4 }), '4 contas em aberto');
  assert.equal(local.t('lancamento.dia', { dia: 9 }), 'Dia 9');
});

test('trocar o idioma muda textos e nomes de meses na hora', () => {
  const local = criarLocalizacao({ idioma: 'pt-BR', moeda: 'BRL' });
  local.configurar({ idioma: 'es-ES', moeda: 'BRL' });
  assert.equal(local.mesEAno({ ano: 2026, mes: 10 }), 'Noviembre de 2026');
  local.configurar({ idioma: 'en-US', moeda: 'BRL' });
  assert.equal(local.mesEAno({ ano: 2026, mes: 10 }), 'November 2026');
  assert.equal(local.nomeAbreviadoDoMes(1), 'Feb');
});

test('o idioma não muda a moeda, só o jeito de escrever o número', () => {
  const local = criarLocalizacao({ idioma: 'en-US', moeda: 'BRL' });
  assert.equal(local.formatarMoeda(123456), 'R$1,234.56');
  assert.equal(local.converterParaCentavos('1,234.56'), 123456);
});

test('texto sem tradução falha alto em vez de aparecer vazio', () => {
  const local = criarLocalizacao({ idioma: 'pt-BR', moeda: 'BRL' });
  assert.throws(() => local.t('nao.existe'), ErroTextoSemTraducao);
});
