// Página simulada (happy-dom) para testar componentes de tela sem navegador.
// Não aplica CSS: aparência (cores, display) continua conferida no navegador.
import { Window } from 'happy-dom';
import { criarLocalizacao } from '../../js/i18n/localizacao.js';

/** Cria uma página nova com o HTML dado e a torna o `document`/`window` globais do teste. */
export function criarTela(html = '') {
  const janela = new Window({ url: 'http://localhost/' });
  janela.document.body.innerHTML = html;
  globalThis.window = janela;
  globalThis.document = janela.document;
  return janela.document;
}

export function localEmPortugues() {
  return criarLocalizacao({ idioma: 'pt-BR', moeda: 'BRL' });
}

/** Registra as chamadas de um callback: `espiao.chamadas` guarda os argumentos de cada uma. */
export function criarEspiao(resposta) {
  const espiao = (...argumentos) => {
    espiao.chamadas.push(argumentos);
    return resposta;
  };
  espiao.chamadas = [];
  return espiao;
}

export function digitar(campo, texto) {
  campo.value = texto;
  campo.dispatchEvent(new window.Event('input', { bubbles: true }));
  campo.dispatchEvent(new window.Event('change', { bubbles: true }));
}

export const esperarTarefas = () => new Promise((resolver) => setTimeout(resolver, 0));
