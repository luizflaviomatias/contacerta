import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarAgendadorDeAvisos } from '../js/agendadorDeAvisos.js';
import { AVISOS } from '../js/dados/preferencias.js';
import { TIPO, criarLancamento } from '../js/dominio/orcamento.js';
import { localEmPortugues } from './apoio/telaSimulada.js';

const conta = (dia, descricao, valorCentavos) =>
  criarLancamento({ id: `${descricao}-${dia}`, descricao, tipo: TIPO.DESPESA, valorCentavos, dia });
const NOVEMBRO = [conta(10, 'Luz', 14830), conta(20, 'Internet', 9990), conta(20, 'Água', 9000)];
const AGORA = { ano: 2026, mes: 10, dia: 9, hora: 12, minuto: 0 };

function criarNotificacoesFalsas() {
  const estado = { agendadas: [{ id: 1 }], canceladas: 0, chamadasDeAgendar: 0 };
  return {
    estado,
    cancelarTodas: async () => { estado.canceladas += 1; estado.agendadas = []; },
    agendar: async (lista) => { estado.chamadasDeAgendar += 1; estado.agendadas.push(...lista); },
  };
}

function montar(preferenciasAtuais) {
  const notificacoes = criarNotificacoesFalsas();
  const agendador = criarAgendadorDeAvisos({
    notificacoes,
    obterMesSalvo: (ano, mes) => (ano === 2026 && mes === 10 ? NOVEMBRO : []),
    agora: () => AGORA,
    preferencias: { obter: () => preferenciasAtuais },
    local: localEmPortugues(),
  });
  return { agendador, notificacoes };
}

test('avisos ligados: uma notificação por dia com conta, no horário escolhido', async () => {
  const { agendador, notificacoes } = montar({ avisos: AVISOS.LIGADOS, horarioDosAvisos: '08:00' });
  await agendador.reagendar();
  const [luz, dia20] = notificacoes.estado.agendadas;

  assert.equal(notificacoes.estado.agendadas.length, 2);
  assert.equal(luz.id, 20261110);
  assert.deepEqual(luz.schedule.at, new Date(2026, 10, 10, 8, 0));
  assert.equal(luz.body.replace(/\s/g, ' '), 'Luz — R$ 148,30');
  assert.equal(dia20.body.replace(/\s/g, ' '), '2 contas: Internet e Água — total de R$ 189,90');
  assert.deepEqual(dia20.extra, { ano: 2026, mes: 10 });
});

test('reagendar troca os avisos antigos pelos novos (cancela antes de agendar)', async () => {
  const { agendador, notificacoes } = montar({ avisos: AVISOS.LIGADOS, horarioDosAvisos: '09:00' });
  await agendador.reagendar();
  await agendador.reagendar();
  assert.equal(notificacoes.estado.agendadas.length, 2);
  assert.ok(!notificacoes.estado.agendadas.some(({ id }) => id === 1));
});

test('avisos desligados ou ainda sem resposta: nada fica agendado', async () => {
  for (const avisos of [AVISOS.DESLIGADOS, undefined]) {
    const { agendador, notificacoes } = montar({ avisos, horarioDosAvisos: '09:00' });
    await agendador.reagendar();
    assert.deepEqual(notificacoes.estado.agendadas, [], String(avisos));
  }
});

test('várias chamadas seguidas viram no máximo uma execução a mais', async () => {
  const { agendador, notificacoes } = montar({ avisos: AVISOS.LIGADOS, horarioDosAvisos: '09:00' });
  await Promise.all([agendador.reagendar(), agendador.reagendar(), agendador.reagendar(), agendador.reagendar()]);
  assert.equal(notificacoes.estado.chamadasDeAgendar, 2);
  assert.equal(notificacoes.estado.agendadas.length, 2);
});
