/* Paz que Ilumina — impressão Administrativa isolada v5.
   A leitura dos dados continua em buildAdminPrint(), sem mudar o Dashboard.
   Esta rotina transfere o resultado para um documento sem CSS legado. */
(function(){
 'use strict';
 const CSS='admin/report-admin-isolated.css?v=admin-isolated-v5';
 const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function standaloneHtml(report){
  const title=escapeHtml(document.title||'Relatório Administrativo | Paz que Ilumina');
  const origin=escapeHtml(new URL(location.protocol==='file:'?'./':'/',location.href).href);
  // Os ícones com <use> precisam das definições SVG originais.
  const defs=[...document.querySelectorAll('svg defs')].map(node=>node.parentElement?.outerHTML||'').join('');
  const svgDefs=defs?`<div hidden aria-hidden="true">${defs}</div>`:'';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1">
   <base href="${origin}"><title>${title}</title>
   <link rel="stylesheet" href="${CSS}"></head>
   <body class="report-view report-admin report-print-prepared preview-mode">
   <nav class="pq-preview-toolbar" aria-label="Ações de impressão">
    <strong>Relatório Administrativo · Prévia A4</strong>
    <span class="pq-toolbar-actions"><a href="/admin/relatorios.html">Voltar aos relatórios</a><button type="button" onclick="window.print()">Imprimir / Salvar em PDF</button></span>
   </nav>
   <p class="pq-preview-help">Para reproduzir as cores: selecione <strong>A4</strong>, <strong>Cor</strong> e <strong>Gráficos de segundo plano</strong> nas configurações de impressão.</p>
   ${svgDefs}${report.outerHTML}
   <script>
    (function(){
      const ready=async()=>{
        await document.fonts.ready;
        await Promise.race([
          Promise.all(Array.from(document.images,im=>im.complete?Promise.resolve():new Promise(resolve=>{im.addEventListener('load',resolve,{once:true});im.addEventListener('error',resolve,{once:true});}))),
          new Promise(resolve=>setTimeout(resolve,1800))
        ]);
        setTimeout(()=>window.print(),300);
      };
      if(document.readyState==='complete')ready();
      else window.addEventListener('load',ready,{once:true});
    })();
   <\/script></body></html>`;
 }
 function paginateLongActivities(root){
  const card=root.querySelector('.pq-activities');
  if(!card)return;
  const rows=[...card.querySelectorAll('.pq-list-item')];
  if(rows.length<=9)return;
  // Acima do volume usual do Dashboard, não permitir que a grade CSS
  // divida o quadro por páginas ou gere uma última página quase vazia.
  const pages=Math.ceil(rows.length/20);
  const perPage=Math.ceil(rows.length/pages);
  const period=root.querySelector('.pq-period')?.textContent||'';
  card.remove();root.classList.add('pq-has-extra-pages');
  for(let pageIndex=0;pageIndex<pages;pageIndex++){
   const group=rows.slice(pageIndex*perPage,(pageIndex+1)*perPage);
   if(!group.length)continue;
   const page=document.createElement('section');page.className='pq-print-page pq-activities-page';
   const heading=document.createElement('header');heading.className='pq-heading pq-heading-secondary';
   const h2=document.createElement('h2');h2.textContent='Atividades recentes'+(pageIndex?' (continuação)':'');
   const p=document.createElement('p');p.className='pq-period';p.textContent=period;
   heading.append(h2,p);page.append(heading);
   const grid=document.createElement('div');grid.className='pq-activities-columns';
   const middle=Math.ceil(group.length/2);
   for(const [columnIndex,part] of [group.slice(0,middle),group.slice(middle)].entries()){
    if(!part.length)continue;
    const panel=document.createElement('section');panel.className='pq-card pq-activities';
    const title=document.createElement('h3');title.className='pq-card-title';
    title.textContent=columnIndex?'Continuação':'Atividades recentes';panel.append(title);
    part.forEach(row=>panel.append(row.cloneNode(true)));
    grid.append(panel);
   }
   page.append(grid);root.append(page);
  }
 }
 function open(auto=false){
  // Abre a aba antes de processar os dados: não perde o gesto do usuário.
  const target=auto?window:(window.open('','_blank')||window);
  try {
   if(typeof buildAdminPrint!=='function')throw Error('Montador de relatório indisponível');
   buildAdminPrint();
   const root=document.getElementById('reportPrintRoot');
   if(!root||!root.querySelector('.pq-kpis'))throw Error('Dados do relatório não carregados');
   paginateLongActivities(root);
   const html=standaloneHtml(root);
   root.remove();
   document.body.classList.remove('report-print-prepared');
   target.document.open();target.document.write(html);target.document.close();
   target.focus();
  } catch(err){
   if(target!==window)target.close();
   console.error('Falha na impressão isolada:',err);
   window.alert('Não foi possível preparar o relatório. Aguarde o carregamento dos indicadores e tente novamente.');
  }
 }
 window.PazAdminStandalonePrint={open};
})();
