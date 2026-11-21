'use strict';
const $=id=>document.getElementById(id),nf=n=>Number(n).toLocaleString('pt-BR'),pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const date=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?new Date(s+'T12:00:00'):null;
const shortDate=d=>pad(d.getDate())+'/'+pad(d.getMonth()+1)+'/'+String(d.getFullYear()).slice(-2);
const fmtDate=s=>{const d=date(s);return d?shortDate(d):'Sem data';};
const fmtMonthYear=(d,month='long')=>d.toLocaleDateString('pt-BR',{month,year:'numeric'}).replace(/\s+de\s+/gi,' ').replace(/\./g,'');
const duration=s=>{const p=String(s||'').split(':').map(Number);if(!p.length||p.some(n=>!Number.isFinite(n)||n<0)||p.length<2||p.length>3)return null;return p.length===3?p[0]*3600+p[1]*60+p[2]:p[0]*60+p[1];};
const hm=seconds=>{if(seconds==null)return '—';const m=Math.round(seconds/60),h=Math.floor(m/60);return h?nf(h)+'h'+pad(m%60)+'min':nf(m)+'min';};
const chartTime=seconds=>{const m=Math.round(seconds/60),h=Math.floor(m/60);return h?nf(h)+'h'+(m%60?pad(m%60):''):nf(m)+'min';};
const agendaTime=hour=>{const m=/^(\d{2}):(\d{2})$/.exec(hour||'');return m?Number(m[1])+'h'+(m[2]==='00'?'':m[2]+'min'):hour;};
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text!=null)x.textContent=text;if(cls)x.className=cls;return x;};
const set=(id,value)=>$(id).textContent=value;
const empty=(host,msg)=>host.append(el('p',msg,'speaker-empty'));
const clear=id=>{$(id).replaceChildren();return $(id);};
const topicNames={'doutrina':'Doutrina e História','temas':'Reflexões','ultimos-dias':'Últimos Dias de Jesus','evangelho':'Evangelho','parabolas':'Parábolas','ministerio':'Ministério de Jesus'};
function tituloFraseApresentacao(titulo) {
  const nomesProprios = [
    ["doutrina espírita", "Doutrina Espírita"],
    ["espírito santo", "Espírito Santo"],
    ["chico xavier", "Chico Xavier"],
    ["luiz gonzaga", "Luiz Gonzaga"],
    ["pedro leopoldo", "Pedro Leopoldo"],
    ["eurípides barsanulfo", "Eurípides Barsanulfo"],
    ["setembro amarelo", "Setembro Amarelo"],
    ["francisco de assis", "Francisco de Assis"],
    ["jesus", "Jesus"], ["cristo", "Cristo"], ["deus", "Deus"],
    ["consolador", "Consolador"], ["espiritismo", "Espiritismo"],
    ["evangelho", "Evangelho"], ["kardec", "Kardec"],
    ["allan", "Allan"], ["judas", "Judas"], ["lázaro", "Lázaro"],
    ["pedro", "Pedro"], ["zaqueu", "Zaqueu"], ["jerusalém", "Jerusalém"],
    ["getsêmani", "Getsêmani"], ["césar", "César"], ["miriam", "Miriam"],
    ["saulo", "Saulo"], ["tarso", "Tarso"], ["maria", "Maria"],
    ["nazaré", "Nazaré"], ["frança", "França"], ["brasil", "Brasil"],
    ["uberaba", "Uberaba"], ["terra", "Terra"]
  ];
  let texto = String(titulo || "").toLocaleLowerCase("pt-BR");
  texto = texto.replace(/\bd\.\s*c\./g, "d.C.").replace(/\ba\.\s*c\./g, "a.C.");
  texto = texto.replace(/\braio x\b/g, "raio X");
  texto = texto.replace(/\b(?:ii|iii|iv|vi|vii|viii|ix|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx)\b/g,
    numeral => numeral.toUpperCase());
  for (const [nome, grafia] of nomesProprios) {
    texto = texto.replace(new RegExp("(^|[^\\p{L}])(" + nome + ")(?=$|[^\\p{L}])", "giu"),
      (_, antes) => antes + grafia);
  }
  return texto.replace(/(^|[.!?]\s+)([\p{L}])/gu,
    (_, inicio, letra) => inicio + letra.toLocaleUpperCase("pt-BR"));
}
let records=[],agendaEvents=[],places=new Map(),error=null,range={kind:'month'},applied={month:new Date().getMonth(),year:new Date().getFullYear(),start:'',end:''};
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
const hasCentre=p=>!!p.centroId;
const displayPlatform=s=>String(s||'').replace(/you\s*tube/gi,'You Tube').replace(/\b(You Tube|Instagram)\s*\(online\)/gi,'$1');
const centreName=p=>displayPlatform(p.localAgenda||(!p.centroId?'Centro Espírita não informado':p.centroId==='youtube'?'You Tube':places.get(p.centroId)||p.centroId));
function countBy(items,key){const m=new Map();for(const p of items){const k=typeof key==='function'?key(p):p[key];m.set(k,(m.get(k)||0)+1);}return [...m.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0]),'pt-BR'));}
function setNotice(msg){$('avisoTexto').textContent=msg;$('aviso').hidden=false;}
const speakerMonths=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let speakerPickerYear=applied.year;
function speakerPeriodUI(){
 const yearly=range.kind==='year',now=new Date();
 set('speakerPeriodLabel',yearly?String(applied.year):speakerMonths[applied.month]+' de '+applied.year);
 $('speakerModeMonth').classList.toggle('active',!yearly);
 $('speakerModeYear').classList.toggle('active',yearly);
 $('speakerModeMonth').setAttribute('aria-pressed',String(!yearly));
 $('speakerModeYear').setAttribute('aria-pressed',String(yearly));
 $('speakerNext').disabled=yearly?applied.year>=now.getFullYear():applied.year>now.getFullYear()||(applied.year===now.getFullYear()&&applied.month>=now.getMonth());
 $('speakerPickerNext').disabled=speakerPickerYear>=now.getFullYear();
 set('speakerPickerYear',speakerPickerYear);
 const host=clear('speakerPickerMonths');
 speakerMonths.forEach((month,i)=>{
  const btn=el('button',month.slice(0,3),'speaker-picker-month');
  btn.type='button';
  btn.disabled=speakerPickerYear>now.getFullYear()||(speakerPickerYear===now.getFullYear()&&i>now.getMonth());
  if(speakerPickerYear===applied.year&&i===applied.month&&!yearly)btn.classList.add('active');
  btn.addEventListener('click',()=>{applied.year=speakerPickerYear;applied.month=i;range.kind='month';speakerClosePicker();speakerPeriodUI();render();});
  host.append(btn);
 });
}
function speakerClosePicker(){
 $('speakerPeriodPicker').hidden=true;
 $('speakerPeriodLabel').setAttribute('aria-expanded','false');
}
function speakerChangePeriod(step){
 if(range.kind==='year')applied.year+=step;
 else{
  const d=new Date(applied.year,applied.month+step,1);
  applied.year=d.getFullYear();applied.month=d.getMonth();
 }
 speakerPickerYear=applied.year;speakerClosePicker();speakerPeriodUI();render();
}
function initFilters(){
 $('speakerPrev').addEventListener('click',()=>speakerChangePeriod(-1));
 $('speakerNext').addEventListener('click',()=>speakerChangePeriod(1));
 $('speakerModeMonth').addEventListener('click',()=>{range.kind='month';speakerClosePicker();speakerPeriodUI();render();});
 $('speakerModeYear').addEventListener('click',()=>{range.kind='year';speakerClosePicker();speakerPeriodUI();render();});
 $('speakerPeriodLabel').addEventListener('click',()=>{
  const show=$('speakerPeriodPicker').hidden;
  speakerPickerYear=applied.year;
  speakerPeriodUI();
  $('speakerPeriodPicker').hidden=!show;
  $('speakerPeriodLabel').setAttribute('aria-expanded',String(show));
 });
 $('speakerPickerPrev').addEventListener('click',()=>{speakerPickerYear--;speakerPeriodUI();});
 $('speakerPickerNext').addEventListener('click',()=>{if(speakerPickerYear<new Date().getFullYear()){speakerPickerYear++;speakerPeriodUI();}});
 document.addEventListener('click',e=>{if(!e.target.closest('.speaker-period-controls'))speakerClosePicker();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')speakerClosePicker();});
 $('fecharAviso').addEventListener('click',()=>$('aviso').hidden=true);
 $('acervoToggle').addEventListener('click',()=>{const btn=$('acervoToggle'),expanded=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!expanded));$('subAcervo').hidden=expanded;});
 $('atualizar').addEventListener('click',load);
 speakerPeriodUI();
}
const topicLabel=p=>topicNames[p.serie]||p.serie||'Sem tema informado';
function centreRanking(items){
 const host=clear('centros'),known=items.filter(hasCentre),groups=new Map();
 for(const p of known){
  const id=p.centroId;
  if(!groups.has(id))groups.set(id,{id,name:id==='youtube'?'You Tube':places.get(id)||id,n:0,seconds:0,knownTime:0,last:null,approx:false});
  const g=groups.get(id);g.n++;g.seconds+=p.seconds||0;if(p.seconds!==null)g.knownTime++;
  if(p.when&&(!g.last||p.when>g.last)){g.last=p.when;g.approx=p.approx;}
 }
 const ranking=[...groups.values()].sort((a,b)=>b.n-a.n||a.name.localeCompare(b.name,'pt-BR'));
 const details=g=>{
  const meta=el('div',null,'speaker-centre-meta');
  meta.append(el('span',g.knownTime?hm(g.seconds)+' de palestras':'Tempo não informado'));
  if(ranking.length>1)meta.append(el('span',(100*g.n/known.length).toFixed(1).replace('.',',')+'% das palestras com Centro Espírita ou You Tube identificado'));
  if(g.last)meta.append(el('span','Última data: '+fmtDate(iso(g.last))+(g.approx?' (estimada)':'')));
  return meta;
 };
 if(!ranking.length)empty(host,'Ainda não há Centros Espíritas ou You Tube identificados neste período.');
 else{
  const top=ranking[0],feature=el('div',null,'speaker-centre-feature');
  feature.append(el('span',ranking.length===1?'Centro Espírita identificado no período':'Centro Espírita mais visitado','speaker-centre-feature-label'));
  feature.append(el('h3',top.name,'speaker-centre-feature-name'));
  feature.append(el('strong',nf(top.n)+' palestra'+(top.n===1?'':'s'),'speaker-centre-feature-count'));
  feature.append(details(top));host.append(feature);
  if(ranking.length>1){
   host.append(el('h3','Outros Centros Espíritas e You Tube','speaker-centre-rank-title'));
   for(const g of ranking.slice(1,7)){
    const card=el('div',null,'speaker-centre-entry'),heading=el('div',null,'speaker-centre-heading');
    heading.append(el('strong',g.name),el('span',nf(g.n)+' palestra'+(g.n===1?'':'s')));
    const bar=el('div',null,'speaker-meter'),fill=el('span');
    fill.style.width=(100*g.n/top.n)+'%';bar.append(fill);
    card.append(heading,bar,details(g));host.append(card);
   }
  }
 }
 const missing=items.filter(p=>!p.centroId).length;
 if(missing)host.append(el('p',nf(missing)+' palestra'+(missing===1?'':'s')+' sem Centro Espírita informado. A análise considera os Centros Espíritas e o You Tube identificados.','speaker-centre-note'));
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
 const labels=document.createElementNS('http://www.w3.org/2000/svg','svg');
 labels.setAttribute('viewBox','0 0 200 200');labels.setAttribute('class','speaker-donut-labels');
 labels.setAttribute('aria-hidden','true');
 let angle=-90;
 entries.forEach(([,n])=>{
  const sweep=n/total*360,mid=(angle+sweep/2)*Math.PI/180;
  const x=100+Math.cos(mid)*78,y=100+Math.sin(mid)*78;
  const number=document.createElementNS('http://www.w3.org/2000/svg','text');
  number.setAttribute('x',x.toFixed(2));number.setAttribute('y',y.toFixed(2));
  number.setAttribute('text-anchor','middle');number.setAttribute('dominant-baseline','central');
  number.textContent=nf(n);labels.append(number);angle+=sweep;
 });
 chart.append(labels);
 const inner=el('div',null,'speaker-donut-center');
 inner.append(el('strong',nf(total)),el('span','palestras'));chart.append(inner);
 const legend=el('div',null,'speaker-donut-legend');
 entries.forEach(([label,n],i)=>{
  const line=el('div',null,'speaker-donut-legend-row'),dot=el('span',null,'speaker-donut-dot');
  dot.style.backgroundColor=colors[i%colors.length];
  const name=el('span',null,'speaker-donut-topic');name.append(dot,document.createTextNode(label));
  const percentage=el('span',(100*n/total).toFixed(1).replace('.',',')+'%','speaker-donut-percentage');
  line.append(name,percentage);legend.append(line);
 });
 wrap.append(chart,legend);host.append(wrap);
 const top=entries[0];const summary=el('div',null,'speaker-donut-summary');
 summary.append(el('strong',top[0]),document.createTextNode(' é o tema mais frequente, com '+(100*top[1]/total).toFixed(1).replace('.',',')+'% das palestras do período.'));
 host.append(summary);
}

function drawCumulativeChart(host,bins,unit,from,to){
 const w=660,h=230,L=39,R=13,T=46,B=40,inner=w-L-R,plotBottom=h-B;
 const total=bins.reduce((n,b)=>n+b.count,0),step=Math.max(1,Math.ceil(total/4)),max=step*4;
 const x=i=>bins.length===1?L+inner/2:L+inner*i/(bins.length-1);
 const y=n=>T+(plotBottom-T)*(1-n/max);
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('viewBox','0 0 '+w+' '+h);
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label','Evolução acumulada de '+nf(total)+' palestras no período selecionado');
 const defs=document.createElementNS(ns,'defs'),gradient=document.createElementNS(ns,'linearGradient');
 gradient.setAttribute('id','speakerCumulativeFill');
 gradient.setAttribute('x1','0');gradient.setAttribute('y1','0');gradient.setAttribute('x2','0');gradient.setAttribute('y2','1');
 for(const [offset,opacity] of [['0%','.43'],['100%','.025']]){
  const stop=document.createElementNS(ns,'stop');
  stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#49a8ff');stop.setAttribute('stop-opacity',opacity);gradient.append(stop);
 }
 defs.append(gradient);svg.append(defs);
 const node=(tag,attrs={},value)=>{const element=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))element.setAttribute(k,String(v));if(value!=null)element.textContent=value;svg.append(element);return element;};
 if(unit==='year'){
  node('text',{x:L+inner/2,y:18,'text-anchor':'middle',class:'year-label speaker-axis-year count'},bins[0].year===bins[bins.length-1].year?String(bins[0].year):bins[0].year+'–'+bins[bins.length-1].year);
 }else{
  let start=0;
  while(start<bins.length){
   let end=start+1;while(end<bins.length&&bins[end].year===bins[start].year)end++;
   node('text',{x:x((start+end-1)/2),y:18,'text-anchor':'middle',class:'year-label speaker-axis-year count'},String(bins[start].year));
   start=end;
  }
 }
 for(let j=0;j<=4;j++){
  const value=step*j,yy=y(value);
  node('line',{x1:L,y1:yy,x2:w-R,y2:yy,class:'axis'});
  node('text',{x:L-7,y:yy+4,'text-anchor':'end'},String(value));
 }
 let running=0;
 const points=bins.map((b,i)=>{running+=b.count;return {x:x(i),y:y(running),value:running,bin:b};});
 const line=points.map((p,i)=>(i?'L':'M')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');
 const area=line+' L'+points[points.length-1].x.toFixed(1)+' '+plotBottom+' L'+points[0].x.toFixed(1)+' '+plotBottom+' Z';
 node('path',{d:area,class:'speaker-area'});
 node('path',{d:line,class:'speaker-line'});
 const dateSkip=Math.max(1,Math.ceil(bins.length/10)),valueSkip=Math.max(1,Math.ceil(bins.length/12));
 points.forEach((p,i)=>{
  const circle=node('circle',{cx:p.x,cy:p.y,r:3.5,class:'speaker-point'});
  const tooltip=document.createElementNS(ns,'title');
  tooltip.textContent=p.bin.fullLabel+': '+nf(p.value)+' palestras acumuladas';
  circle.append(tooltip);
  if(i%valueSkip===0||i===points.length-1){
   node('text',{x:p.x,y:Math.max(T-8,p.y-10),'text-anchor':'middle',class:'speaker-point-value'},String(p.value));
  }
  if(i%dateSkip===0||i===points.length-1){
   node('text',{x:p.x,y:h-15,'text-anchor':'middle',class:'speaker-axis-date count'},p.bin.label);
  }
 });
 host.append(svg);
 host.append(el('p','Período: '+shortDate(from)+' a '+shortDate(to)+' · Agenda prevalece quando há vínculo confirmado; algumas datas do acervo são aproximadas.','widget-subtitle'));
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
  const label=unit==='day'?pad(begin.getDate())+'/'+pad(begin.getMonth()+1):unit==='month'?begin.toLocaleDateString('pt-BR',{month:'short'}).replace('.',''):String(begin.getFullYear());
  bins.push({label,year:begin.getFullYear(),fullLabel:unit==='day'?shortDate(begin):unit==='month'?fmtMonthYear(begin):label,count:subset.length,seconds:seconds(subset),estimated:subset.some(p=>p.approx),known:knownSeconds(subset).length});
  cursor.setTime(next.getTime());
 }
 if(unit==='day'){for(let i=bins.length-1;i>=0;i--)if(!bins[i].count)bins.splice(i,1);}
 if(!bins.length){empty(host,'Não há palestras nas datas do período selecionado.');return;}
 if(field==='count'){drawCumulativeChart(host,bins,unit,from,to);return;}
 // Escala: contagens inteiras e durações em minutos (sem horas decimais).
 const vals=bins.map(b=>field==='count'?b.count:b.seconds/60);
 const peak=Math.max(0,...vals);
 const countStep=Math.max(1,Math.ceil(peak/4));
 const timeSteps=[30,60,90,120,180,240,300,360,480,600,720,900,1200,1800,2400,3600];
 const timeStep=timeSteps.find(step=>step*4>=peak)||Math.ceil(peak/240)*60;
 const step=field==='count'?countStep:timeStep,max=step*4;
 const timeTick=minutes=>{
  if(minutes===0)return '0';
  const hours=Math.floor(minutes/60),rest=minutes%60;
  return (hours?hours+'h':'')+(rest?rest+'min':'');
 };
 const w=660,h=230,L=39,R=13,T=38,B=40,inner=w-L-R,bw=inner/bins.length;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('role','img');
 svg.setAttribute('aria-label',(field==='count'?'Quantidade de palestras':'Horas de palestras')+' por '+(unit==='day'?'dia':unit==='month'?'mês':'ano')+' no período selecionado');
 const node=(tag,attrs,txt)=>{const x=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs||{}))x.setAttribute(k,String(v));if(txt!=null)x.textContent=txt;svg.append(x);return x;};
 if(unit==='year'){
  node('text',{x:L+inner/2,y:18,'text-anchor':'middle',class:'year-label speaker-axis-year '+(field==='count'?'count':'hours')},bins[0].year===bins[bins.length-1].year?String(bins[0].year):bins[0].year+'–'+bins[bins.length-1].year);
 }else{
  let start=0;
  while(start<bins.length){
   let end=start+1;while(end<bins.length&&bins[end].year===bins[start].year)end++;
   node('text',{x:L+(start+end)*bw/2,y:18,'text-anchor':'middle',class:'year-label speaker-axis-year '+(field==='count'?'count':'hours')},String(bins[start].year));
   start=end;
  }
 }
 for(let j=0;j<=4;j++){
  const v=step*j,y=T+(h-T-B)*(1-j/4);
  node('line',{x1:L,y1:y,x2:w-R,y2:y,class:'axis'});
  node('text',{x:L-7,y:y+4,'text-anchor':'end'},field==='count'?String(v):timeTick(v));
 }
 const skip=unit==='day'?1:Math.max(1,Math.ceil(bins.length/12));
 vals.forEach((v,i)=>{
  const height=v/max*(h-T-B),barWidth=Math.min(42,bw*.64),x=L+i*bw+(bw-barWidth)/2,y=h-B-height;
  const rect=node('rect',{x,y,width:barWidth,height:Math.max(0,height),rx:Math.min(4,barWidth*.15),class:field==='count'?'bar':'bar-alt'});
  const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=bins[i].fullLabel+': '+nf(bins[i].count)+' palestra(s) · '+(bins[i].known?hm(bins[i].seconds):'duração não registrada');rect.append(title);
  if(v>0)node('text',{x:x+barWidth/2,y:Math.max(T-2,y-2),'text-anchor':'middle',class:'speaker-bar-value '+(field==='count'?'count':'hours')},field==='count'?String(bins[i].count):chartTime(bins[i].seconds));
  if(i%skip===0||i===bins.length-1)node('text',{x:x+barWidth/2,y:h-15,'text-anchor':'middle',class:'speaker-axis-date '+(field==='count'?'count':'hours')},bins[i].label);
 });
 host.append(svg);
 const fmt=d=>shortDate(d);
 host.append(el('p','Período: '+fmt(from)+' a '+fmt(to)+' · Agenda prevalece quando há vínculo confirmado; algumas datas do acervo são aproximadas.','widget-subtitle'));
}
function comparison(){
 const k=range.kind,now=today();
 let first,last,prevFirst,prevLast,kind;
 if(k==='month'||k==='all'){
  let year=applied.year,month=applied.month;
  if(k==='all'){
   const latest=records.filter(p=>p.when&&p.when<=now).sort((a,b)=>b.when-a.when)[0];
   const ref=latest?latest.when:now;year=ref.getFullYear();month=ref.getMonth();
  }
  first=new Date(year,month,1);last=new Date(year,month+1,0,23,59,59,999);
  prevFirst=new Date(year,month-1,1);prevLast=new Date(year,month,0,23,59,59,999);kind='month';
 }else if(k==='year'){
  first=new Date(applied.year,0,1);last=new Date(applied.year,11,31,23,59,59,999);
  prevFirst=new Date(applied.year-1,0,1);prevLast=new Date(applied.year-1,11,31,23,59,59,999);kind='year';
 }else{
  [first,last]=boundaries();
  const days=Math.round((midnight(last)-midnight(first))/86400000)+1;
  prevLast=new Date(first.getTime()-1);prevFirst=midnight(first);prevFirst.setDate(prevFirst.getDate()-days);kind='days';
 }
 const current=records.filter(p=>p.when&&p.when>=first&&p.when<=last);
 const previous=records.filter(p=>p.when&&p.when>=prevFirst&&p.when<=prevLast);
 const n=current.length,p=previous.length,diff=n-p,pct=p?100*diff/p:null;
 const secs=seconds(current),prevSecs=seconds(previous),secDiff=secs-prevSecs;
 const timeComparable=p>0&&knownSeconds(previous).length>0&&(n===0||knownSeconds(current).length>0);
 const compactDate=d=>shortDate(d);
 const monthDate=d=>fmtMonthYear(d);
 const periodLabel=(a,b)=>kind==='year'?String(a.getFullYear()):kind==='month'?monthDate(a):compactDate(a)+' a '+compactDate(b);
 const short=(a,b)=>kind==='year'?String(a.getFullYear()):kind==='month'?fmtMonthYear(a,'short'):compactDate(a)+' – '+compactDate(b);
 const currentLabel=periodLabel(first,last),previousLabel=periodLabel(prevFirst,prevLast);
 const signed=value=>value>0?'+':value<0?'−':'';
 const change=value=>signed(value)+nf(Math.abs(value));
 const durationLabel=items=>items.length===0?'0min':total(items);
 set('cmpPeriod',currentLabel+' × '+previousLabel);
 set('cmpPercent',pct===null?'—':signed(pct)+Math.abs(pct).toFixed(1).replace('.',',')+'%');
 set('cmpDeltaCount',p?change(diff)+' palestra'+(Math.abs(diff)===1?'':'s'):'Sem base anterior');
 $('cmpDeltaCount').className='compare-delta-count '+(!p?'neutral':diff<0?'negative':diff>0?'positive':'neutral');
 set('cmpCountNow',nf(n));set('cmpCountPrev',nf(p));
 set('cmpTimeDelta',timeComparable?signed(secDiff)+hm(Math.abs(secDiff)):'—');
 set('cmpTimeNow',durationLabel(current));set('cmpTimePrev',durationLabel(previous));
 $('cmpPercent').className='compare-change '+(pct===null?'neutral':diff<0?'negative':diff>0?'positive':'neutral');
 $('cmpTimeDelta').className='compare-change '+(!timeComparable?'neutral':secDiff<0?'negative':secDiff>0?'positive':'neutral');
 const bars=(prefix,oldValue,newValue,formatter)=>{
  const max=Math.max(oldValue,newValue,1);
  set('cmp'+prefix+'ValPrev',formatter(oldValue));set('cmp'+prefix+'ValNow',formatter(newValue));
  set('cmp'+prefix+'MonthPrev',short(prevFirst,prevLast));set('cmp'+prefix+'MonthNow',short(first,last));
  $('cmp'+prefix+'FillPrev').style.height=(oldValue?Math.max(7,oldValue/max*100):0)+'%';
  $('cmp'+prefix+'FillNow').style.height=(newValue?Math.max(7,newValue/max*100):0)+'%';
  $('cmp'+prefix+'Plot').setAttribute('aria-label',previousLabel+': '+formatter(oldValue)+'; '+currentLabel+': '+formatter(newValue));
 };
 bars('Count',p,n,nf);bars('Time',prevSecs,secs,hm);
 const tone=value=>value<0?'negative':value>0?'positive':'neutral';
 const summaryHost=clear('cmpSummary');
 const summaryLine=(label,period,value)=>{
  const row=el('p',null,'compare-summary-line');
  row.append(el('span',label,'compare-summary-label'),document.createTextNode(' '+period+' — '),el('strong',value,'compare-summary-value'));
  return row;
 };
 summaryHost.append(summaryLine('Período atual:',currentLabel,nf(n)+' palestra'+(n===1?'':'s')+' · '+durationLabel(current)));
 summaryHost.append(summaryLine('Período anterior:',previousLabel,nf(p)+' palestra'+(p===1?'':'s')));
 const variation=el('p',null,'compare-summary-line');
 variation.append(el('span','Variação:','compare-summary-label'),document.createTextNode(' '));
 if(p){
  variation.append(el('strong',change(diff)+' palestra'+(Math.abs(diff)===1?'':'s'),'compare-delta '+tone(diff)));
  variation.append(document.createTextNode(' ('));
  variation.append(el('strong',signed(pct)+Math.abs(pct).toFixed(1).replace('.',',')+'%','compare-delta '+tone(pct)));
  variation.append(document.createTextNode(')'));
 }else variation.append(el('strong','Sem base anterior','compare-delta neutral'));
 variation.append(document.createTextNode(' · '));
 if(timeComparable){
  variation.append(el('strong',signed(secDiff)+hm(Math.abs(secDiff)),'compare-delta '+tone(secDiff)));
  variation.append(document.createTextNode(' de duração'));
 }else variation.append(el('span','Duração sem base de comparação','compare-delta neutral'));
 summaryHost.append(variation);
 const caveats=[];
 if(k==='all')caveats.push('No histórico completo, a comparação utiliza o último mês com palestras e o mês anterior.');
 if(k==='month'&&first<=now&&now<=last)caveats.push('Mês em andamento: comparação parcial com o mês anterior completo.');
 if(k==='year'&&first<=now&&now<=last)caveats.push('Ano em andamento: comparação parcial com o ano anterior completo.');
 if(first>now)caveats.push('O período selecionado ainda não começou.');
 if(!p)caveats.push('Não há palestras no período anterior; a variação percentual não é calculável.');
 if(p&&!timeComparable)caveats.push('Durações insuficientes para comparar o tempo total.');
 const missingDuration=[...current,...previous].filter(x=>x.seconds===null).length;
 if(missingDuration)caveats.push(nf(missingDuration)+' palestra'+(missingDuration===1?' não tem':'s não têm')+' duração informada; o tempo exibido pode ser parcial.');
 const approx=[...current,...previous].filter(x=>x.approx).length;
 if(approx)caveats.push(nf(approx)+' palestra'+(approx===1?' tem':'s têm')+' data estimada; os resultados podem mudar após confirmação.');
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
  for(const [value,label] of [[total(group),'Horas de palestras'],[nf(unique(group.filter(hasCentre),'centroId')),'Centros Espíritas'],[nf(group.filter(p=>p.approx).length),'Datas estimadas']]){
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
 const knownCentres=items.filter(hasCentre),centres=countBy(knownCentres,p=>centreName(p));
 const longest=knownSeconds(items).sort((a,b)=>b.seconds-a.seconds)[0];
 const peak=countBy(items.filter(p=>p.when),p=>p.data.slice(0,7))[0];
 const peakDate=peak?new Date(peak[0]+'-01T12:00:00'):null;
 const peakLabel=peakDate?fmtMonthYear(peakDate):'Sem data informada';
 const cards=[
  {icon:'i-layers',tone:'violet',label:'Tema mais abordado',value:topics.length?nf(topics[0][1]):'—',name:topics.length?topics[0][0]:'Nenhum tema informado',detail:'palestras sobre este assunto'},
  {icon:'i-map-pin',tone:'mint',label:'Centro Espírita mais visitado',value:centres.length?nf(centres[0][1]):'—',name:centres.length?centres[0][0]:'Nenhum Centro Espírita informado',detail:centres.length?'Entre as '+nf(knownCentres.length)+' palestras com Centro Espírita ou You Tube informado':'Cadastre o Centro Espírita ou You Tube'},
  {icon:'i-calendar',tone:'blue',label:'Mês mais ativo',value:peak?nf(peak[1]):'—',name:peakLabel,detail:'palestras neste mês'},
  {icon:'i-clock',tone:'amber',label:'Palestra mais longa',value:longest?hm(longest.seconds):'—',name:longest?tituloFraseApresentacao(longest.titulo):'Duração não informada',detail:'maior duração entre as palestras'}
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
 if(missing)notes.push(nf(missing)+' palestra'+(missing===1?' está':'s estão')+' sem Centro Espírita informado; o ranking de Centros Espíritas é parcial.');
 const approximate=items.filter(p=>p.approx).length;
 if(approximate)notes.push('O mês de maior atividade considera datas estimadas.');
 const monthGroups=new Map();
 for(const p of items.filter(x=>x.when)){const key=p.data.slice(0,7);monthGroups.set(key,(monthGroups.get(key)||0)+(p.seconds||0));}
 const best=[...monthGroups.entries()].sort((a,b)=>b[1]-a[1])[0];
 if(best&&best[1]>0){
  const date=new Date(best[0]+'-01T12:00:00');
  const record=el('div',null,'speaker-hours-record');
  record.append(el('strong','Recorde de horas em um mês'),el('span',fmtMonthYear(date)+' · '+hm(best[1])+' de palestras'));
  host.append(record);
 }
 note.textContent=notes.join(' ');
}
function calendar(){
 const host=clear('calendar'),now=new Date();
 let ref=now;
 if(range.kind==='month')ref=new Date(applied.year,applied.month,1);
 else if(range.kind==='year')ref=new Date(applied.year,applied.year===now.getFullYear()?now.getMonth():11,1);
 else if(range.kind==='custom'){const d=date(applied.end);if(d)ref=d;}
 const year=ref.getFullYear(),month=ref.getMonth(),first=new Date(year,month,1),lastDay=new Date(year,month+1,0).getDate(),todayIso=iso(now);
 const label=fmtMonthYear(first);set('calendarMonth',label.charAt(0).toUpperCase()+label.slice(1));
 const byDay=new Map();
 for(const p of agendaEvents.filter(x=>x.data.startsWith(year+'-'+pad(month+1)+'-'))){
  const d=Number(p.data.slice(-2));if(!byDay.has(d))byDay.set(d,[]);byDay.get(d).push(p);
 }
 set('calendarTotal',nf([...byDay.values()].reduce((n,v)=>n+v.length,0))+' eventos neste mês');
 for(const day of ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'])host.append(el('div',day,'speaker-calendar-weekday'));
 for(let i=0;i<first.getDay();i++)host.append(el('div',null,'speaker-calendar-blank'));
 for(let day=1;day<=lastDay;day++){
  const events=byDay.get(day),dayIso=iso(new Date(year,month,day)),status=dayIso<todayIso?'past':dayIso===todayIso?'today':'future';
  const cell=el('div',null,'speaker-calendar-day'+(events?' has-talks':'')+(events||status==='today'?' status-'+status:''));
  cell.append(el('span',String(day),'speaker-calendar-day-number'));
  if(events){
   for(const p of [...events].sort((a,b)=>a.horario.localeCompare(b.horario)||a.titulo.localeCompare(b.titulo,'pt-BR'))){
    const talk=el('div',null,'speaker-calendar-talk');
    talk.append(el('strong',agendaTime(p.horario),'speaker-calendar-talk-time'));
    talk.append(el('span',displayPlatform(p.local),'speaker-calendar-talk-place'));
    talk.title=agendaTime(p.horario)+' · '+displayPlatform(p.local)+' · '+tituloFraseApresentacao(p.titulo);
    cell.append(talk);
   }
   cell.title=events.length+' evento(s) em '+fmtDate(dayIso);
  }
  host.append(cell);
 }
}
function history(items){
 const host=clear('historico');if(!items.length){const tr=el('tr'),td=el('td','Nenhuma palestra encontrada neste período.');td.colSpan=5;tr.append(td);host.append(tr);return;}
 for(const p of [...items].sort((a,b)=>b.data.localeCompare(a.data)).slice(0,120)){
  const tr=el('tr'),td=el('td');td.append(document.createTextNode(fmtDate(p.data)));if(p.agendaOnly)td.append(el('div','Sem apresentação vinculada','approx'));tr.append(td);
  const title=el('td'),displayTitle=tituloFraseApresentacao(p.titulo);if(p.youtubeId){const a=el('a',displayTitle);a.href='https://www.youtube.com/watch?v='+encodeURIComponent(p.youtubeId);a.target='_blank';a.rel='noopener noreferrer';title.append(a);}else title.textContent=displayTitle;
  tr.append(title,el('td',centreName(p)),el('td',topicNames[p.serie]||p.serie||'Sem etiqueta'),el('td',p.seconds===null?'Não informada':hm(p.seconds)));host.append(tr);
 }
 if(items.length>120){const tr=el('tr'),td=el('td','Exibindo as 120 palestras mais recentes.');td.colSpan=5;tr.append(td);host.append(tr);}
}
function render(){
 if(error)return;
 const items=filtered();set('kPalestras',nf(items.length));set('kTempo',total(items));set('kMedia',knownSeconds(items).length?hm(seconds(items)/knownSeconds(items).length):'—');set('kCentros',nf(unique(items.filter(hasCentre),'centroId')));set('kTemas',nf(unique(items,'serie')));const peak=countBy(items.filter(p=>p.when),p=>p.data.slice(0,7))[0];set('kPeakMonth',peak?fmtMonthYear(new Date(peak[0]+'-01T12:00:00'),'short'):'—');set('kPeakCount',peak?nf(peak[1])+' palestra'+(peak[1]===1?'':'s')+' neste mês':'Sem palestras no período');
 chart('chartMensal',items,'count');chart('chartHoras',items,'hours');comparison();
 centreRanking(items);donut(items);
 annual();highlights(items);calendar();history(items);
 set('siteStatus','Dados atualizados');
}
async function load(){
 const button=$('atualizar');if(button.disabled)return;button.disabled=true;button.classList.add('is-loading');set('refreshLabel','Atualizando…');set('refreshFeedback','Atualizando dados do palestrante.');
 try{
  const [p,l,a]=await Promise.all(['/api/admin/palestras','/api/admin/locais','/api/admin/agenda'].map(async url=>{const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}));
  if(!Array.isArray(p?.dados?.palestras)||!Array.isArray(l?.locais)||!Array.isArray(a?.agenda))throw Error('Formato de dados inesperado');
  places=new Map(l.locais.map(x=>[x.id,x.nome]));
  agendaEvents=a.agenda.filter(x=>date(x.data)&&x.horario&&x.titulo&&x.local).sort((x,y)=>x.data.localeCompare(y.data)||x.horario.localeCompare(y.horario));
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();
  const presentations=p.dados.palestras.filter(p=>p.ativo!==false);
  const used=new Set();
  records=presentations.map(p=>{
   // Apenas um título inequívoco e uma data próxima autorizam vincular o arquivo à Agenda.
   const candidates=agendaEvents.filter(e=>!used.has(e)&&norm(e.titulo)===norm(p.titulo)&&date(p.data)&&Math.abs((date(e.data)-date(p.data))/86400000)<=7&&(!e.localId||!p.centroId||e.localId===p.centroId));
   const match=candidates.length===1?candidates[0]:null;
   if(match)used.add(match);
   return {...p,data:match?match.data:p.data,when:date(match?match.data:p.data),horario:match?match.horario:p.horario,centroId:match?.localId||p.centroId||'',localAgenda:match?match.local:null,seconds:duration(p.duracao),approx:match?false:!!p.dataAproximada,agendaLinked:!!match};
  });
  error=null;render();
  $('aviso').hidden=true;set('lastUpdate',shortDate(new Date())+' '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));set('refreshLabel','Atualizado');set('refreshFeedback','Dados atualizados.');
 }catch(e){error=e;setNotice('Não foi possível carregar as palestras: '+e.message);set('siteStatus','Falha na conexão');set('refreshLabel','Falha ao atualizar');set('refreshFeedback','Falha ao atualizar os dados.');}
 finally{button.disabled=false;button.classList.remove('is-loading');setTimeout(()=>{if(!button.disabled)set('refreshLabel','Atualizar');},1800);}
}
initFilters();load();