// O servidor atribui as datas somente quando um conteúdo é publicado.
const stamp=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)&&Number.isFinite(Date.parse(v))?v:'';
export function registrarPublicacoesShorts(dados,anteriores,agora=new Date().toISOString()){
 const map=new Map((anteriores?.shorts||[]).map(s=>[s.sid,s]));
 for(const s of dados.shorts){
  const old=map.get(s.sid),anterior=stamp(old?.publicadoEm),mudou=!!old&&old.youtubeId!==s.youtubeId;
  if(s.ativo!==false&&(!old||mudou||(old.ativo===false&&!anterior)))s.publicadoEm=agora;
  else if(!mudou&&anterior)s.publicadoEm=anterior;
  else delete s.publicadoEm;
 }
 return dados;
}
export function registrarPublicacoesPalestras(dados,anteriores,agora=new Date().toISOString()){
 const map=new Map((anteriores?.palestras||[]).map(p=>[p.pid,p]));
 const campos={video:'youtubeId',audio:'audio',pdf:'pdf',original:'apresentacaoOriginal'};
 for(const p of dados.palestras){
  const old=map.get(p.pid),datas={};
  for(const [tipo,campo] of Object.entries(campos)){
   if(!p[campo])continue;
   const anterior=stamp(old?.publicacoes?.[tipo]),mudou=!!old&&(old[campo]||'')!==p[campo];
   if(p.ativo!==false&&(!old||mudou||(old.ativo===false&&!anterior)))datas[tipo]=agora;
   else if(!mudou&&anterior)datas[tipo]=anterior;
  }
  if(Object.keys(datas).length)p.publicacoes=datas;
  else delete p.publicacoes;
 }
 return dados;
}
