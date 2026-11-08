const ENTIDADES_HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const ANO_DE_REFERENCIA = 2000;
const TAMANHO_DO_NOME_ABREVIADO = 3;

export function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (caractere) => ENTIDADES_HTML[caractere]);
}

export function nomeDoMes(mes) {
  const nome = new Date(ANO_DE_REFERENCIA, mes, 1).toLocaleDateString('pt-BR', { month: 'long' });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

export function nomeAbreviadoDoMes(mes) {
  return nomeDoMes(mes).slice(0, TAMANHO_DO_NOME_ABREVIADO);
}
