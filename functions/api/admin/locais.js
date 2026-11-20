import { branchDaRequisicao } from '../../../server_lib/branch.js';
import { obterLocais, gravarLocais } from '../../../server_lib/github.js';
import { validarLocais } from '../../../server_lib/locais.js';
function resposta(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_TOKEN) return resposta({ erro: 'Configure GITHUB_TOKEN no Cloudflare Pages.' }, 503);
  try {
    const arquivo = await obterLocais(env.GITHUB_TOKEN, branchDaRequisicao(request, env));
    const dados = JSON.parse(arquivo.content);
    return resposta({ locais: validarLocais(dados.locais), sha: arquivo.sha });
  } catch (e) { return resposta({ erro: e.message }, 502); }
}
export async function onRequestPut({ request, env }) {
  if (!env.GITHUB_TOKEN) return resposta({ erro: 'Configure GITHUB_TOKEN no Cloudflare Pages.' }, 503);
  if (request.headers.get('Origin') !== new URL(request.url).origin) return resposta({ erro: 'Origem não autorizada.' }, 403);
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return resposta({ erro: 'Envie JSON.' }, 415);
  if (Number(request.headers.get('Content-Length') || 0) > 200000) return resposta({ erro: 'Cadastro muito grande.' }, 413);
  let payload;
  try { const body = await request.text(); if (body.length > 200000) return resposta({ erro: 'Cadastro muito grande.' }, 413); payload = JSON.parse(body); }
  catch { return resposta({ erro: 'JSON inválido.' }, 400); }
  if (!payload || typeof payload.sha !== 'string' || !/^[a-f0-9]{40}$/.test(payload.sha)) return resposta({ erro: 'Versão inválida.' }, 400);
  let locais;
  try { locais = validarLocais(payload.locais); } catch (e) { return resposta({ erro: e.message }, 400); }
  try {
    const branch = branchDaRequisicao(request, env);
    const arquivo = await obterLocais(env.GITHUB_TOKEN, branch);
    if (arquivo.sha !== payload.sha) return resposta({ erro: 'O cadastro foi modificado no GitHub. Recarregue antes de publicar.' }, 409);
    const result = await gravarLocais(env.GITHUB_TOKEN, JSON.stringify({ locais }, null, 2) + '\n', arquivo.sha, branch);
    return resposta({ ok: true, sha: result.content.sha, total: locais.length, aviso: 'Cadastro de locais enviado ao GitHub. Aguarde o deploy do Cloudflare Pages.' });
  } catch (e) { return resposta({ erro: e.message }, e.message.startsWith('CONFLITO:') ? 409 : 502); }
}
