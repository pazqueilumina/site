'use strict';

// Relatório administrativo: reordena cópias dos indicadores somente no momento de imprimir.
// O dashboard na tela e seus elementos originais permanecem intactos.
function buildAdminPrint(){
  if(!document.body.classList.contains('report-admin'))return;
  document.getElementById('reportPrintRoot')?.remove();
  const source=document.querySelector('.dash-content');
  const welcome=document.querySelector('.dash-welcome');
  if(!source||!welcome)return;
  const find=(selector,scope=source)=>scope.querySelector(selector);
  const el=(tag,cls='',text)=>{
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const clone=(node)=>{
    if(!node)return null;
    const copy=node.cloneNode(true);
    copy.removeAttribute('id');
    copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
    // A impressão mostra o valor selecionado, não um controle interativo.
    copy.querySelectorAll('select').forEach(n=>{
      const replacement=el('span','pq-selected',n.selectedOptions?.[0]?.textContent||n.value||'—');
      n.replaceWith(replacement);
    });
    copy.querySelectorAll('button').forEach(n=>n.replaceWith(el('span','pq-static-value',n.textContent)));
    copy.querySelectorAll('[hidden],.widget-bottom-link,.widget-bottom-links,.quick-actions,.inscricoes-rodape a').forEach(n=>n.remove());
    return copy;
  };
  const root=el('div','pq-print-report');root.id='reportPrintRoot';
  const page1=el('section','pq-print-page pq-overview');
  const page2=el('section','pq-print-page pq-details');
  const heading=(title,period,secondary=false)=>{
    const h=el('header','pq-heading'+(secondary?' pq-heading-secondary':''));
    h.append(el(secondary?'h2':'h1','',title),el('p','pq-period',period));return h;
  };
  const period=find('p',welcome)?.textContent||'';
  const head=heading(find('h1',welcome)?.textContent||'Relatório Administrativo',period);
  const note=el('p','pq-note',document.querySelector('.report-meta')?.textContent||'');
  head.append(note);page1.append(head);
  const kpis=el('section','pq-kpis');kpis.setAttribute('aria-label','Indicadores principais');
  for(const item of source.querySelectorAll('.kpi-strip .kpi')){
    const box=el('div','pq-kpi');
    const tone=[...item.classList].find(s=>s.startsWith('kpi-'))||'kpi-blue';
    box.dataset.tone=tone.replace('kpi-','');
    box.append(el('span','pq-kpi-label',find('h2',item)?.textContent||''),
      el('strong','pq-kpi-value',find('strong',item)?.textContent||'—'),
      el('span','pq-kpi-sub',find('small',item)?.textContent||''));
    kpis.append(box);
  }
  page1.append(kpis);
  const card=(title,kind)=>{
    const box=el('section','pq-card pq-'+kind);
    box.append(el('h3','pq-card-title',title));return box;
  };
  const fromWidget=(selector,kind,bodyBuilder)=>{
    const widget=find(selector)?.closest('.widget');
    if(!widget)return null;
    const c=card(find('h2',widget)?.textContent?.trim()||'',kind);
    bodyBuilder(c,widget);
    return c;
  };
  const subtitle=(c,w)=>{const p=find('.widget-subtitle',w);if(p)c.append(el('p','pq-subtitle',p.textContent));};
  const chart=(selector,kind)=>fromWidget(selector,kind,(c,w)=>{
    subtitle(c,w);
    const svg=find('svg',find(selector,w));
    if(svg){const frame=el('div','pq-chart-frame');frame.append(clone(svg));c.append(frame);}
    else {const message=find(selector,w);if(message)c.append(el('p','pq-message',message.textContent));}
  });
  const chartAcervo=chart('#chartAcervo','acervo');
  const chartVisitas=chart('#chartVisitas','visitas');
  const chartRow=el('div','pq-graph-row');
  if(chartAcervo)chartRow.append(chartAcervo);
  if(chartVisitas)chartRow.append(chartVisitas);
  page1.append(chartRow);
  const mix=el('div','pq-overview-pair');
  const donut=fromWidget('#donut','donut',(c,w)=>{
    const layout=el('div','pq-donut-layout');
    const ring=el('div','pq-donut-ring');
    const original=find('#donut',w);
    ring.style.backgroundImage=original?.style.backgroundImage||getComputedStyle(original).backgroundImage;
    const center=el('div','pq-donut-center');
    center.append(el('strong','',find('#donutTotal',w)?.textContent||'—'),el('span','','Itens'));
    ring.append(center);layout.append(ring);
    const legend=el('div','pq-donut-legend');
    for(const row of w.querySelectorAll('.donut-row')){
      const r=el('div','pq-donut-item');
      const dot=el('span','pq-dot');dot.style.backgroundColor=getComputedStyle(find('.dot',row)).backgroundColor;
      r.append(dot,el('span','pq-donut-name',find('.donut-name',row)?.textContent||''),el('strong','',find('strong',row)?.textContent||''));
      legend.append(r);
    }
    if(!legend.children.length)legend.append(el('p','pq-message',find('.donut-legend',w)?.textContent||'Dados indisponíveis'));
    layout.append(legend);c.append(layout);
  });
  const countries=fromWidget('#origemVisitas','countries',(c,w)=>{
    const rows=w.querySelectorAll('.country-row');
    if(!rows.length){c.append(el('p','pq-message',find('#origemVisitas',w)?.textContent||'Sem dados'));return;}
    for(const row of rows){
      const line=el('div','pq-country');
      const flag=find('.country-flag',row);
      if(flag){const copy=clone(flag);copy.classList.add('pq-country-flag');line.append(copy);}
      line.append(el('span','pq-country-name',find('.country-name',row)?.textContent||''),
        el('strong','pq-country-number',find('.country-number',row)?.textContent||''));
      c.append(line);
    }
    const foot=find('.country-foot',w);if(foot)c.append(el('p','pq-foot',foot.textContent));
  });
  if(donut)mix.append(donut);
  if(countries)mix.append(countries);
  page1.append(mix);
  const sourceFoot=document.querySelector('.dash-footer')?.textContent?.replace(/Atualizar\s*$/,'').trim()||'';
  if(sourceFoot)page1.append(el('p','pq-source',sourceFoot));
  page2.append(heading('Acompanhamento administrativo',period,true));
  const columns=el('div','pq-detail-columns'),left=el('div','pq-column'),right=el('div','pq-column');
  const makeList=(id,kind)=>fromWidget('#'+id,kind,(c,w)=>{
    const host=find('#'+id,w);
    const entries=host?.children||[];
    if(!entries.length){c.append(el('p','pq-message','Sem registros'));return;}
    for(const item of entries){
      const row=el('div','pq-list-item');
      if(kind==='recent'){
        const media=find('.content-media',item);
        if(media){const thumb=el('span','pq-thumb');thumb.append(clone(media));row.append(thumb);}
        const txt=el('div','pq-list-text');
        const meta=find('.content-meta',item);if(meta)txt.append(clone(meta));
        const title=find('.row-text strong',item);if(title)txt.append(el('strong','pq-item-title',title.textContent));
        const small=find('.row-text small',item);if(small)txt.append(el('small','',small.textContent));
        row.append(txt);
      }else if(kind==='events'){
        const date=find('.event-date',item);if(date)row.append(clone(date));
        const text=el('div','pq-list-text');
        const title=find('.event-text strong',item);if(title)text.append(el('strong','pq-item-title',title.textContent));
        const small=find('.event-text small',item);if(small)text.append(el('small','',small.textContent));
        row.append(text);
        const time=find('.event-time',item);if(time)row.append(el('span','pq-event-time',time.textContent));
      }else{
        const text=el('div','pq-list-text');
        const title=find('.row-text strong',item);if(title)text.append(el('strong','pq-item-title',title.textContent));
        const small=find('.row-text small',item);if(small)text.append(el('small','',small.textContent));
        if(!title)text.append(el('span','',item.textContent.trim()));
        row.append(text);
      }
      c.append(row);
    }
  });
  for(const [id,kind] of [['recentes','recent'],['atividades','activities'],['pendencias','alerts']]){
    const c=makeList(id,kind);if(c)left.append(c);
  }
  const metricGrid=(parent,items,cls='')=>{
    const grid=el('div','pq-metrics '+cls);
    for(const item of items){
      const title=find('span',item)?.textContent||'';
      const val=find('strong,button',item)?.textContent||'—';
      const metric=el('div','pq-metric');
      metric.append(el('span','',title),el('strong','',val));
      const small=find('small',item);if(small)metric.append(el('small','',small.textContent));
      grid.append(metric);
    }
    parent.append(grid);
  };
  const emails=fromWidget('#emailSent','emails',(c,w)=>{
    const year=find('#emailYear',w)?.selectedOptions?.[0]?.textContent||'';
    if(year)c.append(el('p','pq-inline-period','Ano '+year));
    subtitle(c,w);
    metricGrid(c,w.querySelectorAll('.email-monitor-metrics > .email-monitor-metric'));
    const info=find('#emailMonitorInfo',w);if(info)c.append(el('p','pq-foot',info.textContent));
  });
  if(emails)right.append(emails);
  const subscribers=fromWidget('#subNew','subscribers',(c,w)=>{
    const period=find('#subPeriodLabel',w);if(period)c.append(el('p','pq-inline-period',period.textContent));
    metricGrid(c,w.querySelectorAll('.email-monitor-metrics > .email-monitor-metric'));
    const total=find('.inscricoes-acumulado',w);
    if(total){c.append(el('h4','pq-minor-heading',find('h3',total)?.textContent||'Acumulado geral'));
      metricGrid(c,total.querySelectorAll('.inscricoes-total-grid > .email-monitor-metric'),'pq-totals');}
    const info=find('#subInfo',w);if(info)c.append(el('p','pq-foot',info.textContent));
  });
  if(subscribers)right.append(subscribers);
  const events=makeList('eventos','events');if(events)right.append(events);
  const summary=fromWidget('#resumo','summary',(c,w)=>{
    const table=find('.summary-table',w);if(table){const copy=clone(table);copy.className='pq-table';c.append(copy);}
    const foot=find('.summary-foot',w);if(foot)c.append(el('p','pq-foot',foot.textContent));
  });
  if(summary)right.append(summary);
  columns.append(left,right);page2.append(columns);
  root.append(page1,page2);document.body.append(root);
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