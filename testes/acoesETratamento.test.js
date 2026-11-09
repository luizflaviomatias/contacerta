import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAcoesDoMes } from '../js/acoesDoMes.js';
import { ErroAnoCorrompido, ErroArmazenamento } from '../js/dados/repositorioOrcamento.js';
import { TIPO, criarLancamento } from '../js/dominio/orcamento.js';
import { criarTratamentoDeErros } from '../js/tratamentoDeErros.js';
import { criarEspiao, esperarTarefas, localEmPortugues } from './apoio/telaSimulada.js';

const NOVEMBRO_2026 = { ano: 2026, mes: 10 };
const luz = criarLancamento({ id: 'luz', descricao: 'Luz', tipo: TIPO.DESPESA, valorCentavos: 15000, dia: 10 });

function criarRepositorioDeUmMes(lancamentos) {
  const meses = new Map([[`${NOVEMBRO_2026.ano}-${NOVEMBRO_2026.mes}`, lancamentos]]);
  return {
    obterMes: (ano, mes) => meses.get(`${ano}-${mes}`) ?? [],
    salvarMes: (ano, mes, novos) => meses.set(`${ano}-${mes}`, novos),
  };
}

function montarAcoes({ respostaDaConfirmacao = true, digitado } = {}) {
  const repositorio = criarRepositorioDeUmMes([luz]);
  const aoSalvar = criarEspiao();
  const acoes = criarAcoesDoMes({
    repositorio,
    mesAberto: () => NOVEMBRO_2026,
    local: localEmPortugues(),
    gerarId: () => 'novo',
    dialogoLancamento: { abrir: async () => digitado },
    dialogoCopia: { abrir: async () => undefined },
    confirmacao: { perguntar: async () => respostaDaConfirmacao },
    aviso: { mostrar: criarEspiao() },
    aoSalvar,
    aoDigitarValor: criarEspiao(),
  });
  return { acoes, repositorio, aoSalvar };
}

test('descrição apagada não é salva e a tela volta a mostrar a anterior', () => {
  const { acoes, aoSalvar } = montarAcoes();
  acoes.alterarDescricao('luz', '   ');
  assert.equal(acoes.lancamentosDoMes()[0].descricao, 'Luz');
  assert.equal(aoSalvar.chamadas.length, 1);
});

test('excluir só apaga depois que a pessoa confirma', async () => {
  const recusou = montarAcoes({ respostaDaConfirmacao: false });
  await recusou.acoes.excluir('luz');
  assert.equal(recusou.acoes.lancamentosDoMes().length, 1);

  const confirmou = montarAcoes({ respostaDaConfirmacao: true });
  await confirmou.acoes.excluir('luz');
  assert.equal(confirmou.acoes.lancamentosDoMes().length, 0);
});

test('lançamento incluído com dia fora do período vai para o limite do período', async () => {
  const { acoes } = montarAcoes({ digitado: { descricao: 'Feira', valorCentavos: 5000, dia: 31 } });
  await acoes.incluir(TIPO.DESPESA, { primeiroDia: 1, ultimoDia: 15 });
  assert.equal(acoes.lancamentosDoMes().find((item) => item.id === 'novo').dia, 15);
});

function montarTratamento({ respostaDaConfirmacao = true } = {}) {
  const aviso = { mostrar: criarEspiao() };
  const repositorio = { recomecarAno: criarEspiao() };
  const aoRecuperarAno = criarEspiao();
  const { proteger } = criarTratamentoDeErros({
    local: localEmPortugues(), aviso, repositorio, aoRecuperarAno,
    confirmacao: { perguntar: async () => respostaDaConfirmacao },
  });
  return { proteger, aviso, repositorio, aoRecuperarAno };
}

const falharCom = (erro) => () => { throw erro; };

test('falha ao gravar vira um aviso em vez de derrubar a tela', () => {
  const { proteger, aviso } = montarTratamento();
  proteger(falharCom(new ErroArmazenamento('cota cheia')))();
  assert.match(aviso.mostrar.chamadas[0][0], /Não foi possível salvar/);
});

test('ano ilegível: se a pessoa aceitar, recomeça o ano e redesenha a tela', async () => {
  const { proteger, repositorio, aoRecuperarAno } = montarTratamento({ respostaDaConfirmacao: true });
  proteger(falharCom(new ErroAnoCorrompido(2025)))();
  await esperarTarefas();
  assert.deepEqual(repositorio.recomecarAno.chamadas, [[2025]]);
  assert.equal(aoRecuperarAno.chamadas.length, 1);
});

test('ano ilegível: se a pessoa recusar, nada é apagado e ela é avisada', async () => {
  const { proteger, repositorio, aviso } = montarTratamento({ respostaDaConfirmacao: false });
  proteger(falharCom(new ErroAnoCorrompido(2025)))();
  await esperarTarefas();
  assert.equal(repositorio.recomecarAno.chamadas.length, 0);
  assert.match(aviso.mostrar.chamadas[0][0], /2025/);
});

test('erros de ações assíncronas também são tratados', async () => {
  const { proteger, aviso } = montarTratamento();
  await proteger(async () => { throw new ErroArmazenamento('cota cheia'); })();
  assert.equal(aviso.mostrar.chamadas.length, 1);
});

test('erros que não são de armazenamento continuam aparecendo (são defeitos)', () => {
  const { proteger } = montarTratamento();
  assert.throws(() => proteger(falharCom(new TypeError('defeito')))(), TypeError);
});
