# ContaCerta

App de controle de orçamento, por mês ou por quinzena, em português, espanhol e inglês.
Funciona em Android e iOS e abre sem internet; os dados ficam salvos no próprio aparelho.

Página de apresentação, com a documentação de uso e os links para baixar: `sobre/index.html`
(publicada em https://luizflaviomatias.github.io/contacerta/sobre/).

## Rodar no computador

```bash
npm start   # http://localhost:5173
npm test    # todos os testes (regras, dados, traduções e telas)
```

## Instalar no celular

O app precisa estar publicado em um endereço **https** (GitHub Pages, Netlify, Vercel, Cloudflare Pages…):
basta enviar esta pasta inteira. Depois:

- **Android (Chrome):** abrir o endereço → menu ⋮ → *Instalar app* / *Adicionar à tela inicial*.
- **iOS (Safari):** abrir o endereço → botão Compartilhar → *Adicionar à Tela de Início*.

Ao publicar uma nova versão, troque `VERSAO_DO_CACHE` em `sw.js`.

## Gerar o APK (Android)

Requisitos: JDK 21 e Android SDK (platform 35). Se o SDK não estiver no caminho padrão,
crie `android/local.properties` com `sdk.dir=...`.

```bash
npm install
npm run apk   # gera ContaCerta-<versão>.apk na raiz do projeto
```

O APK é de depuração (assinado com a chave de debug): serve para instalar direto no celular,
permitindo "instalar apps desconhecidos". Para a Play Store é preciso um build de release assinado.
Para trocar os ícones (web, Android e iOS):
`python ferramentas/gerarIcones.py icones android/app/src/main/res ios/App/App/Assets.xcassets`.

A versão do app fica só no `package.json`: o Android e o iOS leem dela.

## App de iPhone (iOS)

O projeto do Xcode está em `ios/` (Capacitor, com Swift Package Manager). Compilar exige um Mac com Xcode 16 ou mais novo:

```bash
npm install
npm run ios:sync      # copia o app para ios/ e leva a versão do package.json para o Xcode
npx cap open ios      # abre no Xcode
```

No Xcode: *Signing & Capabilities* → escolha seu *Team* (Apple ID) → selecione o iPhone conectado → ▶︎ Run.
Com Apple ID gratuito, o app instalado pelo cabo funciona por 7 dias; para TestFlight ou App Store
é preciso a conta Apple Developer (US$ 99/ano).

Sem Mac, o iPhone usa a versão web: Safari → Compartilhar → *Adicionar à Tela de Início*.

## Estrutura

- `js/dominio/` — regras puras: dinheiro em centavos, períodos do mês, totais e relatórios.
- `js/dados/` — preferências, categorias iniciais da planilha e repositório (localStorage injetado).
- `js/i18n/` — textos em pt-BR, es-ES e en-US, nomes de meses e formato de dinheiro.
- `js/ui/` — telas e componentes (grade do mês, relatórios, menu, idiomas, visualização, janelas).
- `js/acoesDoMes.js` — incluir, alterar, marcar como pago, excluir e copiar lançamentos.
- `js/navegacao.js` — troca de telas; `js/tratamentoDeErros.js` — erros de armazenamento na fronteira da tela.
- `js/ambiente.js` — armazenamento do aparelho, relógio e funcionamento sem internet.
- `js/app.js` — ponto de composição e estado da tela.
- `testes/` — regras, dados, traduções e telas (página simulada com happy-dom); `npm test` roda tudo.
