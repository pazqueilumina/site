'use strict';
const $ = id => document.getElementById(id);
const API = '/api/admin/locais';
const estado = { locais: [], sha: null, selecionado: null, alterado: false, formularioAlterado: false, verificacao: new Map(), verificando: false, filtroErros: false };
const campos = { nome:'nomeLocal', endereco:'enderecoLocal', bairro:'bairroLocal', cidade:'cidadeLocal', uf:'ufLocal', maps:'mapsLocal', kmIdaVolta:'kmIdaVoltaLocal' };
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

const assinaturaLocal=l=>[l.nome,l.endereco,l.bairro,l.cidade,l.uf].map(normalizar).join('|');
function resultadoLocal(l){
 const r=estado.verificacao.get(l.id);
 return r&&r.assinatura===assinaturaLocal(l)?r:null;
}
function atualizarResumoVerificacao(){
 const resultados=estado.locais.map(resultadoLocal);
 const verificados=resultados.filter(r=>r&&r.status!=='pendente').length;
 const erros=resultados.filter(r=>r?.status==='erro').length;
 const aproximados=resultados.filter(r=>r?.status==='aproximado').length;
 const pendentes=estado.locais.length-verificados;
 $('errosLocais').textContent=verificados?String(erros):(estado.locais.length===0?'0':'—');
 $('statusVerificacaoLocais').textContent=estado.verificando
  ?'Verificando… '+verificados+' de '+estado.locais.length
  :pendentes?verificados+' de '+estado.locais.length+' verificados · '+pendentes+' pendente(s)'
  :verificados+' de '+estado.locais.length+' verificados'+(aproximados?' · '+aproximados+' aproximado(s)':'');
 $('verificarLocais').disabled=estado.verificando||!estado.sha||!estado.locais.length;
 $('verificarLocais').textContent=estado.verificando?'Verificando…':'Verificar endereços';
 $('cartaoErrosLocais').classList.toggle('tem-erros',erros>0);
 $('filtrarErrosLocais').setAttribute('aria-pressed',String(estado.filtroErros));
 $('filtrarErrosLocais').title=estado.filtroErros?'Mostrar todos os locais':'Mostrar somente os endereços com erro';
}
async function verificarEnderecos(){
 if(estado.verificando||!estado.sha)return;
 estado.verificando=true;
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
   if(d.id!==l.id||!['ok','aproximado','erro','pendente'].includes(d.status))throw Error('Resposta inesperada.');
   estado.verificacao.set(l.id,{assinatura,status:d.status,motivo:d.motivo||''});
  }catch{
   estado.verificacao.set(l.id,{assinatura,status:'pendente',motivo:'Não foi possível verificar agora.'});
  }
  renderizar();
  // Evita consultas simultâneas ao Nominatim entre locais diferentes.
  if(i<locais.length-1)await new Promise(resolve=>setTimeout(resolve,1200));
 }
 estado.verificando=false;
 renderizar();
}

function renderizar() {
  atualizarResumo();
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
    const corpo=document.createElement('span');corpo.className='evento-corpo';
    const nome=document.createElement('strong');nome.textContent=l.nome;
    const info=document.createElement('span');info.textContent=[l.bairro,l.cidade,l.uf].filter(Boolean).join(' · ');
    corpo.append(nome,info);
    if(resultado?.status==='erro'||resultado?.status==='aproximado'||resultado?.status==='pendente'){
      const aviso=document.createElement('span');
      aviso.className='local-aviso '+resultado.status;
      aviso.textContent=resultado.status==='erro'?'Endereço não localizado':resultado.status==='aproximado'?'Localização aproximada':'Verificação pendente';
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
  const obj={};for(const [campo,input] of Object.entries(campos)){const v=$(input).value.trim();if(v)obj[campo]=v;}
  obj.uf=obj.uf.toUpperCase();
  if(obj.maps&&!/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(obj.maps)){mensagem('O link do mapa deve começar por https://.','erro');return null;}
  const duplicado=estado.locais.some(l=>l.id!==estado.selecionado&&normalizar(l.nome)===normalizar(obj.nome));
  if(duplicado){mensagem('Já existe um local cadastrado com esse nome.','erro');return null;}
  return obj;
}
function salvar(){
  const obj=lerFormulario();if(!obj)return;
  if(estado.selecionado){const i=estado.locais.findIndex(x=>x.id===estado.selecionado);if(i<0)return;estado.locais[i]={...obj,id:estado.selecionado};}
  else{let id=slug(obj.nome),i=2;while(estado.locais.some(l=>l.id===id)){id=slug(obj.nome).slice(0,55)+'-'+i++;}estado.locais.push({...obj,id});estado.selecionado=id;}
  estado.alterado=true;estado.formularioAlterado=false;
  $('tituloEditorLocal').textContent='Editar local';$('salvarLocal').textContent='Salvar na lista';$('excluirLocal').hidden=false;
  renderizar();mensagem('Local salvo na lista. Clique em “Publicar alterações” para atualizar o cadastro.','alerta');
}
async function carregar(){
  $('publicarLocais').disabled=true;mensagem('Carregando cadastro do GitHub…');
  try{const r=await fetch(API,{cache:'no-store',credentials:'same-origin'});const d=await r.json();if(!r.ok)throw new Error(d.erro||`HTTP ${r.status}`);if(!Array.isArray(d.locais)||!d.sha)throw new Error('Resposta incompleta.');estado.locais=d.locais;estado.sha=d.sha;estado.alterado=false;estado.verificacao.clear();estado.filtroErros=false;limpar();mensagem('Cadastro carregado.','sucesso');void verificarEnderecos();}
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
$('formLocal').addEventListener('input',()=>{estado.formularioAlterado=true;});
$('novoLocal').addEventListener('click',()=>{if(confirmarDescarte()){limpar();$('nomeLocal').focus();}});
$('limparLocal').addEventListener('click',()=>{if(confirmarDescarte())limpar();});
$('excluirLocal').addEventListener('click',()=>{const l=estado.locais.find(x=>x.id===estado.selecionado);if(!l)return;if(!confirm(`Excluir o cadastro de “${l.nome}”? Eventos existentes serão preservados, mas deixarão de receber preenchimento automático por este local.`))return;estado.locais=estado.locais.filter(x=>x.id!==l.id);estado.alterado=true;limpar();mensagem('Local excluído da lista. Publique para efetivar.','alerta');});
$('fecharMensagemLocais').addEventListener('click',()=>{ $('mensagemLocais').hidden=true; });
$('publicarLocais').addEventListener('click',publicar);
$('buscaLocal').addEventListener('input',renderizar);
$('verificarLocais').addEventListener('click',verificarEnderecos);
$('filtrarErrosLocais').addEventListener('click',()=>{
 estado.filtroErros=!estado.filtroErros;
 renderizar();
});
window.addEventListener('beforeunload',e=>{if(estado.alterado||estado.formularioAlterado){e.preventDefault();e.returnValue='';}});
carregar();
