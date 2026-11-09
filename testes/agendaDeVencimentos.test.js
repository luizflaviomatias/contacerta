import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agendaDeVencimentos } from '../js/dominio/agendaDeVencimentos.js';
import { TIPO, criarLancamento } from '../js/dominio/orcamento.js';

const conta = (dia, descricao, extra = {}) =>
  criarLancamento({ id: `${descricao}-${dia}`, descricao, tipo: TIPO.DESPESA, valorCentavos: 1000, dia, ...extra });

const mesesSalvos = {
  '2026-10': [conta(9, 'Luz'), conta(20, 'Internet'), conta(20, 'Água'), conta(25, 'Gás', { pago: true })],
  '2026-11': [conta(5, 'Aluguel')],
};
const obterMesSalvo = (ano, mes) => mesesSalvos[`${ano}-${mes}`] ?? [];
const NOVE_HORAS = { hora: 9, minuto: 0 };
const datasDa = (agenda) => agenda.map(({ data }) => `${data.dia}/${data.mes + 1}`);

test('lista os dias com contas não pagas, atravessando para o mês seguinte', () => {
  const agenda = agendaDeVencimentos({ obterMesSalvo, agora: { ano: 2026, mes: 10, dia: 9, hora: 7, minuto: 0 }, horario: NOVE_HORAS });
  assert.deepEqual(datasDa(agenda), ['9/11', '20/11', '5/12']);
  assert.deepEqual(agenda[1].contas.map((item) => item.descricao), ['Internet', 'Água']);
  assert.equal(agenda[1].totalCentavos, 2000);
});

test('hoje fica de fora se o horário do aviso já passou', () => {
  const agenda = agendaDeVencimentos({ obterMesSalvo, agora: { ano: 2026, mes: 10, dia: 9, hora: 9, minuto: 0 }, horario: NOVE_HORAS });
  assert.deepEqual(datasDa(agenda), ['20/11', '5/12']);
});

test('não passa do número de dias pedido', () => {
  const agenda = agendaDeVencimentos({
    obterMesSalvo, agora: { ano: 2026, mes: 10, dia: 9, hora: 7, minuto: 0 }, horario: NOVE_HORAS, dias: 12,
  });
  assert.deepEqual(datasDa(agenda), ['9/11', '20/11']);
});

test('meses que não existem no aparelho não geram aviso', () => {
  const agenda = agendaDeVencimentos({
    obterMesSalvo: () => [], agora: { ano: 2026, mes: 10, dia: 9, hora: 7, minuto: 0 }, horario: NOVE_HORAS,
  });
  assert.deepEqual(agenda, []);
});
