const OWNER='pazqueilumina', REPO='site', FILE='data/shorts.json';
const URL='https://api.github.com/repos/'+OWNER+'/'+REPO+'/contents/'+FILE;
function headers(token){return {Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'shorts-admin','Content-Type':'application/json'};}
function decode(texto){return new TextDecoder().decode(Uint8Array.from(atob(texto.replace(/\s/g,'')),c=>c.charCodeAt(0)));}
function encode(texto){const bytes=new TextEncoder().encode(texto);let bin='';for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(bin);}
export async function lerShorts(token,branch){
 const res=await fetch(URL+'?ref='+encodeURIComponent(branch),{headers:headers(token),cache:'no-store'});
 if(!res.ok)throw new Error('Não foi possível ler os Shorts no GitHub (HTTP '+res.status+').');
 const obj=await res.json();
 if(!obj.sha||obj.encoding!=='base64')throw new Error('Resposta inválida do GitHub.');
 return {sha:obj.sha,dados:JSON.parse(decode(obj.content))};
}
export function validarShorts(dados){
 if(!dados||typeof dados!=='object'||dados.versao!==1||!Array.isArray(dados.shorts)||dados.shorts.length>5000)throw new Error('Formato do cadastro de Shorts inválido.');
 if(!Number.isSafeInteger(dados.proximoId)||dados.proximoId<1)throw new Error('Próximo ID inválido.');
 const ids=new Set(),videos=new Set(),ordens=new Set();let maior=0;
 for(const s of dados.shorts){
  if(!s||typeof s!=='object'||!/^SHO-\d{4,}$/.test(s.sid||'')||ids.has(s.sid))throw new Error('ID de Short inválido ou repetido.');
  const num=Number(s.sid.slice(4));if(!Number.isSafeInteger(num)||num<1)throw new Error('ID de Short inválido.');
  maior=Math.max(maior,num);ids.add(s.sid);
  if(!/^[a-zA-Z0-9_-]{11}$/.test(s.youtubeId||'')||videos.has(s.youtubeId))throw new Error('ID do YouTube inválido ou repetido em '+s.sid);
  videos.add(s.youtubeId);
  if(typeof s.titulo!=='string'||!s.titulo.trim()||s.titulo.length>200)throw new Error('Título inválido em '+s.sid);
  if(typeof s.ativo!=='boolean')throw new Error('Situação inválida em '+s.sid);
  if(!Number.isInteger(s.ordem)||s.ordem<1||s.ordem>dados.shorts.length||ordens.has(s.ordem))throw new Error('Ordem inválida em '+s.sid);
  ordens.add(s.ordem);
 }
 if(dados.proximoId<=maior)throw new Error('Contador de IDs deve ser maior que os IDs existentes.');
 return dados;
}
export async function gravarShorts(token,dados,sha,branch){
 const res=await fetch(URL,{method:'PUT',headers:headers(token),body:JSON.stringify({message:'Atualizar cadastro de Shorts pelo painel',content:encode(JSON.stringify(dados,null,2)+'\n'),sha,branch})});
 if(res.status===409||res.status===422)throw new Error('CONFLITO: cadastro alterado no GitHub. Recarregue antes de publicar.');
 if(!res.ok)throw new Error('Falha ao gravar Shorts no GitHub (HTTP '+res.status+').');
 const obj=await res.json();return obj.content.sha;
}
