import { verificarAcesso } from '../../../server_lib/access.js';
export async function onRequest(context) {
  const auth = await verificarAcesso(context.request, context.env);
  if (!auth.ok) return auth.response;
  return context.next();
}
