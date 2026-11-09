import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ACAO_DE_ATUALIZACAO, ErroAnuncioInvalido, decidirAtualizacao, validarAnuncio } from '../js/dominio/atualizacao.js';

const anuncio = validarAnuncio({
  versao: '3.1.1',
  pacote: 'https://github.com/luizflaviomatias/contacerta/releases/download/v3.1.1/ContaCerta-web-3.1.1.zip',
  sha256: 'a'.repeat(64),
  versaoMinimaDoApk: '3.1.0',
  apk: 'https://github.com/luizflaviomatias/contacerta/releases/download/v3.1.0-apk/ContaCerta-3.1.0.apk',
});

test('versão anunciada igual ou mais antiga que a em uso: nada a fazer', () => {
  assert.equal(decidirAtualizacao({ versaoEmUso: '3.1.1', versaoDoApk: '3.1.0', anuncio }).acao, ACAO_DE_ATUALIZACAO.NENHUMA);
  assert.equal(decidirAtualizacao({ versaoEmUso: '3.2.0', versaoDoApk: '3.1.0', anuncio }).acao, ACAO_DE_ATUALIZACAO.NENHUMA);
});

test('versão nova que o APK instalado suporta: baixar o pacote, com o SHA-256 anunciado', () => {
  assert.deepEqual(decidirAtualizacao({ versaoEmUso: '3.1.0', versaoDoApk: '3.1.0', anuncio }), {
    acao: ACAO_DE_ATUALIZACAO.BAIXAR_PACOTE, versao: '3.1.1', endereco: anuncio.pacote, sha256: anuncio.sha256,
  });
});

test('versão nova que exige APK mais novo: avisar para instalar o APK', () => {
  const decisao = decidirAtualizacao({ versaoEmUso: '3.0.0', versaoDoApk: '3.0.0', anuncio });
  assert.deepEqual(decisao, { acao: ACAO_DE_ATUALIZACAO.INSTALAR_APK, versao: '3.1.1', endereco: anuncio.apk });
});

test('pacote já baixado conta como versão em uso, mesmo com APK antigo de mesma base', () => {
  assert.equal(decidirAtualizacao({ versaoEmUso: '3.1.1', versaoDoApk: '3.1.0', anuncio }).acao, ACAO_DE_ATUALIZACAO.NENHUMA);
});

test('anúncio com endereço de fora do ContaCerta é recusado', () => {
  for (const pacote of ['https://exemplo.com/app.zip', 'http://github.com/luizflaviomatias/contacerta/x.zip',
    'https://github.com/outra-pessoa/contacerta/x.zip']) {
    assert.throws(() => validarAnuncio({ ...anuncio, pacote }), ErroAnuncioInvalido, pacote);
  }
});

test('anúncio sem SHA-256 válido ou com versão estranha é recusado', () => {
  assert.throws(() => validarAnuncio({ ...anuncio, sha256: 'abc' }), ErroAnuncioInvalido);
  assert.throws(() => validarAnuncio({ ...anuncio, versao: 'nova' }), ErroAnuncioInvalido);
  assert.throws(() => validarAnuncio(null), ErroAnuncioInvalido);
});
