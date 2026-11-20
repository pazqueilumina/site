import { branchDaRequisicao } from '../../../server_lib/branch.js';
import { obterDados, gravarDados } from '../../../server_lib/github.js';
import { lerAgenda, substituirAgenda, validarAgenda } from '../../../server_lib/agenda.js';
function resposta(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}
export async function onRequestGet({ request, env }) {
  if (!env.GITHUB_TOKEN) return resposta({ erro: 'Configure o segredo GITHUB_TOKEN no Cloudflare Pages.' }, 503);
  try {
    const file = await obterDados(env.GITHUB_TOKEN, branchDaRequisicao(request,env));
    return resposta({ agenda: lerAgenda(file.content), sha: file.sha });
  } catch (e) { return resposta({ erro: e.message }, 502); }
}
export async function onRequestPut({ request, env }) {
  if (!env.GITHUB_TOKEN) return resposta({ erro: 'Configure o segredo GITHUB_TOKEN no Cloudflare Pages.' }, 503);
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return resposta({ erro: 'Origem da requisição não autorizada.' }, 403);
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) return resposta({ erro: 'Envie JSON.' }, 415);
  if (Number(request.headers.get('Content-Length') || 0) > 200000) return resposta({ erro: 'Agenda excede o tamanho permitido.' }, 413);
  let payload;
  try {
    const body = await request.text();
    if (body.length > 200000) return resposta({ erro: 'Agenda excede o tamanho permitido.' }, 413);
    payload = JSON.parse(body);
  } catch { return resposta({ erro: 'JSON inválido.' }, 400); }
  if (!payload || typeof payload.sha !== 'string' || !/^[a-f0-9]{40}$/.test(payload.sha)) return resposta({ erro: 'Versão da agenda inválida.' }, 400);
  let events;
  try { events = validarAgenda(payload.agenda); }
  catch (e) { return resposta({ erro: e.message }, 400); }
  try {
    const file = await obterDados(env.GITHUB_TOKEN, branchDaRequisicao(request,env));
    if (file.sha !== payload.sha) return resposta({ erro: 'O arquivo foi alterado desde que você abriu o painel. Recarregue antes de publicar.' }, 409);
    const updated = substituirAgenda(file.content, events);
    const result = await gravarDados(env.GITHUB_TOKEN, updated, file.sha, branchDaRequisicao(request,env));
    return resposta({ ok: true, sha: result.content.sha, total: events.length, aviso: 'Alterações enviadas ao GitHub. O Cloudflare Pages publicará a nova versão após o deploy.' });
  } catch (e) { return resposta({ erro: e.message }, e.message.startsWith('CONFLITO:') ? 409 : 502); }
}
