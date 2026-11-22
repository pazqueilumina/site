'use strict';
const $=id=>document.getElementById(id);
const nf=n=>Number(n).toLocaleString('pt-BR');
const todayISO=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
const isoToDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?new Date(s+'T12:00:00'):null;
const fmtDate=s=>{const d=isoToDate(s);return d?d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}):'Data não informada';};
const txt=(tag,value,cls)=>{const e=document.createElement(tag);e.textContent=value;if(cls)e.className=cls;return e;};
const svg=(name)=>{const s=document.createElementNS('http://www.w3.org/2000/svg','svg'),u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#i-'+name);s.append(u);return s;};
const clear=(id)=>{$(id).replaceChildren();return $(id);};
const set=(id,value)=>{$(id).textContent=value;};
let appliedMonth=new Date().getMonth(),appliedYear=new Date().getFullYear(),periodMode='month';
let appliedCustomStart='',appliedCustomEnd='';
const isMonth=()=>periodMode==='month';
const isYear=()=>periodMode==='year';
const isCustom=()=>periodMode==='custom';
const days=()=>Number(periodMode)||30;
const rangeStart=()=>{if(isCustom())return new Date(appliedCustomStart+'T00:00:00');if(isMonth())return new Date(appliedYear,appliedMonth,1);if(isYear())return new Date(appliedYear,0,1);const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(days()-1));return d;};
const rangeEnd=()=>{const end=new Date();end.setHours(23,59,59,999);if(isCustom())return new Date(appliedCustomEnd+'T23:59:59.999');if(isYear()){const last=new Date(appliedYear,11,31,23,59,59,999);return last<end?last:end;}if(!isMonth())return end;const monthEnd=new Date(appliedYear,appliedMonth+1,0,23,59,59,999);return monthEnd<end?monthEnd:end;};
const rangeDays=()=>{const start=rangeStart(),end=rangeEnd();if(end<start)return 0;const utc=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());return Math.round((utc(end)-utc(start))/86400000)+1;};
const inRange=s=>{const d=isoToDate(s);return !!d&&d>=rangeStart()&&d<=rangeEnd();};
let current={p:null,a:null,l:null,activities:null,audience:null,visitsTrend:null};
let audienceSerial=0,trendSerial=0;
function notice(msg){$('avisoTexto').textContent=msg;$('aviso').hidden=false;}
async function read(url){const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.erro||'HTTP '+r.status);return data;}
function drawChart(palestras){const host=clear('chartAcervo');if(!palestras){host.append(txt('p','Dados do acervo indisponíveis.','empty-text'));return;}
 const period=rangeDays(),start=rangeStart(),series=[];const buckets=isYear()?12:Math.min(Math.max(period,2),14);const total=palestras.length;
 if(!period){host.append(txt("p","O período selecionado ainda não começou.","empty-text"));return;}
 for(let i=0;i<buckets;i++){const date=isYear()?new Date(appliedYear,i+1,0):new Date(start);if(!isYear())date.setDate(start.getDate()+Math.round((period-1)*i/(buckets-1)));date.setHours(23,59,59,999);const n=palestras.filter(p=>{const d=isoToDate(p.data);return d&&d<=date&&d<=rangeEnd();}).length;series.push({date,n});}
 if(!series.length){host.append(txt('p','Não há datas para exibir.','empty-text'));return;}
 const width=Math.max(360,Math.round(host.getBoundingClientRect().width||600)),height=Math.max(170,Math.round(host.getBoundingClientRect().height||178)),L=58,R=16,T=18,B=38;let min=Math.min(...series.map(x=>x.n)),max=Math.max(...series.map(x=>x.n));min=Math.max(0,min-1);max=Math.max(max,min+4);const x=i=>L+(width-L-R)*i/(series.length-1),y=n=>T+(height-T-B)*(max-n)/(max-min);
 const points=series.map((v,i)=>[x(i),y(v.n)]),path=points.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const ns='http://www.w3.org/2000/svg';const root=document.createElementNS(ns,'svg');root.setAttribute('viewBox',`0 0 ${width} ${height}`);root.setAttribute('preserveAspectRatio','xMidYMid meet');root.setAttribute('aria-label','Evolução de '+nf(total)+' apresentações cadastradas');root.setAttribute('role','img');
 const defs=document.createElementNS(ns,'defs'),grad=document.createElementNS(ns,'linearGradient');grad.setAttribute('id','areaFill');grad.setAttribute('x1','0');grad.setAttribute('y1','0');grad.setAttribute('x2','0');grad.setAttribute('y2','1');for(const [offset,opacity] of [['0%','.48'],['100%','.02']]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#49a8ff');stop.setAttribute('stop-opacity',opacity);grad.append(stop);}defs.append(grad);root.append(defs);
 const add=(tag,attrs,cls,value)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(cls)e.setAttribute('class',cls);if(value!==undefined)e.textContent=value;root.append(e);return e;};
 for(let i=0;i<4;i++){const v=min+(max-min)*i/3,yy=y(v);add('line',{x1:L,x2:width-R,y1:yy,y2:yy},'chart-grid');add('text',{x:L-13,y:yy+4,'text-anchor':'end'},'chart-label',nf(Math.round(v)));}
 const area=path+` L${x(series.length-1).toFixed(1)} ${height-B} L${L} ${height-B} Z`;add('path',{d:area},'chart-area');add('path',{d:path},'chart-line');points.forEach((p,i)=>{if(i===0||i===points.length-1||i%3===0){const circle=add('circle',{cx:p[0],cy:p[1],r:3},'chart-point');const title=document.createElementNS(ns,'title');title.textContent=series[i].date.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})+': '+nf(series[i].n)+' apresentações';circle.append(title);}});
 (isYear()?[0,2,4,6,8,11]:[0,Math.floor((buckets-1)/2),buckets-1]).forEach(i=>add('text',{x:x(i),y:height-10,'text-anchor':i===0?'start':i===buckets-1?'end':'middle'},'chart-label',series[i].date.toLocaleDateString('pt-BR',isYear()?{month:'short'}:{day:'2-digit',month:'short'})));
 host.append(root);
}

function countryName(value){
 const code=String(value||'').trim().toUpperCase();
 if(!code||code==='XX'||code==='UNKNOWN')return 'Não identificado';
 if(/^[A-Z]{2}$/.test(code)){
  try{return new Intl.DisplayNames(['pt-BR'],{type:'region'}).of(code)||code;}catch(_){return code;}
 }
 return String(value);
}
function countryCode(value){
 const raw=String(value||'').trim().toUpperCase();
 const aliases={'BRAZIL':'BR','BRASIL':'BR','UNITED STATES':'US','UNITED STATES OF AMERICA':'US','ESTADOS UNIDOS':'US','PORTUGAL':'PT','GERMANY':'DE','ALEMANHA':'DE'};
 return aliases[raw]||raw;
}
const pctLabel=value=>Number(value).toLocaleString('pt-BR',{maximumFractionDigits:1,minimumFractionDigits:value%1?1:0})+'%';
function countryFlagElement(value,cls){
 const code=countryCode(value);
 if(!/^[A-Z]{2}$/.test(code)||code==='XX'||code==='ZZ')return txt('span','🌐',cls);
 // Imagens reais, sem emojis de bandeiras: no Windows 🇺🇸 pode virar "US".
 const img=document.createElement('img');
 img.className=cls+' country-flag-image';
 img.alt='Bandeira: '+countryName(code);
 img.width=32;img.height=22;
 img.decoding='async';
 img.referrerPolicy='no-referrer';
 // Brasil e Estados Unidos ficam hospedados no próprio site.
 img.src=code==='BR'||code==='US'
  ?'/admin/flag-'+code.toLowerCase()+'.svg'
  :'https://flagcdn.com/w40/'+code.toLowerCase()+'.png';
 img.addEventListener('error',()=>{
  const fallback=txt('span','🌐',cls);
  fallback.title='Bandeira indisponível: '+countryName(code);
  img.replaceWith(fallback);
 },{once:true});
 return img;
}


function renderAudience(){
 const data=current.audience||{status:'carregando'},host=clear('origemVisitas');
 if(data.status==='ok'){
  set('kVisitantes',nf(data.visitas));set('kAcessos',nf(data.visualizacoes));
  set('sVisitantes','Visitas no período (não pessoas únicas)');
  set('sAcessos','Páginas visualizadas no período');
  const countries=Array.isArray(data.paises)?data.paises:[];
  if(!data.visitas&&!data.visualizacoes){
   host.append(txt('p','Nenhuma visita registrada nesse período. Se já houve acessos, verifique se o Web Analytics está habilitado.','countries-message'));return;
  }
  if(!countries.length){host.append(txt('p','Origem geográfica ainda não disponível.','countries-message'));return;}
  const countryTotal=countries.reduce((sum,c)=>sum+Number(c.visitas||0),0);
  const base=Math.max(1,Number(data.visitas)||0,countryTotal);
  const percent=c=>Math.min(100,Math.max(0,100*Number(c.visitas||0)/base));
  const progress=c=>{
   const track=txt('div','','country-track'),fill=txt('span','','country-fill');
   fill.style.width=percent(c).toFixed(1)+'%';
   track.append(fill);return track;
  };
  if(countries.length===1){
   const c=countries[0],card=txt('div','','country-single');
   const top=txt('div','','country-single-top');
   top.append(countryFlagElement(c.pais,'country-single-flag'));
   const identity=txt('div','','country-single-identity');
   identity.append(txt('strong',countryName(c.pais)),txt('span','País identificado'));
   top.append(identity);
   const metrics=txt('div','','country-single-metrics');
   const count=txt('strong',nf(c.visitas),'country-single-count');
   count.append(txt('small',' visitas'));
   metrics.append(count,txt('strong',pctLabel(percent(c)),'country-single-percent'));
   card.append(top,metrics,progress(c));host.append(card);
  }else{
   countries.slice(0,6).forEach(c=>{
    const row=txt('div','','country-row'),head=txt('div','','country-head');
    head.append(countryFlagElement(c.pais,'country-flag'),txt('span',countryName(c.pais),'country-name'),txt('strong',nf(c.visitas)+' · '+pctLabel(percent(c)),'country-number'));
    row.append(head,progress(c));host.append(row);
   });
  }
  host.append(txt('p','Visitas por país','country-foot'));
  return;
 }
 const pending=data.status==='pendente',loading=data.status==='carregando',limited=data.status==='limite_periodo';
 set('kVisitantes','—');set('kAcessos','—');
 set('sVisitantes',loading?'Consultando Cloudflare…':pending?'Aguardando configuração':limited?'Período indisponível':'Consulta indisponível');
 set('sAcessos',loading?'Consultando Cloudflare…':pending?'Aguardando configuração':limited?'Período indisponível':'Consulta indisponível');
 host.append(txt('p',loading?'Consultando estatísticas de audiência…':data.mensagem||data.erro||'Estatísticas indisponíveis.','countries-message'));
}
async function loadAudience(){
 const serial=++audienceSerial,start=rangeStart(),end=rangeEnd();
 if(end<start){current.audience={status:'limite_periodo',mensagem:'O período selecionado ainda não começou.'};renderAudience();return true;}
 const localDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 current.audience={status:'carregando'};renderAudience();
 try{
  const data=await read('/api/admin/audiencia?inicio='+localDate(start)+'&fim='+localDate(end));
  if(serial!==audienceSerial)return true;
  current.audience=data;renderAudience();return true;
 }catch(err){
  if(serial!==audienceSerial)return false;
  current.audience={status:'erro',erro:err.message};renderAudience();return false;
 }
}


function renderVisitsTrend(){
 const host=clear('chartVisitas'),data=current.visitsTrend||{status:'carregando'};
 if(data.status!=='ok'){
  host.append(txt('p',data.status==='carregando'?'Consultando visitas diárias na Cloudflare…':data.mensagem||data.erro||'Evolução das visitas indisponível.','visits-chart-message'));
  return;
 }
 const start=new Date(data.inicio+'T12:00:00Z'),end=new Date(data.fim+'T12:00:00Z');
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<start){
  host.append(txt('p','Período de visitas inválido.','visits-chart-message'));return;
 }
 const byDate=new Map((Array.isArray(data.dias)?data.dias:[]).map(r=>[r.data,Number(r.visitas)||0]));
 const daily=[];
 for(let cursor=new Date(start),i=0;cursor<=end&&i<1500;cursor.setUTCDate(cursor.getUTCDate()+1),i++){
  const key=cursor.toISOString().slice(0,10);
  daily.push({key,visitas:byDate.get(key)||0});
 }
 if(!daily.length){host.append(txt('p','Nenhuma data disponível nesse período.','visits-chart-message'));return;}
 const mode=daily.length>180?'month':daily.length>45?'week':'day';
 const buckets=[];
 const labelDate=key=>key.slice(8,10)+'/'+key.slice(5,7);
 daily.forEach((day,i)=>{
  const groupKey=mode==='month'?day.key.slice(0,7):mode==='week'?String(Math.floor(i/7)):day.key;
  let bucket=buckets[buckets.length-1];
  if(!bucket||bucket.groupKey!==groupKey){bucket={groupKey,from:day.key,to:day.key,visitas:0};buckets.push(bucket);}
  bucket.to=day.key;bucket.visitas+=day.visitas;
 });
 buckets.forEach(b=>{
  b.label=mode==='month'?b.from.slice(5,7)+'/'+b.from.slice(2,4):mode==='week'?labelDate(b.from):labelDate(b.from);
  b.fullLabel=mode==='day'?labelDate(b.from):labelDate(b.from)+'–'+labelDate(b.to);
 });
 set('visitsTrendSubtitle','Visitas '+(mode==='month'?'por mês':mode==='week'?'por semana':'por dia')+' no período selecionado');
 const total=buckets.reduce((n,b)=>n+b.visitas,0);
 if(!total){host.append(txt('p','Nenhuma visita registrada no período selecionado.','visits-chart-message'));return;}
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 const width=Math.max(680,58+buckets.length*(mode==='day'?32:Math.max(40,Math.min(70,680/buckets.length))));
 const height=234,left=44,right=14,top=33,bottom=44,plotBottom=height-bottom,plotHeight=plotBottom-top;
 const max=Math.max(...buckets.map(b=>b.visitas)),step=Math.max(1,Math.ceil(max/4)),maxY=step*4;
 const slot=(width-left-right)/buckets.length,barWidth=Math.max(8,Math.min(32,slot*.65));
 svg.setAttribute('viewBox','0 0 '+width+' '+height);
 svg.setAttribute('role','img');
 svg.setAttribute('aria-label','Evolução de '+nf(total)+' visitas por '+(mode==='month'?'mês':mode==='week'?'semana':'dia'));
 svg.classList.add('visits-chart-svg');
 svg.style.minWidth=width+'px';
 const add=(tag,attrs,textValue)=>{
  const node=document.createElementNS(ns,tag);
  Object.entries(attrs||{}).forEach(([key,val])=>node.setAttribute(key,String(val)));
  if(textValue!==undefined)node.textContent=String(textValue);
  svg.append(node);return node;
 };
 for(let i=0;i<=4;i++){
  const v=step*i,y=plotBottom-v/maxY*plotHeight;
  add('line',{x1:left,y1:y,x2:width-right,y2:y,class:'visits-chart-grid'});
  add('text',{x:left-8,y:y+4,'text-anchor':'end',class:'visits-chart-axis'},nf(v));
 }
 const labelSkip=Math.max(1,Math.ceil(buckets.length/15));
 buckets.forEach((b,i)=>{
  const x=left+i*slot+(slot-barWidth)/2,barH=b.visitas/maxY*plotHeight,y=plotBottom-barH;
  const rect=add('rect',{x,y,width:barWidth,height:Math.max(0,barH),rx:3,class:'visits-chart-bar'});
  const title=document.createElementNS(ns,'title');
  title.textContent=b.fullLabel+': '+nf(b.visitas)+' visitas';rect.append(title);
  if(b.visitas>0)add('text',{x:x+barWidth/2,y:Math.max(17,y-7),'text-anchor':'middle',class:'visits-chart-value'},nf(b.visitas));
  if(i%labelSkip===0||i===buckets.length-1)add('text',{x:x+barWidth/2,y:height-19,'text-anchor':'middle',class:'visits-chart-date'},b.label);
 });
 host.append(svg);
}
async function loadVisitsTrend(){
 const serial=++trendSerial,start=rangeStart(),end=rangeEnd();
 if(end<start){current.visitsTrend={status:'limite_periodo',mensagem:'O período selecionado ainda não começou.'};renderVisitsTrend();return true;}
 const localDate=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 current.visitsTrend={status:'carregando'};renderVisitsTrend();
 try{
  const data=await read('/api/admin/evolucao-visitas?inicio='+localDate(start)+'&fim='+localDate(end));
  if(serial!==trendSerial)return true;
  current.visitsTrend=data;renderVisitsTrend();return true;
 }catch(err){
  if(serial!==trendSerial)return false;
  current.visitsTrend={status:'erro',erro:err.message};renderVisitsTrend();return false;
 }
}

function renderDonut(palestras){const shorts=(typeof DADOS!=='undefined'&&Array.isArray(DADOS.shorts))?DADOS.shorts.length:0;if(!palestras){set('donutTotal','—');return;}
 const rows=[['Vídeos',shorts,'#2f8bff'],['Apresentações',palestras.length,'#35c95d'],['Áudios',palestras.filter(p=>!!p.audio).length,'#9550e7'],['Slides (PDF)',palestras.filter(p=>!!p.pdf).length,'#ffad30']];const total=rows.reduce((n,r)=>n+r[1],0);set('donutTotal',nf(total));let offset=0;const parts=rows.map(r=>{const begin=offset;offset+=r[1]/(total||1)*100;return `${r[2]} ${begin.toFixed(2)}% ${offset.toFixed(2)}%`;});$('donut').style.background='conic-gradient('+parts.join(',')+')';const host=clear('donutLegend');rows.forEach(([name,count,color])=>{const row=txt('div','','donut-row'),dot=txt('span','','dot');dot.style.background=color;row.append(dot,txt('span',name,'donut-name'),txt('strong',nf(count)));host.append(row);});}
function renderRecent(palestras){const host=clear('recentes');if(!palestras){host.append(txt('p','Dados indisponíveis.','empty-text'));return;}const items=palestras.filter(p=>p.data).sort((a,b)=>b.data.localeCompare(a.data)).slice(0,3);if(!items.length){host.append(txt('p','Nenhuma apresentação cadastrada.','empty-text'));return;}items.forEach(p=>{const link=txt('a','','content-row');link.href=p.youtubeId?'https://www.youtube.com/watch?v='+encodeURIComponent(p.youtubeId):'/admin/palestras.html';if(p.youtubeId){if(link.href.startsWith('https:')){link.target='_blank';link.rel='noopener noreferrer';}const img=document.createElement('img');img.src='https://i.ytimg.com/vi/'+p.youtubeId+'/mqdefault.jpg';img.alt='';img.loading='lazy';link.append(img);}else{const box=txt('span','PDF','thumb-fallback');link.append(box);}const wrap=txt('span','','row-text');wrap.append(txt('strong',p.titulo),txt('small',p.pid+' · '+fmtDate(p.data)+(p.dataAproximada?' (aprox.)':'')));link.append(wrap);host.append(link);});}
function renderActivities(items){const host=clear('atividades');if(!Array.isArray(items)||!items.length){host.append(txt('p','Histórico do GitHub indisponível no momento.','empty-text'));return;}items.slice(0,5).forEach(item=>{const row=txt('div','','activity-row'),icon=txt('span','','activity-icon');icon.append(svg('refresh'));const wrap=txt('span','','row-text');wrap.append(txt('strong',item.message||'Atualização do site'),txt('small',item.date?new Date(item.date).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'GitHub'));row.append(icon,wrap);host.append(row);});}
function renderPending(palestras,agenda){const host=clear('pendencias');if(!palestras){host.append(txt('p','Dados indisponíveis.','empty-text'));return;}const rows=[];const missingPdf=palestras.filter(p=>!p.pdf).length,missingAudio=palestras.filter(p=>!p.audio).length,missingVideo=palestras.filter(p=>!p.youtubeId).length;
 if(missingPdf)rows.push([missingPdf+' apresentações sem PDF','warn','/admin/palestras.html']);if(missingAudio)rows.push([missingAudio+' apresentações sem MP3','warn','/admin/palestras.html']);if(missingVideo)rows.push([missingVideo+' apresentações sem vídeo','warn','/admin/palestras.html']);if(agenda){const incomplete=agenda.filter(e=>!e.titulo||!e.local||!e.data||!e.horario).length;if(incomplete)rows.push([incomplete+' eventos com informações incompletas','warn','/admin/agenda.html']);}
 if(!rows.length){host.append(txt('p','Nenhuma ausência de arquivo identificada no cadastro.','empty-text'));return;}
 rows.slice(0,4).forEach(([label,type,url])=>{const link=txt('a','','alert-row '+type);link.href=url;const icon=txt('span','','alert-icon');icon.append(svg('alert'));const wrap=txt('span','','row-text');wrap.append(txt('strong',label));link.append(icon,wrap,txt('span','›','arrow'));host.append(link);});}
function renderEvents(agenda){const host=clear('eventos');if(!agenda){host.append(txt('p','Agenda indisponível.','empty-text'));return;}const upcoming=agenda.filter(e=>e.data>=todayISO()).sort((a,b)=>a.data.localeCompare(b.data)||(a.horario||'').localeCompare(b.horario||'')).slice(0,2);if(!upcoming.length){host.append(txt('p','Nenhum evento futuro cadastrado.','empty-text'));return;}upcoming.forEach(e=>{const row=txt('div','','event-row'),date=txt('span','','event-date');date.append(txt('strong',e.data.slice(8,10)),txt('span',new Date(e.data+'T12:00:00').toLocaleDateString('pt-BR',{month:'short'}).replace('.','').toUpperCase()));const info=txt('span','','event-text');info.append(txt('strong',e.titulo),txt('small',e.local||'Local não informado'));row.append(date,info,txt('span',e.horario||'—','event-time'));host.append(row);});}
function renderSummary(palestras){const host=clear('resumo');if(!palestras){const row=txt('tr','');const td=txt('td','Dados indisponíveis');td.colSpan=3;row.append(td);host.append(row);return;}const shorts=(typeof DADOS!=='undefined'&&Array.isArray(DADOS.shorts))?DADOS.shorts.length:0;const types=[['Vídeos (Shorts)',shorts,null,'#2f8bff'],['Apresentações',palestras.length,palestras.filter(p=>inRange(p.data)).length,'#35c95d'],['Áudios',palestras.filter(p=>p.audio).length,null,'#9550e7'],['Slides (PDF)',palestras.filter(p=>p.pdf).length,null,'#ffad30']];types.forEach(([name,count,newCount,color])=>{const tr=txt('tr',''),td=txt('td',''),dot=txt('span','','type-dot');dot.style.background=color;td.append(dot,document.createTextNode(name));tr.append(td,txt('td',nf(count)),txt('td',newCount===null?'—':(newCount?'+'+nf(newCount):'0'),newCount?'delta':''));host.append(tr);});}
function render(){set('chartRangeText',isCustom()?'Apresentações acumuladas de '+fmtDate(appliedCustomStart)+' até '+fmtDate(appliedCustomEnd):isMonth()?'Apresentações acumuladas em '+new Date(appliedYear,appliedMonth,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):isYear()?'Apresentações acumuladas em '+appliedYear:'Apresentações acumuladas no período selecionado');const palestras=Array.isArray(current.p?.dados?.palestras)?current.p.dados.palestras.filter(p=>p.ativo!==false):null,agenda=Array.isArray(current.a?.agenda)?current.a.agenda:null,locais=Array.isArray(current.l?.locais)?current.l.locais:null,shorts=(typeof DADOS!=='undefined'&&Array.isArray(DADOS.shorts))?DADOS.shorts.length:null;
 set('kVideos',shorts===null?'—':nf(shorts));set('sVideos','Vídeos curtos cadastrados');set('kPalestras',palestras?nf(palestras.length):'—');set('kAudios',palestras?nf(palestras.filter(p=>p.audio).length):'—');set('kPdfs',palestras?nf(palestras.filter(p=>p.pdf).length):'—');set('sPalestras',palestras?'+'+nf(palestras.filter(p=>inRange(p.data)).length)+' no período':'Cadastro indisponível');
 drawChart(palestras);renderAudience();renderVisitsTrend();renderDonut(palestras);renderRecent(palestras);renderActivities(current.activities?.commits);renderPending(palestras,agenda);renderEvents(agenda);renderSummary(palestras);
 set('siteStatus',palestras&&agenda?'Dados conectados':'Verificar conexão');
}
let refreshTimer=null;
function refreshState(state){
 const button=$('atualizar'),use=$('refreshIcon').querySelector('use');
 button.classList.toggle('is-loading',state==='loading');
 button.classList.toggle('is-success',state==='success');
 button.classList.toggle('is-error',state==='error');
 use.setAttribute('href',state==='success'?'#i-check':'#i-refresh');
 set('refreshLabel',state==='loading'?'Atualizando…':state==='success'?'Atualizado':state==='error'?'Atualização parcial':'Atualizar');
 set('refreshFeedback',state==='loading'?'Atualizando dados do dashboard.':state==='success'?'Dados atualizados com sucesso.':state==='error'?'Alguns dados não puderam ser atualizados.':'');
}
async function update(){
 const button=$('atualizar');if(button.disabled)return;
 if(refreshTimer){clearTimeout(refreshTimer);refreshTimer=null;}
 button.disabled=true;refreshState('loading');$('dashMainContent').classList.add('is-updating');
 const urls=['/api/admin/palestras','/api/admin/agenda','/api/admin/locais','/api/admin/atividade'];
 try{
  const results=await Promise.allSettled(urls.map(read));
  ['p','a','l','activities'].forEach((key,i)=>{current[key]=results[i].status==='fulfilled'?results[i].value:null;});
  const errors=results.map((r,i)=>r.status==='rejected'?['Acervo','Agenda','Locais','Atividades'][i]+': '+r.reason.message:null).filter(Boolean);
  render();
  const [audienceOk,trendOk]=await Promise.all([loadAudience(),loadVisitsTrend()]);
  if(!audienceOk)errors.push('Audiência: '+(current.audience?.erro||'consulta indisponível'));
  if(!trendOk)errors.push('Evolução das visitas: '+(current.visitsTrend?.erro||'consulta indisponível'));
  if(errors.length){notice('Alguns dados não foram carregados: '+errors.join(' · '));refreshState('error');}
  else{
   $('aviso').hidden=true;
   set('lastUpdate',new Date().toLocaleString('pt-BR',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}));
   refreshState('success');
   $('dashMainContent').classList.add('is-fresh');
  }
 }catch(err){notice('Não foi possível atualizar o painel: '+err.message);refreshState('error');}
 finally{
  button.disabled=false;$('dashMainContent').classList.remove('is-updating');
  refreshTimer=setTimeout(()=>{refreshState('idle');$('dashMainContent').classList.remove('is-fresh');refreshTimer=null;},2400);
 }
}
const adminMonths=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let adminPickerYear=appliedYear;
function adminPeriodUI(){
 const monthly=isMonth(),yearly=isYear(),regular=monthly||yearly,now=new Date();
 const labels={'7':'Últimos 7 dias','30':'Últimos 30 dias','90':'Últimos 90 dias','365':'Últimos 12 meses','custom':'Personalizado'};
 set('adminPeriodLabel',yearly?String(appliedYear):monthly?adminMonths[appliedMonth]+' de '+appliedYear:labels[periodMode]||'Escolher período');
 for(const [id,active] of [['adminModeMonth',monthly],['adminModeYear',yearly]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',String(active));}
 $('adminPrev').disabled=!regular;
 $('adminNext').disabled=!regular||(yearly?appliedYear>=now.getFullYear():appliedYear>now.getFullYear()||(appliedYear===now.getFullYear()&&appliedMonth>=now.getMonth()));
 $('adminPickerNext').disabled=adminPickerYear>=now.getFullYear();
 set('adminPickerYear',adminPickerYear);
 const host=clear('adminPickerMonths');
 adminMonths.forEach((month,i)=>{
  const btn=txt('button',month.slice(0,3),'admin-picker-month');btn.type='button';
  btn.disabled=adminPickerYear>now.getFullYear()||(adminPickerYear===now.getFullYear()&&i>now.getMonth());
  if(adminPickerYear===appliedYear&&i===appliedMonth&&monthly)btn.classList.add('active');
  btn.addEventListener('click',()=>{appliedYear=adminPickerYear;appliedMonth=i;adminSelectMode('month');});host.append(btn);
 });
 $('periodo').value=regular?'':periodMode;
 $('customRangePanel').hidden=!isCustom();
}
function adminClosePicker(){$('adminPeriodPicker').hidden=true;$('adminPeriodLabel').setAttribute('aria-expanded','false');}
function adminRefreshPeriod(){render();loadAudience();loadVisitsTrend();}
function adminSelectMode(mode){periodMode=mode;adminPickerYear=appliedYear;adminClosePicker();$('periodoErro').hidden=true;adminPeriodUI();adminRefreshPeriod();}
function adminChangePeriod(step){
 if(isYear())appliedYear+=step;
 else if(isMonth()){const d=new Date(appliedYear,appliedMonth+step,1);appliedYear=d.getFullYear();appliedMonth=d.getMonth();}
 adminSelectMode(periodMode);
}
function initPeriodControls(){
 $('adminPrev').addEventListener('click',()=>adminChangePeriod(-1));
 $('adminNext').addEventListener('click',()=>adminChangePeriod(1));
 $('adminModeMonth').addEventListener('click',()=>adminSelectMode('month'));
 $('adminModeYear').addEventListener('click',()=>adminSelectMode('year'));
 $('adminPeriodLabel').addEventListener('click',()=>{const show=$('adminPeriodPicker').hidden;adminPickerYear=appliedYear;adminPeriodUI();$('adminPeriodPicker').hidden=!show;$('adminPeriodLabel').setAttribute('aria-expanded',String(show));});
 $('adminPickerPrev').addEventListener('click',()=>{adminPickerYear--;adminPeriodUI();});
 $('adminPickerNext').addEventListener('click',()=>{if(adminPickerYear<new Date().getFullYear()){adminPickerYear++;adminPeriodUI();}});
 $('periodo').addEventListener('change',()=>{if(!$('periodo').value)return;periodMode=$('periodo').value;adminClosePicker();adminPeriodUI();adminRefreshPeriod();});
 document.addEventListener('click',e=>{if(!e.target.closest('.admin-period-controls'))adminClosePicker();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')adminClosePicker();});
 adminPeriodUI();
}
function initCustomFilter(){
 const now=new Date(),start=new Date(now);
 start.setDate(start.getDate()-29);
 const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 appliedCustomStart=iso(start);appliedCustomEnd=iso(now);
 $('dataInicio').value=appliedCustomStart;$('dataFim').value=appliedCustomEnd;
 $('dataInicio').max=todayISO();$('dataFim').max=todayISO();
}
function applyCustomPeriod(){
 const start=$('dataInicio').value,end=$('dataFim').value,error=$('periodoErro');
 let message='';
 if(!start||!end)message='Informe as duas datas.';
 else if(start>end)message='A data inicial deve ser anterior ou igual à data final.';
 else if(end>todayISO())message='A data final não pode ser posterior a hoje.';
 if(message){error.textContent=message;error.hidden=false;return;}
 error.hidden=true;
 appliedCustomStart=start;appliedCustomEnd=end;
 render();loadAudience();loadVisitsTrend();
}
$('acervoToggle').addEventListener('click',()=>{const expanded=$('acervoToggle').getAttribute('aria-expanded')==='true';$('acervoToggle').setAttribute('aria-expanded',String(!expanded));$('subAcervo').hidden=expanded;});
$('aplicarPeriodo').addEventListener('click',applyCustomPeriod);
$('atualizar').addEventListener('click',update);
$('fecharAviso').addEventListener('click',()=>$('aviso').hidden=true);
initCustomFilter();initPeriodControls();update();
