'use strict';
const $ = id => document.getElementById(id);
const API = '/api/admin/locais';
const estado = { locais: [], sha: null, selecionado: null, alterado: false, formularioAlterado: false, verificacao: new Map(), verificando: false, verificadosNaRodada: 0, pendentesNovos: new Set(), filtroErros: false };
const CHAVE_VERIFICACAO='pazqueilumina-locais-verificacao-v1';
const campos = { nome:'nomeLocal', endereco:'enderecoLocal', bairro:'bairroLocal', cidade:'cidadeLocal', uf:'ufLocal', maps:'mapsLocal', latitude:'latitudeLocal', longitude:'longitudeLocal', kmIdaVolta:'kmIdaVoltaLocal' };
const normalizar = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ');
const slug = s => normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'local';
function mensagem(t, classe='') { $('mensagemTexto').textContent=t; $('mensagemLocais').className='mensagem' + (classe?' '+classe:''); $('mensagemLocais').hidden=false; }
function atualizarResumo() {
  $('totalLocais').textContent=estado.locais.length;
  $('situacaoLocais').textContent=estado.alterado?'Não publicado':'Atualizado';
  $('situacaoLocais').style.color=estado.alterado?'#94691f':'#3a795e';
  $('publicarLocais').disabled=!estado.sha||!estado.alterado;
  $('cartaoSituacaoLocais').classList.toggle('pendente',estado.alterado);
  atualizarResumoVerificacao();
}

const assinaturaLocal=l=>[l.nome,l.endereco,l.bairro,l.cidade,l.uf,l.maps,l.latitude,l.longitude].map(normalizar).join('|');
function resultadoLocal(l){
 const r=estado.verificacao.get(l.id);
 return r&&r.assinatura===assinaturaLocal(l)?r:null;
}

/* Histórico local: sem consultar serviços de mapas ao abrir a página.
 * Não persistir coordenadas de serviços com restrições de armazenamento (ArcGIS). */
function salvarHistoricoVerificacao(){
 try{
  const itens=estado.locais.map(l=>{
   const r=resultadoLocal(l);
   if(!r||r.status==='pendente')return null;
   const item={id:l.id,assinatura:r.assinatura,status:r.status,motivo:r.motivo||'',
    fonte:r.fonte||'',verificadoEm:r.verificadoEm||Date.now(),nomeLocalizado:!!r.nomeLocalizado};
   if(['OpenStreetMap','Google Maps','Cadastro'].includes(r.fonte)&&
      Number.isFinite(r.latitude)&&Number.isFinite(r.longitude)){
    item.latitude=r.latitude;item.longitude=r.longitude;
   }
   return item;
  }).filter(Boolean);
  localStorage.setItem(CHAVE_VERIFICACAO,JSON.stringify({itens}));
 }catch{/* Navegador pode bloquear armazenamento; verificação manual continua funcionando. */}
}
function restaurarHistoricoVerificacao(){
 estado.verificacao.clear();
 try{
  const salvo=JSON.parse(localStorage.getItem(CHAVE_VERIFICACAO)||'null');
  if(!Array.isArray(salvo?.itens))return;
  const permitidos=new Set(['ok','aproximado','manual','link','erro']);
  for(const r of salvo.itens.slice(0,500)){
   if(!r||typeof r.id!=='string'||!permitidos.has(r.status))continue;
   const l=estado.locais.find(x=>x.id===r.id);
   if(!l||r.assinatura!==assinaturaLocal(l))continue;
   const item={assinatura:r.assinatura,status:r.status,
    motivo:typeof r.motivo==='string'?r.motivo.slice(0,180):'',
    fonte:typeof r.fonte==='string'?r.fonte.slice(0,60):'',
    nomeLocalizado:!!r.nomeLocalizado,
    verificadoEm:Number.isFinite(r.verificadoEm)?r.verificadoEm:0};
   if(['OpenStreetMap','Google Maps','Cadastro'].includes(item.fonte)&&
      Number.isFinite(r.latitude)&&Number.isFinite(r.longitude)){
    item.latitude=r.latitude;item.longitude=r.longitude;
   }
   estado.verificacao.set(r.id,item);
  }
 }catch{/* Histórico corrompido não impede acesso ao cadastro. */}
}

function atualizarResumoVerificacao(){
 const resultados=estado.locais.map(resultadoLocal);
 const verificados=resultados.filter(r=>r&&r.status!=='pendente').length;
 const erros=resultados.filter(r=>r?.status==='erro').length;
 const aproximados=resultados.filter(r=>r?.status==='aproximado').length;
 const manuais=resultados.filter(r=>r?.status==='manual').length;
 const links=resultados.filter(r=>r?.status==='link').length;
 const pendentes=estado.locais.length-verificados;
 $('errosLocais').textContent=verificados?String(erros):(estado.locais.length===0?'0':'—');
 const ultima=Math.max(0,...resultados.map(r=>r?.verificadoEm||0));
 const quando=ultima?' · Última: '+new Date(ultima).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}):'';
 $('statusVerificacaoLocais').textContent=estado.verificando
  ?'Verificando… '+estado.verificadosNaRodada+' de '+estado.locais.length+' · '+verificados+' resultado(s) salvo(s)'
  :!estado.locais.length?'Nenhum local cadastrado'
  :!verificados?'Sem verificação salva neste navegador'
  :pendentes?verificados+' de '+estado.locais.length+' avaliados · '+pendentes+' pendente(s)'+quando
  :verificados+' de '+estado.locais.length+' avaliados'+(aproximados?' · '+aproximados+' aproximado(s)':'')+(manuais?' · '+manuais+' com coordenadas manuais':'')+(links?' · '+links+' com link do mapa':'')+quando;
 $('verificarLocais').disabled=estado.verificando||!estado.sha||!estado.locais.length;
 $('verificarLocais').textContent=estado.verificando?'Verificando…':'Verificar endereços';
 $('cartaoErrosLocais').classList.toggle('tem-erros',erros>0);
 $('filtrarErrosLocais').setAttribute('aria-pressed',String(estado.filtroErros));
 $('filtrarErrosLocais').title=estado.filtroErros?'Mostrar todos os locais':'Mostrar somente os endereços com erro';
}
async function verificarEnderecos(){
 if(estado.verificando||!estado.sha)return;
 estado.verificando=true;
 estado.verificadosNaRodada=0;
 const locais=estado.locais.map(l=>({...l}));
 renderizar();
 for(let i=0;i<locais.length;i++){
  const l=locais[i],assinatura=assinaturaLocal(l);
  try{
   const r=await fetch('/api/admin/verificar-enderecos',{
    method:'POST',credentials:'same-origin',cache:'no-store',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({local:l})
   });
   const d=await r.json();
   if(!r.ok)throw Error(d.erro||'Falha na consulta.');
   if(d.id!==l.id||!['ok','aproximado','manual','link','erro','pendente'].includes(d.status))throw Error('Resposta inesperada.');
   estado.verificacao.set(l.id,{assinatura,status:d.status,motivo:d.motivo||'',fonte:d.fonte||'',
    latitude:d.latitude,longitude:d.longitude,nomeLocalizado:!!d.nomeLocalizado,verificadoEm:Date.now()});
   estado.pendentesNovos.delete(l.id);
   salvarHistoricoVerificacao();
  }catch{
   // Manter a última verificação conhecida se a rede falhar.
   if(!resultadoLocal(l))estado.verificacao.set(l.id,{assinatura,status:'pendente',motivo:'Não foi possível verificar agora.'});
  }
  estado.verificadosNaRodada=i+1;
  renderizar();
  // Evita consultas simultâneas ao Nominatim entre locais diferentes.
  if(i<locais.length-1)await new Promise(resolve=>setTimeout(resolve,1200));
 }
 estado.verificando=false;
 renderizar();
}


function atualizarSugestaoCoordenadas(){
 const host=$('sugestaoCoordenadas'),l=estado.locais.find(x=>x.id===estado.selecionado),r=l&&resultadoLocal(l);
 // Somente pontos específicos do OpenStreetMap ou links do Google Maps podem ser sugeridos
 // para persistência. ArcGIS é utilizado apenas para consulta, sem armazenamento automático.
 const permitida=r&&(['ok','link'].includes(r.status)||(r.status==='aproximado'&&r.nomeLocalizado))&&
  ['OpenStreetMap','Google Maps'].includes(r.fonte);
 const disponivel=permitida&&Number.isFinite(r.latitude)&&Number.isFinite(r.longitude);
 host.hidden=!disponivel;
 $('tituloCoordenadas').textContent=disponivel?'Coordenadas geográficas · sugestão disponível':'Coordenadas geográficas (opcional)';
 if(!disponivel)return;
 const lat=Number(r.latitude),lon=Number(r.longitude);
 $('textoSugestaoCoordenadas').textContent=(r.nomeLocalizado?'Instituição encontrada pelo nome no ':'Ponto encontrado em ')+r.fonte+': '+lat.toFixed(6)+', '+lon.toFixed(6)+'. Confira o imóvel antes de salvar.';
 $('abrirSugestaoMapa').href='https://www.google.com/maps?q='+lat.toFixed(7)+','+lon.toFixed(7);
}
function aplicarCoordenadasSugeridas(){
 const l=estado.locais.find(x=>x.id===estado.selecionado),r=l&&resultadoLocal(l);
 if(!r||!(['ok','link'].includes(r.status)||(r.status==='aproximado'&&r.nomeLocalizado))||
  !['OpenStreetMap','Google Maps'].includes(r.fonte)||
  !Number.isFinite(r.latitude)||!Number.isFinite(r.longitude))return;
 const fmt=n=>Number(n).toFixed(7).replace(/0+$/,'').replace(/\.$/,'');
 $('latitudeLocal').value=fmt(r.latitude);
 $('longitudeLocal').value=fmt(r.longitude);
 $('detalhesCoordenadas').open=true;
 estado.formularioAlterado=true;
 mensagem('Coordenadas preenchidas no formulário. Confira no mapa, salve na lista e publique para armazená-las.','alerta');
}

function atualizarBuscaNoMapa(){
 const l=estado.locais.find(x=>x.id===estado.selecionado);
 const camposBusca=l||{nome:$('nomeLocal').value,endereco:$('enderecoLocal').value,
  bairro:$('bairroLocal').value,cidade:$('cidadeLocal').value,uf:$('ufLocal').value};
 const query=[camposBusca.nome,camposBusca.endereco,camposBusca.bairro,camposBusca.cidade,camposBusca.uf].filter(Boolean).join(', ');
 $('buscarEnderecoNoMapa').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query||'Rio de Janeiro');
}
function renderizar() {
  atualizarResumo();
  atualizarBuscaNoMapa();
  atualizarSugestaoCoordenadas();
  const busca=normalizar($('buscaLocal').value);
  const lista=$('listaLocais'); lista.replaceChildren();
  const locais=estado.locais.filter(l=>(!estado.filtroErros||resultadoLocal(l)?.status==='erro')&&(!busca||normalizar([l.nome,l.endereco,l.bairro,l.cidade,l.uf].join(' ')).includes(busca)))
    .sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  if (!locais.length) { const p=document.createElement('p');p.className='vazio';p.textContent=estado.filtroErros?'Nenhum endereço com erro identificado.':'Nenhum local encontrado.';lista.append(p);return; }
  for(const l of locais){
    const b=document.createElement('button');b.type='button';b.className='evento'+(l.id===estado.selecionado?' ativo':'');
    const resultado=resultadoLocal(l);
    if(resultado?.status==='erro')b.classList.add('local-com-erro');
    if(resultado?.status==='aproximado')b.classList.add('local-aproximado');
    if(!resultado&&estado.pendentesNovos.has(l.id))b.classList.add('local-aproximado');
    const corpo=document.createElement('span');corpo.className='evento-corpo';
    const nome=document.createElement('strong');nome.textContent=l.nome;
    const info=document.createElement('span');info.textContent=[l.bairro,l.cidade,l.uf].filter(Boolean).join(' · ');
    corpo.append(nome,info);
    if(!resultado&&estado.pendentesNovos.has(l.id)){
      const aviso=document.createElement('span');
      aviso.className='local-aviso pendente';
      aviso.textContent='Endereço alterado; verificar novamente';
      corpo.append(aviso);
    }
    if(resultado?.status==='erro'||resultado?.status==='aproximado'||resultado?.status==='manual'||resultado?.status==='link'||resultado?.status==='pendente'){
      const aviso=document.createElement('span');
      aviso.className='local-aviso '+resultado.status;
      aviso.textContent=resultado.status==='erro'?'Endereço não localizado':resultado.status==='aproximado'?(resultado.motivo||'Localização aproximada'):resultado.status==='manual'?'Coordenadas manuais (endereço não verificado)':resultado.status==='link'?'Ponto do Google Maps (conferir)':'Verificação pendente';
      corpo.append(aviso);
    }
    b.append(corpo);b.addEventListener('click',()=>selecionar(l.id));lista.append(b);
  }
}
function confirmarDescarte(){return !estado.formularioAlterado||confirm('Descartar alterações não salvas do formulário?');}
function limpar(){estado.selecionado=null;estado.formularioAlterado=false;$('formLocal').reset();$('tituloEditorLocal').textContent='Novo local';$('salvarLocal').textContent='Adicionar à lista';$('excluirLocal').hidden=true;renderizar();}
function selecionar(id){if(!confirmarDescarte())return;const l=estado.locais.find(x=>x.id===id);if(!l)return;estado.selecionado=id;estado.formularioAlterado=false;for(const [campo,input] of Object.entries(campos))$(input).value=l[campo]||'';$('tituloEditorLocal').textContent='Editar local';$('salvarLocal').textContent='Salvar na lista';$('excluirLocal').hidden=false;renderizar();}
function lerFormulario(){
  if(!$('formLocal').reportValidity())return null;
  const obj={};for(const [campo,input] of Object.entries(campos)){const v=$(input).value.trim();if(v)obj[campo]=['latitude','longitude'].includes(campo)?v.replace(',','.'):v;}
  if(Boolean(obj.latitude)!==Boolean(obj.longitude)){mensagem('Preencha latitude e longitude juntas, ou deixe ambas vazias.','erro');return null;}
  if(obj.latitude){
   const valid=(v,min,max)=>/^-?\d{1,2}(?:\.\d{1,7})?$/.test(v)&&Number(v)>=min&&Number(v)<=max;
   if(!valid(obj.latitude,-34,6)||!valid(obj.longitude,-75,-33)){mensagem('Coordenadas inválidas. Informe latitude e longitude do Brasil, com até 7 casas decimais.','erro');return null;}
  }
  obj.uf=obj.uf.toUpperCase();
  if(obj.maps&&!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(obj.maps)){mensagem('O link do mapa deve começar por https://.','erro');return null;}
  const duplicado=estado.locais.some(l=>l.id!==estado.selecionado&&normalizar(l.nome)===normalizar(obj.nome));
  if(duplicado){mensagem('Já existe um local cadastrado com esse nome.','erro');return null;}
  return obj;
}
function salvar(){
  const obj=lerFormulario();if(!obj)return;
  if(estado.selecionado){
    const i=estado.locais.findIndex(x=>x.id===estado.selecionado);if(i<0)return;
    const anterior=estado.locais[i],atual={...obj,id:estado.selecionado};
    estado.locais[i]=atual;
    if(assinaturaLocal(anterior)!==assinaturaLocal(atual)){
      estado.verificacao.delete(atual.id);
      estado.pendentesNovos.add(atual.id);
    }
  }else{
    let id=slug(obj.nome),i=2;while(estado.locais.some(l=>l.id===id)){id=slug(obj.nome).slice(0,55)+'-'+i++;}
    estado.locais.push({...obj,id});estado.selecionado=id;
    estado.pendentesNovos.add(id);
  }
  salvarHistoricoVerificacao();
  estado.alterado=true;estado.formularioAlterado=false;
  $('tituloEditorLocal').textContent='Editar local';$('salvarLocal').textContent='Salvar na lista';$('excluirLocal').hidden=false;
  renderizar();mensagem('Local salvo na lista. Clique em “Publicar alterações” para atualizar o cadastro.','alerta');
}
async function carregar(){
  $('publicarLocais').disabled=true;mensagem('Carregando cadastro do GitHub…');
  try{const r=await fetch(API,{cache:'no-store',credentials:'same-origin'});const d=await r.json();if(!r.ok)throw new Error(d.erro||`HTTP ${r.status}`);if(!Array.isArray(d.locais)||!d.sha)throw new Error('Resposta incompleta.');estado.locais=d.locais;estado.sha=d.sha;estado.alterado=false;restaurarHistoricoVerificacao();estado.pendentesNovos.clear();estado.filtroErros=false;limpar();mensagem('Cadastro carregado. A verificação de endereços é manual.','sucesso');}
  catch(e){mensagem('Não foi possível carregar os locais: '+e.message,'erro');$('listaLocais').textContent='Confira o acesso e o arquivo data/locais.json no GitHub.';}
}
async function publicar(){
  if(estado.formularioAlterado){mensagem('Salve ou descarte as alterações do formulário antes de publicar.','alerta');return;}
  if(!estado.alterado)return;
  $('publicarLocais').disabled=true;mensagem('Publicando cadastro…');
  try{const r=await fetch(API,{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:estado.sha,locais:estado.locais})});const d=await r.json();if(!r.ok)throw new Error(d.erro||`HTTP ${r.status}`);estado.sha=d.sha;estado.alterado=false;renderizar();mensagem(d.aviso||'Cadastro publicado.','sucesso');}
  catch(e){mensagem('Erro ao publicar: '+e.message,'erro');atualizarResumo();}
}
$('formLocal').addEventListener('submit',e=>{e.preventDefault();salvar();});
$('formLocal').addEventListener('input',()=>{estado.formularioAlterado=true;atualizarBuscaNoMapa();});
$('novoLocal').addEventListener('click',()=>{if(confirmarDescarte()){limpar();$('nomeLocal').focus();}});
$('limparLocal').addEventListener('click',()=>{if(confirmarDescarte())limpar();});
$('excluirLocal').addEventListener('click',()=>{const l=estado.locais.find(x=>x.id===estado.selecionado);if(!l)return;if(!confirm(`Excluir o cadastro de “${l.nome}”? Eventos existentes serão preservados, mas deixarão de receber preenchimento automático por este local.`))return;estado.locais=estado.locais.filter(x=>x.id!==l.id);estado.verificacao.delete(l.id);estado.pendentesNovos.delete(l.id);salvarHistoricoVerificacao();estado.alterado=true;limpar();mensagem('Local excluído da lista. Publique para efetivar.','alerta');});
$('fecharMensagemLocais').addEventListener('click',()=>{ $('mensagemLocais').hidden=true; });
$('publicarLocais').addEventListener('click',publicar);
$('buscaLocal').addEventListener('input',renderizar);
$('verificarLocais').addEventListener('click',verificarEnderecos);
$('aplicarCoordenadas').addEventListener('click',aplicarCoordenadasSugeridas);
$('filtrarErrosLocais').addEventListener('click',()=>{
 estado.filtroErros=!estado.filtroErros;
 renderizar();
});
window.addEventListener('beforeunload',e=>{if(estado.alterado||estado.formularioAlterado){e.preventDefault();e.returnValue='';}});
carregar();
