'use strict';
const $ = id => document.getElementById(id);
const tipos = ['video', 'audio', 'pdf', 'short'];
const nomes = { video: 'Vídeos', audio: 'Áudios', pdf: 'PDFs', short: 'Shorts' };
const cores = { video: '#3679ec', audio: '#16a17a', pdf: '#e59a2c', short: '#8b5ce2' };
const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const agora = new Date();
const reportQuery = new URLSearchParams(location.search);
const reportRequested = reportQuery.get('report') === '1';
function lerConfigRelatorio() {
  if (!reportRequested) return null;
  const mode = reportQuery.get('mode'), anoTexto = reportQuery.get('year'), mesTexto = reportQuery.get('month');
  const ano = Number(anoTexto), mes = mode === 'month' ? Number(mesTexto) : 1;
  const valido = ['month','year'].includes(mode) && /^\d{4}$/.test(anoTexto || '') &&
    Number.isInteger(ano) && ano >= 2024 && ano <= agora.getFullYear() &&
    Number.isInteger(mes) && mes >= 1 && mes <= 12 &&
    (mode !== 'month' || (ano < agora.getFullYear() || mes <= agora.getMonth() + 1));
  return valido ? { mode, ano, mes, autoPrint: reportQuery.get('autoprint') === '1' }
    : { erro: 'Período inválido. Volte à opção Relatórios e selecione outro período.' };
}
const configRelatorio = lerConfigRelatorio();
const estado = { ano: configRelatorio && !configRelatorio.erro ? configRelatorio.ano : agora.getFullYear(),
  mes: configRelatorio && !configRelatorio.erro ? configRelatorio.mes : agora.getMonth() + 1,
  modo: configRelatorio && configRelatorio.mode === 'year' ? 'ano' : 'mes',
  tipo: 'todos', busca: '', resposta: null, catalogo: null, requisicao: 0 };
const fmt = n => Number(n || 0).toLocaleString('pt-BR');
const criar = (tag, texto, classe) => {
  const el = document.createElement(tag);
  if (texto !== undefined) el.textContent = texto;
  if (classe) el.className = classe;
  return el;
};
const limpar = id => { const el = $(id); el.replaceChildren(); return el; };
function iniciarMenu() {
  for (const [botao, painel] of [['dashboardToggle','subDashboard'],['gestaoToggle','subGestao'],['acervoToggle','subAcervo']]) {
    if(window.matchMedia('(max-width: 760px)').matches){$(botao).setAttribute('aria-expanded','false');$(painel).hidden=true;}
    $(botao).addEventListener('click', () => {
      const aberto = $(botao).getAttribute('aria-expanded') === 'true';
      $(botao).setAttribute('aria-expanded', String(!aberto));
      $(painel).hidden = aberto;
    });
  }
}
function atualizarPeriodo() {
  $('adminPeriodLabel').textContent=estado.modo==='ano'?String(estado.ano):meses[estado.mes-1]+' de '+estado.ano;
  for (const [id,ativo] of [['statModeMonth',estado.modo === 'mes'],['statModeYear',estado.modo === 'ano']]) {
    $(id).classList.toggle('active', ativo);
    $(id).setAttribute('aria-pressed', String(ativo));
  }
  $('statPrev').disabled = estado.ano <= 2024 && (estado.modo === 'ano' || estado.mes === 1);
  $('statNext').disabled = estado.modo === 'ano'
    ? estado.ano >= agora.getFullYear()
    : estado.ano > agora.getFullYear() || (estado.ano === agora.getFullYear() && estado.mes >= agora.getMonth() + 1);
  $('periodoExibido').textContent = estado.modo === 'ano' ? 'Ano de ' + estado.ano : meses[estado.mes - 1] + ' de ' + estado.ano;
}
function mudarPeriodo(passo) {
  if (estado.modo === 'ano') estado.ano += passo;
  else {
    const d = new Date(estado.ano, estado.mes - 1 + passo, 1);
    estado.ano = d.getFullYear(); estado.mes = d.getMonth() + 1;
  }
  atualizarPeriodo(); carregar();
}
let pickerAno=estado.ano;
function fecharPicker(){ $('statPicker').hidden=true;$('adminPeriodLabel').setAttribute('aria-expanded','false'); }
function renderPicker(){
 $('statPickerYear').textContent=pickerAno;$('statPickerPrev').disabled=pickerAno<=2024;$('statPickerNext').disabled=pickerAno>=agora.getFullYear();
 const host=limpar('statPickerMonths');
 if(estado.modo==='ano'){const btn=criar('button','Selecionar '+pickerAno,'admin-picker-month');btn.type='button';btn.onclick=()=>{estado.ano=pickerAno;estado.mes=Math.min(estado.mes,estado.ano===agora.getFullYear()?agora.getMonth()+1:12);fecharPicker();atualizarPeriodo();carregar();};host.append(btn);}
 else meses.forEach((m,i)=>{const btn=criar('button',m.slice(0,3),'admin-picker-month');btn.type='button';btn.disabled=pickerAno===agora.getFullYear()&&i>agora.getMonth();btn.classList.toggle('active',pickerAno===estado.ano&&i+1===estado.mes);btn.onclick=()=>{estado.ano=pickerAno;estado.mes=i+1;fecharPicker();atualizarPeriodo();carregar();};host.append(btn);});
}
function iniciarPeriodo(){
 $('statPrev').onclick=()=>{fecharPicker();mudarPeriodo(-1);};$('statNext').onclick=()=>{fecharPicker();mudarPeriodo(1);};
 $('adminPeriodLabel').onclick=()=>{if(!$('statPicker').hidden){fecharPicker();return;}pickerAno=estado.ano;renderPicker();$('statPicker').hidden=false;$('adminPeriodLabel').setAttribute('aria-expanded','true');};
 $('statPickerPrev').onclick=()=>{if(pickerAno>2024){pickerAno--;renderPicker();}};$('statPickerNext').onclick=()=>{if(pickerAno<agora.getFullYear()){pickerAno++;renderPicker();}};
 $('statModeMonth').onclick=()=>{estado.modo='mes';if(estado.ano===agora.getFullYear())estado.mes=Math.min(estado.mes,agora.getMonth()+1);fecharPicker();atualizarPeriodo();carregar();};
 $('statModeYear').onclick=()=>{estado.modo='ano';fecharPicker();atualizarPeriodo();carregar();};
 document.addEventListener('click',e=>{if(!e.target.closest('.stats-period'))fecharPicker();});document.addEventListener('keydown',e=>{if(e.key==='Escape')fecharPicker();});atualizarPeriodo();
}
function aviso(mensagem, classe) {
  const host = $('statsAviso');
  host.textContent = mensagem;
  host.className = 'stats-aviso' + (classe ? ' ' + classe : '');
  host.hidden = !mensagem;
}
function vazio(host, mensagem) {
  host.replaceChildren(criar('p', mensagem, 'stats-empty'));
}
async function obterCatalogo() {
  if (estado.catalogo) return;
  const [r1,r2] = await Promise.all([
    fetch('/data/palestras.json', { cache:'no-store' }),
    fetch('/data/shorts.json', { cache:'no-store' })
  ]);
  if (!r1.ok || !r2.ok) throw Error('Catálogo indisponível');
  const [palestras,shorts] = await Promise.all([r1.json(),r2.json()]);
  const mapa = new Map();
  for (const p of Array.isArray(palestras.palestras) ? palestras.palestras : []) if (p.pid) mapa.set(p.pid,p);
  for (const s of Array.isArray(shorts.shorts) ? shorts.shorts : []) if (s.sid) mapa.set(s.sid,s);
  estado.catalogo = mapa;
}
function linkItem(item) {
  const registro = estado.catalogo && estado.catalogo.get(item.id);
  if (!registro) return '';
  if (item.short && registro.youtubeId) return 'https://www.youtube.com/shorts/' + encodeURIComponent(registro.youtubeId);
  if (item.video && registro.youtubeId) return 'https://www.youtube.com/watch?v=' + encodeURIComponent(registro.youtubeId);
  if (item.audio && /^https:\/\//.test(registro.audio || '')) return registro.audio;
  if (item.pdf && /^(?:https:\/\/|\/pdf\/)/.test(registro.pdf || '')) return registro.pdf;
  return '';
}
function rankingAgrupado() {
  const mapa = new Map();
  for (const entrada of estado.resposta.ranking || []) {
    const item = mapa.get(entrada.id) || { id:entrada.id, titulo:entrada.titulo, video:0, audio:0, pdf:0, short:0 };
    item[entrada.tipo] += Number(entrada.acessos) || 0;
    if (!item.titulo) item.titulo = entrada.titulo;
    mapa.set(entrada.id, item);
  }
  return [...mapa.values()].map(item => {
    const cadastro = estado.catalogo && estado.catalogo.get(item.id);
    const tituloOriginal = cadastro && cadastro.titulo || item.titulo || item.id;
    // Shorts mantêm a grafia do cadastro; palestras seguem o padrão público.
    item.titulo = /^PAL-\d+$/.test(item.id) ? formatarTituloSite(tituloOriginal) : tituloOriginal;
    item.total = estado.tipo === 'todos' ? tipos.reduce((s, tipo) => s + item[tipo], 0) : item[estado.tipo];
    return item;
  }).filter(item => item.total > 0 && (!estado.busca || (item.titulo + ' ' + item.id).toLocaleLowerCase('pt-BR').includes(estado.busca)))
    .sort((a,b) => b.total - a.total || a.titulo.localeCompare(b.titulo,'pt-BR'));
}
function indicadores() {
  const dados = estado.resposta;
  $('statsTotal').textContent = fmt(dados.total);
  for (const tipo of tipos) $('stats' + tipo.charAt(0).toUpperCase() + tipo.slice(1)).textContent = fmt(dados.totais[tipo]);
  $('statsPeriodo').textContent = 'No período selecionado';
  const formatos = (dados.ranking || []).length;
  $('statsRegistros').textContent = fmt(formatos) + (formatos === 1 ? ' formato com acesso' : ' formatos com acessos');
}
function comparacao() {
  const host = limpar('statsComparacao'), totais = estado.resposta.totais;
  const maior = Math.max(1, ...tipos.map(tipo => totais[tipo]));
  for (const tipo of tipos) {
    const linha = criar('div',undefined,'stats-comparison-row');
    const track = criar('div',undefined,'stats-comparison-track');
    const fill = criar('div',undefined,'stats-comparison-fill');
    fill.style.width = (totais[tipo] / maior * 100).toFixed(2) + '%';
    fill.style.backgroundColor = cores[tipo];
    track.append(fill);
    linha.append(criar('span',nomes[tipo],'stats-comparison-label'),track,criar('strong',fmt(totais[tipo])));
    host.append(linha);
  }
}
function topDez(ranking) {
  const host = limpar('statsTop');
  if (!ranking.length) return vazio(host,'Nenhum conteúdo encontrado no período ou filtro.');
  const maior = Math.max(1,ranking[0].total);
  ranking.slice(0,10).forEach((item,i) => {
    const linha = criar('div',undefined,'stats-top-row');
    const titulo = criar('div',undefined,'stats-top-title');
    titulo.append(criar('span',String(i+1).padStart(2,'0'),'stats-rank-number'),criar('span',item.titulo,'stats-rank-title'));
    const track = criar('div',undefined,'stats-top-track'),fill = criar('div',undefined,'stats-top-fill');
    fill.style.width = (item.total / maior * 100).toFixed(2) + '%';
    track.append(fill);
    linha.append(titulo,criar('strong',fmt(item.total),'stats-rank-count'),track);
    host.append(linha);
  });
}
function evolucao() {
  const host = limpar('statsEvolucao'), dados = estado.resposta.evolucao || [];
  const buckets = new Map();
  if (estado.modo === 'ano') {
    for (let m=1;m<=12;m++) {
      if (estado.ano === agora.getFullYear() && m > agora.getMonth()+1) break;
      buckets.set(estado.ano + '-' + String(m).padStart(2,'0'),0);
    }
  } else {
    const dias = new Date(estado.ano,estado.mes,0).getDate();
    const ultimo = estado.ano === agora.getFullYear() && estado.mes === agora.getMonth()+1 ? agora.getDate() : dias;
    for (let d=1;d<=ultimo;d++) buckets.set(estado.ano+'-'+String(estado.mes).padStart(2,'0')+'-'+String(d).padStart(2,'0'),0);
  }
  for (const d of dados) {
    const chave = estado.modo === 'ano' ? d.data.slice(0,7) : d.data;
    if (!buckets.has(chave)) continue;
    const valor = estado.tipo === 'todos' ? d.total : d[estado.tipo];
    buckets.set(chave,buckets.get(chave)+(Number(valor)||0));
  }
  if (![...buckets.values()].some(Boolean)) return vazio(host,'Ainda não há evolução registrada para o filtro selecionado.');
  const maximo = Math.max(1,...buckets.values());
  const chart = criar('div',undefined,'stats-evolution-bars');
  for (const [chave,valor] of buckets) {
    const grupo = criar('div',undefined,'stats-evolution-item');
    const barra = criar('div',undefined,'stats-evolution-column');
    barra.style.height = (valor ? Math.max(3,valor/maximo*100) : 0).toFixed(2) + '%';
    barra.title = chave+': '+fmt(valor)+' acessos';
    grupo.append(barra,criar('span',estado.modo==='ano'?meses[Number(chave.slice(5,7))-1].slice(0,3):chave.slice(-2)));
    chart.append(grupo);
  }
  host.append(chart);
}
function tabela(ranking) {
  const tbody = limpar('statsTabela');
  $('statsQtdResultados').textContent = fmt(ranking.length) + ' conteúdos';
  if (!ranking.length) {
    const tr=criar('tr'),td=criar('td','Nenhum conteúdo encontrado.','stats-table-empty');
    td.colSpan=7;tr.append(td);tbody.append(tr);return;
  }
  ranking.forEach((item,i) => {
    const tr=criar('tr');tr.append(criar('td',String(i+1)));
    const cel=criar('td'),href=linkItem(item);
    if (href) {
      const a=criar('a',item.titulo);
      a.href=href;a.target='_blank';a.rel='noopener noreferrer';cel.append(a);
    } else cel.append(criar('strong',item.titulo));
    cel.append(criar('small',item.id));
    tr.append(cel);
    for (const tipo of tipos) tr.append(criar('td',item[tipo]?fmt(item[tipo]):'—'));
    tr.append(criar('td',fmt(item.total),'stats-table-total'));
    tbody.append(tr);
  });
}
function desenhar() {
  if (!estado.resposta || estado.resposta.status!=='ok') return;
  const ranking = rankingAgrupado();
  indicadores();comparacao();topDez(ranking);evolucao();tabela(ranking);
}
function limparPainel() {
  for (const id of ['statsTotal','statsVideo','statsAudio','statsPdf','statsShort']) $(id).textContent='—';
  $('statsQtdResultados').textContent='—';
  for (const id of ['statsTop','statsComparacao','statsEvolucao']) vazio($(id),'Aguardando estatísticas…');
  const tr=criar('tr'),td=criar('td','Aguardando estatísticas…','stats-table-empty');
  td.colSpan=7;tr.append(td);limpar('statsTabela').append(tr);
}
async function carregar() {
  const req=++estado.requisicao;
  estado.resposta=null;limparPainel();
  aviso('Consultando o GoatCounter…','loading');
  $('siteStatus').textContent='Consultando GoatCounter';
  const url='/api/admin/estatisticas?ano='+estado.ano+(estado.modo==='mes'?'&mes='+estado.mes:'');
  try {
    const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});
    const dados=await r.json().catch(()=>({}));
    if(req!==estado.requisicao)return;
    if(!r.ok)throw Error(dados.erro||'Não foi possível consultar o GoatCounter.');
    if(dados.status==='pendente'){
      aviso(dados.mensagem+' A chave deve ficar somente no servidor, nunca no código público.','warning');
      $('siteStatus').textContent='Configuração pendente';return;
    }
    if(dados.status!=='ok'||!Array.isArray(dados.ranking))throw Error('Resposta inesperada da integração.');
    estado.resposta=dados;
    try{await obterCatalogo();}catch(e){/* O ranking continua com os títulos do GoatCounter. */}
    if(req!==estado.requisicao)return;
    aviso('','');desenhar();
    if (configRelatorio && !configRelatorio.erro) {
      const printButton = $('statsReportPrint');
      if (printButton) printButton.disabled = false;
      if (configRelatorio.autoPrint && !document.body.dataset.autoPrinted) {
        document.body.dataset.autoPrinted = '1';
        requestAnimationFrame(() => setTimeout(() => window.print(), 300));
      }
    }
    $('siteStatus').textContent='GoatCounter conectado';
    $('lastUpdate').textContent=new Date(dados.atualizadoEm).toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
  }catch(err){
    if(req!==estado.requisicao)return;
    aviso(err.message||'Erro ao consultar as estatísticas.','warning');
    $('siteStatus').textContent='Consulta indisponível';
  }
}
function iniciarRelatorio() {
  if (!configRelatorio) return;
  document.body.classList.add('stats-report-mode');
  const periodo = configRelatorio.erro ? 'Período inválido'
    : configRelatorio.mode === 'year' ? 'Ano de ' + configRelatorio.ano
    : meses[configRelatorio.mes - 1] + ' de ' + configRelatorio.ano;
  const toolbar = criar('div',undefined,'stats-report-toolbar');
  const titulo = criar('strong','Relatório de Estatísticas · ' + periodo);
  const botoes = criar('div',undefined,'stats-report-actions');
  const voltar = criar('a','Voltar aos relatórios');
  voltar.href = '/admin/relatorios.html';
  const imprimir = criar('button','Imprimir / Salvar em PDF');
  imprimir.type = 'button';
  imprimir.id = 'statsReportPrint';
  imprimir.disabled = true;
  imprimir.addEventListener('click',() => { if (estado.resposta && estado.resposta.status === 'ok') window.print(); });
  botoes.append(voltar,imprimir);toolbar.append(titulo,botoes);
  document.body.prepend(toolbar);
  document.title = 'Relatório de Estatísticas — ' + periodo + ' | Paz que Ilumina';
  const heading = document.querySelector('.dash-welcome h1');
  if (heading) heading.textContent = 'Relatório de Estatísticas';
  const sub = document.querySelector('.dash-welcome p');
  if (sub) sub.textContent = 'Paz que Ilumina · ' + periodo;
  const meta = $('statsReportMeta');
  meta.hidden = false;
  meta.textContent = 'Emitido em ' + new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}) +
    ' · Fonte: GoatCounter · Contagem de interações no site';
}
iniciarMenu();iniciarPeriodo();iniciarRelatorio();
$('statsTipo').addEventListener('change',e=>{estado.tipo=e.target.value;desenhar();});
$('statsBusca').addEventListener('input',e=>{estado.busca=e.target.value.trim().toLocaleLowerCase('pt-BR');desenhar();});
$('statsAtualizar').addEventListener('click',carregar);
if (configRelatorio && configRelatorio.erro) aviso(configRelatorio.erro,'warning');
else carregar();
