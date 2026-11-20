import { branchDaRequisicao } from '../../../server_lib/branch.js';
import { lerArquivo } from '../../../server_lib/palestras.js';

// PDFs são publicados na pasta /pdf/ do GitHub, nunca no R2.
// O limite de 20 MiB fica abaixo do limite por arquivo do Cloudflare Pages.
const MAX_PDF = 20 * 1024 * 1024;
const REPO = 'https://api.github.com/repos/pazqueilumina/site/contents/';
const SITE = 'https://pazqueilumina.com.br';

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function headers(token) {
  return {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'pazqueilumina-pdf-admin',
    'Content-Type': 'application/json'
  };
}

function nomeSeguro(pid, original) {
  if (typeof original !== 'string' || original.length > 220 ||
      /[\\/\x00-\x1f\x7f]/.test(original) || !/\.pdf$/i.test(original)) return null;
  const base = original.slice(0, -4).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 75).replace(/-+$/g, '');
  if (!base) return null;
  return pid + '-' + base + '.pdf';
}

function base64(bytes) {
  // Evita espalhar arrays grandes no call stack do Worker.
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(bin);
}

export async function onRequestPost({ request, env }) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ erro: 'Origem não autorizada.' }, 403);
  }
  if (!env.GITHUB_TOKEN) return json({ erro: 'Token do GitHub não configurado.' }, 503);
  let branch;
  try { branch = branchDaRequisicao(request, env); }
  catch (e) { return json({ erro: e.message }, 403); }

  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/pdf')) {
    return json({ erro: 'Envie um arquivo PDF.' }, 415);
  }
  const params = new URL(request.url).searchParams;
  const pid = params.get('pid');
  const original = params.get('nome');
  if (!/^PAL-\d{4,}$/.test(pid || '') || pid.length > 32) {
    return json({ erro: 'ID da palestra inválido.' }, 400);
  }
  const nome = nomeSeguro(pid, original);
  if (!nome) return json({ erro: 'Nome de arquivo PDF inválido.' }, 400);

  const declared = Number(request.headers.get('Content-Length') || 0);
  if (declared > MAX_PDF) return json({ erro: 'O PDF deve ter no máximo 20 MiB.' }, 413);

  let bytes;
  try {
    const data = await request.arrayBuffer();
    if (data.byteLength < 5 || data.byteLength > MAX_PDF) {
      return json({ erro: 'O PDF deve ter entre 5 bytes e 20 MiB.' }, 413);
    }
    bytes = new Uint8Array(data);
  } catch { return json({ erro: 'Não foi possível ler o PDF enviado.' }, 400); }
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') {
    return json({ erro: 'O arquivo não possui assinatura de PDF válida.' }, 400);
  }

  try {
    // Não permitir arquivos órfãos associados a IDs inexistentes ou ainda não publicados.
    const cadastro = await lerArquivo(env.GITHUB_TOKEN, branch);
    if (!cadastro.dados.palestras.some(p => p.pid === pid)) {
      return json({ erro: 'Primeiro salve e publique a palestra no GitHub para enviar seu PDF.' }, 409);
    }

    const caminho = 'pdf/' + nome;
    const api = REPO + caminho.split('/').map(encodeURIComponent).join('/');
    const opts = { headers: headers(env.GITHUB_TOKEN), cache: 'no-store' };
    const existente = await fetch(api + '?ref=' + encodeURIComponent(branch), opts);
    if (existente.ok) {
      return json({ erro: 'Já existe um PDF com esse nome para a palestra. Renomeie o arquivo antes de enviar; não substituímos PDFs automaticamente.' }, 409);
    }
    if (existente.status !== 404) {
      return json({ erro: 'Falha ao verificar o nome no GitHub (HTTP ' + existente.status + ').' }, 502);
    }

    const salvo = await fetch(api, {
      method: 'PUT',
      headers: headers(env.GITHUB_TOKEN),
      body: JSON.stringify({
        message: 'Adicionar PDF ' + nome + ' pelo painel de palestras',
        content: base64(bytes),
        branch
      })
    });
    if (salvo.status === 409 || salvo.status === 422) {
      return json({ erro: 'O arquivo já existe ou houve conflito no GitHub. Atualize e escolha outro nome; nenhum PDF existente foi substituído.' }, 409);
    }
    if (!salvo.ok) {
      return json({ erro: 'GitHub recusou o PDF (HTTP ' + salvo.status + ').' }, 502);
    }
    const info = await salvo.json();
    if (!info.content?.sha || info.content?.path !== caminho) {
      return json({ erro: 'O GitHub respondeu sem confirmação do caminho. Verifique o repositório antes de repetir o envio.' }, 502);
    }
    return json({
      ok: true,
      caminho,
      url: SITE + '/pdf/' + encodeURIComponent(nome),
      sha: info.content.sha,
      aviso: 'PDF enviado ao GitHub. Aguarde o deploy do Cloudflare Pages e publique o vínculo no cadastro.'
    });
  } catch (e) {
    return json({ erro: 'Não foi possível enviar o PDF: ' + e.message }, 502);
  }
}
