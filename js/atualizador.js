import { ACAO_DE_ATUALIZACAO, decidirAtualizacao, validarAnuncio } from './dominio/atualizacao.js';

/**
 * Na abertura do app instalado: confirma que esta versão abriu bem, consulta o anúncio de versão
 * nova no site e, conforme o caso, baixa o pacote novo (que entra em uso na próxima abertura)
 * ou avisa que é preciso instalar um APK mais novo.
 *
 * @param {{ plataforma: ReturnType<typeof import('./plataforma/atualizacaoNativa.js').criarAtualizacaoNativa>,
 *           buscarAnuncio: () => Promise<unknown>, versaoEmUso: string,
 *           aoPacotePronto: (pronto: { versao: string, usarAgora: () => Promise<void> }) => void,
 *           aoApkDisponivel: (disponivel: { versao: string, endereco: string }) => void }} dependencias
 */
export function criarAtualizador({ plataforma, buscarAnuncio, versaoEmUso, aoPacotePronto, aoApkDisponivel }) {
  async function verificar() {
    await plataforma.confirmarQueAbriu();
    const decisao = decidirAtualizacao({
      versaoEmUso,
      versaoDoApk: await plataforma.versaoDoApk(),
      anuncio: validarAnuncio(await buscarAnuncio()),
    });
    if (decisao.acao === ACAO_DE_ATUALIZACAO.INSTALAR_APK) aoApkDisponivel(decisao);
    if (decisao.acao === ACAO_DE_ATUALIZACAO.BAIXAR_PACOTE) await prepararPacote(decisao);
  }

  async function prepararPacote({ versao, endereco, sha256 }) {
    const id = await plataforma.pacoteJaBaixado(versao) ?? await plataforma.baixar({ endereco, versao, sha256 });
    await plataforma.usarNaProximaAbertura(id);
    aoPacotePronto({ versao, usarAgora: () => plataforma.usarAgora(id) });
  }

  return { verificar };
}

/** Busca o anúncio sem cache, para não ficar preso numa versão antiga do arquivo. */
export function criarBuscaDeAnuncio(endereco) {
  return async () => {
    const resposta = await fetch(endereco, { cache: 'no-store' });
    if (!resposta.ok) throw new Error(`Anúncio de atualização indisponível (HTTP ${resposta.status})`);
    return resposta.json();
  };
}
