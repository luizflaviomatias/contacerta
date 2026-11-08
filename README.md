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

## Estrutura

- `js/dominio/` — regras puras: dinheiro em centavos, quinzenas, totais, resumo anual.
- `js/dados/` — preenchimento inicial da planilha e repositório (localStorage injetado).
- `js/ui/` — calendário, grade das quinzenas, painel anual, janela de lançamento.
- `js/app.js` — ponto de composição e estado da tela.
