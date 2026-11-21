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
let appliedMonth=new Date().getMonth(),appliedYear=new Date().getFullYear();
let appliedCustomStart='',appliedCustomEnd='';
const isMonth=()=>$('periodo').value==='month';
const isCustom=()=>$('periodo').value==='custom';
const days=()=>Number($('periodo').value)||30;
const rangeStart=()=>{if(isCustom())return new Date(appliedCustomStart+'T00:00:00');if(isMonth())return new Date(appliedYear,appliedMonth,1);const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-(days()-1));return d;};
const rangeEnd=()=>{const end=new Date();end.setHours(23,59,59,999);if(isCustom())return new Date(appliedCustomEnd+'T23:59:59.999');if(!isMonth())return end;const monthEnd=new Date(appliedYear,appliedMonth+1,0,23,59,59,999);return monthEnd<end?monthEnd:end;};
const rangeDays=()=>{const start=rangeStart(),end=rangeEnd();if(end<start)return 0;const utc=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());return Math.round((utc(end)-utc(start))/86400000)+1;};
const inRange=s=>{const d=isoToDate(s);return !!d&&d>=rangeStart()&&d<=rangeEnd();};
let current={p:null,a:null,l:null,activities:null};
function notice(msg){$('avisoTexto').textContent=msg;$('aviso').hidden=false;}
async function read(url){const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.erro||'HTTP '+r.status);return data;}
function drawChart(palestras){const host=clear('chartAcervo');if(!palestras){host.append(txt('p','Dados do acervo indisponíveis.','empty-text'));return;}
 const period=rangeDays(),start=rangeStart(),series=[];const buckets=Math.min(Math.max(period,2),14);const total=palestras.length;
 if(!period){host.append(txt("p","O período selecionado ainda não começou.","empty-text"));return;}
 for(let i=0;i<buckets;i++){const date=new Date(start);date.setDate(start.getDate()+Math.round((period-1)*i/(buckets-1)));date.setHours(23,59,59,999);const n=palestras.filter(p=>{const d=isoToDate(p.data);return d&&d<=date;}).length;series.push({date,n});}
 if(!series.length){host.append(txt('p','Não há datas para exibir.','empty-text'));return;}
 const width=Math.max(360,Math.round(host.getBoundingClientRect().width||600)),height=Math.max(170,Math.round(host.getBoundingClientRect().height||178)),L=58,R=16,T=18,B=38;let min=Math.min(...series.map(x=>x.n)),max=Math.max(...series.map(x=>x.n));min=Math.max(0,min-1);max=Math.max(max,min+4);const x=i=>L+(width-L-R)*i/(series.length-1),y=n=>T+(height-T-B)*(max-n)/(max-min);
 const points=series.map((v,i)=>[x(i),y(v.n)]),path=points.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const ns='http://www.w3.org/2000/svg';const root=document.createElementNS(ns,'svg');root.setAttribute('viewBox',`0 0 ${width} ${height}`);root.setAttribute('preserveAspectRatio','xMidYMid meet');root.setAttribute('aria-label','Evolução de '+nf(total)+' apresentações cadastradas');root.setAttribute('role','img');
 const defs=document.createElementNS(ns,'defs'),grad=document.createElementNS(ns,'linearGradient');grad.setAttribute('id','areaFill');grad.setAttribute('x1','0');grad.setAttribute('y1','0');grad.setAttribute('x2','0');grad.setAttribute('y2','1');for(const [offset,opacity] of [['0%','.48'],['100%','.02']]){const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#49a8ff');stop.setAttribute('stop-opacity',opacity);grad.append(stop);}defs.append(grad);root.append(defs);
 const add=(tag,attrs,cls,value)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));if(cls)e.setAttribute('class',cls);if(value!==undefined)e.textContent=value;root.append(e);return e;};
 for(let i=0;i<4;i++){const v=min+(max-min)*i/3,yy=y(v);add('line',{x1:L,x2:width-R,y1:yy,y2:yy},'chart-grid');add('text',{x:L-13,y:yy+4,'text-anchor':'end'},'chart-label',nf(Math.round(v)));}
 const area=path+` L${x(series.length-1).toFixed(1)} ${height-B} L${L} ${height-B} Z`;add('path',{d:area},'chart-area');add('path',{d:path},'chart-line');points.forEach((p,i)=>{if(i===0||i===points.length-1||i%3===0){const circle=add('circle',{cx:p[0],cy:p[1],r:3},'chart-point');const title=document.createElementNS(ns,'title');title.textContent=series[i].date.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'})+': '+nf(series[i].n)+' apresentações';circle.append(title);}});
 [0,Math.floor((buckets-1)/2),buckets-1].forEach(i=>add('text',{x:x(i),y:height-10,'text-anchor':i===0?'start':i===buckets-1?'end':'middle'},'chart-label',series[i].date.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})));
 host.append(root);
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
function render(){set('chartRangeText',isCustom()?'Apresentações acumuladas de '+fmtDate(appliedCustomStart)+' até '+fmtDate(appliedCustomEnd):isMonth()?'Apresentações acumuladas em '+new Date(appliedYear,appliedMonth,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'Apresentações acumuladas no período selecionado');const palestras=Array.isArray(current.p?.dados?.palestras)?current.p.dados.palestras.filter(p=>p.ativo!==false):null,agenda=Array.isArray(current.a?.agenda)?current.a.agenda:null,locais=Array.isArray(current.l?.locais)?current.l.locais:null,shorts=(typeof DADOS!=='undefined'&&Array.isArray(DADOS.shorts))?DADOS.shorts.length:null;
 set('kVideos',shorts===null?'—':nf(shorts));set('sVideos','Vídeos curtos cadastrados');set('kPalestras',palestras?nf(palestras.length):'—');set('kAudios',palestras?nf(palestras.filter(p=>p.audio).length):'—');set('kPdfs',palestras?nf(palestras.filter(p=>p.pdf).length):'—');set('sPalestras',palestras?'+'+nf(palestras.filter(p=>inRange(p.data)).length)+' no período':'Cadastro indisponível');
 drawChart(palestras);renderDonut(palestras);renderRecent(palestras);renderActivities(current.activities?.commits);renderPending(palestras,agenda);renderEvents(agenda);renderSummary(palestras);
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
function initMonthFilter(){
 const now=new Date(),mes=$('mesEspecifico'),ano=$('anoEspecifico');
 const nomes=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
 nomes.forEach((nome,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=nome;mes.append(o);});
 for(let y=now.getFullYear()+1;y>=2015;y--){const o=document.createElement('option');o.value=String(y);o.textContent=String(y);ano.append(o);}
 mes.value=String(now.getMonth());ano.value=String(now.getFullYear());
}
function initCustomFilter(){
 const now=new Date(),start=new Date(now);
 start.setDate(start.getDate()-29);
 const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 appliedCustomStart=iso(start);appliedCustomEnd=iso(now);
 $('dataInicio').value=appliedCustomStart;$('dataFim').value=appliedCustomEnd;
 $('dataInicio').max=todayISO();$('dataFim').max=todayISO();
}
function periodChanged(){
 const month=isMonth(),custom=isCustom();
 $('monthControls').hidden=!month;
 $('customRangePanel').hidden=!custom;
 $('periodoErro').hidden=true;
 if(month){appliedMonth=Number($('mesEspecifico').value);appliedYear=Number($('anoEspecifico').value);}
 render();
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
 render();
}
$('acervoToggle').addEventListener('click',()=>{const expanded=$('acervoToggle').getAttribute('aria-expanded')==='true';$('acervoToggle').setAttribute('aria-expanded',String(!expanded));$('subAcervo').hidden=expanded;});
$('periodo').addEventListener('change',periodChanged);
$('aplicarMes').addEventListener('click',()=>{appliedMonth=Number($('mesEspecifico').value);appliedYear=Number($('anoEspecifico').value);render();});
$('aplicarPeriodo').addEventListener('click',applyCustomPeriod);
$('atualizar').addEventListener('click',update);
$('fecharAviso').addEventListener('click',()=>$('aviso').hidden=true);
initMonthFilter();initCustomFilter();update();
