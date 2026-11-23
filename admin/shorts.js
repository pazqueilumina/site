'use strict';
const $ = id => document.getElementById(id);
const estado = {dados:{versao:1,proximoId:1,shorts:[]},sha:null,selecionado:null,alterado:false,formAlterado:false,publicando:false};
function aviso(texto,tipo=''){ $('mensagemShortsTexto').textContent=texto;$('mensagemShorts').className='mensagem'+(tipo?' '+tipo:'');$('mensagemShorts').hidden=false; }
function youtubeId(valor){
 const texto=String(valor||'').trim();
 if(/^[a-zA-Z0-9_-]{11}$/.test(texto))return texto;
 try{
  const u=new URL(texto);
  if(u.protocol!=='https:'&&u.protocol!=='http:')return null;
  const host=u.hostname.toLowerCase().replace(/^(www\.|m\.)/,'');
  let id='';
  if(host==='youtu.be')id=u.pathname.split('/')[1];
  else if(host==='youtube.com'||host==='youtube-nocookie.com')id=u.searchParams.get('v')||(u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)||[])[1];
  return /^[a-zA-Z0-9_-]{11}$/.test(id||'')?id:null;
 }catch{return null;}
}
function formatarTitulo(titulo){
 const limpo=String(titulo||'').trim().replace(/\s+/g,' ');
 // Converter somente títulos inteiramente em caixa alta; respeitar títulos mistos.
 if(limpo!==limpo.toLocaleUpperCase('pt-BR')||limpo===limpo.toLocaleLowerCase('pt-BR'))return limpo;
 const nomes={deus:'Deus',jesus:'Jesus',chico:'Chico',xavier:'Xavier',allan:'Allan',kardec:'Kardec',brasil:'Brasil',youtube:'YouTube',eua:'EUA',tdah:'TDAH',toc:'TOC'};
 return limpo.toLocaleLowerCase('pt-BR')
  .replace(/(^|[.!?]\s*)(\p{L})/gu,(_,inicio,letra)=>inicio+letra.toLocaleUpperCase('pt-BR'))
  .replace(/[\p{L}]+/gu,palavra=>nomes[palavra]||palavra);
}
function idNovo(){return 'SHO-'+String(estado.dados.proximoId).padStart(4,'0');}
function normalizarOrdem(){estado.dados.shorts.forEach((s,i)=>s.ordem=i+1);}
function listaOrdenada(){return [...estado.dados.shorts].sort((a,b)=>a.ordem-b.ordem||a.sid.localeCompare(b.sid));}
function podeSair(){return !estado.formAlterado||confirm('Há alterações no formulário ainda não salvas. Deseja descartá-las?');}
function preencher(s){
 estado.selecionado=s?s.sid:null;
 $('sidShort').textContent=s?s.sid:idNovo();
 $('tituloShort').value=s?s.titulo:'';
 $('urlShort').value=s?'https://www.youtube.com/shorts/'+s.youtubeId:'';
 $('statusShort').value=s&&s.ativo===false?'inativo':'ativo';
 $('tituloEditorShort').textContent=s?'Editar Short':'Novo Short';
 $('excluirShort').hidden=!s;
 estado.formAlterado=false;
 atualizarPreview();
 render();
}
function novo(){
 if(!podeSair())return;
 preencher(null);
 $('tituloShort').focus();
}
function selecionar(sid){
 if(!podeSair())return;
 const s=estado.dados.shorts.find(x=>x.sid===sid);
 if(s)preencher(s);
}
function atualizarPreview(){
 const id=youtubeId($('urlShort').value);
 $('previewShort').hidden=!id;
 $('avisoPreviewShort').hidden=!!id;
 if(!id){$('avisoPreviewShort').textContent=$('urlShort').value.trim()?'Link do YouTube inválido.':'Cole um link válido para visualizar a miniatura.';return;}
 $('previewShortImagem').src='https://i.ytimg.com/vi/'+id+'/hq720.jpg';
 $('previewShortLink').href='https://www.youtube.com/shorts/'+id;
}
function render(){
 const todos=listaOrdenada(),busca=$('buscaShort').value.trim().toLocaleLowerCase('pt-BR'),filtro=$('filtroShort').value;
 $('totalShorts').textContent=todos.length;
 $('ativosShorts').textContent=todos.filter(s=>s.ativo!==false).length;
 $('inativosShorts').textContent=todos.filter(s=>s.ativo===false).length;
 $('situacaoShorts').textContent=estado.alterado?'Alterações pendentes':estado.sha?'Atualizado':'Indisponível';
 $('publicarShorts').disabled=!estado.sha||!estado.alterado||estado.publicando;
 $('salvarShort').disabled=estado.publicando;
 $('excluirShort').disabled=estado.publicando;
 const visiveis=todos.filter(s=>(!busca||(s.sid+' '+s.titulo).toLocaleLowerCase('pt-BR').includes(busca))&&(filtro==='todos'||(filtro==='ativos'&&s.ativo!==false)||(filtro==='inativos'&&s.ativo===false)));
 const host=$('listaShorts');host.replaceChildren();
 if(!visiveis.length){const p=document.createElement('p');p.className='vazio';p.textContent='Nenhum Short encontrado.';host.append(p);return;}
 const reordenarPermitido=!busca&&filtro==='todos'&&!estado.publicando;
 visiveis.forEach(s=>{
  const idx=todos.findIndex(x=>x.sid===s.sid);
  const linha=document.createElement('div');linha.className='short-registro'+(estado.selecionado===s.sid?' selecionado':'')+(s.ativo===false?' inativo':'');
  const escolher=document.createElement('button');escolher.type='button';escolher.className='short-escolher';escolher.addEventListener('click',()=>selecionar(s.sid));
  const img=document.createElement('img');img.className='short-thumb';img.loading='lazy';img.alt='';img.src='https://i.ytimg.com/vi/'+s.youtubeId+'/hqdefault.jpg';
  const circulo=document.createElement('span');circulo.className='short-thumb-circulo';circulo.append(img);
  const dados=document.createElement('span');dados.className='short-dados';
  const titulo=document.createElement('strong');titulo.textContent=s.titulo;
  const meta=document.createElement('small');meta.textContent=s.sid+' · '+(s.ativo===false?'Inativo':'Ativo')+' · Ordem '+s.ordem;
  dados.append(titulo,meta);escolher.append(circulo,dados);
  const controles=document.createElement('div');controles.className='short-ordem';
  for(const [delta,rotulo] of [[-1,'↑'],[1,'↓']]){
   const b=document.createElement('button');b.type='button';b.textContent=rotulo;b.title=delta<0?'Subir Short':'Descer Short';b.setAttribute('aria-label',b.title+': '+s.titulo);
   b.disabled=!reordenarPermitido||(delta<0?idx===0:idx===todos.length-1);
   b.addEventListener('click',()=>mover(s.sid,delta));controles.append(b);
  }
  const acao=document.createElement('button');
  acao.type='button';acao.className='short-toggle '+(s.ativo===false?'status-short--inativo':'status-short--ativo');
  acao.textContent=s.ativo===false?'● Inativo':'● Ativo';
  acao.title=s.ativo===false?'Clique para reativar o Short':'Clique para desativar o Short';
  acao.setAttribute('aria-label',acao.title+': '+s.titulo);
  acao.disabled=estado.publicando;
  acao.addEventListener('click',()=>alternarAtivo(s.sid));
  linha.append(escolher,acao,controles);host.append(linha);
 });
}
function alternarAtivo(sid){
 if(!podeSair())return;
 const s=estado.dados.shorts.find(x=>x.sid===sid);
 if(!s||estado.publicando)return;
 s.ativo=!s.ativo;
 estado.alterado=true;
 const atual=estado.dados.shorts.find(x=>x.sid===estado.selecionado);
 preencher(atual||null);
 aviso('Short '+(s.ativo?'ativado':'desativado')+' na lista. Clique em Publicar alterações para atualizar o site.','alerta');
}
function mover(sid,delta){
 if(!podeSair())return;
 const todos=listaOrdenada(),i=todos.findIndex(s=>s.sid===sid),j=i+delta;
 if(i<0||j<0||j>=todos.length)return;
 [todos[i],todos[j]]=[todos[j],todos[i]];
 estado.dados.shorts=todos;normalizarOrdem();estado.alterado=true;
 const atual=estado.dados.shorts.find(x=>x.sid===estado.selecionado);
 preencher(atual||null);
 aviso('Ordem alterada. Clique em Publicar alterações para atualizar o site.','alerta');
}
function salvar(evento){
 evento.preventDefault();
 if(!estado.sha){aviso('Aguarde o carregamento do cadastro.','erro');return;}
 if(!$('formShort').reportValidity())return;
 const id=youtubeId($('urlShort').value),titulo=formatarTitulo($('tituloShort').value);
 if(!id){aviso('Informe um link válido do YouTube.','erro');return;}
 if(!titulo){aviso('O título é obrigatório.','erro');return;}
 const duplicado=estado.dados.shorts.find(s=>s.youtubeId===id&&s.sid!==estado.selecionado);
 if(duplicado){aviso('Este vídeo já está cadastrado em '+duplicado.sid+'.','erro');return;}
 let s=estado.dados.shorts.find(x=>x.sid===estado.selecionado);
 if(s){s.titulo=titulo;s.youtubeId=id;s.ativo=$('statusShort').value==='ativo';}
 else{
  s={sid:idNovo(),youtubeId:id,titulo,ativo:$('statusShort').value==='ativo',ordem:estado.dados.shorts.length+1};
  estado.dados.proximoId++;estado.dados.shorts.unshift(s);
 }
 normalizarOrdem();estado.alterado=true;preencher(s);
 aviso('Short salvo na lista. Clique em Publicar alterações para atualizar o site.','alerta');
}
function excluir(){
 const s=estado.dados.shorts.find(x=>x.sid===estado.selecionado);if(!s)return;
 if(!confirm('Excluir definitivamente o Short “'+s.titulo+'” do cadastro? O vídeo continuará no YouTube.'))return;
 estado.dados.shorts=estado.dados.shorts.filter(x=>x.sid!==s.sid);
 normalizarOrdem();estado.alterado=true;estado.formAlterado=false;preencher(null);
 aviso('Short excluído da lista. Clique em Publicar alterações para confirmar.','alerta');
}
async function publicar(){
 if(estado.formAlterado){aviso('Salve primeiro as alterações do formulário.','alerta');return;}
 if(!estado.alterado||!estado.sha||estado.publicando)return;
 if(!confirm('Publicar as alterações dos Shorts no site?'))return;
 estado.publicando=true;render();aviso('Publicando cadastro no GitHub…');
 try{
  const r=await fetch('/api/admin/shorts',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:estado.sha,dados:estado.dados})});
  const resposta=await r.json().catch(()=>({}));
  if(!r.ok||!resposta.sha)throw new Error(resposta.erro||'HTTP '+r.status);
  estado.sha=resposta.sha;estado.alterado=false;
  aviso('Cadastro publicado no GitHub. Aguarde o deploy automático do Cloudflare Pages.','sucesso');
 }catch(e){aviso('Não foi possível publicar: '+e.message,'erro');}
 finally{estado.publicando=false;render();}
}
async function carregar(){
 try{
  const r=await fetch('/api/admin/shorts',{credentials:'same-origin',cache:'no-store'});
  const resposta=await r.json().catch(()=>({}));
  if(!r.ok||!resposta.sha||!Array.isArray(resposta.dados?.shorts))throw new Error(resposta.erro||'Cadastro indisponível.');
  estado.sha=resposta.sha;estado.dados=resposta.dados;
  estado.dados.shorts=listaOrdenada();normalizarOrdem();
  preencher(null);
  $('mensagemShorts').hidden=true;
 }catch(e){aviso('Falha ao carregar Shorts: '+e.message,'erro');render();}
}
$('novoShort').addEventListener('click',novo);
$('formShort').addEventListener('submit',salvar);
$('cancelarShort').addEventListener('click',()=>{if(!podeSair())return;const s=estado.dados.shorts.find(x=>x.sid===estado.selecionado);preencher(s||null);});
$('excluirShort').addEventListener('click',excluir);
$('publicarShorts').addEventListener('click',publicar);
$('buscaShort').addEventListener('input',render);
$('filtroShort').addEventListener('change',render);
$('urlShort').addEventListener('input',atualizarPreview);
$('previewShortImagem').addEventListener('error',function(){if(this.src.endsWith('/hq720.jpg'))this.src=this.src.replace('/hq720.jpg','/hqdefault.jpg');});
$('formShort').addEventListener('input',()=>{estado.formAlterado=true;});
$('formShort').addEventListener('change',()=>{estado.formAlterado=true;});
$('fecharMensagemShorts').addEventListener('click',()=>{$('mensagemShorts').hidden=true;});
window.addEventListener('beforeunload',e=>{if(estado.alterado||estado.formAlterado){e.preventDefault();e.returnValue='';}});
carregar();
