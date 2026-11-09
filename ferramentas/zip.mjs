// Gerador mínimo de arquivo .zip (método deflate), sem dependências: o suficiente para os pacotes do app.
import { readFile, readdir } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

const ASSINATURA_DO_ARQUIVO = 0x04034b50;
const ASSINATURA_DO_INDICE = 0x02014b50;
const ASSINATURA_DO_FIM = 0x06054b50;
const VERSAO_DO_FORMATO = 20;
const METODO_DEFLATE = 8;
const NOMES_EM_UTF8 = 0x0800;
// Data fixa (1º/1/2020): o mesmo conteúdo gera sempre o mesmo zip e, portanto, o mesmo SHA-256.
const DATA_DOS_ARQUIVOS = ((2020 - 1980) << 9) | (1 << 5) | 1;

/** Todos os arquivos da pasta, com caminho relativo usando "/" (como o zip exige). */
async function listarArquivos(pasta, raiz = pasta) {
  const entradas = await readdir(pasta, { withFileTypes: true });
  const listas = await Promise.all(entradas.map((entrada) => {
    const caminho = resolve(pasta, entrada.name);
    return entrada.isDirectory() ? listarArquivos(caminho, raiz) : [relative(raiz, caminho).replaceAll('\\', '/')];
  }));
  return listas.flat().sort();
}

/** @returns {Promise<Buffer>} o .zip com o conteúdo da pasta na raiz */
export async function compactarPasta(pasta) {
  const partes = [];
  const indice = [];
  let posicao = 0;
  for (const nome of await listarArquivos(pasta)) {
    const conteudo = await readFile(resolve(pasta, nome));
    const compactado = deflateRawSync(conteudo, { level: 9 });
    const nomeEmBytes = Buffer.from(nome, 'utf8');
    const dados = { crc: crc32(conteudo), compactado: compactado.length, original: conteudo.length, nomeEmBytes };
    const cabecalho = cabecalhoDoArquivo(dados);
    partes.push(cabecalho, nomeEmBytes, compactado);
    indice.push(entradaDoIndice(dados, posicao));
    posicao += cabecalho.length + nomeEmBytes.length + compactado.length;
  }
  const indiceEmBytes = Buffer.concat(indice);
  return Buffer.concat([...partes, indiceEmBytes, fimDoArquivo(indice.length, indiceEmBytes.length, posicao)]);
}

function cabecalhoDoArquivo({ crc, compactado, original, nomeEmBytes }) {
  const cabecalho = Buffer.alloc(30);
  cabecalho.writeUInt32LE(ASSINATURA_DO_ARQUIVO, 0);
  cabecalho.writeUInt16LE(VERSAO_DO_FORMATO, 4);
  cabecalho.writeUInt16LE(NOMES_EM_UTF8, 6);
  cabecalho.writeUInt16LE(METODO_DEFLATE, 8);
  cabecalho.writeUInt16LE(0, 10);
  cabecalho.writeUInt16LE(DATA_DOS_ARQUIVOS, 12);
  cabecalho.writeUInt32LE(crc, 14);
  cabecalho.writeUInt32LE(compactado, 18);
  cabecalho.writeUInt32LE(original, 22);
  cabecalho.writeUInt16LE(nomeEmBytes.length, 26);
  cabecalho.writeUInt16LE(0, 28);
  return cabecalho;
}

function entradaDoIndice({ crc, compactado, original, nomeEmBytes }, posicaoDoArquivo) {
  const entrada = Buffer.alloc(46);
  entrada.writeUInt32LE(ASSINATURA_DO_INDICE, 0);
  entrada.writeUInt16LE(VERSAO_DO_FORMATO, 4);
  entrada.writeUInt16LE(VERSAO_DO_FORMATO, 6);
  entrada.writeUInt16LE(NOMES_EM_UTF8, 8);
  entrada.writeUInt16LE(METODO_DEFLATE, 10);
  entrada.writeUInt16LE(0, 12);
  entrada.writeUInt16LE(DATA_DOS_ARQUIVOS, 14);
  entrada.writeUInt32LE(crc, 16);
  entrada.writeUInt32LE(compactado, 20);
  entrada.writeUInt32LE(original, 24);
  entrada.writeUInt16LE(nomeEmBytes.length, 28);
  entrada.writeUInt32LE(posicaoDoArquivo, 42);
  return Buffer.concat([entrada, nomeEmBytes]);
}

function fimDoArquivo(quantidade, tamanhoDoIndice, posicaoDoIndice) {
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(ASSINATURA_DO_FIM, 0);
  fim.writeUInt16LE(quantidade, 8);
  fim.writeUInt16LE(quantidade, 10);
  fim.writeUInt32LE(tamanhoDoIndice, 12);
  fim.writeUInt32LE(posicaoDoIndice, 16);
  return fim;
}
