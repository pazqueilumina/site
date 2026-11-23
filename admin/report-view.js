'use strict';
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