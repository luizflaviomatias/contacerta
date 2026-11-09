# Orçamento Quinzenal

App (PWA) de controle de orçamento para quem recebe o salário em duas vezes no mês.
Funciona em Android e iOS e abre sem internet; os dados ficam salvos no próprio aparelho.

## Rodar no computador

```bash
npm start   # http://localhost:5173
npm test    # testes do domínio
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
npm run apk   # gera OrcamentoQuinzenal-<versão>.apk na raiz do projeto
```

O APK é de depuração (assinado com a chave de debug): serve para instalar direto no celular,
permitindo "instalar apps desconhecidos". Para a Play Store é preciso um build de release assinado.
Para trocar os ícones: `python ferramentas/gerarIcones.py icones android/app/src/main/res`.

## Estrutura

- `js/dominio/` — regras puras: dinheiro em centavos, quinzenas, totais, resumo anual.
- `js/dados/` — preenchimento inicial da planilha e repositório (localStorage injetado).
- `js/ui/` — seletor de mês, grade das quinzenas, painel anual, janela de lançamento.
- `js/app.js` — ponto de composição e estado da tela.
