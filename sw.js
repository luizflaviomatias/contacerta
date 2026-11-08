// Deixa o app abrir sem internet. Ao publicar uma nova versão, troque VERSAO_DO_CACHE.
const VERSAO_DO_CACHE = 'orcamento-quinzenal-v1';
const ARQUIVOS_DO_APP = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/dominio/dinheiro.js',
  './js/dominio/orcamento.js',
  './js/dados/modeloPlanilha.js',
  './js/dados/repositorioOrcamento.js',
  './js/ui/calendario.js',
  './js/ui/dialogoLancamento.js',
  './js/ui/formatacao.js',
  './js/ui/gradeQuinzenas.js',
  './js/ui/painelAnual.js',
  './icones/icone-180.png',
  './icones/icone-192.png',
  './icones/icone-512.png',
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(VERSAO_DO_CACHE).then((cache) => cache.addAll(ARQUIVOS_DO_APP)));
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((chave) => chave !== VERSAO_DO_CACHE).map((chave) => caches.delete(chave))))
      .then(() => self.clients.claim()),
  );
});

// Rede primeiro (para pegar atualizações); sem rede, usa o cache.
self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    fetch(evento.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(VERSAO_DO_CACHE).then((cache) => cache.put(evento.request, copia));
        return resposta;
      })
      .catch(() => caches.match(evento.request)),
  );
});
