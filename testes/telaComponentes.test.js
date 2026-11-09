import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MODO, TIPO } from '../js/dominio/orcamento.js';
import { criarDialogoConfirmacao } from '../js/ui/dialogoConfirmacao.js';
import { criarDialogoLancamento } from '../js/ui/dialogoLancamento.js';
import { criarMenuLateral } from '../js/ui/menuLateral.js';
import { criarSeletorDeIdioma } from '../js/ui/seletorDeIdioma.js';
import { criarSeletorDeModo } from '../js/ui/seletorDeModo.js';
import { criarEspiao, criarTela, localEmPortugues } from './apoio/telaSimulada.js';

test('lista de bandeiras começa fechada e fecha ao escolher um idioma', () => {
  const documento = criarTela('<div id="idioma"></div>');
  const aoEscolherIdioma = criarEspiao();
  criarSeletorDeIdioma(documento.getElementById('idioma'), { local: localEmPortugues(), aoEscolherIdioma }).renderizar('pt-BR');
  const lista = documento.getElementById('lista-de-idiomas');
  assert.equal(lista.hidden, true);

  documento.querySelector('.botao-idioma').click();
  assert.equal(lista.hidden, false);
  documento.querySelector('[data-idioma="es-ES"]').click();

  assert.equal(lista.hidden, true);
  assert.deepEqual(aoEscolherIdioma.chamadas, [['es-ES']]);
});

test('a bandeira atual fica marcada na lista', () => {
  const documento = criarTela('<div id="idioma"></div>');
  criarSeletorDeIdioma(documento.getElementById('idioma'), { local: localEmPortugues(), aoEscolherIdioma: criarEspiao() })
    .renderizar('en-US');
  assert.ok(documento.querySelector('[data-idioma="en-US"]').hasAttribute('aria-current'));
  assert.ok(!documento.querySelector('[data-idioma="pt-BR"]').hasAttribute('aria-current'));
});

test('botão de visualização mostra o modo atual e troca para o outro', () => {
  const documento = criarTela('<button id="visualizacao"></button>');
  const aoTrocarModo = criarEspiao();
  const botao = documento.getElementById('visualizacao');
  criarSeletorDeModo(botao, { local: localEmPortugues(), aoTrocarModo }).renderizar(MODO.QUINZENAL);

  assert.equal(botao.textContent.trim(), 'Quinzena');
  botao.click();
  assert.deepEqual(aoTrocarModo.chamadas, [[MODO.MENSAL]]);
});

function montarMenu() {
  const documento = criarTela(`
    <button id="abrir"></button>
    <dialog id="menu">
      <button data-tela="contas">Contas</button>
      <button data-preferencia="tema" data-valor="escuro">Escuro</button>
    </dialog>`);
  const aoEscolherTela = criarEspiao();
  const aoAlterarPreferencia = criarEspiao();
  const menu = criarMenuLateral(documento.getElementById('menu'), documento.getElementById('abrir'), {
    aoEscolherTela, aoAlterarPreferencia,
  });
  documento.getElementById('abrir').click();
  return { documento, menu, aoEscolherTela, aoAlterarPreferencia };
}

test('no menu, escolher uma tela fecha o menu e avisa qual', () => {
  const { documento, aoEscolherTela } = montarMenu();
  documento.querySelector('[data-tela="contas"]').click();
  assert.equal(documento.getElementById('menu').open, false);
  assert.deepEqual(aoEscolherTela.chamadas, [['contas']]);
});

test('no menu, mudar uma preferência deixa o menu aberto e marca a escolha', () => {
  const { documento, menu, aoAlterarPreferencia } = montarMenu();
  documento.querySelector('[data-preferencia="tema"]').click();
  menu.marcarPreferencias({ tema: 'escuro' });
  assert.equal(documento.getElementById('menu').open, true);
  assert.deepEqual(aoAlterarPreferencia.chamadas, [['tema', 'escuro']]);
  assert.equal(documento.querySelector('[data-preferencia="tema"]').getAttribute('aria-pressed'), 'true');
});

function montarDialogoLancamento() {
  const documento = criarTela(`
    <dialog id="lancamento"><form>
      <h2 data-campo="titulo"></h2><span data-campo="rotulo-valor"></span>
      <input name="descricao"><input name="valor"><input name="dia" type="number">
      <p data-campo="erro"></p>
      <button type="submit" value="cancelar">Cancelar</button><button type="submit" value="salvar">Salvar</button>
    </form></dialog>`);
  const dialogo = documento.getElementById('lancamento');
  const janela = criarDialogoLancamento(dialogo, { local: localEmPortugues() });
  const resposta = janela.abrir({ tipo: TIPO.DESPESA, intervalo: { primeiroDia: 1, ultimoDia: 15 }, diaSugerido: 1 });
  const preencher = (descricao, valor) => {
    dialogo.querySelector('[name="descricao"]').value = descricao;
    dialogo.querySelector('[name="valor"]').value = valor;
    dialogo.querySelector('button[value="salvar"]').click();
  };
  return { dialogo, resposta, preencher };
}

test('janela de lançamento não fecha com descrição em branco e explica o motivo', () => {
  const { dialogo, preencher } = montarDialogoLancamento();
  preencher('   ', '10,00');
  assert.equal(dialogo.open, true);
  assert.equal(dialogo.querySelector('[data-campo="erro"]').textContent, 'Preencha a descrição do lançamento.');
});

test('janela de lançamento não fecha com valor inválido', () => {
  const { dialogo, preencher } = montarDialogoLancamento();
  preencher('Feira', '12,345');
  assert.equal(dialogo.open, true);
  assert.match(dialogo.querySelector('[data-campo="erro"]').textContent, /150,00/);
});

test('janela de lançamento devolve descrição, valor em centavos e dia', async () => {
  const { dialogo, resposta, preencher } = montarDialogoLancamento();
  preencher('Feira', '85,90');
  assert.equal(dialogo.open, false);
  assert.deepEqual(await resposta, { descricao: 'Feira', valorCentavos: 8590, dia: 1 });
});

function montarConfirmacao() {
  const documento = criarTela(`
    <dialog id="confirmacao"><form>
      <p data-campo="mensagem"></p>
      <button type="submit" value="cancelar"></button><button type="submit" value="confirmar"></button>
    </form></dialog>`);
  const dialogo = documento.getElementById('confirmacao');
  const resposta = criarDialogoConfirmacao(dialogo, { local: localEmPortugues() })
    .perguntar({ texto: 'Excluir "Luz"?', rotuloDeConfirmar: 'Excluir' });
  return { dialogo, resposta };
}

test('confirmação mostra a pergunta e devolve verdadeiro ao confirmar', async () => {
  const { dialogo, resposta } = montarConfirmacao();
  assert.equal(dialogo.querySelector('[data-campo="mensagem"]').textContent, 'Excluir "Luz"?');
  assert.equal(dialogo.querySelector('button[value="cancelar"]').textContent, 'Cancelar');
  dialogo.querySelector('button[value="confirmar"]').click();
  assert.equal(await resposta, true);
});

test('confirmação devolve falso ao cancelar', async () => {
  const { dialogo, resposta } = montarConfirmacao();
  dialogo.querySelector('button[value="cancelar"]').click();
  assert.equal(await resposta, false);
});
