const OWNER = 'pazqueilumina';
const REPO = 'site';
const FILE = 'data/palestras.json';
const URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;
function headers(token) { return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'palestras-admin', 'Content-Type': 'application/json' }; }
function decode(s) { return new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g,'')), c=>c.charCodeAt(0))); }
function encode(s) { const bytes=new TextEncoder().encode(s);let bin='';for(let i=0;i<bytes.length;i+=8192)bin+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(bin); }
export async function lerArquivo(token, branch) {
 const res=await fetch(URL+'?ref='+encodeURIComponent(branch),{headers:headers(token),cache:'no-store'});
 if(!res.ok)throw new Error('Não foi possível ler o cadastro no GitHub (HTTP '+res.status+').');
 const obj=await res.json();if(!obj.sha||obj.encoding!=='base64')throw new Error('Resposta inválida do GitHub.');
 return {sha:obj.sha, dados:JSON.parse(decode(obj.content))};
}
export async function gravarArquivo(token,dados,sha,branch) {
 const res=await fetch(URL,{method:'PUT',headers:headers(token),body:JSON.stringify({message:'Atualizar cadastro de palestras pelo painel',content:encode(JSON.stringify(dados,null,2)+'\n'),sha,branch:branch})});
 if(res.status===409||res.status===422)throw new Error('CONFLITO: cadastro alterado no GitHub. Recarregue antes de publicar.');
 if(!res.ok)throw new Error('Falha ao gravar cadastro no GitHub (HTTP '+res.status+').');
 const obj=await res.json();return obj.content.sha;
}

/* Normaliza os tempos antigos MM:SS ou H:MM:SS antes de gravar o catálogo. */
function normalizarDuracao(valor) {
 if(typeof valor!=='string')throw new Error('Duração inválida.');
 const partes=valor.trim().split(':');
 if(partes.length<2||partes.length>3||partes.some(p=>!/^\d{1,3}$/.test(p)))throw new Error('Duração inválida.');
 const nums=partes.map(Number);
 const [h,m,s]=partes.length===2?[0,nums[0],nums[1]]:nums;
 if(m>59||s>59)throw new Error('Duração inválida.');
 return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':');
}

export function validarCadastro(dados) {
 if(!dados||dados.versao!==1||!Array.isArray(dados.palestras)||dados.palestras.length>10000)throw new Error('Formato do cadastro inválido.');
 const ids=new Set(),videos=new Set();
 for(const p of dados.palestras){
  if(!p||typeof p!=='object'||!/^PAL-\d{4,}$/.test(p.pid||'')||ids.has(p.pid))throw new Error('ID inválido ou repetido: '+(p?.pid||''));
  ids.add(p.pid);
  if(p.ativo!==undefined&&typeof p.ativo!=='boolean')throw new Error('Status da palestra inválido em '+p.pid);
  if(typeof p.titulo!=='string'||!p.titulo.trim()||p.titulo.length>300)throw new Error('Título inválido em '+p.pid);
  if(p.youtubeId){if(!/^[a-zA-Z0-9_-]{11}$/.test(p.youtubeId)||videos.has(p.youtubeId))throw new Error('YouTube inválido ou repetido em '+p.pid);videos.add(p.youtubeId);}
  if(p.data&&!/^\d{4}-\d{2}-\d{2}$/.test(p.data))throw new Error('Data inválida em '+p.pid);
  if(p.duracao!==undefined&&p.duracao!==''){
   try{p.duracao=normalizarDuracao(p.duracao);}catch{throw new Error('Duração inválida em '+p.pid);}
  }
  if(p.horario!==undefined&&p.horario!==''&&(typeof p.horario!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(p.horario)))throw new Error('Horário inválido em '+p.pid);
  if(p.centroId&&(typeof p.centroId!=='string'||p.centroId.length>120||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.centroId)))throw new Error('Centro inválido em '+p.pid);
   if(p.eventoId!==undefined&&p.eventoId!==''&&(typeof p.eventoId!=='string'||!/^evt-[a-z0-9-]{4,50}$/.test(p.eventoId)))throw new Error('Vínculo de agenda inválido em '+p.pid);
  for(const key of ['audio','pdf'])if(p[key]&&(typeof p[key]!=='string'||p[key].length>1500||!(/^(https:\/\/|\/)/.test(p[key]))))throw new Error('Link inválido em '+p.pid);
  if(p.apresentacaoOriginal&&(typeof p.apresentacaoOriginal!=='string'||p.apresentacaoOriginal.length>250||/[\/\\]/.test(p.apresentacaoOriginal)))throw new Error('Nome de arquivo inválido em '+p.pid);
 }
 return dados;
}
