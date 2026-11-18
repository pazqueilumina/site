import { verificarAcesso } from '../../server_lib/access.js';
export async function onRequest(context) {
  const auth = await verificarAcesso(context.request, context.env);
  if (!auth.ok) return auth.response;
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'same-origin');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
