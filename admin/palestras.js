'use strict';
const $ = id => document.getElementById(id);
const state={dados:{versao:1,palestras:[]},sha:null,selecionado:null,aba:'nova',dirty:false,formDirty:false,ordemDesc:false,publicados:new Set(),r2Ativo:false,r2Erro:'Verificando integração com o R2…',r2Uploading:false,pdfUploading:false};
function msg(s,type=''){ $('mensagemTexto').textContent=s;$('mensagemP').className='mensagem'+(type?' '+type:'');$('mensagemP').hidden=false; }
// Remove pontuação terminal dos títulos, preservando abreviações como d.C.
function tituloSemPontoFinal(titulo){
 const texto=String(titulo||'').trim();
 return /\b(?:d\.\s*C\.|a\.\s*C\.)$/i.test(texto)?texto:texto.replace(/\.+$/,'').trimEnd();
}
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
 if(state.r2Uploading||state.pdfUploading){msg('Aguarde o término do envio do arquivo antes de mudar de palestra.','alerta');return false;}
 return !state.formDirty||confirm('Há alterações no formulário que ainda não foram salvas na lista. Deseja descartá-las?');
}
function limparSelecaoMp3(){
 $('arquivoMp3R2').value='';$('progressoAudioR2').hidden=true;$('progressoAudioR2').value=0;
 $('statusAudioR2').className='upload-r2-status';$('avisoAudioR2').hidden=false;
}
function limparSelecaoPdf(){
 $('arquivoPdfGithub').value='';$('statusPdfGithub').className='upload-r2-status';
 $('statusPdfGithub').textContent='Selecione uma palestra publicada para enviar um PDF.';
 $('avisoPdfGithub').hidden=false;
}
function atualizarUploadPdf(){
 const existe=state.aba==='editar'&&!!state.selecionado;
 const publicado=existe&&state.publicados.has(state.selecionado);
 const pronto=publicado&&!state.pdfUploading&&!state.r2Uploading;
 $('arquivoPdfGithub').disabled=!pronto;
 $('enviarPdfGithub').disabled=!pronto||!$('arquivoPdfGithub').files.length;
 if(state.pdfUploading)return;
 const status=$('statusPdfGithub');
 if(status.className!=='upload-r2-status')return;
 if(!existe)status.textContent='Selecione uma palestra existente para enviar um PDF.';
 else if(!publicado)status.textContent='Para uma palestra nova, primeiro salve na lista e publique o cadastro no GitHub.';
 else if(!$('arquivoPdfGithub').files.length)status.textContent='Selecione um arquivo PDF e clique em Enviar. O link será preenchido após o envio.';
 else status.textContent='Arquivo selecionado. Clique em Enviar PDF ao GitHub.';
}
function atualizarUploadR2(){
 const existe=state.aba==='editar'&&!!state.selecionado;
 const publicado=existe&&state.publicados.has(state.selecionado);
 const pronto=state.r2Ativo&&publicado&&!state.r2Uploading&&!state.pdfUploading;
 $('arquivoMp3R2').disabled=!pronto;
 $('enviarAudioR2').disabled=!pronto||!$('arquivoMp3R2').files.length;
 if(state.r2Uploading)return;
 if(!state.r2Ativo){$('statusAudioR2').textContent=state.r2Erro;return;}
 if(!existe){$('statusAudioR2').textContent='Selecione uma palestra existente para enviar um MP3.';return;}
 if(!publicado){$('statusAudioR2').textContent='Para uma palestra nova, primeiro salve na lista e publique o cadastro no GitHub.';return;}
 if(!$('arquivoMp3R2').files.length&&$('statusAudioR2').className==='upload-r2-status')$('statusAudioR2').textContent='Selecione um arquivo MP3 e clique em Enviar. O link será preenchido após a conclusão.';
}
async function consultarR2(){
 try{
  const r=await fetch('/api/admin/audio-r2',{credentials:'same-origin',cache:'no-store'});
  const o=await r.json();if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);
  state.r2Ativo=!!o.ativo;
  state.r2Erro=o.ativo?'':(o.aviso||'Vincule o bucket R2 ao ambiente de prévia do Cloudflare Pages.');
 }catch(e){state.r2Ativo=false;state.r2Erro='Upload indisponível: '+e.message;}
 $('avisoAudioR2').hidden=false;atualizarUploadR2();
}
async function enviarJsonR2(payload){
 const r=await fetch('/api/admin/audio-r2',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const o=await r.json().catch(()=>({}));if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);return o;
}
async function enviarMp3R2(){
 if(state.r2Uploading||state.pdfUploading||!state.r2Ativo||state.aba!=='editar'||!state.publicados.has(state.selecionado))return;
 const arquivo=$('arquivoMp3R2').files[0],pid=state.selecionado;
 if(!arquivo)return;
 if(!/\.mp3$/i.test(arquivo.name)){msg('Selecione um arquivo com extensão .mp3.','erro');return;}
 if(!arquivo.size||arquivo.size>300*1024*1024){msg('O MP3 precisa ter entre 1 byte e 300 MB.','erro');return;}
 if($('audio').value.trim()&&!confirm('Esta palestra já possui um link de áudio. O novo arquivo não apagará o áudio antigo, mas o link será substituído quando você publicar o cadastro. Continuar?'))return;
 state.r2Uploading=true;let uploadId='',completando=false;
 const progresso=$('progressoAudioR2'),status=$('statusAudioR2');
 $('avisoAudioR2').hidden=false;progresso.hidden=false;progresso.value=0;status.className='upload-r2-status';
 status.textContent='Preparando envio seguro…';render();
 try{
  const inicio=await enviarJsonR2({acao:'iniciar',pid,nome:arquivo.name,tamanho:arquivo.size});
  uploadId=inicio.uploadId;
  const tamanhoParte=inicio.tamanhoParte;
  if(!uploadId||!Number.isInteger(tamanhoParte)||tamanhoParte<=0)throw new Error('Resposta de inicialização inválida.');
  const partes=[];
  for(let inicioByte=0,numero=1;inicioByte<arquivo.size;inicioByte+=tamanhoParte,numero++){
   const fimByte=Math.min(inicioByte+tamanhoParte,arquivo.size);
   status.textContent=`Enviando parte ${numero} de ${Math.ceil(arquivo.size/tamanhoParte)}…`;
   const parametros=new URLSearchParams({pid,uploadId,parte:String(numero)});
   const r=await fetch('/api/admin/audio-r2?'+parametros.toString(),{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/octet-stream'},body:arquivo.slice(inicioByte,fimByte)});
   const o=await r.json().catch(()=>({}));if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);
   if(o.numero!==numero||!o.etag)throw new Error('Resposta inesperada ao enviar uma parte.');
   partes.push({partNumber:numero,etag:o.etag});
   progresso.value=Math.round(100*fimByte/arquivo.size);
  }
  completando=true;status.textContent='Finalizando o arquivo no R2…';
  const fim=await enviarJsonR2({acao:'concluir',pid,uploadId,tamanho:arquivo.size,partes});
  if(!fim.url)throw new Error('O R2 não devolveu o endereço do arquivo.');
  // O arquivo já está no R2, mas o cadastro ainda depende de Salvar na lista + Publicar alterações.
  $('audio').value=fim.url;state.formDirty=true;
  $('arquivoMp3R2').value='';
  status.textContent=`MP3 enviado: ${pid}.mp3. Agora clique em “Salvar na lista” e depois em “Publicar alterações”.`;
  status.className='upload-r2-status sucesso';
  msg('MP3 no R2. O link foi preenchido, mas ainda precisa ser salvo na lista e publicado no GitHub.','sucesso');
 }catch(e){
  if(uploadId&&!completando){try{await enviarJsonR2({acao:'cancelar',pid,uploadId});}catch{ /* limpeza de melhor esforço */ }}
  status.textContent='Falha no envio: '+e.message+(completando?' Verifique o bucket antes de tentar novamente.':'');
  status.className='upload-r2-status erro';msg(status.textContent,'erro');
 }finally{state.r2Uploading=false;render();}
}
async function enviarPdfGithub(){
 if(state.pdfUploading||state.r2Uploading||state.aba!=='editar'||!state.publicados.has(state.selecionado))return;
 const arquivo=$('arquivoPdfGithub').files[0],pid=state.selecionado;
 if(!arquivo)return;
 if(!/\.pdf$/i.test(arquivo.name)){msg('Selecione um arquivo com extensão .pdf.','erro');return;}
 if(!arquivo.size||arquivo.size>20*1024*1024){msg('O PDF deve ter entre 1 byte e 20 MiB.','erro');return;}
 if($('pdf').value.trim()&&!confirm('Esta palestra já possui um link de PDF. O novo envio não apagará o PDF anterior, mas o link será substituído quando você publicar o cadastro. Continuar?'))return;
 state.pdfUploading=true;
 const status=$('statusPdfGithub');
 $('avisoPdfGithub').hidden=false;status.className='upload-r2-status';
 status.textContent='Enviando PDF ao GitHub. Aguarde a confirmação…';
 render();
 try{
  const params=new URLSearchParams({pid,nome:arquivo.name});
  const r=await fetch('/api/admin/pdf-github?'+params.toString(),{
   method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/pdf'},body:arquivo
  });
  const o=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(o.erro||'Falha no envio (HTTP '+r.status+').');
  if(!o.ok||!o.url||!o.caminho)throw new Error('Resposta de confirmação do GitHub incompleta.');
  $('pdf').value=o.url;state.formDirty=true;
  $('arquivoPdfGithub').value='';
  $('avisoPdfGithub').hidden=false;
  status.textContent='PDF enviado para '+o.caminho+'. Aguarde o Cloudflare Pages; clique em “Salvar na lista” e depois em “Publicar alterações” para vincular o PDF à palestra.';
  status.className='upload-r2-status sucesso';
  msg('PDF enviado ao GitHub. O link foi preenchido, mas ainda precisa ser salvo e publicado no cadastro.','sucesso');
 }catch(e){
  $('avisoPdfGithub').hidden=false;
  status.textContent='Falha no envio do PDF: '+e.message;
  status.className='upload-r2-status erro';
  msg(status.textContent,'erro');
 }finally{
  state.pdfUploading=false;render();
 }
}

function preencher(p){
 limparSelecaoMp3();limparSelecaoPdf();$('pid').value=p.pid;$('titulo').value=p.titulo;$('data').value=p.data||'';$('aproximada').value=p.dataAproximada?'sim':'nao';
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
  state.selecionado=null;$('formP').reset();limparSelecaoMp3();limparSelecaoPdf();$('pid').value=novoId();$('tituloP').textContent='Nova palestra';
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
 state.selecionado=null;state.formDirty=false;$('formP').reset();limparSelecaoMp3();limparSelecaoPdf();$('pid').value=novoId();$('tituloP').textContent='Nova palestra';
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
function salvar(){if(state.r2Uploading||state.pdfUploading){msg('Aguarde o envio do arquivo terminar.','alerta');return false;}if(!$('formP').reportValidity())return false;
 const id=idYoutube($('youtube').value);if(id===null){msg('URL do YouTube inválida.','erro');return false;}
 const duplicate=id&&state.dados.palestras.find(p=>p.youtubeId===id&&p.pid!==state.selecionado);
 if(duplicate){msg('Este vídeo já pertence a '+duplicate.pid+'. Abra o registro existente.','erro');return false;}
 const audio=$('audio').value.trim(),pdf=$('pdf').value.trim(),arquivo=$('arquivo').value.trim();
 if([audio,pdf].some(v=>v&&!/^(https:\/\/|\/)/.test(v))){msg('Links de áudio e PDF devem começar com https:// ou /.','erro');return false;}
 if(arquivo&&(/[\\/]/.test(arquivo)||!/\.(ppt|pptx|pdf)$/i.test(arquivo))){msg('Informe apenas o nome do arquivo .ppt, .pptx ou .pdf, sem caminhos.','erro');return false;}
 const pid=state.selecionado||novoId();const old=state.dados.palestras.find(p=>p.pid===pid)||{};
 const p={...old,pid,titulo:tituloSemPontoFinal($('titulo').value),data:$('data').value,dataAproximada:$('aproximada').value==='sim',youtubeId:id||'',serie:$('serie').value,audio,audioPlataforma:audio.startsWith('https://audio.pazqueilumina.com.br/')?'Cloudflare R2':audio===(old.audio||'')?(old.audioPlataforma||''):'',pdf,apresentacaoOriginal:arquivo,
  statusAudio:audio?'existente':id?'pendente':'sem-fonte',statusPdf:pdf?'existente':arquivo?'pendente':'sem-arquivo'};
 if(!p.titulo){msg('Título obrigatório.','erro');return false;}
 const i=state.dados.palestras.findIndex(x=>x.pid===pid);if(i>=0)state.dados.palestras[i]=p;else state.dados.palestras.push(p);
 state.selecionado=pid;state.dirty=true;state.formDirty=false;state.aba='editar';preencher(p);atualizarAbas();render();msg('Alteração preparada. Clique em “Publicar alterações” para enviá-la ao GitHub.','alerta');return true;
}
function render(){atualizarUploadR2();atualizarUploadPdf();const rows=state.dados.palestras; $('totalP').textContent=rows.length;$('videosP').textContent=rows.filter(p=>p.youtubeId).length;$('audiosP').textContent=rows.filter(p=>p.audio).length;$('pdfsP').textContent=rows.filter(p=>p.pdf).length;
 $('publicarP').disabled=!state.sha||!state.dirty||state.r2Uploading||state.pdfUploading;
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
 if(!o.sha||!Array.isArray(o.dados?.palestras))throw new Error('Resposta incompleta.');state.dados=o.dados;state.sha=o.sha;state.publicados=new Set(o.dados.palestras.map(p=>p.pid));state.dirty=false;limpar(true);msg('Cadastro carregado. Os registros existentes foram preservados.','sucesso');
 }catch(e){msg('Não foi possível carregar: '+e.message,'erro');}}
async function publicar(){if(state.r2Uploading||state.pdfUploading){msg('Aguarde o envio do arquivo terminar.','alerta');return;}if(state.dados.palestras.some(p=>p.titulo.startsWith('Palestra a revisar — '))){msg('Revise os títulos provisórios das URLs importadas antes de publicar.','erro');return;}if(state.formDirty&&!salvar())return;if(!state.dirty)return;if(!confirm('Enviar as alterações do cadastro ao GitHub?'))return;
 $('publicarP').disabled=true;msg('Enviando cadastro ao GitHub…');try{const r=await fetch('/api/admin/palestras',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:state.sha,dados:state.dados})});const o=await r.json();if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);state.sha=o.sha;state.dirty=false;state.publicados=new Set(state.dados.palestras.map(p=>p.pid));render();msg(o.aviso||'Enviado.','sucesso');}catch(e){render();msg('Publicação não concluída: '+e.message,'erro');}}
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
 const isNew=!p;if(isNew){p={pid:'PAL-'+String(++next).padStart(4,'0'),titulo:tituloSemPontoFinal(item.titulo),serie:'temas',data:'',dataAproximada:true,youtubeId:'',audio:'',pdf:'',apresentacaoOriginal:'',statusAudio:'sem-fonte',statusPdf:'sem-arquivo'};working.push(p);}
 if(item.titulo)p.titulo=tituloSemPontoFinal(item.titulo);if(item.data)p.data=item.data;if(y){p.youtubeId=y;if(!p.audio)p.statusAudio='pendente';}
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
$('fecharMensagemP').addEventListener('click',()=>{ $('mensagemP').hidden=true; });
$('formP').addEventListener('submit',e=>{e.preventDefault();salvar();});$('formP').addEventListener('input',e=>{if(!['arquivoMp3R2','arquivoPdfGithub'].includes(e.target.id))state.formDirty=true;});$('formP').addEventListener('change',e=>{if(!['arquivoMp3R2','arquivoPdfGithub'].includes(e.target.id))state.formDirty=true;});
 $('fecharStatusAudioR2').addEventListener('click',()=>{$('avisoAudioR2').hidden=true;});
 $('fecharStatusPdfGithub').addEventListener('click',()=>{$('avisoPdfGithub').hidden=true;});
 $('arquivoMp3R2').addEventListener('change',()=>{$('avisoAudioR2').hidden=false;atualizarUploadR2();});
 $('enviarAudioR2').addEventListener('click',enviarMp3R2);
 $('arquivoPdfGithub').addEventListener('change',()=>{$('avisoPdfGithub').hidden=false;$('statusPdfGithub').className='upload-r2-status';atualizarUploadPdf();});
 $('enviarPdfGithub').addEventListener('click',enviarPdfGithub);$('novoP').addEventListener('click',()=>state.aba==='nova'?limpar():trocarAba('nova'));$('cancelarP').addEventListener('click',descartarFormulario);$('abaEditar').addEventListener('click',()=>trocarAba('editar'));$('abaNova').addEventListener('click',()=>trocarAba('nova'));$('abaImportar').addEventListener('click',()=>trocarAba('importar'));$('publicarP').addEventListener('click',publicar);$('buscaP').addEventListener('input',render);$('filtroP').addEventListener('change',render);
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
window.addEventListener('beforeunload',e=>{if(state.dirty||state.formDirty||state.r2Uploading||state.pdfUploading){e.preventDefault();e.returnValue='';}});carregar();consultarR2();
