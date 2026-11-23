'use strict';
const form=document.getElementById('reportForm'),month=document.getElementById('reportMonth'),year=document.getElementById('reportYear');
const names=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],now=new Date();
names.forEach((name,i)=>{const o=document.createElement('option');o.value=String(i+1);o.textContent=name;month.append(o);});
for(let y=now.getFullYear();y>=2020;y--){const o=document.createElement('option');o.value=String(y);o.textContent=String(y);year.append(o);}
year.value=String(now.getFullYear());month.value=String(now.getMonth()+1);
const mode=()=>form.elements.mode.value;
function sync(){
 const kind=form.elements.dashboard.value;
 const minimo=kind==='administrativo'?2026:kind==='estatisticas'?2024:2020;
 for(const o of year.options)o.disabled=Number(o.value)<minimo;
 if(Number(year.value)<minimo)year.value=String(minimo);
 document.getElementById('monthField').hidden=mode()==='year';month.disabled=mode()==='year';
 const y=Number(year.value),m=Number(month.value);
 for(const o of month.options)o.disabled=y===now.getFullYear()&&Number(o.value)>now.getMonth()+1;
 if(y===now.getFullYear()&&m>now.getMonth()+1)month.value=String(now.getMonth()+1);
 const type=kind==='palestrante'?'Dashboard do Palestrante':
   kind==='estatisticas'?'Estatísticas do acervo':'Dashboard Administrativo';
 document.getElementById('reportInfo').textContent=kind==='estatisticas'
   ?'Inclui indicadores de interação, Top 10, comparação por formato, evolução dos acessos e ranking completo. Os números representam cliques no site, não reproduções concluídas.'
   :'Todos os quadros do dashboard serão incluídos. Indicadores atuais e atividades recentes serão identificados separadamente dos dados do período.';
 document.getElementById('reportFooter').textContent=kind==='estatisticas'
   ?'Formato A4 (paisagem) · Impressão compacta em nova aba · Nenhum dado é alterado.'
   :'Formato A4 (retrato) · A impressão abre em nova aba · Nenhum dado é alterado.';
 const period=mode()==='year'?'Ano de '+year.value:names[Number(month.value)-1]+' de '+year.value;
 document.getElementById('reportSummary').textContent=type+' · '+period;
}
function openReport(autoPrint){
 const kind=form.elements.dashboard.value,params=new URLSearchParams({report:'1',mode:mode(),year:year.value});
 if(mode()==='month')params.set('month',month.value);
 if(autoPrint)params.set('autoprint','1');
 const pagina=kind==='palestrante'?'palestrante.html':kind==='estatisticas'?'estatisticas.html':'dashboard.html';
 window.open('/admin/'+pagina+'?'+params.toString(),'_blank','noopener');
}
form.addEventListener('change',sync);
document.getElementById('reportPreview').addEventListener('click',()=>openReport(false));
form.addEventListener('submit',e=>{e.preventDefault();if(form.reportValidity())openReport(true);});
sync();