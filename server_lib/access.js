/* Validação independente do JWT do Cloudflare Access, inclusive em URLs alternativas. */
function jsonError(message, status) {
  return new Response(JSON.stringify({ erro: message }), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}
function fromBase64Url(value) {
  const str = value.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(str.padEnd(Math.ceil(str.length / 4) * 4, '='));
  return Uint8Array.from(decoded, c => c.charCodeAt(0));
}
function readCookie(cookie, name) {
  const part = cookie.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
}
export async function verificarAcesso(request, env) {
  const team = (env.CF_ACCESS_TEAM_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const audience = (env.CF_ACCESS_AUD || '').trim();
  const emails = (env.CF_ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!team || !audience || !emails.length) return { ok: false, response: jsonError('Administração ainda não configurada no Cloudflare.', 503) };
  if (!/^[a-zA-Z0-9.-]+\.cloudflareaccess\.com$/.test(team)) return { ok: false, response: jsonError('Domínio do Cloudflare Access inválido.', 503) };
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') || readCookie(request.headers.get('Cookie') || '', 'CF_Authorization');
  if (!jwt) return { ok: false, response: jsonError('Acesso restrito. Faça login pelo Cloudflare Access.', 401) };
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) throw new Error('JWT inválido');
    const header = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(parts[1])));
    if (header.alg !== 'RS256' || !header.kid) throw new Error('Assinatura não aceita');
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== `https://${team}` || !Array.isArray(payload.aud) || !payload.aud.includes(audience) ||
        !Number.isFinite(payload.exp) || payload.exp <= now ||
        (payload.nbf && payload.nbf > now) || !emails.includes(String(payload.email || '').toLowerCase())) {
      throw new Error('Credenciais sem permissão');
    }
    const certResponse = await fetch(`https://${team}/cdn-cgi/access/certs`);
    if (!certResponse.ok) throw new Error('Falha ao consultar certificado');
    const certs = await certResponse.json();
    const jwk = (certs.keys || []).find(k => k.kid === header.kid && k.kty === 'RSA');
    if (!jwk) throw new Error('Chave de assinatura não encontrada');
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromBase64Url(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
    if (!valid) throw new Error('Assinatura inválida');
    return { ok: true, email: payload.email };
  } catch {
    return { ok: false, response: jsonError('Sessão inválida ou sem permissão. Entre novamente.', 403) };
  }
}
