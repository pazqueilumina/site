'use strict';
const $ = id => document.getElementById(id);
const fmt = n => Number(n).toLocaleString('pt-BR');
const dataBR = s => /^\d{4}-\d{2}-\d{2}$/.test(s||'') ? s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4) : 'Sem data';
function texto(tag, value, classe) { const e=document.createElement(tag);e.textContent=value;if(classe)e.className=classe;return e; }
function linha(titulo,descricao,contagem){const e=texto('div','','dash-item'),box=texto('div','');box.append(texto('strong',titulo),texto('small',descricao));e.append(box);if(contagem!==undefined)e.append(texto('span',fmt(contagem),'dash-count'));return e;}
function lista(id,items,vazio){const e=$(id);e.replaceChildren();if(!items.length)e.append(texto('p',vazio,'dash-muted'));else items.forEach(x=>e.append(x));}
function barra(titulo,tem,total){const e=texto('div','','dash-barra'),topo=texto('div','','dash-barra-topo'),trilho=texto('div','','dash-trilho'),preenchimento=texto('div','','dash-preenchimento');topo.append(texto('span',titulo),texto('strong',fmt(tem)+' / '+fmt(total)));preenchimento.style.width=(total?Math.round(tem/total*100):0)+'%';trilho.append(preenchimento);e.append(topo,trilho);return e;}
async function ler(url){const r=await fetch(url,{cache:'no-store',credentials:'same-origin'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.erro||'HTTP '+r.status);return d;}
function hoje(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
async function atualizar(){
 $('atualizar').disabled=true;$('aviso').className='dash-aviso';$('aviso').textContent='Atualizando indicadores…';
 const resultados=await Promise.allSettled([ler('/api/admin/palestras'),ler('/api/admin/agenda'),ler('/api/admin/locais')]);
 const [p,a,l]=resultados.map(r=>r.status==='fulfilled'?r.value:null);
 const falhas=resultados.map((r,i)=>r.status==='rejected'?['Palestras','Agenda','Locais'][i]+': '+r.reason.message:null).filter(Boolean);
 if(p&&Array.isArray(p.dados?.palestras)){
   const ps=p.dados.palestras,total=ps.length,comVideo=ps.filter(x=>!!x.youtubeId).length,comAudio=ps.filter(x=>!!x.audio).length,comPdf=ps.filter(x=>!!x.pdf).length;
   $('kPalestras').textContent=fmt(total);$('kVideos').textContent=fmt(comVideo);$('kAudios').textContent=fmt(comAudio);$('kPdfs').textContent=fmt(comPdf);
   const barras=$('integridade');barras.replaceChildren();barras.append(barra('Vídeo vinculado',comVideo,total),barra('Áudio vinculado',comAudio,total),barra('PDF vinculado',comPdf,total));
   const pend=[];if(total-comAudio)pend.push(linha('Palestras sem áudio','Campo de MP3 vazio',total-comAudio));if(total-comPdf)pend.push(linha('Palestras sem PDF','Campo de PDF vazio',total-comPdf));if(total-comVideo)pend.push(linha('Palestras sem vídeo','Campo de YouTube vazio',total-comVideo));
   const semCentro=ps.filter(x=>!x.centroId).length;if(semCentro)pend.push(linha('Centro não informado','Associação a um centro opcional',semCentro));
   const semData=ps.filter(x=>!x.data).length;if(semData)pend.push(linha('Data não informada','Campo de data vazio',semData));
   lista('pendencias',pend,'Nenhuma pendência de cadastro identificada.');
   const recentes=ps.filter(x=>x.data).sort((x,y)=>y.data.localeCompare(x.data)).slice(0,5).map(x=>linha(x.titulo,x.pid+' · '+dataBR(x.data)+(x.dataAproximada?' (aprox.)':'')));
   lista('recentes',recentes,'Nenhuma apresentação com data cadastrada.');
 }else{lista('pendencias',[],'Cadastro de palestras indisponível.');lista('recentes',[],'Cadastro de palestras indisponível.');$('integridade').textContent='Dados indisponíveis.';}
 if(a&&Array.isArray(a.agenda)){const futuros=a.agenda.filter(e=>e.data>=hoje()).sort((x,y)=>x.data.localeCompare(y.data)||(x.horario||'').localeCompare(y.horario||''));$('kEventos').textContent=fmt(futuros.length);lista('eventos',futuros.slice(0,5).map(x=>linha(x.titulo,dataBR(x.data)+' · '+(x.horario||'Sem horário')+' · '+(x.local||'Local não informado'))),'Nenhum evento futuro cadastrado.');}else lista('eventos',[],'Agenda indisponível.');
 if(l&&Array.isArray(l.locais))$('kLocais').textContent=fmt(l.locais.length);
 $('aviso').textContent=falhas.length?'Alguns dados não puderam ser carregados: '+falhas.join(' | '):'Dados atualizados a partir dos cadastros administrativos. Os números indicam vínculos cadastrados, não verificações de disponibilidade dos arquivos.';
 $('aviso').className='dash-aviso'+(falhas.length?' erro':'');$('atualizar').disabled=false;
}
$('atualizar').addEventListener('click',atualizar);atualizar();
