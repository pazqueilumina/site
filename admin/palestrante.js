'use strict';
const $=id=>document.getElementById(id),nf=n=>Number(n).toLocaleString('pt-BR'),pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?new Date(s+'T12:00:00'):null;
const fmtDate=s=>{const d=date(s);return d?d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}):'Sem data';};
const duration=s=>{const p=String(s||'').split(':').map(Number);if(!p.length||p.some(n=>!Number.isFinite(n)||n<0)||p.length<2||p.length>3)return null;return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1];};
const hm=seconds=>{if(seconds==null)return '—';const m=Math.round(seconds/60),h=Math.floor(m/60);return h?nf(h)+'h '+pad(m%60)+'min':nf(m)+'min';};
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x;};
const set=(id,value)=>$(id).textContent=value;
const empty=(host,msg)=>host.append(el('p',msg,'speaker-empty'));
const clear=id=>{$(id).replaceChildren();return $(id);};
const topicNames={'doutrina':'Doutrina e História','temas':'Reflexões','ultimos-dias':'Últimos Dias de Jesus','evangelho':'Evangelho','parabolas':'Parábolas','ministerio':'Ministério de Jesus'};
let records=[],places=new Map(),error=null,range={kind:'30'},applied={month:new Date().getMonth(),year:new Date().getFullYear(),start:'',end:''};
const today=()=>{const d=new Date();d.setHours(23,59,59,999);return d;};
const midnight=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
function boundaries(){
 const now=today(),k=range.kind;
 if(k==='all')return [new Date(1900,0,1),now];
 if(k==='month')return [new Date(applied.year,applied.month,1),new Date(applied.year,applied.month+1,0,23,59,59,999)];
 if(k==='year')return [new Date(applied.year,0,1),new Date(applied.year,11,31,23,59,59,999)];
 if(k==='custom')return [new Date(applied.start+'T00:00:00'),new Date(applied.end+'T23:59:59.999')];
 const days=Number(k)||30,start=midnight(now);start.setDate(start.getDate()-(days-1));return [start,now];
}
const filtered=()=>{const [a,b]=boundaries();return records.filter(p=>p.when&&p.when>=a&&p.when<=b);};
const seconds=items=>items.reduce((n,p)=>n+(p.seconds||0),0);
const knownSeconds=items=>items.filter(p=>p.seconds!==null);
const total=items=>knownSeconds(items).length?hm(seconds(items)):'—';
const unique=(items,key)=>new Set(items.map(p=>p[key]).filter(Boolean)).size;
function countBy(items,key){const m=new Map();for(const p of items){const k=typeof key==='function'?key(p):p[key];m.set(k,(m.get(k)||0)+1);}return [...m.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0]),'pt-BR'));}
function setNotice(msg){$('avisoTexto').textContent=msg;$('aviso').hidden=false;}
function initFilters(){
 const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
 months.forEach((m,i)=>{const o=new Option(m,String(i));$('mes').add(o);});
 const y=new Date().getFullYear();for(let n=y+1;n>=2015;n--){$('anoMes').add(new Option(String(n),String(n)));$('ano').add(new Option(String(n),String(n)));}
 $('mes').value=String(applied.month);$('anoMes').value=String(y);$('ano').value=String(y);
 const d=new Date();applied.end=iso(d);d.setDate(d.getDate()-29);applied.start=iso(d);
 $('dataInicio').value=applied.start;$('dataFim').value=applied.end;$('dataInicio').max=iso(new Date());$('dataFim').max=iso(new Date());
 $('periodo').addEventListener('change',()=>{range.kind=$('periodo').value;const k=range.kind;$('filterPanel').hidden=!['month','year','custom'].includes(k);$('monthFields').hidden=k!=='month';$('yearFields').hidden=k!=='year';$('customFields').hidden=k!=='custom';set('filterTitle',k==='month'?'Mês específico':k==='year'?'Ano específico':'Período personalizado');$('periodoErro').hidden=true;render();});
 $('aplicarPeriodo').addEventListener('click',()=>{
  const k=range.kind;let err='';
  if(k==='month'){applied.month=Number($('mes').value);applied.year=Number($('anoMes').value);}
  if(k==='year')applied.year=Number($('ano').value);
  if(k==='custom'){const a=$('dataInicio').value,b=$('dataFim').value;if(!a||!b)err='Informe as duas datas.';else if(a>b)err='A data inicial deve ser anterior à final.';else if(b>iso(new Date()))err='A data final não pode ser posterior a hoje.';else{applied.start=a;applied.end=b;}}
  if(err){$('periodoErro').textContent=err;$('periodoErro').hidden=false;return;}
  $('periodoErro').hidden=true;render();
 });
 $('fecharAviso').addEventListener('click',()=>$('aviso').hidden=true);
 $('acervoToggle').addEventListener('click',()=>{const btn=$('acervoToggle'),expanded=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!expanded));$('subAcervo').hidden=expanded;});
 $('atualizar').addEventListener('click',load);
}
function rank(host,entries,limit=5){host.replaceChildren();if(!entries.length){empty(host,'Sem registros identificados neste período.');return;}
 const max=entries[0][1]||1;
 for(const [name,n] of entries.slice(0,limit)){const block=el('div',null,'speaker-rank'),line=el('div',null,'speaker-line');line.append(el('strong',name),el('span',nf(n)+' palestra'+(n===1?'':'s')));const bar=el('div',null,'speaker-meter'),fill=el('span');fill.style.width=(100*n/max)+'%';bar.append(fill);block.append(line,bar);host.append(block);}
}
function chart(id,items,field){
 const host=clear(id),year=range.kind==='year'?applied.year:range.kind==='month'?applied.year:range.kind==='custom'?new Date(applied.end+'T12:00:00').getFullYear():new Date().getFullYear();
 const buckets=Array.from({length:12},(_,i)=>items.filter(p=>p.when&&p.when.getFullYear()===year&&p.when.getMonth()===i));
 const vals=buckets.map(b=>field==='count'?b.length:seconds(b)/3600),max=Math.max(1,...vals);
 const w=660,h=230,L=37,R=12,T=25,B=35,inner=w-L-R,bw=inner/12;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('role','img');svg.setAttribute('aria-label',(field==='count'?'Palestras':'Horas de gravação')+' por mês de '+year);
 const node=(tag,attrs,txt)=>{const x=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs||{}))x.setAttribute(k,String(v));if(txt!=null)x.textContent=txt;svg.append(x);return x;};
 for(let j=0;j<=4;j++){const v=max*j/4,y=T+(h-T-B)*(1-j/4);node('line',{x1:L,y1:y,x2:w-R,y2:y,class:'axis'});node('text',{x:L-7,y:y+4,'text-anchor':'end'},field==='count'?String(Math.round(v)):v.toFixed(1).replace('.',','));}
 vals.forEach((v,i)=>{const height=v/max*(h-T-B),x=L+i*bw+bw*.16,y=h-B-height;const rect=node('rect',{x,y,width:bw*.68,height:Math.max(0,height),rx:4,class:field==='count'?'bar':'bar-alt'});const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]+': '+(field==='count'?nf(v)+' palestras':hm(v*3600));rect.append(title);node('text',{x:x+bw*.34,y:h-13,'text-anchor':'middle'},['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][i]);});
 host.append(svg);host.append(el('p','Ano exibido: '+year+' · Datas aproximadas podem distorcer a distribuição mensal.','widget-subtitle'));
}
function comparison(items){
 const host=clear('comparativo'),now=new Date(),year=range.kind==='month'||range.kind==='year'?applied.year:range.kind==='custom'?new Date(applied.end+'T12:00:00').getFullYear():now.getFullYear(),month=range.kind==='month'?applied.month:range.kind==='custom'?new Date(applied.end+'T12:00:00').getMonth():now.getMonth();
 const a=new Date(year,month,1),b=new Date(year,month+1,1),prev=new Date(year,month-1,1);
 const thisMonth=records.filter(p=>p.when&&p.when>=a&&p.when<b),lastMonth=records.filter(p=>p.when&&p.when>=prev&&p.when<a);
 const diff=thisMonth.length-lastMonth.length,delta=lastMonth.length?((diff/lastMonth.length)*100):null;
 const wrap=el('div',null,'speaker-trend '+(diff>0?'up':diff<0?'down':''));
 wrap.append(el('div',(diff>0?'+':'')+nf(diff),'trend-number'),el('p',nf(thisMonth.length)+' palestras em '+a.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})+'\n'+nf(lastMonth.length)+' no mês anterior'+(delta===null?' · variação % indisponível':' · '+(delta>0?'+':'')+delta.toFixed(1).replace('.',',')+'%')));
 host.append(wrap);
 const d=seconds(thisMonth)-seconds(lastMonth);host.append(el('div','Diferença no tempo gravado: '+(d>0?'+':d<0?'−':'')+hm(Math.abs(d)),'speaker-highlight'));
 if(thisMonth.some(p=>p.approx)||lastMonth.some(p=>p.approx))host.append(el('p','Comparação provisória: existem datas aproximadas.','widget-subtitle'));
}
function annual(){
 const host=clear('anual'),years=[...new Set(records.filter(p=>p.when).map(p=>p.when.getFullYear()))].sort((a,b)=>b-a);
 if(!years.length){empty(host,'Sem datas cadastradas.');return;}
 const table=el('table',null,'speaker-table'),thead=el('thead'),row=el('tr');
 ['Ano','Palestras','Tempo','Centros'].forEach(t=>row.append(el('th',t)));thead.append(row);const tbody=el('tbody');
 for(const y of years){const group=records.filter(p=>p.when?.getFullYear()===y),tr=el('tr');[y,nf(group.length),total(group),nf(unique(group,'centroId'))].forEach(t=>tr.append(el('td',String(t))));tbody.append(tr);}
 table.append(thead,tbody);host.append(table);
}
function highlights(items){
 const host=clear('destaques');if(!items.length){empty(host,'Sem apresentações no período.');return;}
 const topic=countBy(items,p=>topicNames[p.serie]||p.serie||'Sem etiqueta'),centres=countBy(items.filter(p=>p.centroId),p=>places.get(p.centroId)||p.centroId),longest=knownSeconds(items).sort((a,b)=>b.seconds-a.seconds)[0];
 const byMonth=countBy(items,p=>p.data?.slice(0,7)||'');const peak=byMonth[0];
 const lines=[
  ['Tema mais frequente',topic[0]?topic[0][0]+' ('+topic[0][1]+')':'Sem etiqueta'],
  ['Centro mais frequente',centres[0]?centres[0][0]+' ('+centres[0][1]+')':'Centro não informado'],
  ['Mês com mais registros',peak?new Date(peak[0]+'-01T12:00:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'})+' ('+peak[1]+')':'Sem datas'],
  ['Palestra mais longa',longest?longest.titulo+' · '+hm(longest.seconds):'Duração indisponível']
 ];
 for(const [label,value] of lines){const block=el('div',null,'speaker-highlight');block.append(el('strong',label+': '),document.createTextNode(value));host.append(block);}
}
function history(items){
 const host=clear('historico');if(!items.length){const tr=el('tr'),td=el('td','Nenhuma apresentação cadastrada neste período.');td.colSpan=5;tr.append(td);host.append(tr);return;}
 for(const p of [...items].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,120)){
  const tr=el('tr'),td=el('td');td.append(document.createTextNode(fmtDate(p.data)));if(p.approx)td.append(el('div','Data aproximada','approx'));tr.append(td);
  const title=el('td');if(p.youtubeId){const a=el('a',p.titulo);a.href='https://www.youtube.com/watch?v='+encodeURIComponent(p.youtubeId);a.target='_blank';a.rel='noopener noreferrer';title.append(a);}else title.textContent=p.titulo;
  tr.append(title,el('td',places.get(p.centroId)||'Não informado'),el('td',topicNames[p.serie]||p.serie||'Sem etiqueta'),el('td',p.seconds===null?'Não informada':hm(p.seconds)));host.append(tr);
 }
 if(items.length>120){const tr=el('tr'),td=el('td','Exibindo as 120 apresentações mais recentes.');td.colSpan=5;tr.append(td);host.append(tr);}
}
function render(){
 if(error)return;
 const items=filtered();set('kPalestras',nf(items.length));set('kTempo',total(items));set('kMedia',knownSeconds(items).length?hm(seconds(items)/knownSeconds(items).length):'—');set('kCentros',nf(unique(items,'centroId')));set('kTemas',nf(unique(items,'serie')));set('kAprox',nf(items.filter(p=>p.approx).length));
 chart('chartMensal',records,'count');chart('chartHoras',records,'hours');comparison(items);
 rank($('centros'),countBy(items.filter(p=>p.centroId),p=>places.get(p.centroId)||p.centroId));
 const unknown=items.filter(p=>!p.centroId).length;if(unknown)$('centros').append(el('p',nf(unknown)+' registro(s) sem centro informado.','widget-subtitle'));
 rank($('temas'),countBy(items,p=>topicNames[p.serie]||p.serie||'Sem etiqueta'),6);
 annual();highlights(items);history(items);
 set('siteStatus','Acervo conectado');
}
async function load(){
 const button=$('atualizar');if(button.disabled)return;button.disabled=true;button.classList.add('is-loading');set('refreshLabel','Atualizando…');set('refreshFeedback','Atualizando dados do palestrante.');
 try{
  const [p,l]=await Promise.all(['/api/admin/palestras','/api/admin/locais'].map(async url=>{const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}));
  if(!Array.isArray(p?.dados?.palestras)||!Array.isArray(l?.locais))throw Error('Formato de dados inesperado');
  places=new Map(l.locais.map(x=>[x.id,x.nome]));
  records=p.dados.palestras.map(x=>({...x,when:date(x.data),seconds:duration(x.duracao),approx:!!x.dataAproximada}));error=null;render();
  $('aviso').hidden=true;set('lastUpdate',new Date().toLocaleString('pt-BR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}));set('refreshLabel','Atualizado');set('refreshFeedback','Dados atualizados.');
 }catch(e){error=e;setNotice('Não foi possível carregar o acervo: '+e.message);set('siteStatus','Falha na conexão');set('refreshLabel','Falha ao atualizar');set('refreshFeedback','Falha ao atualizar os dados.');}
 finally{button.disabled=false;button.classList.remove('is-loading');setTimeout(()=>{if(!button.disabled)set('refreshLabel','Atualizar');},1800);}
}
initFilters();load();