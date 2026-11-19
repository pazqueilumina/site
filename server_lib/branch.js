/** Isola o ambiente de testes do cadastro principal. Falha de forma fechada. */
export function branchDaRequisicao(request, env) {
  const host = new URL(request.url).hostname.toLowerCase();
  const deployedBranch = String(env.CF_PAGES_BRANCH || '').trim();
  if (host === 'pazqueilumina.com.br' || host === 'www.pazqueilumina.com.br') {
    if (deployedBranch && deployedBranch !== 'main') throw new Error('Deploy não principal bloqueado no domínio público.');
    return 'main';
  }
  if (host.endsWith('.pages.dev')) {
    if (deployedBranch !== 'teste-admin') throw new Error('Prévia bloqueada: CF_PAGES_BRANCH deve ser teste-admin.');
    return 'teste-admin';
  }
  throw new Error('Host não autorizado para a administração.');
}
