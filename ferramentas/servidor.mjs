// Servidor estático mínimo para testar o app localmente: node ferramentas/servidor.mjs [porta]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PASTA_DO_APP = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORTA = Number(process.argv[2] ?? 5173);
const TIPOS_DE_CONTEUDO = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
};

createServer(async (requisicao, resposta) => {
  const caminhoPedido = decodeURIComponent(new URL(requisicao.url, 'http://local').pathname);
  const caminhoRelativo = caminhoPedido.endsWith('/') ? `${caminhoPedido}index.html` : caminhoPedido;
  const arquivo = normalize(join(PASTA_DO_APP, caminhoRelativo));
  if (!arquivo.startsWith(PASTA_DO_APP)) return responder(resposta, 403, 'Proibido');
  try {
    const conteudo = await readFile(arquivo);
    resposta.writeHead(200, { 'Content-Type': TIPOS_DE_CONTEUDO[extname(arquivo)] ?? 'application/octet-stream' });
    resposta.end(conteudo);
  } catch {
    responder(resposta, 404, 'Não encontrado');
  }
}).listen(PORTA, () => console.log(`Orçamento Quinzenal em http://localhost:${PORTA}`));

function responder(resposta, status, mensagem) {
  resposta.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  resposta.end(mensagem);
}
