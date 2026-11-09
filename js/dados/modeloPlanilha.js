// Categorias iniciais da planilha "Controle Financeiro Simples - Modelo Didático", em cada idioma.
// Os valores começam zerados: cada pessoa preenche os seus no aparelho.
import { MESES_NO_ANO, TIPO, criarLancamento, limitarDiaAoMes } from '../dominio/orcamento.js';
import { IDIOMA, MODO } from './preferencias.js';

const DIA_DO_SALARIO = 15;
const DIA_DO_ADIANTAMENTO = 30;
const DIA_DO_SALARIO_MENSAL = 5;
const VALOR_INICIAL_CENTAVOS = 0;

const NOMES_POR_IDIOMA = {
  [IDIOMA.PORTUGUES]: {
    salario: 'Salário (dia 15)',
    adiantamento: 'Adiantamento (dia 30)',
    salarioMensal: 'Salário',
    gastosDaPrimeiraQuinzena: [
      'Moradia / Condomínio / Aluguel', 'Seguro de Vida & Proteção', 'Financiamento / Parcela', 'Carro',
      'Internet Banda Larga', 'Supermercado Mensal', 'Água & Saneamento', 'Telefonia / Celular',
      'Cartão de Crédito', 'Plano de Saúde', 'Assinaturas & Streaming',
    ],
    gastosDaSegundaQuinzena: [
      'Feira & Hortifruti', 'Transporte / Combustível', 'Mensalidade Academia', 'Farmácia & Saúde',
      'Lazer & Restaurantes', 'Padaria & Confeitaria', 'Cuidados Pessoais', 'Vestuário & Calçados',
      'Manutenção Residencial', 'Reserva de Emergência', 'Outros Gastos',
    ],
  },
  [IDIOMA.ESPANHOL]: {
    salario: 'Nómina (día 15)',
    adiantamento: 'Anticipo (día 30)',
    salarioMensal: 'Nómina',
    gastosDaPrimeiraQuinzena: [
      'Vivienda / Comunidad / Alquiler', 'Seguro de vida', 'Préstamo / Cuota', 'Coche',
      'Internet de fibra', 'Supermercado mensual', 'Agua y saneamiento', 'Teléfono / Móvil',
      'Tarjeta de crédito', 'Seguro médico', 'Suscripciones y streaming',
    ],
    gastosDaSegundaQuinzena: [
      'Fruta y verdura', 'Transporte / Combustible', 'Cuota del gimnasio', 'Farmacia y salud',
      'Ocio y restaurantes', 'Panadería y pastelería', 'Cuidado personal', 'Ropa y calzado',
      'Mantenimiento del hogar', 'Fondo de emergencia', 'Otros gastos',
    ],
  },
  [IDIOMA.INGLES]: {
    salario: 'Paycheck (day 15)',
    adiantamento: 'Advance (day 30)',
    salarioMensal: 'Paycheck',
    gastosDaPrimeiraQuinzena: [
      'Housing / HOA / Rent', 'Life insurance', 'Loan / Installment', 'Car',
      'Home internet', 'Monthly groceries', 'Water & sewer', 'Phone / Mobile',
      'Credit card', 'Health insurance', 'Subscriptions & streaming',
    ],
    gastosDaSegundaQuinzena: [
      'Fruits & vegetables', 'Transportation / Gas', 'Gym membership', 'Pharmacy & health',
      'Leisure & dining out', 'Bakery', 'Personal care', 'Clothing & shoes',
      'Home maintenance', 'Emergency fund', 'Other expenses',
    ],
  },
};

/**
 * Ano novo com as categorias da planilha no idioma escolhido. No modo quinzenal há um salário no dia 15
 * e um adiantamento no dia 30; no mensal, um único salário. Os gastos são os mesmos nos dois modos.
 * @param {() => string} gerarId
 */
export function criarAnoConformePlanilha(ano, gerarId, { idioma = IDIOMA.PORTUGUES, modo = MODO.QUINZENAL } = {}) {
  const grupos = gruposDaPlanilha(NOMES_POR_IDIOMA[idioma], modo);
  return Array.from({ length: MESES_NO_ANO }, (_, mes) => criarMesConformePlanilha(grupos, ano, mes, gerarId));
}

function gruposDaPlanilha(nomes, modo) {
  const recebimentosDaPrimeira = modo === MODO.MENSAL ? [] : [nomes.salario];
  const recebimentosDaSegunda = modo === MODO.MENSAL ? [] : [nomes.adiantamento];
  const grupos = [
    { dia: DIA_DO_SALARIO, recebimentos: recebimentosDaPrimeira, gastos: nomes.gastosDaPrimeiraQuinzena },
    { dia: DIA_DO_ADIANTAMENTO, recebimentos: recebimentosDaSegunda, gastos: nomes.gastosDaSegundaQuinzena },
  ];
  if (modo === MODO.MENSAL) grupos.unshift({ dia: DIA_DO_SALARIO_MENSAL, recebimentos: [nomes.salarioMensal], gastos: [] });
  return grupos;
}

function criarMesConformePlanilha(grupos, ano, mes, gerarId) {
  return grupos.flatMap((grupo) => {
    const dia = limitarDiaAoMes(grupo.dia, ano, mes);
    const criar = (tipo) => (descricao) =>
      criarLancamento({ id: gerarId(), descricao, tipo, valorCentavos: VALOR_INICIAL_CENTAVOS, dia });
    return [...grupo.recebimentos.map(criar(TIPO.RECEITA)), ...grupo.gastos.map(criar(TIPO.DESPESA))];
  });
}
