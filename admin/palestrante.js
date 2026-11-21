'use strict';
const $=id=>document.getElementById(id),nf=n=>Number(n).toLocaleString('pt-BR'),pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?new Date(s+'T12:00:00'):null;
const fmtDate=s=>{const d=date(s);return d?d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}):'Sem data';};
const duration=s=>{const p=String(s||'').split(':').map(Number);if(!p.length||p.some(n=>!Number.isFinite(n)||n<0)||p.length<2||p.length>3)return null;return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1];};
const hm=seconds=>{if(seconds==null)return '—';const m=Math.round(seconds/60),h=Math.floor(m/60);return h?nf(h)+'h'+pad(m%60)+'min':nf(m)+'min';};
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
const isPhysicalCentre=p=>!!p.centroId&&p.centroId!=='youtube';
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
const topicLabel=p=>topicNames[p.serie]||p.serie||'Sem tema informado';
function centreRanking(items){
 const host=clear('centros'),groups=new Map();
 for(const p of items.filter(isPhysicalCentre)){
  const id=p.centroId;if(!groups.has(id))groups.set(id,{id,name:places.get(id)||id,n:0,seconds:0,last:null,approx:false});
  const g=groups.get(id);g.n++;g.seconds+=p.seconds||0;
  if(p.when&&(!g.last||p.when>g.last)){g.last=p.when;g.approx=p.approx;}
 }
 const ranking=[...groups.values()].sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'pt-BR'));
 if(!ranking.length){empty(host,'Ainda não há centros informados para este período.');}
 else{
  const max=ranking[0].n;
  for(const g of ranking.slice(0,7)){
   const card=el('div',null,'speaker-centre-entry');
   const heading=el('div',null,'speaker-centre-heading');
   heading.append(el('strong',g.name),el('span',nf(g.n)+' palestra'+(g.n===1?'':'s')));
   const bar=el('div',null,'speaker-meter'),fill=el('span');fill.style.width=(100*g.n/max)+'%';bar.append(fill);
   const meta=el('div',null,'speaker-centre-meta');
   const share=items.length?((g.n/items.length)*100).toFixed(1).replace('.',',')+'% do período':'—';
   meta.append(el('span',hm(g.seconds)+' de palestras'),el('span',share));
   if(g.last)meta.append(el('span','Última data: '+fmtDate(iso(g.last))+(g.approx?' (estimada)':'')));
   card.append(heading,bar,meta);host.append(card);
  }
 }
 const missing=items.filter(p=>!p.centroId).length;
 const online=items.filter(p=>p.centroId==='youtube').length;
 if(missing)host.append(el('p',nf(missing)+' palestra'+(missing===1?'':'s')+' sem centro informado. O ranking considera apenas os locais identificados.','speaker-centre-note'));
 if(online)host.append(el('p',nf(online)+' palestra'+(online===1?'':'s')+' marcada'+(online===1?'':'s')+' como YouTube (online), fora do ranking de centros físicos.','speaker-centre-note'));
}
function donut(items){
 const host=clear('temas'),entries=countBy(items,topicLabel);
 if(!entries.length){empty(host,'Nenhuma palestra encontrada neste período.');return;}
 const colors=['#497CE2','#9065D8','#28AD91','#F0AA47','#EA7792','#7F91AB','#5371B3','#A87BC8'];
 const total=items.length,wrap=el('div',null,'speaker-donut-layout'),chart=el('div',null,'speaker-donut-chart');
 let start=0;const stops=[];
 entries.forEach(([label,n],i)=>{const end=start+n/total*100;stops.push(colors[i%colors.length]+' '+start.toFixed(3)+'% '+end.toFixed(3)+'%');start=end;});
 chart.style.background='conic-gradient('+stops.join(',')+')';
 chart.setAttribute('role','img');chart.setAttribute('aria-label',entries.map(([name,n])=>name+': '+n+' palestra'+(n===1?'':'s')+' ('+(n/total*100).toFixed(1)+'%)').join('; '));
 const inner=el('div',null,'speaker-donut-center');
 inner.append(el('strong',nf(total)),el('span','palestras'));chart.append(inner);
 const legend=el('div',null,'speaker-donut-legend');
 entries.forEach(([label,n],i)=>{
  const line=el('div',null,'speaker-donut-legend-row'),dot=el('span',null,'speaker-donut-dot');
  dot.style.backgroundColor=colors[i%colors.length];
  const name=el('span',label,'speaker-donut-topic');
  const value=el('strong',nf(n)+' · '+(100*n/total).toFixed(1).replace('.',',')+'%');
  line.append(dot,name,value);legend.append(line);
 });
 wrap.append(chart,legend);host.append(wrap);
 const top=entries[0];const summary=el('div',null,'speaker-donut-summary');
 summary.append(el('strong',top[0]),document.createTextNode(' é o tema mais frequente, com '+(100*top[1]/total).toFixed(1).replace('.',',')+'% das palestras do período.'));
 host.append(summary);
}
function chart(id,items,field){
 const host=clear(id);let [from,to]=boundaries();
 if(range.kind==='all'){
  const valid=records.filter(p=>p.when).map(p=>p.when).sort((a,b)=>a-b);
  if(!valid.length){empty(host,'Ainda não há palestras com data informada.');return;}
  from=new Date(valid[0].getFullYear(),valid[0].getMonth(),1);
  to=new Date(valid[valid.length-1].getFullYear(),valid[valid.length-1].getMonth()+1,0,23,59,59);
 }
 const span=(to-from)/86400000,unit=span<=45?'day':span<=730?'month':'year';
 const bins=[],cursor=unit==='day'?midnight(from):unit==='month'?new Date(from.getFullYear(),from.getMonth(),1):new Date(from.getFullYear(),0,1);
 const maxBins=unit==='day'?46:unit==='month'?25:50;
 while(cursor<=to&&bins.length<maxBins){
  const begin=new Date(cursor),next=new Date(cursor);
  if(unit==='day')next.setDate(next.getDate()+1);
  else if(unit==='month')next.setMonth(next.getMonth()+1);
  else next.setFullYear(next.getFullYear()+1);
  const subset=items.filter(p=>p.when&&p.when>=begin&&p.when<next);
  const label=unit==='day'?pad(begin.getDate())+'/'+pad(begin.getMonth()+1):unit==='month'?begin.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}).replace('.',''):String(begin.getFullYear());
  bins.push({label,count:subset.length,seconds:seconds(subset)});
  cursor.setTime(next.getTime());
 }
 if(!bins.length){empty(host,'Não há datas para o período selecionado.');return;}
 const vals=bins.map(b=>field==='count'?b.count:b.seconds/3600),max=Math.max(field==='count'?4:1,...vals);
 const w=660,h=230,L=39,R=13,T=25,B=40,inner=w-L-R,bw=inner/bins.length;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('role','img');
 svg.setAttribute('aria-label',(field==='count'?'Quantidade de palestras':'Horas de palestras')+' por '+(unit==='day'?'dia':unit==='month'?'mês':'ano')+' no período selecionado');
 const node=(tag,attrs,txt)=>{const x=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs||{}))x.setAttribute(k,String(v));if(txt!=null)x.textContent=txt;svg.append(x);return x;};
 for(let j=0;j<=4;j++){
  const v=max*j/4,y=T+(h-T-B)*(1-j/4);
  node('line',{x1:L,y1:y,x2:w-R,y2:y,class:'axis'});
  node('text',{x:L-7,y:y+4,'text-anchor':'end'},field==='count'?String(Math.round(v)):v.toFixed(1).replace('.',','));
 }
 const skip=Math.max(1,Math.ceil(bins.length/12));
 vals.forEach((v,i)=>{
  const height=v/max*(h-T-B),x=L+i*bw+bw*.13,y=h-B-height;
  const rect=node('rect',{x,y,width:bw*.74,height:Math.max(0,height),rx:Math.min(4,bw*.15),class:field==='count'?'bar':'bar-alt'});
  const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=bins[i].label+': '+(field==='count'?nf(bins[i].count)+' palestras':hm(bins[i].seconds));rect.append(title);
  if(i%skip===0||i===bins.length-1)node('text',{x:x+bw*.37,y:h-15,'text-anchor':'middle'},bins[i].label);
 });
 host.append(svg);
 const fmt=d=>d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});
 host.append(el('p','Período: '+fmt(from)+' a '+fmt(to)+' · Datas estimadas podem alterar a distribuição.','widget-subtitle'));
}
function comparison(){
 const now=new Date(),k=range.kind;
 let year=now.getFullYear(),month=now.getMonth();
 if(k==='month'){year=applied.year;month=applied.month;}
 else if(k==='year'){year=applied.year;month=year===now.getFullYear()?now.getMonth():11;}
 else if(k==='custom'){const d=date(applied.end);if(d){year=d.getFullYear();month=d.getMonth();}}
 const first=new Date(year,month,1),next=new Date(year,month+1,1),prev=new Date(year,month-1,1);
 const current=records.filter(p=>p.when&&p.when>=first&&p.when<next),previous=records.filter(p=>p.when&&p.when>=prev&&p.when<first);
 const n=current.length,p=previous.length,diff=n-p,pct=p?100*diff/p:null;
 const secs=seconds(current),prevSecs=seconds(previous),secDiff=secs-prevSecs;
 const label=d=>d.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 const short=d=>d.toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.','');
 const signed=(n)=>n>0?'+':n<0?'−':'';
 set('cmpPeriod',label(first)+' × '+label(prev));
 set('cmpPercent',pct===null?'—':signed(pct)+Math.abs(pct).toFixed(1).replace('.',',')+'%');
 set('cmpDeltaCount',signed(diff)+nf(Math.abs(diff))+' palestra'+(Math.abs(diff)===1?'':'s'));
 set('cmpCountNow',nf(n));set('cmpCountPrev',nf(p));
 set('cmpTimeDelta',signed(secDiff)+hm(Math.abs(secDiff)));set('cmpTimeNow',hm(secs));set('cmpTimePrev',hm(prevSecs));
 $('cmpPercent').className='compare-change '+(diff<0?'negative':diff>0?'positive':'neutral');
 $('cmpTimeDelta').className='compare-change '+(secDiff<0?'negative':secDiff>0?'positive':'neutral');
 const bars=(prefix,oldValue,newValue,formatter)=>{
  const max=Math.max(oldValue,newValue,1);
  set('cmp'+prefix+'ValPrev',formatter(oldValue));set('cmp'+prefix+'ValNow',formatter(newValue));
  set('cmp'+prefix+'MonthPrev',short(prev));set('cmp'+prefix+'MonthNow',short(first));
  $('cmp'+prefix+'FillPrev').style.height=(oldValue?Math.max(7,oldValue/max*100):0)+'%';
  $('cmp'+prefix+'FillNow').style.height=(newValue?Math.max(7,newValue/max*100):0)+'%';
  $('cmp'+prefix+'Plot').setAttribute('aria-label',label(prev)+': '+formatter(oldValue)+'; '+label(first)+': '+formatter(newValue));
 };
 bars('Count',p,n,v=>nf(v));bars('Time',prevSecs,secs,v=>hm(v));
 const countText=diff===0?'a mesma quantidade':diff>0?nf(diff)+' a mais':nf(-diff)+' a menos';
 const timeText=secDiff===0?'sem alteração no tempo total':secDiff>0?'um aumento de '+hm(secDiff):'uma redução de '+hm(-secDiff);
 const pctText=pct===null?'':', variação de '+signed(pct)+Math.abs(pct).toFixed(1).replace('.',',')+'%';
 set('cmpSummary',label(first)+' reúne '+nf(n)+' palestra'+(n===1?'':'s')+' de Alexandre — '+countText+' que em '+label(prev)+pctText+'. Foram '+hm(secs)+' de palestras, '+timeText+' em relação ao mês anterior.');
 const caveats=[];
 if(first<=now&&now<next)caveats.push('Mês em andamento: comparação parcial com o mês anterior completo.');
 if(first>now)caveats.push('O mês selecionado ainda não começou.');
 const approx=current.filter(x=>x.approx).length+previous.filter(x=>x.approx).length;
 if(approx)caveats.push(nf(approx)+' palestra'+(approx===1?' tem':'s têm')+' data estimada; os resultados podem mudar após confirmação.');
 if(!p)caveats.push('Sem base para variação percentual: não há palestras no mês anterior.');
 set('cmpCaveat',caveats.join(' '));
}
function annual(){
 const host=clear('anual'),years=[...new Set(records.filter(p=>p.when).map(p=>p.when.getFullYear()))].sort((a,b)=>b-a);
 if(!years.length){empty(host,'Ainda não há palestras com data informada.');return;}
 for(const y of years){
  const group=records.filter(p=>p.when?.getFullYear()===y),prior=records.filter(p=>p.when?.getFullYear()===y-1),card=el('article',null,'speaker-year-card');
  const heading=el('div',null,'speaker-year-heading'),tag=el('span','ANO '+y,'speaker-year-tag'),count=el('strong',nf(group.length)+' palestra'+(group.length===1?'':'s'),'speaker-year-total');
  heading.append(tag,count);card.append(heading);
  const metrics=el('div',null,'speaker-year-metrics');
  for(const [value,label] of [[total(group),'Horas de palestras'],[nf(unique(group.filter(isPhysicalCentre),'centroId')),'Centros visitados'],[nf(group.filter(p=>p.approx).length),'Datas estimadas']]){
   const item=el('div',null,'speaker-year-metric');item.append(el('strong',value),el('span',label));metrics.append(item);
  }
  card.append(metrics);
  const compare=el('div',null,'speaker-year-comparison');
  if(!prior.length){compare.textContent='Sem dados de '+(y-1)+' para comparar o crescimento anual.';}
  else{
   const diff=group.length-prior.length,pct=diff/prior.length*100,timeDiff=seconds(group)-seconds(prior);
   const prefix=n=>n>0?'+':n<0?'−':'';
   compare.append(el('strong',prefix(pct)+Math.abs(pct).toFixed(1).replace('.',',')+'% de palestras em relação a '+(y-1)));
   compare.append(el('span','Variação: '+prefix(diff)+nf(Math.abs(diff))+' palestra'+(Math.abs(diff)===1?'':'s')+' · '+prefix(timeDiff)+hm(Math.abs(timeDiff))+' de duração.'));
  }
  if(y===new Date().getFullYear())compare.append(el('small','Ano ainda em andamento; comparação parcial.'));
  card.append(compare);host.append(card);
 }
}
function highlights(items){
 const host=clear('destaques'),note=$('highlightsNote');note.textContent='';
 if(!items.length){empty(host,'Ainda não há palestras neste período.');return;}
 const topics=countBy(items,p=>topicNames[p.serie]||p.serie||'Sem tema informado');
 const knownCentres=items.filter(isPhysicalCentre),centres=countBy(knownCentres,p=>places.get(p.centroId)||p.centroId);
 const longest=knownSeconds(items).sort((a,b)=>b.seconds-a.seconds)[0];
 const peak=countBy(items.filter(p=>p.when),p=>p.data.slice(0,7))[0];
 const peakDate=peak?new Date(peak[0]+'-01T12:00:00'):null;
 const peakLabel=peakDate?peakDate.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'Sem data informada';
 const cards=[
  {icon:'i-layers',tone:'violet',label:'Tema mais abordado',value:topics.length?nf(topics[0][1]):'—',name:topics.length?topics[0][0]:'Nenhum tema informado',detail:'palestras sobre este assunto'},
  {icon:'i-map-pin',tone:'mint',label:'Centro mais visitado',value:centres.length?nf(centres[0][1]):'—',name:centres.length?centres[0][0]:'Nenhum centro informado',detail:centres.length?'Entre as '+nf(knownCentres.length)+' palestras com local informado':'Cadastre o local das palestras'},
  {icon:'i-calendar',tone:'blue',label:'Mês mais ativo',value:peak?nf(peak[1]):'—',name:peakLabel,detail:'palestras neste mês'},
  {icon:'i-clock',tone:'amber',label:'Palestra mais longa',value:longest?hm(longest.seconds):'—',name:longest?longest.titulo:'Duração não informada',detail:'maior duração entre as palestras'}
 ];
 for(const item of cards){
  const tile=el('article',null,'speaker-highlight-tile tone-'+item.tone);
  const top=el('div',null,'speaker-highlight-top'),ico=el('span',null,'speaker-highlight-icon');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#'+item.icon);svg.append(use);ico.append(svg);
  top.append(ico,el('span',item.label,'speaker-highlight-label'));
  const num=el('strong',item.value,'speaker-highlight-number'),name=el('div',item.name,'speaker-highlight-name');
  name.title=item.name;
  tile.append(top,num,name,el('p',item.detail,'speaker-highlight-detail'));host.append(tile);
 }
 const notes=[];
 const missing=items.filter(p=>!p.centroId).length;
 if(missing)notes.push(nf(missing)+' palestra'+(missing===1?' está':'s estão')+' sem centro informado; o ranking de locais é parcial.');
 const approximate=items.filter(p=>p.approx).length;
 if(approximate)notes.push('O mês de maior atividade considera datas estimadas.');
 const monthGroups=new Map();
 for(const p of items.filter(x=>x.when)){const key=p.data.slice(0,7);monthGroups.set(key,(monthGroups.get(key)||0)+(p.seconds||0));}
 const best=[...monthGroups.entries()].sort((a,b)=>b[1]-a[1])[0];
 if(best&&best[1]>0){
  const date=new Date(best[0]+'-01T12:00:00');
  const record=el('div',null,'speaker-hours-record');
  record.append(el('strong','Recorde de horas em um mês'),el('span',date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})+' · '+hm(best[1])+' de palestras'));
  host.append(record);
 }
 note.textContent=notes.join(' ');
}
function calendar(items){
 const host=clear('calendar'),now=new Date();
 let ref=now;
 if(range.kind==='month')ref=new Date(applied.year,applied.month,1);
 else if(range.kind==='year')ref=new Date(applied.year,applied.year===now.getFullYear()?now.getMonth():11,1);
 else if(range.kind==='custom'){const d=date(applied.end);if(d)ref=d;}
 else if(range.kind==='all'){const last=[...items].sort((a,b)=>(b.data||'').localeCompare(a.data||''))[0];if(last?.when)ref=last.when;}
 const year=ref.getFullYear(),month=ref.getMonth(),first=new Date(year,month,1),lastDay=new Date(year,month+1,0).getDate();
 const label=first.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
 set('calendarMonth',label.charAt(0).toUpperCase()+label.slice(1));
 const byDay=new Map();
 for(const p of items.filter(x=>x.when&&x.when.getFullYear()===year&&x.when.getMonth()===month)){
  const d=p.when.getDate();if(!byDay.has(d))byDay.set(d,{count:0,approx:0});
  const v=byDay.get(d);v.count++;if(p.approx)v.approx++;
 }
 set('calendarTotal',nf([...byDay.values()].reduce((n,v)=>n+v.count,0))+' palestras neste mês');
 for(const day of ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'])host.append(el('div',day,'speaker-calendar-weekday'));
 for(let i=0;i<first.getDay();i++)host.append(el('div',null,'speaker-calendar-blank'));
 for(let day=1;day<=lastDay;day++){
  const item=byDay.get(day),cell=el('div',null,'speaker-calendar-day'+(item?' has-talks':''));
  cell.append(el('span',String(day),'speaker-calendar-day-number'));
  if(item){cell.append(el('strong',nf(item.count)+' palestra'+(item.count===1?'':'s'),'speaker-calendar-day-count'));cell.title=nf(item.count)+' palestra(s) com data informada em '+pad(day)+'/'+pad(month+1)+'/'+year+(item.approx?' ('+item.approx+' com data estimada)':'');}
  host.append(cell);
 }
 const approximated=[...byDay.values()].reduce((n,v)=>n+v.approx,0);
 set('calendarNote',approximated?nf(approximated)+' palestra'+(approximated===1?' tem':'s têm')+' data estimada neste mês. O calendário não confirma o dia real de realização.':'O calendário considera as datas informadas nas palestras selecionadas.');
}
function history(items){
 const host=clear('historico');if(!items.length){const tr=el('tr'),td=el('td','Nenhuma palestra encontrada neste período.');td.colSpan=5;tr.append(td);host.append(tr);return;}
 for(const p of [...items].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,120)){
  const tr=el('tr'),td=el('td');td.append(document.createTextNode(fmtDate(p.data)));if(p.approx)td.append(el('div','Data aproximada','approx'));tr.append(td);
  const title=el('td');if(p.youtubeId){const a=el('a',p.titulo);a.href='https://www.youtube.com/watch?v='+encodeURIComponent(p.youtubeId);a.target='_blank';a.rel='noopener noreferrer';title.append(a);}else title.textContent=p.titulo;
  tr.append(title,el('td',p.centroId==='youtube'?'YouTube (online)':places.get(p.centroId)||'Não informado'),el('td',topicNames[p.serie]||p.serie||'Sem etiqueta'),el('td',p.seconds===null?'Não informada':hm(p.seconds)));host.append(tr);
 }
 if(items.length>120){const tr=el('tr'),td=el('td','Exibindo as 120 palestras mais recentes.');td.colSpan=5;tr.append(td);host.append(tr);}
}
function render(){
 if(error)return;
 const items=filtered();set('kPalestras',nf(items.length));set('kTempo',total(items));set('kMedia',knownSeconds(items).length?hm(seconds(items)/knownSeconds(items).length):'—');set('kCentros',nf(unique(items.filter(isPhysicalCentre),'centroId')));set('kTemas',nf(unique(items,'serie')));const peak=countBy(items.filter(p=>p.when),p=>p.data.slice(0,7))[0];set('kPeakMonth',peak?new Date(peak[0]+'-01T12:00:00').toLocaleDateString('pt-BR',{month:'short',year:'numeric'}).replace('.',''):'—');set('kPeakCount',peak?nf(peak[1])+' palestra'+(peak[1]===1?'':'s')+' neste mês':'Sem palestras no período');
 chart('chartMensal',items,'count');chart('chartHoras',items,'hours');comparison();
 centreRanking(items);donut(items);
 annual();highlights(items);calendar(items);history(items);
 set('siteStatus','Dados atualizados');
}
async function load(){
 const button=$('atualizar');if(button.disabled)return;button.disabled=true;button.classList.add('is-loading');set('refreshLabel','Atualizando…');set('refreshFeedback','Atualizando dados do palestrante.');
 try{
  const [p,l]=await Promise.all(['/api/admin/palestras','/api/admin/locais'].map(async url=>{const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}));
  if(!Array.isArray(p?.dados?.palestras)||!Array.isArray(l?.locais))throw Error('Formato de dados inesperado');
  places=new Map(l.locais.map(x=>[x.id,x.nome]));
  records=p.dados.palestras.map(x=>({...x,when:date(x.data),seconds:duration(x.duracao),approx:!!x.dataAproximada}));error=null;render();
  $('aviso').hidden=true;set('lastUpdate',new Date().toLocaleString('pt-BR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}));set('refreshLabel','Atualizado');set('refreshFeedback','Dados atualizados.');
 }catch(e){error=e;setNotice('Não foi possível carregar as palestras: '+e.message);set('siteStatus','Falha na conexão');set('refreshLabel','Falha ao atualizar');set('refreshFeedback','Falha ao atualizar os dados.');}
 finally{button.disabled=false;button.classList.remove('is-loading');setTimeout(()=>{if(!button.disabled)set('refreshLabel','Atualizar');},1800);}
}
initFilters();load();