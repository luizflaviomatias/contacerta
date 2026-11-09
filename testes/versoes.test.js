import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ErroVersaoInvalida, compararVersoes, ehMaisNova } from '../js/dominio/versoes.js';
import { VERSAO_DO_APP } from '../js/versao.js';

test('compara maior, menor e correção nessa ordem', () => {
  assert.ok(ehMaisNova('3.1.1', '3.1.0'));
  assert.ok(ehMaisNova('3.2.0', '3.1.9'));
  assert.ok(ehMaisNova('4.0.0', '3.10.10'));
  assert.equal(compararVersoes('3.1.0', '3.1.0'), 0);
});

test('compara números, não texto: 3.10.0 é mais nova que 3.9.0', () => {
  assert.ok(ehMaisNova('3.10.0', '3.9.0'));
});

test('versão em formato estranho é recusada', () => {
  for (const invalida of ['3.1', 'v3.1.0', '3.1.0-beta', '', undefined]) {
    assert.throws(() => compararVersoes(invalida, '3.0.0'), ErroVersaoInvalida, String(invalida));
  }
});

test('a versão que o app mostra é a do package.json', async () => {
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(VERSAO_DO_APP, version, 'rode npm run versao');
});
