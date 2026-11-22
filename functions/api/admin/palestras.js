import { branchDaRequisicao } from '../../../server_lib/branch.js';
import { lerArquivo, gravarArquivo, validarCadastro } from '../../../server_lib/palestras.js';
import { registrarPublicacoesPalestras } from '../../../server_lib/publicacoes.js';
function resp(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function onRequestGet({request,env}){
 if(!env.GITHUB_TOKEN)return resp({erro:'Token do GitHub não configurado.'},503);
 try{return resp(await lerArquivo(env.GITHUB_TOKEN,branchDaRequisicao(request,env)));}catch(e){return resp({erro:e.message},502);}
}
export async function onRequestPut({request,env}){
 if(!env.GITHUB_TOKEN)return resp({erro:'Token do GitHub não configurado.'},503);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return resp({erro:'Origem não autorizada.'},403);
 if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return resp({erro:'Envie JSON.'},415);
 if(Number(request.headers.get('Content-Length')||0)>1500000)return resp({erro:'Cadastro muito grande.'},413);
 let payload;try{const body=await request.text();if(body.length>1500000)throw new Error('Cadastro muito grande.');payload=JSON.parse(body);}catch(e){return resp({erro:e.message||'JSON inválido.'},400);}
 if(!/^[a-f0-9]{40}$/.test(payload?.sha||''))return resp({erro:'Versão inválida.'},400);
 try{validarCadastro(payload.dados);}catch(e){return resp({erro:e.message},400);}
 try{const atual=await lerArquivo(env.GITHUB_TOKEN,branchDaRequisicao(request,env));if(atual.sha!==payload.sha)return resp({erro:'Cadastro alterado por outra operação. Recarregue.'},409);
 registrarPublicacoesPalestras(payload.dados,atual.dados);
 validarCadastro(payload.dados);
 const sha=await gravarArquivo(env.GITHUB_TOKEN,payload.dados,atual.sha,branchDaRequisicao(request,env));return resp({ok:true,sha,aviso:'Cadastro enviado ao GitHub. Aguarde o deploy do Cloudflare.'});
 }catch(e){return resp({erro:e.message},e.message.startsWith('CONFLITO:')?409:502);}
}
