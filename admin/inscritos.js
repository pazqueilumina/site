'use strict';
const $=id=>document.getElementById(id);
let pagina=1,serial=0,espera=null,ultimaConsulta=null;
const nomes={active:'Confirmado',pending:'Pendente',unsubscribed:'Cancelado'};
function dataLocal(iso){
 if(!iso||!Number.isFinite(Date.parse(iso)))return '—';
 const parts=Object.fromEntries(new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 return parts.day+'/'+parts.month+'/'+parts.year+' às '+parts.hour+'h'+(parts.minute==='00'?'':parts.minute);
}
function mensagem(texto,erro=false){const el=$('mensagemInscritos');el.textContent=texto;el.hidden=!texto;el.className='mensagem'+(erro?' erro':'');}
function parametros(extra={}){
 const params=new URLSearchParams({q:$('buscarInscritos').value.trim(),status:$('filtroInscritos').value,page:String(pagina),...extra});
 return params.toString();
}
function celula(tr,texto){const td=document.createElement('td');td.textContent=texto;tr.append(td);return td;}
function renderizar(dados){
 const s=dados.summary||{};
 for(const [id,key] of [['inscritosAtivos','active'],['inscritosPendentes','pending'],['inscritosSemanais','weekly'],['inscritosCancelados','unsubscribed']])
  $(id).textContent=Number(s[key]||0).toLocaleString('pt-BR');
 const tbody=$('listaInscritos');tbody.replaceChildren();
 const rows=Array.isArray(dados.items)?dados.items:[];
 if(!rows.length){const tr=document.createElement('tr');celula(tr,'Nenhuma inscrição encontrada.').colSpan=7;tbody.append(tr);}
 for(const row of rows){
  const tr=document.createElement('tr');
  const email=celula(tr,row.email||'—');email.className='inscritos-email';
  const status=celula(tr,nomes[row.status]||row.status||'—');status.className='inscritos-status status-'+row.status;
  celula(tr,row.status==='active'&&Number(row.weekly_opt_in)===1?'Sim':'Não');
  celula(tr,dataLocal(row.created_at));celula(tr,dataLocal(row.confirmed_at));celula(tr,dataLocal(row.unsubscribed_at));
  const action=celula(tr,'');
  if(row.status==='active'||row.status==='pending'){
   const button=document.createElement('button');button.type='button';button.className='inscritos-cancelar';button.textContent='Cancelar';
   button.addEventListener('click',()=>cancelar(row.email,button));action.append(button);
  }else action.textContent='—';
  tbody.append(tr);
 }
 const total=Number(dados.total||0),pages=Math.max(1,Math.ceil(total/50));
 pagina=Number(dados.page||1);
 $('totalFiltrado').textContent=total.toLocaleString('pt-BR')+' inscrição(ões) encontrada(s)';
 $('numeroPagina').textContent='Página '+pagina+' de '+pages;
 $('paginaAnterior').disabled=pagina<=1;$('proximaPagina').disabled=pagina>=pages;
}
async function carregar(){
 const atual=++serial;
 $('atualizarInscritos').disabled=true;
 try{
  const r=await fetch('/api/admin/inscritos?'+parametros(),{credentials:'same-origin',cache:'no-store'});
  const dados=await r.json().catch(()=>({}));
  if(atual!==serial)return;
  if(!r.ok||dados.status!=='ok')throw Error(dados.message||dados.erro||'Não foi possível carregar os inscritos.');
  ultimaConsulta=dados;renderizar(dados);mensagem('');
 }catch(e){if(atual===serial)mensagem(e.message||'Erro ao carregar os inscritos.',true);}
 finally{if(atual===serial)$('atualizarInscritos').disabled=false;}
}
async function cancelar(email,botao){
 if(!confirm('Cancelar a inscrição de '+email+' nas agendas mensal e semanal?'))return;
 botao.disabled=true;
 try{
  const r=await fetch('/api/admin/inscritos',{method:'POST',credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest'},
   body:JSON.stringify({action:'cancel',confirm:true,email})});
  const dados=await r.json().catch(()=>({}));
  if(!r.ok)throw Error(dados.erro||'Não foi possível cancelar.');
  mensagem(dados.message||'Inscrição cancelada.');await carregar();
 }catch(e){mensagem(e.message||'Falha no cancelamento.',true);botao.disabled=false;}
}
$('atualizarInscritos').addEventListener('click',carregar);
$('buscarInscritos').addEventListener('input',()=>{clearTimeout(espera);espera=setTimeout(()=>{pagina=1;carregar();},320);});
$('filtroInscritos').addEventListener('change',()=>{pagina=1;carregar();});
$('paginaAnterior').addEventListener('click',()=>{if(pagina>1){pagina--;carregar();}});
$('proximaPagina').addEventListener('click',()=>{pagina++;carregar();});
$('exportarInscritos').addEventListener('click',()=>{
 const link=document.createElement('a');link.href='/api/admin/inscritos?'+parametros({format:'csv'});
 document.body.append(link);link.click();link.remove();
});
carregar();