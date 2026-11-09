/** Convite, mostrado uma vez no app instalado, para ligar os avisos de vencimento no celular. */
export function criarConviteDeAvisos(elemento, { local, aoLigar, aoRecusar }) {
  elemento.addEventListener('click', (evento) => {
    const acao = evento.target.closest('button[data-acao]')?.dataset.acao;
    if (acao === 'ligar-avisos') aoLigar();
    if (acao === 'recusar-avisos') aoRecusar();
  });

  /** @param {string} horario "09:00" */
  function renderizar(horario) {
    const { t } = local;
    elemento.innerHTML = `
      <p class="faixa-vencimentos__texto">${t('convite.avisos', { horario: local.formatarHorario(horario) })}</p>
      <div class="faixa-vencimentos__acoes">
        <button type="button" class="faixa-vencimentos__ver" data-acao="ligar-avisos">${t('convite.ligar')}</button>
        <button type="button" class="faixa-vencimentos__dispensar" data-acao="recusar-avisos">${t('convite.agoraNao')}</button>
      </div>`;
    elemento.hidden = false;
  }

  function esconder() {
    elemento.hidden = true;
  }

  return { renderizar, esconder };
}
