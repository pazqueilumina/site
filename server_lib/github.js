const OWNER = 'pazqueilumina';
const REPO = 'site';
const FILE = 'js/dados.js';
const URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;
function headers(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'agenda-site-cloudflare-pages',
    'Content-Type': 'application/json'
  };
}
function decodeBase64(value) {
  const bin = atob(value.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
}
function encodeBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(bin);
}
export async function obterDados(token, branch) {
  const res = await fetch(URL + '?ref=' + encodeURIComponent(branch), { headers: headers(token), cache: 'no-store' });
  if (!res.ok) throw new Error(`Não foi possível ler js/dados.js no GitHub (HTTP ${res.status}).`);
  const result = await res.json();
  if (result.encoding !== 'base64' || !result.content || !result.sha) throw new Error('Resposta inesperada do GitHub.');
  return { content: decodeBase64(result.content), sha: result.sha };
}
export async function gravarDados(token, content, sha, branch) {
  const res = await fetch(URL, {
    method: 'PUT', headers: headers(token),
    body: JSON.stringify({ message: 'Atualizar agenda pelo painel administrativo', content: encodeBase64(content), sha, branch: branch })
  });
  if (res.status === 409 || res.status === 422) throw new Error('CONFLITO: o arquivo mudou no GitHub. Recarregue a agenda antes de publicar.');
  if (!res.ok) throw new Error(`O GitHub não aceitou a atualização (HTTP ${res.status}). Verifique as permissões do token.`);
  return res.json();
}

// Cadastro de locais em arquivo separado, preservando o js/dados.js da agenda.
const LOCAIS_FILE = 'data/locais.json';
const LOCAIS_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${LOCAIS_FILE}`;
export async function obterLocais(token, branch) {
  const res = await fetch(LOCAIS_URL + '?ref=' + encodeURIComponent(branch), { headers: headers(token), cache: 'no-store' });
  if (!res.ok) throw new Error(`Não foi possível ler data/locais.json (HTTP ${res.status}). Publique primeiro o arquivo inicial.`);
  const result = await res.json();
  if (result.encoding !== 'base64' || !result.content || !result.sha) throw new Error('Resposta inesperada do GitHub para locais.');
  return { content: decodeBase64(result.content), sha: result.sha };
}
export async function gravarLocais(token, content, sha, branch) {
  const res = await fetch(LOCAIS_URL, {
    method: 'PUT', headers: headers(token),
    body: JSON.stringify({ message: 'Atualizar cadastro de locais pelo painel', content: encodeBase64(content), sha, branch })
  });
  if (res.status === 409 || res.status === 422) throw new Error('CONFLITO: cadastro alterado no GitHub. Recarregue antes de publicar.');
  if (!res.ok) throw new Error(`O GitHub não aceitou o cadastro de locais (HTTP ${res.status}).`);
  return res.json();
}
