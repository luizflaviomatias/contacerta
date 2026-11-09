import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ErroAnoCorrompido, ErroArmazenamento, criarRepositorioOrcamento } from '../js/dados/repositorioOrcamento.js';
import { TIPO, criarLancamento } from '../js/dominio/orcamento.js';

function criarArmazenamentoEmMemoria(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return { getItem: (chave) => dados.get(chave) ?? null, setItem: (chave, valor) => dados.set(chave, valor), dados };
}

const anoVazio = () => Array.from({ length: 12 }, () => []);
const gasto = criarLancamento({ id: 'a', descricao: 'Feira', tipo: TIPO.DESPESA, valorCentavos: 5000, dia: 20 });

test('cria o ano inicial uma única vez e o persiste', () => {
  let anosCriados = 0;
  const armazenamento = criarArmazenamentoEmMemoria();
  const repositorio = criarRepositorioOrcamento({ armazenamento, criarAnoInicial: () => (anosCriados++, anoVazio()) });

  repositorio.obterMes(2026, 0);
  repositorio.obterMes(2026, 5);

  assert.equal(anosCriados, 1);
  assert.ok(armazenamento.dados.has('orcamento-quinzenal:ano:2026'));
});

test('mês salvo é lido de volta por um novo repositório', () => {
  const armazenamento = criarArmazenamentoEmMemoria();
  criarRepositorioOrcamento({ armazenamento, criarAnoInicial: anoVazio }).salvarMes(2026, 10, [gasto]);

  const reaberto = criarRepositorioOrcamento({ armazenamento, criarAnoInicial: anoVazio });

  assert.deepEqual(reaberto.obterMes(2026, 10), [gasto]);
  assert.deepEqual(reaberto.obterMes(2026, 9), []);
});

test('dados corrompidos geram erro com contexto', () => {
  const armazenamento = criarArmazenamentoEmMemoria({ 'orcamento-quinzenal:ano:2026': '{quebrado' });
  const repositorio = criarRepositorioOrcamento({ armazenamento, criarAnoInicial: anoVazio });
  assert.throws(() => repositorio.obterAno(2026), ErroArmazenamento);
});

test('lançamento salvo antes da marca de pago é lido como não pago', () => {
  const { pago, ...gastoAntigo } = gasto;
  const meses = anoVazio();
  meses[10] = [gastoAntigo];
  const armazenamento = criarArmazenamentoEmMemoria({ 'orcamento-quinzenal:ano:2026': JSON.stringify(meses) });

  const [lido] = criarRepositorioOrcamento({ armazenamento, criarAnoInicial: anoVazio }).obterMes(2026, 10);

  assert.equal(pago, false);
  assert.equal(lido.pago, false);
});

test('sabe se um ano já foi salvo antes, sem criá-lo ao perguntar', () => {
  const armazenamento = criarArmazenamentoEmMemoria();
  const repositorio = criarRepositorioOrcamento({ armazenamento, criarAnoInicial: anoVazio });

  assert.equal(repositorio.existeAnoSalvo(2026), false);
  assert.equal(armazenamento.dados.size, 0);
  repositorio.obterMes(2026, 0);
  assert.equal(repositorio.existeAnoSalvo(2026), true);
});

test('se gravar falhar, o mês na memória continua como estava', () => {
  const armazenamento = criarArmazenamentoEmMemoria();
  const repositorio = criarRepositorioOrcamento({ armazenamento, criarAnoInicial: anoVazio });
  repositorio.obterMes(2026, 10);
  armazenamento.setItem = () => { throw new Error('cota cheia'); };

  assert.throws(() => repositorio.salvarMes(2026, 10, [gasto]), ErroArmazenamento);
  assert.deepEqual(repositorio.obterMes(2026, 10), []);
});

test('ano corrompido gera erro que diz qual ano é', () => {
  const armazenamento = criarArmazenamentoEmMemoria({ 'orcamento-quinzenal:ano:2025': '[1,2]' });
  const repositorio = criarRepositorioOrcamento({ armazenamento, criarAnoInicial: anoVazio });
  assert.throws(() => repositorio.obterMes(2025, 0), (erro) => erro instanceof ErroAnoCorrompido && erro.ano === 2025);
});

test('recomeçar um ano corrompido guarda o conteúdo antigo à parte e cria o ano de novo', () => {
  const armazenamento = criarArmazenamentoEmMemoria({ 'orcamento-quinzenal:ano:2025': '{quebrado' });
  const repositorio = criarRepositorioOrcamento({ armazenamento, criarAnoInicial: anoVazio });

  repositorio.recomecarAno(2025);

  assert.deepEqual(repositorio.obterMes(2025, 0), []);
  assert.equal(armazenamento.dados.get('orcamento-quinzenal:ano:2025:corrompido'), '{quebrado');
});
