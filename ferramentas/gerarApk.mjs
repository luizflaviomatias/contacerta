// Compila o APK de depuração e copia para a raiz do projeto como OrcamentoQuinzenal.apk.
import { spawnSync } from 'node:child_process';
import { copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PASTA_ANDROID = resolve(RAIZ, 'android');
const APK_GERADO = resolve(PASTA_ANDROID, 'app/build/outputs/apk/debug/app-debug.apk');
const APK_FINAL = resolve(RAIZ, 'OrcamentoQuinzenal.apk');

const ehWindows = process.platform === 'win32';
const gradle = resolve(PASTA_ANDROID, ehWindows ? 'gradlew.bat' : 'gradlew');
const resultado = spawnSync(`"${gradle}" assembleDebug`, { cwd: PASTA_ANDROID, stdio: 'inherit', shell: true });
if (resultado.status !== 0) {
  console.error(`Falha ao compilar o APK (código ${resultado.status ?? resultado.error?.message}).`);
  process.exit(1);
}

await copyFile(APK_GERADO, APK_FINAL);
console.log(`APK pronto: ${APK_FINAL}`);
