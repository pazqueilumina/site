'use strict';
const $ = id => document.getElementById(id);
const API = '/api/admin/locais';
const estado = { locais: [], sha: null, selecionado: null, alterado: false, formularioAlterado: false };
const campos = { nome:'nomeLocal', endereco:'enderecoLocal', bairro:'bairroLocal', cidade:'cidadeLocal', uf:'ufLocal', maps:'mapsLocal' };
const normalizar = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ');
const slug = s => normalizar(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'local';
function mensagem(t, classe='') { $('mensagemLocais').textContent=t; $('mensagemLocais').className='mensagem' + (classe?' '+classe:''); }
function atualizarResumo() {
  $('totalLocais').textContent=estado.locais.length;
  $('situacaoLocais').textContent=estado.alterado?'Não publicado':'Atualizado';
  $('situacaoLocais').style.color=estado.alterado?'#94691f':'#3a795e';
  $('publicarLocais').disabled=!estado.sha||!estado.alterado;
}
function renderizar() {
  atualizarResumo();
  const busca=normalizar($('buscaLocal').value);
  const lista=$('listaLocais'); lista.replaceChildren();
  const locais=estado.locais.filter(l=>!busca||normalizar([l.nome,l.endereco,l.bairro,l.cidade,l.uf].join(' ')).includes(busca))
    .sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
  if (!locais.length) { const p=document.createElement('p');p.className='vazio';p.textContent='Nenhum local encontrado.';lista.append(p);return; }
  for(const l of locais){
    const b=document.createElement('button');b.type='button';b.className='evento'+(l.id===estado.selecionado?' ativo':'');
    const corpo=document.createElement('span');corpo.className='evento-corpo';
    const nome=document.createElement('strong');nome.textContent=l.nome;
    const info=document.createElement('span');info.textContent=[l.bairro,l.cidade,l.uf].filter(Boolean).join(' · ');
    corpo.append(nome,info);b.append(corpo);b.addEventListener('click',()=>selecionar(l.id));lista.append(b);
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
  try{const r=await fetch(API,{cache:'no-store',credentials:'same-origin'});const d=await r.json();if(!r.ok)throw new Error(d.erro||`HTTP ${r.status}`);if(!Array.isArray(d.locais)||!d.sha)throw new Error('Resposta incompleta.');estado.locais=d.locais;estado.sha=d.sha;estado.alterado=false;limpar();mensagem('Cadastro carregado.','sucesso');}
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
$('publicarLocais').addEventListener('click',publicar);
$('buscaLocal').addEventListener('input',renderizar);
window.addEventListener('beforeunload',e=>{if(estado.alterado||estado.formularioAlterado){e.preventDefault();e.returnValue='';}});
carregar();
