import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  IDIOMA, MODO, MOEDA, TEMA, criarPreferencias, escolherIdiomaDoAparelho,
} from '../js/dados/preferencias.js';

function criarArmazenamentoEmMemoria(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return { getItem: (chave) => dados.get(chave) ?? null, setItem: (chave, valor) => dados.set(chave, valor), dados };
}

const novaPessoa = (idiomasDoAparelho, armazenamento = criarArmazenamentoEmMemoria()) =>
  criarPreferencias({ armazenamento, idiomasDoAparelho, jaUsavaOApp: false });

test('idioma do aparelho em português, espanhol ou inglês é usado, qualquer variante', () => {
  assert.equal(escolherIdiomaDoAparelho(['pt-PT']), IDIOMA.PORTUGUES);
  assert.equal(escolherIdiomaDoAparelho(['es-MX']), IDIOMA.ESPANHOL);
  assert.equal(escolherIdiomaDoAparelho(['en-GB']), IDIOMA.INGLES);
});

test('aparelho em outro idioma usa o primeiro idioma conhecido da lista, ou inglês', () => {
  assert.equal(escolherIdiomaDoAparelho(['fr-FR', 'es-ES']), IDIOMA.ESPANHOL);
  assert.equal(escolherIdiomaDoAparelho(['de-DE', 'ja']), IDIOMA.INGLES);
  assert.equal(escolherIdiomaDoAparelho([]), IDIOMA.INGLES);
});

test('primeira abertura: tema claro, idioma do aparelho e moeda desse idioma', () => {
  assert.deepEqual(novaPessoa(['pt-BR']).obter(), {
    modo: undefined, tema: TEMA.CLARO, idioma: IDIOMA.PORTUGUES, moeda: MOEDA.REAL,
  });
  assert.equal(novaPessoa(['es-ES']).obter().moeda, MOEDA.EURO);
  assert.equal(novaPessoa(['it-IT']).obter().moeda, MOEDA.DOLAR);
});

test('pessoa nova precisa escolher o modo; quem já usava o app continua quinzenal', () => {
  assert.equal(novaPessoa(['pt-BR']).precisaEscolherModo(), true);
  const antiga = criarPreferencias({
    armazenamento: criarArmazenamentoEmMemoria(), idiomasDoAparelho: ['pt-BR'], jaUsavaOApp: true,
  });
  assert.equal(antiga.precisaEscolherModo(), false);
  assert.equal(antiga.obter().modo, MODO.QUINZENAL);
});

test('alterações ficam salvas para a próxima abertura', () => {
  const armazenamento = criarArmazenamentoEmMemoria();
  novaPessoa(['pt-BR'], armazenamento).alterar({ modo: MODO.MENSAL, tema: TEMA.ESCURO });

  const reaberta = novaPessoa(['pt-BR'], armazenamento).obter();

  assert.equal(reaberta.modo, MODO.MENSAL);
  assert.equal(reaberta.tema, TEMA.ESCURO);
});

test('trocar o idioma não troca a moeda escolhida', () => {
  const preferencias = novaPessoa(['pt-BR']);
  preferencias.alterar({ idioma: IDIOMA.INGLES });
  assert.equal(preferencias.obter().moeda, MOEDA.REAL);
});

test('a moeda da primeira abertura não muda se o idioma do aparelho mudar depois', () => {
  const armazenamento = criarArmazenamentoEmMemoria();
  novaPessoa(['pt-BR'], armazenamento);
  assert.equal(novaPessoa(['en-US'], armazenamento).obter().moeda, MOEDA.REAL);
});

test('valor desconhecido ou dados corrompidos voltam ao padrão', () => {
  const comValorEstranho = criarArmazenamentoEmMemoria({
    'contacerta:preferencias': JSON.stringify({ tema: 'rosa', idioma: 'fr-FR', moeda: 'BRL', modo: 'mensal' }),
  });
  assert.deepEqual(novaPessoa(['es-ES'], comValorEstranho).obter(), {
    modo: MODO.MENSAL, tema: TEMA.CLARO, idioma: IDIOMA.ESPANHOL, moeda: MOEDA.REAL,
  });
  const corrompido = criarArmazenamentoEmMemoria({ 'contacerta:preferencias': '{quebrado' });
  assert.equal(novaPessoa(['pt-BR'], corrompido).obter().tema, TEMA.CLARO);
});
