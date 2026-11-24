'use strict';
const $ = id => document.getElementById(id);
const state={dados:{versao:1,palestras:[]},sha:null,baseDados:null,selecionado:null,aba:'nova',dirty:false,formDirty:false,ordemDesc:false,publicados:new Set(),r2Ativo:false,r2Erro:'Verificando integração com o R2…',r2Uploading:false,pdfUploading:false,tituloEditado:false,autoSaving:false,statusSaving:false,agenda:[],agendaDisponivel:false};
let monitorPublicacao=0,ultimoCommit='';
async function acompanharPublicacao(commit){
 const monitor=++monitorPublicacao;
 if(!commit){msg('Cadastro enviado ao GitHub; status do deploy indisponível nesta versão.','alerta');return;}
 msg('Publicando alterações no Cloudflare Pages…');
 for(let i=0;i<60;i++){
  if(monitor!==monitorPublicacao)return;
  try{
   const r=await fetch('/api/admin/palestras?deploy='+encodeURIComponent(commit),{credentials:'same-origin',cache:'no-store'});const o=await r.json();
   if(monitor!==monitorPublicacao)return;
   if(r.ok&&o.status==='success'){
    if(!state.dirty&&!state.formDirty&&!state.autoSaving&&!state.statusSaving&&!state.r2Uploading&&!state.pdfUploading){
     const leitura=await fetch('/api/admin/palestras',{credentials:'same-origin',cache:'no-store'});const atual=await leitura.json();
     if(monitor!==monitorPublicacao)return;
     if(leitura.ok&&atual.sha&&Array.isArray(atual.dados?.palestras)&&!state.dirty&&!state.formDirty&&!state.autoSaving&&!state.statusSaving&&!state.r2Uploading&&!state.pdfUploading&&!$('arquivoMp3R2').files.length&&!$('arquivoPdfGithub').files.length){state.dados=atual.dados;state.sha=atual.sha;state.baseDados=structuredClone(atual.dados);state.publicados=new Set(atual.dados.palestras.map(p=>p.pid));const p=state.dados.palestras.find(p=>p.pid===state.selecionado);if(p&&state.aba==='editar')preencher(p);render();}
    }
    msg('Publicação concluída com sucesso.','sucesso');return;
   }
   if(r.ok&&o.status==='failure'){msg('O cadastro está no GitHub, mas o deploy do Cloudflare falhou. Não reenvie os arquivos.','erro');return;}
  }catch(e){/* falhas transitórias: tentar novamente */}
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 if(monitor===monitorPublicacao)msg('Cadastro salvo no GitHub; não foi possível confirmar o deploy em cinco minutos.','alerta');
}
function msg(s,type=''){ $('mensagemTexto').textContent=s;$('mensagemP').className='mensagem'+(type?' '+type:'');$('mensagemP').hidden=false; }
// Remove pontuação terminal dos títulos, preservando abreviações como d.C.
function tituloSemPontoFinal(titulo){
 const texto=String(titulo||'').trim();
 return /\b(?:d\.\s*C\.|a\.\s*C\.)$/i.test(texto)?texto:texto.replace(/\.+$/,'').trimEnd();
}
function tituloFraseAdmin(titulo) {
  return formatarTituloSite(titulo);
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
 if(state.r2Uploading||state.pdfUploading||state.autoSaving||state.statusSaving){msg('Aguarde a conclusão da operação antes de mudar de palestra.','alerta');return false;}
 const arquivos=$('arquivoMp3R2').files.length||$('arquivoPdfGithub').files.length;
 return (!state.formDirty&&!arquivos)||confirm('Há alterações ou arquivos selecionados que ainda não foram salvos. Deseja descartá-los?');
}
function limparSelecaoMp3(){
 $('arquivoMp3R2').value='';$('progressoAudioR2').hidden=true;$('progressoAudioR2').value=0;
 $('statusAudioR2').className='upload-r2-status';$('statusAudioR2').textContent='';$('avisoAudioR2').hidden=true;
}
function limparSelecaoPdf(){
 $('arquivoPdfGithub').value='';$('statusPdfGithub').className='upload-r2-status';
 $('statusPdfGithub').textContent='';$('avisoPdfGithub').hidden=true;
}
function atualizarUploadPdf(){
 const existe=state.aba==='editar'&&!!state.selecionado;
 const ocupado=state.pdfUploading||state.r2Uploading||state.autoSaving||state.statusSaving;
 const semMaterial=$('materialApresentacao').value==='nao-utiliza';
 $('blocoPdf').hidden=semMaterial;
 const vinculo=$('pdf').value.trim();
 let url=null;try{if(vinculo){const u=new URL(vinculo,location.origin);if(u.protocol==='https:'||u.protocol==='http:')url=u;}}catch{}
 $('pdfVinculadoEstado').textContent=vinculo?'PDF vinculado':'Nenhum PDF vinculado.';
 $('pdfVinculadoEstado').classList.toggle('vinculado',!!vinculo);
 $('pdfVinculadoDetalhes').hidden=!vinculo;
 let nome=vinculo; if(url){nome=url.pathname.split('/').filter(Boolean).pop()||url.hostname;try{nome=decodeURIComponent(nome);}catch{}}
 $('pdfVinculadoNome').textContent=nome;
 $('pdfVinculadoLink').hidden=!url;if(url)$('pdfVinculadoLink').href=url.href;else $('pdfVinculadoLink').removeAttribute('href');
 $('rotuloArquivoPdf').textContent=vinculo?'Substituir PDF (até 20 MiB)':'Arquivo PDF (até 20 MiB)';
 $('materialApresentacao').disabled=ocupado;
 const selecionado=$('arquivoPdfGithub').files.length>0;
 $('arquivoPdfGithub').disabled=semMaterial||!(state.aba==='nova'||existe)||ocupado;
 if(state.pdfUploading||state.autoSaving)return;
 const status=$('statusPdfGithub');
 if(status.className!=='upload-r2-status')return;
 $('avisoPdfGithub').hidden=!selecionado;
 status.textContent=selecionado?'PDF selecionado. Clique em “Salvar na lista” para enviar e publicar automaticamente.':'';
}
function atualizarUploadR2(){
 const existe=state.aba==='editar'&&!!state.selecionado;
 const ocupado=state.r2Uploading||state.pdfUploading||state.autoSaving||state.statusSaving;
 const selecionado=$('arquivoMp3R2').files.length>0;
 $('arquivoMp3R2').disabled=!(state.aba==='nova'||existe)||ocupado;
 if(state.r2Uploading||state.autoSaving)return;
 const status=$('statusAudioR2');
 if(!state.r2Ativo){
  $('avisoAudioR2').hidden=false;status.className='upload-r2-status erro';status.textContent=state.r2Erro;return;
 }
 if(status.className!=='upload-r2-status')return;
 $('avisoAudioR2').hidden=!selecionado;
 status.textContent=selecionado?'MP3 selecionado. Clique em “Salvar na lista” para enviar e publicar automaticamente.':'';
}
async function consultarR2(){
 try{
  const r=await fetch('/api/admin/audio-r2',{credentials:'same-origin',cache:'no-store'});
  const o=await r.json();if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);
  state.r2Ativo=!!o.ativo;
  state.r2Erro=o.ativo?'':(o.aviso||'Vincule o bucket R2 ao ambiente de prévia do Cloudflare Pages.');
 }catch(e){state.r2Ativo=false;state.r2Erro='Upload indisponível: '+e.message;}
 if(state.r2Ativo)$('statusAudioR2').className='upload-r2-status';
 atualizarUploadR2();
}
async function enviarJsonR2(payload){
 const r=await fetch('/api/admin/audio-r2',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const o=await r.json().catch(()=>({}));if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);return o;
}
async function enviarMp3R2(){
 if(state.r2Uploading||state.pdfUploading||!state.r2Ativo||state.aba!=='editar'||!state.publicados.has(state.selecionado))return false;
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
  status.textContent=`MP3 ${pid}.mp3 enviado ao R2. Vinculando ao cadastro…`;
  status.className='upload-r2-status sucesso';
  if(!state.autoSaving)msg('MP3 no R2. O vínculo ainda precisa ser publicado no GitHub.','sucesso');
  return true;
 }catch(e){
  if(uploadId&&!completando){try{await enviarJsonR2({acao:'cancelar',pid,uploadId});}catch{ /* limpeza de melhor esforço */ }}
  status.textContent='Falha no envio: '+e.message+(completando?' Verifique o bucket antes de tentar novamente.':'');
  status.className='upload-r2-status erro';msg(status.textContent,'erro');return false;
 }finally{state.r2Uploading=false;render();}
}
async function enviarPdfGithub(){
 if(state.pdfUploading||state.r2Uploading||state.aba!=='editar'||!state.publicados.has(state.selecionado))return false;
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
  $('pdf').value=o.url;$('materialApresentacao').value='possui';state.formDirty=true;
  $('arquivoPdfGithub').value='';
  $('avisoPdfGithub').hidden=false;
  status.textContent='PDF enviado para '+o.caminho+'. Vinculando ao cadastro…';
  status.className='upload-r2-status sucesso';
  if(!state.autoSaving)msg('PDF enviado ao GitHub. O vínculo ainda precisa ser publicado no cadastro.','sucesso');
   return true;
 }catch(e){
  $('avisoPdfGithub').hidden=false;
  status.textContent='Falha no envio do PDF: '+e.message;
  status.className='upload-r2-status erro';
  msg(status.textContent,'erro');return false;
 }finally{
  state.pdfUploading=false;render();
 }
}

async function carregarCentros(){
 try{
  const r=await fetch('/data/locais.json',{cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const d=await r.json();
  const select=$('centroId');
  const selected=select.value;
  for(const local of (Array.isArray(d.locais)?d.locais:[])){
   const opt=document.createElement('option');opt.value=local.id;opt.textContent=local.nome;select.append(opt);
  }
  const opcoes=Array.from(select.options);
  const vazio=opcoes.find(o=>o.value==='');
  const preenchidas=opcoes.filter(o=>o.value!=='').sort((a,b)=>a.textContent.localeCompare(b.textContent,'pt-BR',{sensitivity:'base'}));
  select.replaceChildren(...(vazio?[vazio]:[]),...preenchidas);
  select.value=selected||'';
 }catch(e){console.warn('Cadastro de centros indisponível:',e);}
}

/* Vínculo explícito pelo ID estável da Agenda; nunca inferir só pelo título. */
function eventoDaAgenda(eventoId) { return state.agenda.find(e=>e.id===eventoId) || null; }
function dataEfetivaPalestra(p) { return eventoDaAgenda(p.eventoId)?.data || p.data || ''; }
function fmtDataAgenda(iso) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return 'Data não informada';
 const [a,m,d]=iso.split('-');return d+'/'+m+'/'+a;
}
function preencherOpcoesAgenda(){
 const select=$('eventoId'), atual=select.value;select.replaceChildren();
 const sem=document.createElement('option');sem.value='';sem.textContent='Sem vínculo com a Agenda';select.append(sem);
 for(const e of [...state.agenda].sort((a,b)=>b.data.localeCompare(a.data)||b.horario.localeCompare(a.horario))){
  if(!e.id)continue;
  const opt=document.createElement('option');opt.value=e.id;
  opt.textContent=fmtDataAgenda(e.data)+' · '+e.horario+' · '+e.titulo+' — '+e.local;
  select.append(opt);
 }
 if(atual&&eventoDaAgenda(atual))select.value=atual;
}
function atualizarVinculoAgenda(){
 const id=$('eventoId').value,evento=eventoDaAgenda(id);
 $('dadosSemAgenda').hidden=!!id;
 $('resumoEvento').hidden=!id;
 if(!id)return;
 const texto=$('dadosEvento'),aviso=$('avisoEvento');
 if(!evento){
  texto.textContent='Este evento não está mais disponível na Agenda.';
  aviso.textContent='Desvincule a palestra ou recarregue a Agenda antes de salvar.';
  aviso.classList.add('vinculo-invalido');
  return;
 }
 texto.textContent=fmtDataAgenda(evento.data)+' às '+evento.horario+' · '+evento.local+' · '+evento.titulo;
 aviso.textContent='Para alterar data, horário ou local, edite o evento na Agenda.';
 aviso.classList.remove('vinculo-invalido');
}
async function carregarAgenda(){
 try{
  const r=await fetch('/api/admin/agenda',{credentials:'same-origin',cache:'no-store'});
  const o=await r.json().catch(()=>({}));
  if(!r.ok||!Array.isArray(o.agenda))throw new Error(o.erro||'Não foi possível consultar a Agenda.');
  state.agenda=o.agenda;state.agendaDisponivel=true;preencherOpcoesAgenda();return true;
 }catch(e){
  state.agenda=[];state.agendaDisponivel=false;preencherOpcoesAgenda();
  msg('O acervo foi carregado, mas a Agenda não está disponível para vincular eventos: '+e.message,'alerta');
  return false;
 }
}
function preencher(p){
 limparSelecaoMp3();limparSelecaoPdf();$('pid').value=p.pid;$('titulo').value=tituloFraseAdmin(p.titulo);state.tituloEditado=false;$('data').value=p.data||'';$('aproximada').value=p.dataAproximada?'sim':'nao';
  if(p.eventoId&&!eventoDaAgenda(p.eventoId)&&!Array.from($('eventoId').options).some(o=>o.value===p.eventoId)){
   const opt=document.createElement('option');opt.value=p.eventoId;opt.textContent='Evento não encontrado: '+p.eventoId;$('eventoId').append(opt);
  }
  $('eventoId').value=p.eventoId||'';atualizarVinculoAgenda();
 $('youtube').value=p.youtubeId?'https://www.youtube.com/watch?v='+p.youtubeId:'';
 $('audio').value=p.audio||'';$('pdf').value=p.pdf||'';$('materialApresentacao').value=p.materialApresentacao||'nao-informado';$('serie').value=p.serie||'temas';
 const centro=$('centroId');if(p.centroId&&!Array.from(centro.options).some(o=>o.value===p.centroId)){
  const opt=document.createElement('option');opt.value=p.centroId;opt.textContent='Centro não encontrado: '+p.centroId;centro.append(opt);
 }centro.value=p.centroId||'';
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
 state.formDirty=false;state.tituloEditado=false;
 if(aba==='nova'){
  state.selecionado=null;$('formP').reset();$('centroId').value='';limparSelecaoMp3();limparSelecaoPdf();$('pid').value=novoId();$('tituloP').textContent='Nova palestra';$('eventoId').value='';atualizarVinculoAgenda();
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
 state.selecionado=null;state.formDirty=false;state.tituloEditado=false;$('formP').reset();$('centroId').value='';limparSelecaoMp3();limparSelecaoPdf();$('pid').value=novoId();$('tituloP').textContent='Nova palestra';$('eventoId').value='';atualizarVinculoAgenda();
 state.aba='nova';atualizarAbas();render();
}
function descartarFormulario(){
 if(!confirmarDescarte())return;
 state.formDirty=false;state.tituloEditado=false;
 if(state.aba==='editar'&&state.selecionado){
  const p=state.dados.palestras.find(x=>x.pid===state.selecionado);if(p)preencher(p);
 }else{$('formP').reset();$('centroId').value='';$('pid').value=novoId();$('eventoId').value='';atualizarVinculoAgenda();}
 atualizarUploadPdf();
 msg('Alterações não salvas do formulário descartadas.','alerta');
}
function salvar(preservarArquivos=false,interno=false){if(state.r2Uploading||state.pdfUploading||state.statusSaving||(state.autoSaving&&!interno)){msg('Aguarde o envio do arquivo terminar.','alerta');return false;}if(!$('formP').reportValidity())return false;
 const id=idYoutube($('youtube').value);if(id===null){msg('URL do You Tube inválida.','erro');return false;}
 const duplicate=id&&state.dados.palestras.find(p=>p.youtubeId===id&&p.pid!==state.selecionado);
 if(duplicate){msg('Este vídeo já pertence a '+duplicate.pid+'. Abra o registro existente.','erro');return false;}
 const audio=$('audio').value.trim(),pdf=$('pdf').value.trim();
 if([audio,pdf].some(v=>v&&!/^(https:\/\/|\/)/.test(v))){msg('Links de áudio e PDF devem começar com https:// ou /.','erro');return false;}
 const eventoId=$('eventoId').value,evento=eventoDaAgenda(eventoId);
  if(eventoId&&!evento){msg('O evento vinculado não foi encontrado na Agenda. Selecione outro ou remova o vínculo.','erro');return false;}
  const pid=state.selecionado||novoId();const old=state.dados.palestras.find(p=>p.pid===pid)||{};
  const arquivo=old.apresentacaoOriginal||'';
 if(arquivo&&(/[\\/]/.test(arquivo)||!/\.(ppt|pptx|pdf)$/i.test(arquivo))){msg('Nome do arquivo importado inválido em '+pid+'. Corrija-o pelo CSV.','erro');return false;}
 const titulo=state.selecionado&&!state.tituloEditado&&old.titulo?old.titulo:tituloSemPontoFinal($('titulo').value);
 const p={...old,pid,titulo,ativo:old.ativo!==false,eventoId:eventoId||'',data:evento?(old.data||''):$('data').value,dataAproximada:evento?(old.dataAproximada??true):$('aproximada').value==='sim',youtubeId:id||'',serie:$('serie').value,centroId:evento?(evento.localId||old.centroId||''):$('centroId').value,audio,audioPlataforma:audio.startsWith('https://audio.pazqueilumina.com.br/')?'Cloudflare R2':audio===(old.audio||'')?(old.audioPlataforma||''):'',pdf,materialApresentacao:$('materialApresentacao').value,apresentacaoOriginal:arquivo,
  statusAudio:audio?'existente':id?'pendente':'sem-fonte',statusPdf:pdf?'existente':arquivo?'pendente':'sem-arquivo'};
 delete p.horario;
  if(!p.titulo){msg('Título obrigatório.','erro');return false;}
 const i=state.dados.palestras.findIndex(x=>x.pid===pid);if(i>=0)state.dados.palestras[i]=p;else state.dados.palestras.push(p);
 state.selecionado=pid;state.dirty=true;state.formDirty=false;state.aba='editar';if(preservarArquivos)$('pid').value=pid;else preencher(p);atualizarAbas();render();if(!state.autoSaving)msg('Alteração preparada. Clique em “Publicar alterações” para enviá-la ao GitHub.','alerta');return true;
}
function palestrasVisiveis(){
 const term=$('buscaP').value.trim().toLocaleLowerCase('pt-BR'),filtro=$('filtroP').value;
 return state.dados.palestras.filter(p=>(!term||(p.pid+' '+p.titulo).toLocaleLowerCase('pt-BR').includes(term))&&(filtro==='todos'||(filtro==='semAudio'&&!p.audio)||(filtro==='semPdf'&&!p.pdf)||(filtro==='pdfPendente'&&pdfPendente(p))||(filtro==='naoUtiliza'&&!p.pdf&&p.materialApresentacao==='nao-utiliza')||(filtro==='materialNaoInformado'&&!p.pdf&&(!p.materialApresentacao||p.materialApresentacao==='nao-informado'))||(filtro==='ativas'&&p.ativo!==false)||(filtro==='inativas'&&p.ativo===false)))
 .sort((a,b)=>{const comparacao=(dataEfetivaPalestra(a)||'9999').localeCompare(dataEfetivaPalestra(b)||'9999')||a.pid.localeCompare(b.pid);return state.ordemDesc?-comparacao:comparacao;});
}
function mesclarMudancas(local,base,remoto){
 if(!base||base.versao!==remoto.versao)throw new Error('Versão do cadastro mudou. Recarregue antes de publicar.');
 const mesclado=structuredClone(remoto),antigos=new Map(base.palestras.map(p=>[p.pid,p]));
 const atuais=new Map(mesclado.palestras.map(p=>[p.pid,p])),locais=new Map(local.palestras.map(p=>[p.pid,p]));
 for(const id of antigos.keys())if(!locais.has(id))throw new Error('Remoção concorrente de registro. Recarregue o cadastro.');
 for(const p of local.palestras){
  const antes=antigos.get(p.pid),destino=atuais.get(p.pid);
  if(!antes){
   if(destino)throw new Error('O ID '+p.pid+' foi criado por outra operação. Recarregue.');
   mesclado.palestras.push(structuredClone(p));continue;
  }
  if(!destino)throw new Error('O registro '+p.pid+' foi removido por outra operação. Recarregue.');
  for(const campo of new Set([...Object.keys(antes),...Object.keys(p)])){
   const a=JSON.stringify(antes[campo]),b=JSON.stringify(p[campo]),c=JSON.stringify(destino[campo]);
   if(a===b)continue;
   if(c!==a&&c!==b)throw new Error('Conflito no registro '+p.pid+', campo '+campo+'. Recarregue antes de publicar.');
   if(Object.prototype.hasOwnProperty.call(p,campo))destino[campo]=structuredClone(p[campo]);
   else delete destino[campo];
  }
 }
 return mesclado;
}
function pdfPendente(p){return !p.pdf&&p.materialApresentacao==='possui';}
function render(){atualizarUploadR2();atualizarUploadPdf();$('salvarP').disabled=state.autoSaving||state.statusSaving;const rows=state.dados.palestras; $('totalP').textContent=rows.length;$('videosP').textContent=rows.filter(p=>p.youtubeId).length;$('audiosP').textContent=rows.filter(p=>p.audio).length;$('pdfsP').textContent=rows.filter(p=>p.pdf).length;$('pdfsPendentesP').textContent=rows.filter(pdfPendente).length;$('pdfsNaoUtilizaP').textContent=rows.filter(p=>!p.pdf&&p.materialApresentacao==='nao-utiliza').length;$('pdfsNaoInformadoP').textContent=rows.filter(p=>!p.pdf&&(!p.materialApresentacao||p.materialApresentacao==='nao-informado')).length;
 $('publicarP').disabled=!state.sha||!state.dirty||state.r2Uploading||state.pdfUploading||state.autoSaving||state.statusSaving;
 // ORDEM é a posição cronológica no acervo completo, independentemente de busca, filtro e inversão.
 const ordemCronologica=[...rows].sort((a,b)=>(dataEfetivaPalestra(a)||'9999').localeCompare(dataEfetivaPalestra(b)||'9999')||a.pid.localeCompare(b.pid));
 const numerosOrdem=new Map(ordemCronologica.map((p,i)=>[p.pid,i+1]));
 const filtered=palestrasVisiveis();
 $('exportarFiltradoP').disabled=!filtered.length;
 const list=$('listaP');list.replaceChildren();if(!filtered.length){const e=document.createElement('p');e.className='vazio';e.textContent='Nenhuma palestra encontrada.';list.append(e);return;}
 filtered.forEach((p,i)=>{
  const row=document.createElement('div');row.className='evento evento-registro'+(state.selecionado===p.pid?' ativo':'')+(p.ativo===false?' evento-registro--inativa':'');
  const b=document.createElement('button');b.type='button';b.className='evento-selecionar';b.setAttribute('aria-label','Editar '+p.titulo);
  const n=document.createElement('span');n.className='evento-data';const strong=document.createElement('strong');strong.textContent=String(numerosOrdem.get(p.pid)??(i+1)).padStart(3,'0');const small=document.createElement('span');small.textContent='ORDEM';n.append(strong,small);
  const body=document.createElement('span');body.className='evento-corpo';const t=document.createElement('strong');t.textContent=tituloFraseAdmin(p.titulo);const meta=document.createElement('span');meta.textContent=`${p.pid} · ${dataEfetivaPalestra(p)||'Sem data'}${p.eventoId?' (Agenda)':p.dataAproximada?' (aprox.)':''}`;
  const flags=document.createElement('small');flags.textContent=`Vídeo ${p.youtubeId?'✓':'—'}   MP3 ${p.audio?'✓':'—'}   `;const indicador=document.createElement('span');const [simbolo,descricao,classe]=p.pdf?['✓','PDF disponível','disponivel']:p.materialApresentacao==='possui'?['!','Possui apresentação, PDF pendente','pendente']:p.materialApresentacao==='nao-utiliza'?['—','Não utiliza apresentação','sem']:['?','Material não informado','desconhecido'];indicador.textContent='PDF '+simbolo;indicador.title=descricao;indicador.setAttribute('aria-label',descricao);indicador.className='pdf-indicador pdf-'+classe;flags.append(indicador);body.append(t,meta,flags);b.append(n,body);b.addEventListener('click',()=>selecionar(p.pid));
  const status=document.createElement('button');status.type='button';status.className='status-palestra '+(p.ativo===false?'status-palestra--inativa':'status-palestra--ativa');
  status.textContent=p.ativo===false?'● Inativa':'● Ativa';status.title=p.ativo===false?'Clique para reativar a palestra':'Clique para desativar a palestra e seus materiais';
  status.setAttribute('aria-label',status.title+': '+p.titulo);status.disabled=state.autoSaving||state.statusSaving||state.r2Uploading||state.pdfUploading;
  status.addEventListener('click',()=>alternarStatus(p.pid));row.append(b,status);list.append(row);
 });
}
async function carregar(){$('mensagemP').hidden=true;try{const r=await fetch('/api/admin/palestras',{credentials:'same-origin',cache:'no-store'});const o=await r.json();if(!r.ok)throw new Error(o.erro||`HTTP ${r.status}`);
 if(!o.sha||!Array.isArray(o.dados?.palestras))throw new Error('Resposta incompleta.');state.dados=o.dados;state.sha=o.sha;state.baseDados=structuredClone(o.dados);state.publicados=new Set(o.dados.palestras.map(p=>p.pid));state.dirty=false;const agendaOk=await carregarAgenda();limpar(true);if(agendaOk)$('mensagemP').hidden=true;
 }catch(e){msg('Não foi possível carregar: '+e.message,'erro');}}
async function publicar(semConfirmacao=false,interno=false){
 if(!interno&&(state.aba==='nova'||(state.aba==='editar'&&state.selecionado))&&($('arquivoMp3R2').files.length||$('arquivoPdfGithub').files.length))return salvarEEnviar();
 if(state.statusSaving||(state.autoSaving&&!interno)||state.r2Uploading||state.pdfUploading){if(!interno)msg('Aguarde o envio do arquivo terminar.','alerta');return false;}
 if(!state.sha){msg('Cadastro ainda não carregado.','erro');return false;}
 if(state.dados.palestras.some(p=>p.titulo.startsWith('Palestra a revisar — '))){msg('Revise os títulos provisórios das URLs importadas antes de publicar.','erro');return false;}
 if(state.formDirty&&!salvar(false,interno))return false;
 if(!state.dirty)return true;
 if(!semConfirmacao&&!confirm('Enviar as alterações do cadastro ao GitHub?'))return false;
 $('publicarP').disabled=true;msg('Enviando cadastro ao GitHub…');
 try{
  let dados=state.dados,sha=state.sha;
  for(let tentativa=0;tentativa<2;tentativa++){
   const r=await fetch('/api/admin/palestras',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha,dados})});
   const o=await r.json().catch(()=>({}));
   if(r.status===409&&interno&&state.autoSaving&&tentativa===0){
    const leitura=await fetch('/api/admin/palestras',{credentials:'same-origin',cache:'no-store'});
    const atual=await leitura.json().catch(()=>({}));
    if(!leitura.ok||!atual.sha||!Array.isArray(atual.dados?.palestras))throw new Error('Não foi possível recarregar o cadastro para resolver o conflito.');
    dados=mesclarMudancas(dados,state.baseDados,atual.dados);
    sha=atual.sha;
    msg('O cadastro mudou durante o envio. Conciliando alterações sem sobrescrever outros registros…','alerta');
    continue;
   }
   if(!r.ok||!o.sha)throw new Error(o.erro||`HTTP ${r.status}`);
   state.dados=dados;state.sha=o.sha;state.baseDados=structuredClone(dados);
   state.dirty=false;state.publicados=new Set(dados.palestras.map(p=>p.pid));render();
   ultimoCommit=o.commit||'';if(!state.autoSaving)acompanharPublicacao(ultimoCommit);
   return true;
  }
  throw new Error('Não foi possível concluir a publicação.');
 }catch(e){render();msg('Publicação não concluída: '+e.message,'erro');return false;}
}
async function alternarStatus(pid){
 if(state.statusSaving||state.autoSaving||state.r2Uploading||state.pdfUploading)return;
 if(state.dirty||state.formDirty){msg('Há alterações pendentes. Salve e publique essas alterações antes de mudar o status de uma palestra.','alerta');return;}
 if(!state.sha||!state.publicados.has(pid)){msg('Publique primeiro o cadastro desta palestra.','alerta');return;}
 const original=state.dados.palestras.find(p=>p.pid===pid);if(!original)return;
 const desativar=original.ativo!==false;
 if(desativar&&!confirm('Desativar “'+original.titulo+'”? A palestra, seu vídeo, MP3 e PDF deixarão de aparecer no site público. Os arquivos não serão apagados.'))return;
 const novo=structuredClone(state.dados),registro=novo.palestras.find(p=>p.pid===pid);
 registro.ativo=!desativar;
 state.statusSaving=true;render();msg((desativar?'Desativando':'Reativando')+' palestra no GitHub…');
 try{
  const r=await fetch('/api/admin/palestras',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:state.sha,dados:novo})});
  const o=await r.json().catch(()=>({}));if(!r.ok||!o.sha)throw new Error(o.erro||`HTTP ${r.status}`);
  state.dados=novo;state.sha=o.sha;state.baseDados=structuredClone(novo);
  acompanharPublicacao(o.commit);
 }catch(e){msg('Não foi possível alterar o status: '+e.message,'erro');}
 finally{state.statusSaving=false;render();}
}
async function salvarEEnviar(){
 if(state.autoSaving||state.statusSaving||state.r2Uploading||state.pdfUploading)return;
 const mp3=$('arquivoMp3R2').files[0],pdf=$('arquivoPdfGithub').files[0];
 if(pdf&&$('materialApresentacao').value==='nao-utiliza'){msg('Altere a classificação antes de enviar um PDF.','erro');return;}
 if(!mp3&&!pdf){salvar();return;}
 const novoNaoPublicado=state.aba==='nova'||(state.aba==='editar'&&state.selecionado&&!state.publicados.has(state.selecionado));
 if(!state.sha){msg('Aguarde o carregamento do cadastro antes de salvar.','erro');return;}
 if(mp3&&!state.r2Ativo){msg('Envio de MP3 indisponível: '+state.r2Erro,'erro');return;}
 if(mp3&&(!/\.mp3$/i.test(mp3.name)||!mp3.size||mp3.size>300*1024*1024)){msg('Selecione um MP3 válido de até 300 MB.','erro');return;}
 if(pdf&&(!/\.pdf$/i.test(pdf.name)||pdf.size<5||pdf.size>20*1024*1024)){msg('Selecione um PDF válido de até 20 MiB.','erro');return;}
 if(state.dirty&&!confirm('Há outras alterações preparadas no Acervo. Para enviar os arquivos, será necessário publicá-las junto com esta palestra. Continuar?'))return;
 state.autoSaving=true;render();
 try{
  if(!salvar(true,true))return;
  if(novoNaoPublicado){
   const registro=state.dados.palestras.find(p=>p.pid===state.selecionado);
   // Apenas palestras novas ficam temporariamente inativas; não ocultar registros já publicados.
   registro.ativo=false;state.dirty=true;
   msg('Etapa 1/3: reservando o ID e publicando o cadastro inicial…');
   if(!await publicar(true,true))return;
  }
  let mp3Ok=!mp3,pdfOk=!pdf;
  if(mp3){msg('Enviando MP3 ao R2…');mp3Ok=await enviarMp3R2();}
  if(pdf){msg('Enviando PDF ao GitHub…');pdfOk=await enviarPdfGithub();}
  const algumEnviado=(mp3&&mp3Ok)||(pdf&&pdfOk),completo=mp3Ok&&pdfOk;
  if(!algumEnviado){
   msg(novoNaoPublicado?'Nenhum arquivo foi enviado. A palestra nova permanece inativa; corrija o erro e tente novamente.':'Nenhum arquivo foi enviado. O cadastro não foi publicado; corrija o erro e tente novamente.','erro');
   return;
  }
  if(!salvar(true,true))throw new Error('Arquivos enviados, mas não foi possível preparar os vínculos. Não reenvie os arquivos já concluídos.');
  if(novoNaoPublicado&&completo){
   state.dados.palestras.find(p=>p.pid===state.selecionado).ativo=true;
   state.dirty=true;
  }
  msg('Vinculando arquivos ao cadastro e publicando no GitHub…');
  if(!await publicar(true,true))throw new Error('Os arquivos enviados permanecem armazenados. Não os reenvie; use “Publicar alterações” para concluir os vínculos.');
  const registroFinal=state.dados.palestras.find(p=>p.pid===state.selecionado);
  if(!completo){
   msg('Publicação parcial: os arquivos enviados foram vinculados, mas houve falha em outro envio. Confira os avisos e tente novamente apenas o arquivo pendente.'+(registroFinal?.ativo===false?' A palestra permanece inativa.':''),'alerta');
  }else if(registroFinal?.ativo===false){
   msg('Arquivos enviados e vinculados. A palestra continua inativa; ative-a no Acervo quando estiver pronta.','alerta');
  }else{
   acompanharPublicacao(ultimoCommit);
  }
 }catch(e){msg('Cadastro ou envio não concluído: '+e.message,'erro');}
 finally{state.autoSaving=false;render();}
}
function csvRows(text){const out=[];let row=[],val='',q=false;for(let i=0;i<text.length;i++){const c=text[i];if(q){if(c==='"'&&text[i+1]==='"'){val+='"';i++;}else if(c==='"')q=false;else val+=c;}else if(c==='"')q=true;else if(c===', '){val+=c;}else if(c===','||c===';' ){row.push(val);val='';}else if(c==='\n'){row.push(val.replace(/\r$/,''));out.push(row);row=[];val='';}else val+=c;}if(q)throw Error('Aspas não fechadas no CSV.');if(val||row.length){row.push(val);out.push(row);}return out;}
function parseCSV(text){const lines=csvRows(text.replace(/^\uFEFF/,''));if(lines.length<2)throw Error('CSV sem registros.');const normalize=s=>s.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const cols=lines.shift().map(normalize);const aliases={id:['id'],titulo:['titulo','title'],data:['data','date'],youtube:['youtube','url','url do youtube'],apresentacao:['apresentacao','arquivo','pdf','pptx'],material:['materialapresentacao','material de apresentacao'],serie:['serie'],linkpdf:['linkpdf','link do pdf','urlpdf']};
 const idx=Object.fromEntries(Object.entries(aliases).map(([k,a])=>[k,cols.findIndex(c=>a.includes(c))]));if(idx.titulo<0||idx.youtube<0&&idx.apresentacao<0)throw Error('Cabeçalho precisa de Titulo e YouTube ou Apresentacao.');
 return lines.filter(x=>x.some(v=>v.trim())).map((x,i)=>{const get=k=>idx[k]<0?'':(x[idx[k]]||'').trim();return {linha:i+2,id:get('id'),titulo:get('titulo'),data:get('data'),youtube:get('youtube'),arquivo:get('apresentacao'),material:get('material'),serie:get('serie'),linkpdf:get('linkpdf')};});}
function importar(items){if(!confirmarDescarte())return;const working=structuredClone(state.dados.palestras);const problems=[],changes=[];let next=Math.max(0,...working.map(p=>Number((p.pid||'').slice(4))||0));
 for(const item of items){const y=idYoutube(item.youtube||'');if(y===null){problems.push(`Linha ${item.linha}: URL inválida`);continue;}
 if(item.data&&!/^\d{4}-\d{2}-\d{2}$/.test(item.data)){problems.push(`Linha ${item.linha}: data inválida`);continue;}
 if(item.arquivo&&(/[\\/]/.test(item.arquivo)||!/\.(ppt|pptx|pdf)$/i.test(item.arquivo))){problems.push(`Linha ${item.linha}: arquivo inválido`);continue;}
 const material=item.material||'',serie=item.serie||'',linkpdf=item.linkpdf||'';
 if(material&&!['possui','nao-utiliza','nao-informado'].includes(material)){problems.push(`Linha ${item.linha}: material de apresentação inválido`);continue;}
 if(serie&&!['temas','doutrina','evangelho','ministerio','parabolas','ultimos-dias'].includes(serie)){problems.push(`Linha ${item.linha}: série inválida`);continue;}
 if(linkpdf&&(linkpdf.length>1500||! /^(https:\/\/|\/)/.test(linkpdf))){problems.push(`Linha ${item.linha}: link PDF inválido`);continue;}
 let p=item.id?working.find(x=>x.pid===item.id):y?working.find(x=>x.youtubeId===y):null;
 if(item.id&&!p){problems.push(`Linha ${item.linha}: ID ${item.id} não existe`);continue;}
 if(p&&y&&p.youtubeId&&p.youtubeId!==y){problems.push(`Linha ${item.linha}: ID e YouTube diferentes`);continue;}
 if(y&&working.some(x=>x.youtubeId===y&&x!==p)){problems.push(`Linha ${item.linha}: YouTube duplicado`);continue;}
 if(!p&&!item.titulo){problems.push(`Linha ${item.linha}: título obrigatório para novo registro`);continue;}
 const isNew=!p;if(isNew){p={pid:'PAL-'+String(++next).padStart(4,'0'),titulo:tituloSemPontoFinal(item.titulo),serie:'temas',data:'',dataAproximada:true,youtubeId:'',audio:'',pdf:'',apresentacaoOriginal:'',statusAudio:'sem-fonte',statusPdf:'sem-arquivo',ativo:true};working.push(p);}
 if(item.titulo)p.titulo=tituloSemPontoFinal(item.titulo);if(item.data)p.data=item.data;if(y){p.youtubeId=y;if(!p.audio)p.statusAudio='pendente';}
 if(material)p.materialApresentacao=material;if(serie)p.serie=serie;
 if(linkpdf){p.pdf=linkpdf;p.statusPdf='existente';}
 if(item.arquivo){p.apresentacaoOriginal=item.arquivo;if(!p.pdf)p.statusPdf='pendente';}
 changes.push(`${isNew?'NOVA':'ATUALIZAR'} ${p.pid}: ${p.titulo}`);
 }
 if(problems.length){alert('Importação não aplicada. Corrija os problemas:\n'+problems.slice(0,25).join('\n'));return;}
 if(!changes.length){msg('Nenhuma linha válida encontrada.','alerta');return;}
 if(!confirm(`Prévia da importação (${changes.length} linhas):\n\n${changes.slice(0,18).join('\n')}${changes.length>18?'\n…':''}\n\nAplicar à lista? A publicação no GitHub será separada.`))return;
 state.dados.palestras=working;state.dirty=true;state.formDirty=false;state.selecionado=null;state.aba='importar';$('formP').reset();$('centroId').value='';$('pid').value=novoId();$('eventoId').value='';atualizarVinculoAgenda();atualizarAbas();render();msg(`${changes.length} linhas preparadas. Confira e publique quando estiver pronto.`, 'alerta');
}
function baixarCSV(rows,nome){
 if(!rows.length){msg('Nenhuma palestra corresponde aos filtros atuais.','alerta');return;}
 const escape=v=>'"'+String(v??'').replace(/"/g,'""')+'"';
 const lines=[['ID','Titulo','Data','YouTube','Apresentacao','MaterialApresentacao','Serie','LinkPDF'].join(',')];
 for(const p of rows)lines.push([p.pid,p.titulo,p.data,p.youtubeId?'https://www.youtube.com/watch?v='+p.youtubeId:'',p.apresentacaoOriginal,p.materialApresentacao||'nao-informado',p.serie,p.pdf].map(escape).join(','));
 const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=nome;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function exportar(){baixarCSV(state.dados.palestras,'palestras-com-ids.csv');}
function exportarFiltrado(){baixarCSV(palestrasVisiveis(),'palestras-'+$('filtroP').value+'.csv');}
$('fecharMensagemP').addEventListener('click',()=>{ $('mensagemP').hidden=true; });
$('eventoId').addEventListener('change',atualizarVinculoAgenda);
$('formP').addEventListener('submit',e=>{e.preventDefault();salvarEEnviar();});$('formP').addEventListener('input',e=>{if(e.target.id==='titulo')state.tituloEditado=true;if(!['arquivoMp3R2','arquivoPdfGithub'].includes(e.target.id))state.formDirty=true;});$('formP').addEventListener('change',e=>{if(!['arquivoMp3R2','arquivoPdfGithub'].includes(e.target.id))state.formDirty=true;});
 $('fecharStatusAudioR2').addEventListener('click',()=>{$('avisoAudioR2').hidden=true;});
 $('fecharStatusPdfGithub').addEventListener('click',()=>{$('avisoPdfGithub').hidden=true;});
 $('arquivoMp3R2').addEventListener('change',()=>{$('statusAudioR2').className='upload-r2-status';atualizarUploadR2();});
 $('materialApresentacao').addEventListener('change',()=>{if($('materialApresentacao').value==='nao-utiliza'&&$('arquivoPdfGithub').files.length){if(!confirm('Descartar a seleção do PDF ainda não enviado?')){$('materialApresentacao').value='nao-informado';atualizarUploadPdf();return;}limparSelecaoPdf();}atualizarUploadPdf();});
 $('arquivoPdfGithub').addEventListener('change',()=>{$('statusPdfGithub').className='upload-r2-status';atualizarUploadPdf();});$('cancelarP').addEventListener('click',descartarFormulario);$('abaEditar').addEventListener('click',()=>trocarAba('editar'));$('abaNova').addEventListener('click',()=>trocarAba('nova'));$('abaImportar').addEventListener('click',()=>trocarAba('importar'));$('publicarP').addEventListener('click',()=>publicar());$('buscaP').addEventListener('input',render);$('filtroP').addEventListener('change',render);
$('ordenarP').addEventListener('click',()=>{
 state.ordemDesc=!state.ordemDesc;
 const botao=$('ordenarP');
 const descricao=state.ordemDesc?'Mais recentes primeiro. Clique para mostrar as mais antigas primeiro.':'Mais antigas primeiro. Clique para mostrar as mais recentes primeiro.';
 botao.setAttribute('aria-pressed',String(state.ordemDesc));
 botao.setAttribute('aria-label',descricao);
 botao.title=descricao;
 render();
});
$('exportarFiltradoP').addEventListener('click',exportarFiltrado);
 $('csvP').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{importar(parseCSV(await f.text()));}catch(err){msg('CSV inválido: '+err.message,'erro');}e.target.value='';});$('exportarP').addEventListener('click',exportar);
$('colarP').addEventListener('click',()=>{$('urlsP').hidden=!$('urlsP').hidden;$('aplicarUrlsP').hidden=$('urlsP').hidden;$('rotuloUrlsP').hidden=$('urlsP').hidden;});
$('aplicarUrlsP').addEventListener('click',()=>{const urls=$('urlsP').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const items=urls.map((url,i)=>({linha:i+1,id:'',titulo:'',data:'',youtube:url,arquivo:''}));
 // URLs novas precisam de título; gerar rascunho a partir do identificador, para revisão manual obrigatória.
 for(const it of items){const id=idYoutube(it.youtube);it.titulo=id?'Palestra a revisar — '+id:'';}
 importar(items);});
window.addEventListener('beforeunload',e=>{if(state.dirty||state.formDirty||state.r2Uploading||state.pdfUploading||state.autoSaving||state.statusSaving){e.preventDefault();e.returnValue='';}});const filtroInicial=new URLSearchParams(location.search).get('filtro');if(['pdfPendente','materialNaoInformado'].includes(filtroInicial))$('filtroP').value=filtroInicial;carregarCentros().then(carregar);consultarR2();
