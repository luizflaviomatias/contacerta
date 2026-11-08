// Categorias iniciais da planilha "Controle Financeiro Simples - Modelo Didático".
// Os valores começam zerados: cada pessoa preenche os seus no aparelho.
import { MESES_NO_ANO, TIPO, criarLancamento, limitarDiaAoMes } from '../dominio/orcamento.js';

const DIA_DO_SALARIO = 15;
const DIA_DO_ADIANTAMENTO = 30;
const VALOR_INICIAL_CENTAVOS = 0;

const PRIMEIRA_QUINZENA = {
  dia: DIA_DO_SALARIO,
  recebimentos: ['Salário (dia 15)'],
  gastos: [
    'Moradia / Condomínio / Aluguel',
    'Seguro de Vida & Proteção',
    'Financiamento / Parcela',
    'Carro',
    'Internet Banda Larga',
    'Supermercado Mensal',
    'Água & Saneamento',
    'Telefonia / Celular',
    'Cartão de Crédito',
    'Plano de Saúde',
    'Assinaturas & Streaming',
  ],
};

const SEGUNDA_QUINZENA = {
  dia: DIA_DO_ADIANTAMENTO,
  recebimentos: ['Adiantamento (dia 30)'],
  gastos: [
    'Feira & Hortifruti',
    'Transporte / Combustível',
    'Mensalidade Academia',
    'Farmácia & Saúde',
    'Lazer & Restaurantes',
    'Padaria & Confeitaria',
    'Cuidados Pessoais',
    'Vestuário & Calçados',
    'Manutenção Residencial',
    'Reserva de Emergência',
    'Outros Gastos',
  ],
};

/** @param {() => string} gerarId */
export function criarAnoConformePlanilha(ano, gerarId) {
  return Array.from({ length: MESES_NO_ANO }, (_, mes) => criarMesConformePlanilha(ano, mes, gerarId));
}

function criarMesConformePlanilha(ano, mes, gerarId) {
  return [PRIMEIRA_QUINZENA, SEGUNDA_QUINZENA].flatMap((quinzena) => {
    const dia = limitarDiaAoMes(quinzena.dia, ano, mes);
    const criar = (tipo) => (descricao) =>
      criarLancamento({ id: gerarId(), descricao, tipo, valorCentavos: VALOR_INICIAL_CENTAVOS, dia });
    return [
      ...quinzena.recebimentos.map(criar(TIPO.RECEITA)),
      ...quinzena.gastos.map(criar(TIPO.DESPESA)),
    ];
  });
}
