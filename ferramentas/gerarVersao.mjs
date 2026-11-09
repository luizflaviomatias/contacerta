// Escreve js/versao.js com a versão do package.json, a única fonte da versão do app.
// Rode depois de mudar a versão: npm run versao (os comandos de APK e pacote já rodam sozinhos).
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const { version: versao } = JSON.parse(await readFile(resolve(RAIZ, 'package.json'), 'utf8'));

await writeFile(resolve(RAIZ, 'js/versao.js'), `// Gerado por ferramentas/gerarVersao.mjs a partir do package.json. Não edite à mão.
export const VERSAO_DO_APP = '${versao}';
`);
console.log(`js/versao.js na versão ${versao}`);
