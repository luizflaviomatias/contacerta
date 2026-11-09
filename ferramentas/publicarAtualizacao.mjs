// Gera o pacote de atualização (zip das telas e regras) e o atualizacao.json que o anuncia.
// Uso: npm run publicar-atualizacao — depois, publique o zip numa release do GitHub e envie o
// atualizacao.json para o site (os comandos aparecem no fim). Mudou algo nativo (plugin, permissão)?
// Suba "versaoMinimaDoApk" no package.json e publique também um APK dessa versão.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { etiquetaDoPacote, montarAnuncio, nomeDoPacote } from './anuncioDeAtualizacao.mjs';
import { compactarPasta } from './zip.mjs';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pacoteJson = JSON.parse(await readFile(resolve(RAIZ, 'package.json'), 'utf8'));
const versao = pacoteJson.version;
const { versaoMinimaDoApk } = pacoteJson.contacerta;

const pacote = await compactarPasta(resolve(RAIZ, 'www'));
const sha256 = createHash('sha256').update(pacote).digest('hex');
await writeFile(resolve(RAIZ, nomeDoPacote(versao)), pacote);

const anuncio = montarAnuncio({ versao, sha256, versaoMinimaDoApk });
await writeFile(resolve(RAIZ, 'atualizacao.json'), `${JSON.stringify(anuncio, null, 2)}\n`);

console.log(`Pacote ${nomeDoPacote(versao)} (${(pacote.length / 1024).toFixed(0)} KB, SHA-256 ${sha256})`);
console.log('Para publicar:');
console.log(`  gh release create ${etiquetaDoPacote(versao)} ${nomeDoPacote(versao)} --latest=false --title "ContaCerta ${versao} — atualização automática"`);
console.log('  git add atualizacao.json && git commit && git push');
