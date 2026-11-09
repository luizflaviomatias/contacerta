const ENTIDADES_HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (caractere) => ENTIDADES_HTML[caractere]);
}
