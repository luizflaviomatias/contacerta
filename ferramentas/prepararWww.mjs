// Copia somente os arquivos do app (sem ferramentas, testes e node_modules) para www/, que o Capacitor empacota.
import { cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DESTINO = resolve(RAIZ, 'www');
const ARQUIVOS_DO_APP = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'icones'];

await rm(DESTINO, { recursive: true, force: true });
for (const item of ARQUIVOS_DO_APP) {
  await cp(resolve(RAIZ, item), resolve(DESTINO, item), { recursive: true });
}
console.log(`App copiado para ${DESTINO}`);
