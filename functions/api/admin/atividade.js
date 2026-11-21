import { branchDaRequisicao } from '../../../server_lib/branch.js';
function resp(obj,status=200){return new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export async function onRequestGet({request,env}){
 if(!env.GITHUB_TOKEN)return resp({erro:'Token GitHub não configurado.'},503);
 const branch=branchDaRequisicao(request,env);
 const url='https://api.github.com/repos/pazqueilumina/site/commits?sha='+encodeURIComponent(branch)+'&per_page=5';
 try{
  const r=await fetch(url,{headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'pazqueilumina-admin'},cache:'no-store'});
  if(!r.ok)throw Error('GitHub HTTP '+r.status);
  const data=await r.json();
  return resp({commits:data.map(c=>({message:String(c.commit?.message||'Atualização').split('\n')[0].slice(0,120),date:c.commit?.committer?.date||null})),source:'GitHub'});
 }catch(e){return resp({erro:'Não foi possível consultar as atualizações: '+e.message},502);}
}
