import { AVISOS } from './dados/preferencias.js';
import { agendaDeVencimentos } from './dominio/agendaDeVencimentos.js';
import { CANAL_DE_VENCIMENTOS } from './plataforma/notificacoesNativas.js';

const ICONE_DA_NOTIFICACAO = 'ic_stat_contacerta';

/**
 * Mantém agendada uma notificação por dia com conta a vencer (próximos dias), no horário escolhido.
 * `reagendar` pode ser chamado a cada mudança: as chamadas rodam uma de cada vez e, se chegarem
 * várias durante uma execução, viram uma só execução a mais (sem agendamentos fora de ordem).
 *
 * @param {{ notificacoes: ReturnType<typeof import('./plataforma/notificacoesNativas.js').criarNotificacoesNativas>,
 *           obterMesSalvo: (ano: number, mes: number) => object[], agora: () => object,
 *           preferencias: { obter: () => object }, local: object }} dependencias
 */
export function criarAgendadorDeAvisos({ notificacoes, obterMesSalvo, agora, preferencias, local }) {
  async function refazerAgenda() {
    await notificacoes.cancelarTodas();
    const { avisos, horarioDosAvisos } = preferencias.obter();
    if (avisos !== AVISOS.LIGADOS) return;
    const horario = lerHorario(horarioDosAvisos);
    const agenda = agendaDeVencimentos({ obterMesSalvo, agora: agora(), horario });
    await notificacoes.agendar(agenda.map((dia) => montarNotificacao(dia, horario, local)));
  }

  return { reagendar: executarUmaDeCadaVez(refazerAgenda) };
}

/** Para quando não há notificações (navegador e iPhone pela web): mesma interface, não faz nada. */
export function criarAgendadorSemNotificacoes() {
  return { reagendar: async () => {} };
}

function lerHorario(texto) {
  const [hora, minuto] = texto.split(':').map(Number);
  return { hora, minuto };
}

/** Id estável por dia (ex.: 20261109), para cada dia ter no máximo um aviso. */
function idDoDia({ ano, mes, dia }) {
  return ano * 10000 + (mes + 1) * 100 + dia;
}

function montarNotificacao({ data, contas, totalCentavos }, horario, local) {
  return {
    id: idDoDia(data),
    title: local.t('notificacao.titulo'),
    body: textoDaNotificacao(contas, totalCentavos, local),
    schedule: { at: new Date(data.ano, data.mes, data.dia, horario.hora, horario.minuto), allowWhileIdle: true },
    channelId: CANAL_DE_VENCIMENTOS,
    smallIcon: ICONE_DA_NOTIFICACAO,
    extra: { ano: data.ano, mes: data.mes },
  };
}

function textoDaNotificacao(contas, totalCentavos, local) {
  const valor = local.formatarMoeda(totalCentavos);
  if (contas.length === 1) return local.t('notificacao.uma', { nome: contas[0].descricao, valor });
  return local.t('notificacao.varias', { n: contas.length, nomes: local.listar(contas.map(({ descricao }) => descricao)), valor });
}

function executarUmaDeCadaVez(tarefa) {
  let emAndamento;
  let precisaDeOutra = false;
  return function executar() {
    if (emAndamento) {
      precisaDeOutra = true;
      return emAndamento;
    }
    emAndamento = (async () => {
      try {
        do {
          precisaDeOutra = false;
          await tarefa();
        } while (precisaDeOutra);
      } finally {
        emAndamento = undefined;
      }
    })();
    return emAndamento;
  };
}
