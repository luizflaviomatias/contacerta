import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { montarAnuncio } from '../ferramentas/anuncioDeAtualizacao.mjs';
import { compactarPasta } from '../ferramentas/zip.mjs';
import { validarAnuncio } from '../js/dominio/atualizacao.js';

/** Lê o índice do zip e devolve { nome: conteúdo } para conferir o que foi compactado. */
function lerZip(zip) {
  const fim = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const quantidade = zip.readUInt16LE(fim + 10);
  let posicao = zip.readUInt32LE(fim + 16);
  const arquivos = {};
  for (let indice = 0; indice < quantidade; indice++) {
    const tamanhoDoNome = zip.readUInt16LE(posicao + 28);
    const nome = zip.subarray(posicao + 46, posicao + 46 + tamanhoDoNome).toString('utf8');
    const compactado = zip.readUInt32LE(posicao + 20);
    const inicio = zip.readUInt32LE(posicao + 42);
    const inicioDosDados = inicio + 30 + zip.readUInt16LE(inicio + 26);
    arquivos[nome] = inflateRawSync(zip.subarray(inicioDosDados, inicioDosDados + compactado)).toString('utf8');
    posicao += 46 + tamanhoDoNome;
  }
  return arquivos;
}

test('o pacote guarda a pasta com index.html na raiz e subpastas com "/"', async () => {
  const pasta = await mkdtemp(join(tmpdir(), 'contacerta-zip-'));
  try {
    await mkdir(join(pasta, 'js', 'ui'), { recursive: true });
    await writeFile(join(pasta, 'index.html'), '<!doctype html><title>ContaCerta</title>');
    await writeFile(join(pasta, 'js', 'ui', 'tela.js'), 'export const ç = "acentuação";');

    const arquivos = lerZip(await compactarPasta(pasta));

    assert.deepEqual(Object.keys(arquivos), ['index.html', 'js/ui/tela.js']);
    assert.equal(arquivos['js/ui/tela.js'], 'export const ç = "acentuação";');
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
});

test('o mesmo conteúdo gera exatamente o mesmo pacote (e o mesmo SHA-256)', async () => {
  const pasta = await mkdtemp(join(tmpdir(), 'contacerta-zip-'));
  try {
    await writeFile(join(pasta, 'index.html'), 'x');
    assert.deepEqual(await compactarPasta(pasta), await compactarPasta(pasta));
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
});

test('o anúncio gerado passa na mesma validação que o app faz', () => {
  const anuncio = montarAnuncio({ versao: '3.1.1', sha256: 'c'.repeat(64), versaoMinimaDoApk: '3.1.0' });
  assert.deepEqual(validarAnuncio(anuncio), anuncio);
  assert.match(anuncio.pacote, /\/v3\.1\.1\/ContaCerta-web-3\.1\.1\.zip$/);
  assert.match(anuncio.apk, /\/v3\.1\.0-apk\/ContaCerta-3\.1\.0\.apk$/);
});
