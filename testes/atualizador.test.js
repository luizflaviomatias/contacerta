import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAtualizador } from '../js/atualizador.js';
import { criarEspiao } from './apoio/telaSimulada.js';

const ANUNCIO = {
  versao: '3.1.1',
  pacote: 'https://github.com/luizflaviomatias/contacerta/releases/download/v3.1.1/ContaCerta-web-3.1.1.zip',
  sha256: 'b'.repeat(64),
  versaoMinimaDoApk: '3.1.0',
  apk: 'https://github.com/luizflaviomatias/contacerta/releases/download/v3.1.0-apk/ContaCerta-3.1.0.apk',
};

function criarPlataformaFalsa({ versaoDoApk = '3.1.0', pacotesBaixados = {} } = {}) {
  const registro = [];
  return {
    registro,
    confirmarQueAbriu: async () => { registro.push('confirmou'); },
    versaoDoApk: async () => versaoDoApk,
    pacoteJaBaixado: async (versao) => pacotesBaixados[versao],
    baixar: async ({ endereco, versao, sha256 }) => { registro.push(['baixou', endereco, versao, sha256]); return 'pacote-novo'; },
    usarNaProximaAbertura: async (id) => { registro.push(['proxima', id]); },
    usarAgora: async (id) => { registro.push(['agora', id]); },
  };
}

function montar({ versaoEmUso = '3.1.0', anuncio = ANUNCIO, plataforma = criarPlataformaFalsa() } = {}) {
  const aoPacotePronto = criarEspiao();
  const aoApkDisponivel = criarEspiao();
  const atualizador = criarAtualizador({
    plataforma, buscarAnuncio: async () => anuncio, versaoEmUso, aoPacotePronto, aoApkDisponivel,
  });
  return { atualizador, plataforma, aoPacotePronto, aoApkDisponivel };
}

test('sempre confirma ao plugin que a versão atual abriu bem', async () => {
  const { atualizador, plataforma } = montar({ versaoEmUso: '3.1.1' });
  await atualizador.verificar();
  assert.deepEqual(plataforma.registro, ['confirmou']);
});

test('versão nova compatível: baixa com o SHA-256, deixa para a próxima abertura e avisa', async () => {
  const { atualizador, plataforma, aoPacotePronto } = montar();
  await atualizador.verificar();

  assert.deepEqual(plataforma.registro.slice(1), [
    ['baixou', ANUNCIO.pacote, '3.1.1', ANUNCIO.sha256],
    ['proxima', 'pacote-novo'],
  ]);
  assert.equal(aoPacotePronto.chamadas[0][0].versao, '3.1.1');
  await aoPacotePronto.chamadas[0][0].usarAgora();
  assert.deepEqual(plataforma.registro.at(-1), ['agora', 'pacote-novo']);
});

test('pacote baixado numa abertura anterior não é baixado de novo', async () => {
  const plataforma = criarPlataformaFalsa({ pacotesBaixados: { '3.1.1': 'ja-tinha' } });
  const { atualizador } = montar({ plataforma });
  await atualizador.verificar();
  assert.deepEqual(plataforma.registro.slice(1), [['proxima', 'ja-tinha']]);
});

test('versão que exige APK mais novo: não baixa pacote e avisa com o endereço do APK', async () => {
  const plataforma = criarPlataformaFalsa({ versaoDoApk: '3.0.0' });
  const { atualizador, aoApkDisponivel, aoPacotePronto } = montar({ versaoEmUso: '3.0.0', plataforma });
  await atualizador.verificar();
  assert.deepEqual(aoApkDisponivel.chamadas, [[{ acao: 'instalar-apk', versao: '3.1.1', endereco: ANUNCIO.apk }]]);
  assert.equal(aoPacotePronto.chamadas.length, 0);
  assert.deepEqual(plataforma.registro, ['confirmou']);
});

test('anúncio adulterado (endereço de fora) é recusado antes de baixar qualquer coisa', async () => {
  const { atualizador, plataforma } = montar({ anuncio: { ...ANUNCIO, pacote: 'https://exemplo.com/x.zip' } });
  await assert.rejects(atualizador.verificar(), /Anúncio de atualização inválido/);
  assert.deepEqual(plataforma.registro, ['confirmou']);
});
