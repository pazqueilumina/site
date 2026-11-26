// Fail closed: no private study content is served without verified Access JWT.
export async function onRequest(context) {
  const {request, env, next} = context;
  const headers = {"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"};
  const deny = () => new Response("Acesso restrito", {status:403, headers});
  try {
    const team = env.ESTUDO_ACCESS_TEAM || 'soft-scene-0696';
    const aud = env.ESTUDO_ACCESS_AUD || '512d093301285ea5286eb13072c8f7471021cfc03365bc7d9764da8dca1f9d2a';
    if (new URL(request.url).hostname !== 'pazqueilumina.com.br') return deny();
    if (!team || !aud || !/^[a-z0-9-]+$/.test(team)) return deny();
    const issuer = "https://" + team + ".cloudflareaccess.com";
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!token) return deny();
    const parts = token.split(".");
    if (parts.length !== 3) return deny();
    const decode = s => Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(s.length/4)*4,"=")), c=>c.charCodeAt(0));
    const parse = s => JSON.parse(new TextDecoder().decode(decode(s)));
    const head = parse(parts[0]), claims = parse(parts[1]);
    const now = Math.floor(Date.now()/1000);
    if (head.alg !== "RS256" || claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(aud) || !Number.isFinite(claims.exp) || claims.exp <= now || (claims.nbf && claims.nbf > now) || !["pazqueilumina@gmail.com","alexmalves352005@gmail.com"].includes(claims.email)) return deny();
    const response = await fetch(issuer+"/cdn-cgi/access/certs");
    if (!response.ok) return deny();
    const {keys} = await response.json();
    const jwk = keys.find(k=>k.kid===head.kid && k.kty==="RSA");
    if (!jwk) return deny();
    const key = await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,decode(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]))) return deny();
    const result = await next();
    const output = new Response(result.body,result);
    for (const [k,v] of Object.entries(headers)) output.headers.set(k,v);
    return output;
  } catch { return deny(); }
}
