'use strict';
const $ = id => document.getElementById(id);
const state={dados:{versao:1,palestras:[]},sha:null,selecionado:null,aba:'nova',dirty:false,formDirty:false,ordemDesc:false};
function msg(s,type=''){ $('mensagemP').textContent=s;$('mensagemP').className='mensagem'+(type?' '+type:''); }
function idYoutube(url){
 if(!url.trim())return '';
 try{const u=new URL(url.trim());const host=u.hostname.toLowerCase().replace(/^www\./,'').replace(/^m\./,'');let id='';
 if(host==='youtu.be')id=u.pathname.split('/')[1];
 else if(host==='youtube.com'||host==='youtube-nocookie.com')id=u.searchParams.get('v')||(u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)||[])[1];
 return /^[a-zA-Z0-9_-]{11}$/.test(id||'')?id:null;
 }catch{return null;}
}
function novoId(){const nums=state.dados.palestras.map(p=>Number((p.pid||'').replace(/^PAL-/,''))).filter(Number.isFinite);return 'PAL-'+String(Math.max(0,...nums)+1).padStart(4,'0');}
function confirmarDescarte(){
 return !state.formDirty||confirm('Há alterações no formulário que ainda não foram salvas na lista. Deseja descartá-las?');
}
function preencher(p){
 $('pid').value=p.pid;$('titulo').value=p.titulo;$('data').value=p.data||'';$('aproximada').value=p.dataAproximada?'sim':'nao';
 $('youtube').value=p.youtubeId?'https://www.youtube.com/watch?v='+p.youtubeId:'';
 $('audio').value=p.audio||'';$('pdf').value=p.pdf||'';$('arquivo').value=p.apresentacaoOriginal||'';$('serie').value=p.serie||'temas';
 $('tituloP').textContent='Editar palestra';
}
function atualizarAbas(){
 for(const [nome,id] of [['editar','abaEditar'],['nova','abaNova'],['importar','abaImportar']]){
  const ativo=state.aba===nome;$(id).classList.toggle('ativa',ativo);$(id).setAttribute('aria-selected',String(ativo));$(id).tabIndex=ativo?0:-1;
 }
 const temFormulario=state.aba==='nova'||(state.aba==='editar'&&!!state.selecionado);
 $('painelFormulario').hidden=!temFormulario;
 $('avisoSelecionar').hidden=state.aba!=='editar'||!!state.selecionado;
 $('painelImportar').hidden=state.aba!=='importar';
}
function trocarAba(aba){
 if(state.aba===aba)return true;
 if(!confirmarDescarte())return false;
 state.formDirty=false;
 if(aba==='nova'){
  state.selecionado=null;$('formP').reset();$('pid').value=novoId();$('tituloP').textContent='Nova palestra';
 }else if(aba==='editar'&&state.selecionado){
  const p=state.dados.palestras.find(x=>x.pid===state.selecionado);
  if(p)preencher(p);
 }
 state.aba=aba;atualizarAbas();render();return true;
}
function selecionar(pid){
 const p=state.dados.palestras.find(x=>x.pid===pid);if(!p)return;
 if(state.selecionado===pid&&state.aba==='editar')return;
 if(!confirmarDescarte())return;
 state.selecionado=pid;state.formDirty=false;preencher(p);state.aba='editar';atualizarAbas();render();
}
function limpar(force=false){
 if(!force&&!confirmarDescarte())return;
 state.selecionado=null;state.formDirty=false;$('formP').reset();$('pid').value=novoId();$('tituloP').textContent='Nova palestra';
 state.aba='nova';atualizarAbas();render();
}
function descartarFormulario(){
 if(!confirmarDescarte())return;
 state.formDirty=false;
 if(state.aba==='editar'&&state.selecionado){
  const p=state.dados.palestras.find(x=>x.pid===state.selecionado);if(p)preencher(p);
 }else{$('formP').reset();$('pid').value=novoId();}
 msg('Alterações não salvas do formulário descartadas.','alerta');
}
function salvar(){if(!$('formP').reportValidity())return false;
 const id=idYoutube($('youtube').value);if(id===null){msg('URL do YouTube inválida.','erro');return false;}
 const duplicate=id&&state.dados.palestras.find(p=>p.youtubeId===id&&p.pid!==state.selecionado);
 if(duplicate){msg('Este vídeo já pertence a '+duplicate.pid+'. Abra o registro existente.','erro');return false;}
 const audio=$('audio').value.trim(),pdf=$('pdf').value.trim(),arquivo=$('arquivo').value.trim();
 if([audio,pdf].some(v=>v&&!/^(https:\/\/|\/)/.test(v))){msg('Links de áudio e PDF devem começar com https:// ou /.','erro');return false;}
 if(arquivo&&(/[\\/]/.test(arquivo)||!/\.(ppt|pptx|pdf)$/i.test(arquivo))){msg('Informe apenas o nome do arquivo .ppt, .pptx ou .pdf, sem caminhos.','erro');return false;}
 const pid=state.selecionado||novoId();const old=state.dados.palestras.find(p=>p.pid===pid)||{};
 const p={...old,pid,titulo:$('titulo').value.trim(),data:$('data').value,dataAproximada:$('aproximada').value==='sim',youtubeId:id||'',serie:$('serie').value,audio,pdf,apresentacaoOriginal:arquivo,
  statusAudio:audio?'existente':id?'pendente':'sem-fonte',statusPdf:pdf?'existente':arquivo?'pendente':'sem-arquivo'};
 if(!p.titulo){msg('Título obrigatório.','erro');return false;}
 const i=state.dados.palestras.findIndex(x=>x.pid===pid);if(i>=0)state.dados.palestras[i]=p;else state.dados.palestras.push(p);
 state.selecionado=pid;state.dirty=true;state.formDirty=false;state.aba='editar';preencher(p);atualizarAbas();render();msg('Alteração preparada. Clique em “Publicar alterações” para enviá-la ao GitHub.','alerta');return true;
}
function render(){const rows=state.dados.palestras; $('totalP').textContent=rows.length;$('videosP').textContent=rows.filter(p=>p.youtubeId).length;$('audiosP').textContent=rows.filter(p=>p.audio).length;$('pdfsP').textContent=rows.filter(p=>p.pdf).length;
 $('publicarP').disabled=!state.sha||!state.dirty;
 const term=$('buscaP').value.trim().toLocaleLowerCase('pt-BR');const filtro=$('filtroP').value;
 // A etiqueta ORDEM representa a posição cronológica no acervo completo, não a posição na lista filtrada/invertida.
 const ordemCronologica=[...rows].sort((a,b)=>(a.data||'9999').localeCompare(b.data||'9999')||a.pid.localeCompare(b.pid));
 const numerosOrdem=new Map(ordemCronologica.map((p,i)=>[p.pid,i+1]));
 const filtered=rows.filter(p=>(!term||(p.pid+' '+p.titulo).toLocaleLowerCase('pt-BR').includes(term))&&(filtro==='todos'||(filtro==='semAudio'&&!p.audio)||(filtro==='semPdf'&&!p.pdf)))
 .sort((a,b)=>{const comparacao=(a.data||'9999').localeCompare(b.data||'9999')||a.pid.localeCompare(b.pid);return state.ordemDesc?-comparacao:comparacao;});
 const list=$('listaP');list.replaceChildren();if(!filtered.length){const e=document.createElement('p');e.className='vazio';e.textContent='Nenhuma palestra encontrada.';list.append(e);return;}
 filtered.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='evento'+(state.selecionado===p.pid?' ativo':'');
 const n=document.createElement('span');n.className='evento-data';const strong=document.createElement('strong');strong.textContent=String(numerosOrdem.get(p.pid)??(i+1)).padStart(3,'0');const small=document.createElement('span');small.textContent='ORDEM';n.append(strong,small);
 const body=document.createElement('span');body.className='evento-corpo';const t=document.createElement('strong');t.textContent=p.titulo;const meta=document.createElement('span');meta.textContent=`${p.pid} · ${p.data||'Sem data'}${p.dataAproximada?' (aprox.)':''}`;
 const flags=document.createElement('small');flags.textContent=`Vídeo ${p.youtubeId?'✓':'—'}   MP3 ${p.audio?'✓':'—'}   PDF ${p.pdf?'✓':'—'}`;body.append(t,meta,flags);b.append(n,body);b.addEventListener('click',()=>selecionar(p.pid));list.append(b);});
}
async function carregar(){msg('Consultando cadastro no GitHub…');try{const r=await fetch('/api/admin/palestras',{credentials:'same-origin',cache:'no-store'});const o=await r.json();if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);
 if(!o.sha||!Array.isArray(o.dados?.palestras))throw new Error('Resposta incompleta.');state.dados=o.dados;state.sha=o.sha;state.dirty=false;limpar(true);msg('Cadastro carregado. Os registros existentes foram preservados.','sucesso');
 }catch(e){msg('Não foi possível carregar: '+e.message,'erro');}}
async function publicar(){if(state.dados.palestras.some(p=>p.titulo.startsWith('Palestra a revisar — '))){msg('Revise os títulos provisórios das URLs importadas antes de publicar.','erro');return;}if(state.formDirty&&!salvar())return;if(!state.dirty)return;if(!confirm('Enviar as alterações do cadastro ao GitHub?'))return;
 $('publicarP').disabled=true;msg('Enviando cadastro ao GitHub…');try{const r=await fetch('/api/admin/palestras',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:state.sha,dados:state.dados})});const o=await r.json();if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);state.sha=o.sha;state.dirty=false;render();msg(o.aviso||'Enviado.','sucesso');}catch(e){render();msg('Publicação não concluída: '+e.message,'erro');}}
function csvRows(text){const out=[];let row=[],val='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){val+='"';i++;}else if(c==='"')q=false;else val+=c;}else if(c==='"')q=true;else if(c===', '){val+=c;}else if(c===','||c===';' ){row.push(val);val='';}else if(c==='\n'){row.push(val.replace(/\r$/,''));out.push(row);row=[];val='';}else val+=c;}if(q)throw Error('Aspas não fechadas no CSV.');if(val||row.length){row.push(val);out.push(row);}return out;}
function parseCSV(text){const lines=csvRows(text.replace(/^\uFEFF/,''));if(lines.length<2)throw Error('CSV sem registros.');const normalize=s=>s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const cols=lines.shift().map(normalize);const aliases={id:['id'],titulo:['titulo','title'],data:['data','date'],youtube:['youtube','url','url do youtube'],apresentacao:['apresentacao','arquivo','pdf','pptx']};
 const idx=Object.fromEntries(Object.entries(aliases).map(([k,a])=>[k,cols.findIndex(c=>a.includes(c))]));if(idx.titulo<0||idx.youtube<0&&idx.apresentacao<0)throw Error('Cabeçalho precisa de Titulo e YouTube ou Apresentacao.');
 return lines.filter(x=>x.some(v=>v.trim())).map((x,i)=>{const get=k=>idx[k]<0?'':(x[idx[k]]||'').trim();return {linha:i+2,id:get('id'),titulo:get('titulo'),data:get('data'),youtube:get('youtube'),arquivo:get('apresentacao')};});}
function importar(items){if(!confirmarDescarte())return;const working=structuredClone(state.dados.palestras);const problems=[],changes=[];let next=Math.max(0,...working.map(p=>Number((p.pid||'').slice(4))||0));
 for(const item of items){const y=idYoutube(item.youtube||'');if(y===null){problems.push(`Linha ${item.linha}: URL inválida`);continue;}
 if(item.data&&!/^\d{4}-\d{2}-\d{2}$/.test(item.data)){problems.push(`Linha ${item.linha}: data inválida`);continue;}
 if(item.arquivo&&(/[\\/]/.test(item.arquivo)||!/\.(ppt|pptx|pdf)$/i.test(item.arquivo))){problems.push(`Linha ${item.linha}: arquivo inválido`);continue;}
 let p=item.id?working.find(x=>x.pid===item.id):y?working.find(x=>x.youtubeId===y):null;
 if(item.id&&!p){problems.push(`Linha ${item.linha}: ID ${item.id} não existe`);continue;}
 if(p&&y&&p.youtubeId&&p.youtubeId!==y){problems.push(`Linha ${item.linha}: ID e YouTube diferentes`);continue;}
 if(y&&working.some(x=>x.youtubeId===y&&x!==p)){problems.push(`Linha ${item.linha}: YouTube duplicado`);continue;}
 if(!p&&!item.titulo){problems.push(`Linha ${item.linha}: título obrigatório para novo registro`);continue;}
 const isNew=!p;if(isNew){p={pid:'PAL-'+String(++next).padStart(4,'0'),titulo:item.titulo,serie:'temas',data:'',dataAproximada:true,youtubeId:'',audio:'',pdf:'',apresentacaoOriginal:'',statusAudio:'sem-fonte',statusPdf:'sem-arquivo'};working.push(p);}
 if(item.titulo)p.titulo=item.titulo;if(item.data)p.data=item.data;if(y){p.youtubeId=y;if(!p.audio)p.statusAudio='pendente';}
 if(item.arquivo){p.apresentacaoOriginal=item.arquivo;if(!p.pdf)p.statusPdf='pendente';}
 changes.push(`${isNew?'NOVA':'ATUALIZAR'} ${p.pid}: ${p.titulo}`);
 }
 if(problems.length){alert('Importação não aplicada. Corrija os problemas:\n'+problems.slice(0,25).join('\n'));return;}
 if(!changes.length){msg('Nenhuma linha válida encontrada.','alerta');return;}
 if(!confirm(`Prévia da importação (${changes.length} linhas):\n\n${changes.slice(0,18).join('\n')}${changes.length>18?'\n…':''}\n\nAplicar à lista? A publicação no GitHub será separada.`))return;
 state.dados.palestras=working;state.dirty=true;state.formDirty=false;state.selecionado=null;state.aba='importar';$('formP').reset();$('pid').value=novoId();atualizarAbas();render();msg(`${changes.length} linhas preparadas. Confira e publique quando estiver pronto.`, 'alerta');
}
function exportar(){const escape=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const lines=[['ID','Titulo','Data','YouTube','Apresentacao'].join(',')];for(const p of state.dados.palestras)lines.push([p.pid,p.titulo,p.data,p.youtubeId?'https://www.youtube.com/watch?v='+p.youtubeId:'',p.apresentacaoOriginal].map(escape).join(','));
 const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='palestras-com-ids.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
$('formP').addEventListener('submit',e=>{e.preventDefault();salvar();});$('formP').addEventListener('input',()=>{state.formDirty=true;});$('formP').addEventListener('change',()=>{state.formDirty=true;});$('novoP').addEventListener('click',()=>state.aba==='nova'?limpar():trocarAba('nova'));$('cancelarP').addEventListener('click',descartarFormulario);$('abaEditar').addEventListener('click',()=>trocarAba('editar'));$('abaNova').addEventListener('click',()=>trocarAba('nova'));$('abaImportar').addEventListener('click',()=>trocarAba('importar'));$('publicarP').addEventListener('click',publicar);$('buscaP').addEventListener('input',render);$('filtroP').addEventListener('change',render);
$('ordenarP').addEventListener('click',()=>{
 state.ordemDesc=!state.ordemDesc;
 const botao=$('ordenarP');
 const descricao=state.ordemDesc?'Mais recentes primeiro. Clique para mostrar as mais antigas primeiro.':'Mais antigas primeiro. Clique para mostrar as mais recentes primeiro.';
 botao.setAttribute('aria-pressed',String(state.ordemDesc));
 botao.setAttribute('aria-label',descricao);
 botao.title=descricao;
 render();
});
$('csvP').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{importar(parseCSV(await f.text()));}catch(err){msg('CSV inválido: '+err.message,'erro');}e.target.value='';});$('exportarP').addEventListener('click',exportar);
$('colarP').addEventListener('click',()=>{$('urlsP').hidden=!$('urlsP').hidden;$('aplicarUrlsP').hidden=$('urlsP').hidden;$('rotuloUrlsP').hidden=$('urlsP').hidden;});
$('aplicarUrlsP').addEventListener('click',()=>{const urls=$('urlsP').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const items=urls.map((url,i)=>({linha:i+1,id:'',titulo:'',data:'',youtube:url,arquivo:''}));
 // URLs novas precisam de título; gerar rascunho a partir do identificador, para revisão manual obrigatória.
 for(const it of items){const id=idYoutube(it.youtube);it.titulo=id?'Palestra a revisar — '+id:'';}
 importar(items);});
window.addEventListener('beforeunload',e=>{if(state.dirty||state.formDirty){e.preventDefault();e.returnValue='';}});carregar();
