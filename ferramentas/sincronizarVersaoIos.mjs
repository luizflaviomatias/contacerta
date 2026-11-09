// Leva a versão do package.json para o projeto do Xcode, como o build.gradle faz no Android.
// MARKETING_VERSION = "1.4.0"; CURRENT_PROJECT_VERSION = maior*10000 + menor*100 + correção (mesma conta do Android).
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PROJETO_XCODE = resolve(RAIZ, 'ios/App/App.xcodeproj/project.pbxproj');

const { version: versao } = JSON.parse(await readFile(resolve(RAIZ, 'package.json'), 'utf8'));
const [maior, menor, correcao] = versao.split('.').map(Number);
const numeroDoBuild = maior * 10000 + menor * 100 + correcao;

const projeto = await readFile(PROJETO_XCODE, 'utf8');
const atualizado = projeto
  .replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${versao};`)
  .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, `CURRENT_PROJECT_VERSION = ${numeroDoBuild};`);
await writeFile(PROJETO_XCODE, atualizado);
console.log(`Projeto iOS na versão ${versao} (build ${numeroDoBuild})`);
