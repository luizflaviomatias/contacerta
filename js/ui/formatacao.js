const ENTIDADES_HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (caractere) => ENTIDADES_HTML[caractere]);
}

export function nomeDoMes(mes) {
  const nome = new Date(2000, mes, 1).toLocaleDateString('pt-BR', { month: 'long' });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}
