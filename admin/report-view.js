'use strict';

// Relatório administrativo: reordena cópias dos indicadores somente no momento de imprimir.
// O dashboard na tela e seus elementos originais permanecem intactos.
function buildAdminPrint(){
 if(!document.body.classList.contains('report-admin'))return;
 document.getElementById('reportPrintRoot')?.remove();
 const content=document.querySelector('.dash-content'),welcome=document.querySelector('.dash-welcome');
 if(!content||!welcome)return;
 const root=document.createElement('div');
 root.id='reportPrintRoot';root.className='report-print-root';
 const header=document.createElement('header');header.className='report-print-heading';
 const title=document.createElement('h1');title.textContent=welcome.querySelector('h1')?.textContent||'Relatório Administrativo';
 const period=document.createElement('p');period.textContent=welcome.querySelector('p')?.textContent||'';
 const note=document.createElement('p');note.className='report-print-note';
 const footer=document.querySelector('.dash-footer')?.cloneNode(true);
 footer?.querySelectorAll('button,.sr-only').forEach(node=>node.remove());
 const source=(footer?.textContent||'').replace(/\s+/g,' ').trim();
 note.textContent=(document.querySelector('.report-meta')?.textContent||'')+(source?' · '+source:'');
 header.append(title,period,note);root.append(header);
 const kpis=content.querySelector('.kpi-strip');
 if(kpis){const copy=kpis.cloneNode(true);copy.classList.add('report-print-kpis');root.append(copy);}
 const charts=document.createElement('section');charts.className='report-print-charts';
 const details=document.createElement('section');details.className='report-print-details';
 for(const widget of content.querySelectorAll('.widget')){
  // Botões de navegação não fazem parte dos indicadores do relatório impresso.
  if(widget.classList.contains('widget-actions'))continue;
  const copy=widget.cloneNode(true);
  if(widget.querySelector('#atividades'))copy.classList.add('report-print-activity');
  const chart=widget.classList.contains('widget-chart')||widget.classList.contains('widget-donut')
   ||widget.classList.contains('widget-countries')||widget.classList.contains('widget-visits-evolution');
  (chart?charts:details).append(copy);
 }
 root.append(charts,details);document.body.append(root);
 document.body.classList.add('report-print-prepared');
}
window.PazRelatorio={
 config(){
  const p=new URLSearchParams(location.search);if(p.get('report')!=='1')return null;
  const mode=p.get('mode'),year=Number(p.get('year')),month=Number(p.get('month')||1),now=new Date();
  if(!['month','year'].includes(mode)||!Number.isInteger(year)||year<2020||year>now.getFullYear()||!Number.isInteger(month)||month<1||month>12||(mode==='month'&&year===now.getFullYear()&&month>now.getMonth()+1))return null;
  return {mode,year,month,autoPrint:p.get('autoprint')==='1'};
 },
 activate(kind,cfg){
  if(!cfg)return;
  document.body.classList.add('report-view');
  if(kind==='administrativo'){
   document.body.classList.add('report-admin');
   window.addEventListener('beforeprint',buildAdminPrint);
   window.addEventListener('afterprint',()=>{
    document.getElementById('reportPrintRoot')?.remove();
    document.body.classList.remove('report-print-prepared');
   });
  }
  const months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const period=cfg.mode==='year'?'Ano de '+cfg.year:months[cfg.month-1]+' de '+cfg.year;
  const name=kind==='palestrante'?'Dashboard do Palestrante':'Dashboard Administrativo';
  document.title='Relatório — '+name+' — '+period+' | Paz que Ilumina';
  const welcome=document.querySelector('.dash-welcome');
  if(welcome){if(kind==='administrativo')welcome.querySelector('h1').textContent='Relatório Administrativo';welcome.querySelector('p').textContent=period+' · Paz que Ilumina';}
  const bar=document.createElement('div');bar.className='report-toolbar';
  const label=document.createElement('strong');label.textContent=name+' · '+period;
  const actions=document.createElement('div'),back=document.createElement('a');back.href='/admin/relatorios.html';back.textContent='Voltar aos relatórios';
  const print=document.createElement('button');print.type='button';print.textContent='Imprimir / Salvar em PDF';print.addEventListener('click',()=>window.print());
  actions.append(back,print);bar.append(label,actions);document.body.prepend(bar);
  const note=document.createElement('p');note.className='report-meta';
  note.textContent='Emitido em '+new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})+' · Indicadores acumulados, atividades recentes, pendências e próximos eventos refletem a situação atual; os demais seguem o período selecionado.';
  const main=document.querySelector('.dash-main'),content=main?.querySelector('.dash-content');if(main&&content)main.insertBefore(note,content);
 },
 maybePrint(cfg){if(cfg?.autoPrint)setTimeout(()=>window.print(),1400);}
};