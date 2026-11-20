import { branchDaRequisicao } from '../../../server_lib/branch.js';
import { lerArquivo } from '../../../server_lib/palestras.js';

// Upload em partes de 8 MiB: cada requisição fica bem abaixo do limite de corpo
// de uma Cloudflare Pages Function, inclusive no plano gratuito.
const TAMANHO_PARTE = 8 * 1024 * 1024;
const MAX_ARQUIVO = 300 * 1024 * 1024;
const MAX_PARTES = Math.ceil(MAX_ARQUIVO / TAMANHO_PARTE);
const URL_PUBLICA = 'https://audio.pazqueilumina.com.br/';

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function ambiente(request, env) {
  // Falha de forma fechada se o host/branch não estiver autorizado.
  return branchDaRequisicao(request, env);
}

function chave(pid, branch) {
  // A prévia NUNCA grava na raiz do bucket, usada para os áudios definitivos.
  return `${branch === 'teste-admin' ? 'teste-admin/' : ''}${pid}.mp3`;
}

function validoPid(pid) {
  return typeof pid === 'string' && /^PAL-\d{4,}$/.test(pid) && pid.length <= 32;
}

function validoUploadId(id) {
  return typeof id === 'string' && id.length > 4 && id.length <= 1024 && !/[\x00-\x20\x7f]/.test(id);
}

function checarOrigem(request) {
  return request.headers.get('Origin') === new URL(request.url).origin;
}

function bucket(env) {
  const r2 = env.PALESTRAS_AUDIOS;
  if (!r2 || typeof r2.createMultipartUpload !== 'function' || typeof r2.resumeMultipartUpload !== 'function') {
    throw new Error('Binding PALESTRAS_AUDIOS não configurado no Cloudflare Pages.');
  }
  return r2;
}

async function lerJson(request) {
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/json')) {
    throw new Error('Envie JSON.');
  }
  if (Number(request.headers.get('Content-Length') || 0) > 16384) {
    throw new Error('Requisição muito grande.');
  }
  const body = await request.text();
  if (body.length > 16384) throw new Error('Requisição muito grande.');
  try { return JSON.parse(body); } catch { throw new Error('JSON inválido.'); }
}

function validarPartes(partes, tamanho) {
  if (!Array.isArray(partes) || partes.length !== Math.ceil(tamanho / TAMANHO_PARTE) || partes.length > MAX_PARTES) {
    throw new Error('Quantidade de partes inválida.');
  }
  return partes.map((p, i) => {
    if (!p || p.partNumber !== i + 1 || typeof p.etag !== 'string' ||
        p.etag.length > 256 || /[\x00-\x20\x7f]/.test(p.etag)) {
      throw new Error('Lista de partes inválida.');
    }
    return { partNumber: p.partNumber, etag: p.etag };
  });
}

export async function onRequestGet({ request, env }) {
  try {
    const branch = ambiente(request, env);
    bucket(env);
    return json({ ativo: true, ambiente: branch, tamanhoParte: TAMANHO_PARTE, tamanhoMaximo: MAX_ARQUIVO });
  } catch (e) {
    return json({ ativo: false, aviso: e.message });
  }
}

export async function onRequestPost({ request, env }) {
  if (!checarOrigem(request)) return json({ erro: 'Origem não autorizada.' }, 403);
  let branch, r2, payload;
  try { branch = ambiente(request, env); r2 = bucket(env); payload = await lerJson(request); }
  catch (e) { return json({ erro: e.message }, 400); }
  const { acao, pid, uploadId } = payload || {};
  if (!validoPid(pid)) return json({ erro: 'ID da palestra inválido.' }, 400);
  const key = chave(pid, branch);

  if (acao === 'iniciar') {
    const { nome, tamanho } = payload;
    if (typeof nome !== 'string' || nome.length > 255 || !/\.mp3$/i.test(nome) ||
        !Number.isSafeInteger(tamanho) || tamanho < 1 || tamanho > MAX_ARQUIVO) {
      return json({ erro: 'Arquivo inválido. Aceitamos MP3 de até 300 MB.' }, 400);
    }
    if (!env.GITHUB_TOKEN) return json({ erro: 'Token do GitHub não configurado.' }, 503);
    try {
      // Impede uploads para IDs ainda não publicados ou inventados.
      const atual = await lerArquivo(env.GITHUB_TOKEN, branch);
      if (!atual.dados.palestras.some(p => p.pid === pid)) {
        return json({ erro: 'Publique primeiro o cadastro desta palestra na branch de testes.' }, 409);
      }
      if (await r2.head(key)) return json({ erro: `O arquivo ${key} já existe no R2. A substituição automática está bloqueada.` }, 409);
      const up = await r2.createMultipartUpload(key, {
        httpMetadata: { contentType: 'audio/mpeg' },
        customMetadata: { palestra: pid, ambiente: branch },
      });
      return json({ ok: true, uploadId: up.uploadId, tamanhoParte: TAMANHO_PARTE, partes: Math.ceil(tamanho / TAMANHO_PARTE) });
    } catch (e) {
      return json({ erro: 'Não foi possível iniciar o envio: ' + e.message }, 502);
    }
  }

  if (!validoUploadId(uploadId)) return json({ erro: 'Identificador de envio inválido.' }, 400);
  const up = r2.resumeMultipartUpload(key, uploadId);
  if (acao === 'cancelar') {
    try { await up.abort(); return json({ ok: true }); }
    catch (e) { return json({ erro: 'Falha ao cancelar envio: ' + e.message }, 502); }
  }
  if (acao === 'concluir') {
    const tamanho = payload.tamanho;
    if (!Number.isSafeInteger(tamanho) || tamanho < 1 || tamanho > MAX_ARQUIVO) {
      return json({ erro: 'Tamanho total inválido.' }, 400);
    }
    let partes;
    try { partes = validarPartes(payload.partes, tamanho); }
    catch (e) { return json({ erro: e.message }, 400); }
    try {
      // Não substituir um arquivo preexistente, inclusive após o início do upload.
      if (await r2.head(key)) return json({ erro: `O arquivo ${key} já existe. Upload não concluído.` }, 409);
      await up.complete(partes);
      const objeto = await r2.head(key);
      if (!objeto || objeto.size !== tamanho) {
        // Não excluir automaticamente: uma falha de verificação requer inspeção manual.
        return json({ erro: 'Envio finalizado, mas tamanho não confirmado. Confira o arquivo no R2.' }, 502);
      }
      return json({ ok: true, pid, url: URL_PUBLICA + key, tamanho: objeto.size });
    } catch (e) { return json({ erro: 'Não foi possível concluir o MP3: ' + e.message }, 502); }
  }
  return json({ erro: 'Ação desconhecida.' }, 400);
}

export async function onRequestPut({ request, env }) {
  if (!checarOrigem(request)) return json({ erro: 'Origem não autorizada.' }, 403);
  let branch, r2;
  try { branch = ambiente(request, env); r2 = bucket(env); }
  catch (e) { return json({ erro: e.message }, 503); }
  const params = new URL(request.url).searchParams;
  const pid = params.get('pid'), uploadId = params.get('uploadId');
  const numero = Number(params.get('parte'));
  if (!validoPid(pid) || !validoUploadId(uploadId) || !Number.isInteger(numero) || numero < 1 || numero > MAX_PARTES) {
    return json({ erro: 'Parâmetros do envio inválidos.' }, 400);
  }
  if (!(request.headers.get('Content-Type') || '').toLowerCase().startsWith('application/octet-stream')) {
    return json({ erro: 'Formato da parte inválido.' }, 415);
  }
  const declarado = Number(request.headers.get('Content-Length') || 0);
  if (declarado > TAMANHO_PARTE) return json({ erro: 'Parte excede 8 MiB.' }, 413);
  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength < 1 || bytes.byteLength > TAMANHO_PARTE) return json({ erro: 'Tamanho da parte inválido.' }, 413);
    const up = r2.resumeMultipartUpload(chave(pid, branch), uploadId);
    const part = await up.uploadPart(numero, bytes);
    return json({ ok: true, numero: part.partNumber, etag: part.etag });
  } catch (e) { return json({ erro: 'Falha ao enviar parte: ' + e.message }, 502); }
}
