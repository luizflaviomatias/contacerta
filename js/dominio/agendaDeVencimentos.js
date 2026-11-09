// Os próximos dias com contas a vencer, para agendar os avisos do celular.
import { vencimentosDoDia } from './contasAPagar.js';

export const DIAS_AGENDADOS = 60;

/**
 * @param {{ obterMesSalvo: (ano: number, mes: number) => object[],
 *           agora: { ano: number, mes: number, dia: number, hora: number, minuto: number },
 *           horario: { hora: number, minuto: number }, dias?: number }} dados
 * Só entram dias cujo horário de aviso ainda não passou. Meses que ainda não existem no aparelho
 * contam como sem contas (o app não cria meses só para avisar).
 * @returns {Array<{ data: { ano: number, mes: number, dia: number }, contas: object[], totalCentavos: number }>}
 */
export function agendaDeVencimentos({ obterMesSalvo, agora, horario, dias = DIAS_AGENDADOS }) {
  const agenda = [];
  for (let deslocamento = 0; deslocamento < dias; deslocamento++) {
    const data = diaDepois(agora, deslocamento);
    if (deslocamento === 0 && horarioJaPassou(agora, horario)) continue;
    const vencimentos = vencimentosDoDia(obterMesSalvo(data.ano, data.mes), data.dia);
    if (vencimentos.contas.length > 0) agenda.push({ data, ...vencimentos });
  }
  return agenda;
}

function diaDepois({ ano, mes, dia }, deslocamento) {
  const data = new Date(ano, mes, dia + deslocamento);
  return { ano: data.getFullYear(), mes: data.getMonth(), dia: data.getDate() };
}

function horarioJaPassou(agora, horario) {
  return agora.hora > horario.hora || (agora.hora === horario.hora && agora.minuto >= horario.minuto);
}
