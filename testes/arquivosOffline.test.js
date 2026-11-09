import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));

async function arquivosJavaScriptDoApp(pasta = resolve(RAIZ, 'js')) {
  const entradas = await readdir(pasta, { withFileTypes: true });
  const listas = await Promise.all(entradas.map((entrada) => {
    const caminho = resolve(pasta, entrada.name);
    if (entrada.isDirectory()) return arquivosJavaScriptDoApp(caminho);
    return entrada.name.endsWith('.js') ? [`./${relative(RAIZ, caminho).replaceAll('\\', '/')}`] : [];
  }));
  return listas.flat();
}

async function arquivosGuardadosPeloServiceWorker() {
  const sw = await readFile(resolve(RAIZ, 'sw.js'), 'utf8');
  return [...sw.matchAll(/'(\.\/[^']+)'/g)].map(([, caminho]) => caminho);
}

test('o service worker guarda todos os módulos do app para funcionar sem internet', async () => {
  const guardados = new Set(await arquivosGuardadosPeloServiceWorker());
  const faltando = (await arquivosJavaScriptDoApp()).filter((arquivo) => !guardados.has(arquivo));
  assert.deepEqual(faltando, [], 'acrescente estes arquivos em ARQUIVOS_DO_APP no sw.js');
});

test('o service worker não guarda arquivos que não existem mais', async () => {
  const existentes = new Set(await arquivosJavaScriptDoApp());
  const sobrando = (await arquivosGuardadosPeloServiceWorker())
    .filter((arquivo) => arquivo.endsWith('.js') && arquivo !== './sw.js' && !existentes.has(arquivo));
  assert.deepEqual(sobrando, []);
});
