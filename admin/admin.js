'use strict';
const API = '/api/admin/agenda';
const $ = id => document.getElementById(id);
const campos = ['data', 'horario', 'titulo', 'local', 'endereco', 'link'];
const estado = { agenda: [], sha: null, selecionado: null, alterado: false, formularioAlterado: false, sequencia: 0, ordemDesc: false };
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
function chave() { return 'e' + (++estado.sequencia); }
function hojeISO() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function mensagem(texto, tipo = '') { $('mensagem').textContent = texto; $('mensagem').className = 'mensagem' + (tipo ? ' ' + tipo : ''); }
function atualizarResumo() {
  const hoje = hojeISO();
  $('total').textContent = estado.agenda.length;
  $('futuros').textContent = estado.agenda.filter(e => e.data >= hoje).length;
  $('passados').textContent = estado.agenda.filter(e => e.data < hoje).length;
  $('situacao').textContent = estado.alterado ? 'Não publicado' : 'Atualizada';
  $('situacao').style.color = estado.alterado ? '#94691f' : '#3a795e';
  $('publicar').disabled = !estado.sha || !estado.alterado;
}
function ordenar() { estado.agenda.sort((a,b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario) || a.titulo.localeCompare(b.titulo,'pt-BR')); }
function renderizar() {
  ordenar(); atualizarResumo();
  const filtro = $('filtro').value, busca = $('busca').value.trim().toLocaleLowerCase('pt-BR'), hoje = hojeISO();
  const filtrados = estado.agenda.filter(e => {
    if (filtro === 'futuros' && e.data < hoje) return false;
    if (filtro === 'passados' && e.data >= hoje) return false;
    return !busca || `${e.titulo} ${e.local} ${e.endereco || ''}`.toLocaleLowerCase('pt-BR').includes(busca);
  });
  // Inverter apenas a apresentação, sem alterar os registros ou o estado de publicação.
  if (estado.ordemDesc) filtrados.reverse();
  const lista = $('listaEventos'); lista.replaceChildren();
  if (!filtrados.length) { const p=document.createElement('p');p.className='vazio';p.textContent='Nenhum evento encontrado.';lista.append(p);return; }
  for (const e of filtrados) {
    const b=document.createElement('button');b.type='button';b.className='evento' + (e._key === estado.selecionado ? ' ativo' : '');
    const data=document.createElement('span');data.className='evento-data';
    const dia=document.createElement('strong');dia.textContent=e.data.slice(8,10);
    const mes=document.createElement('span');mes.textContent=MESES[Number(e.data.slice(5,7))-1] || '';
    data.append(dia,mes);
    const corpo=document.createElement('span');corpo.className='evento-corpo';
    const titulo=document.createElement('strong');titulo.textContent=e.titulo;
    const info=document.createElement('span');info.textContent=`${e.horario.replace(':00','h').replace(':','h')} · ${e.local}`;
    corpo.append(titulo,info);
    const seta=document.createElement('span');seta.className='evento-seta';seta.textContent='›';
    b.append(data,corpo,seta);b.addEventListener('click',()=>selecionar(e._key));lista.append(b);
  }
}
function formularioEmBranco() {
  estado.selecionado=null; estado.formularioAlterado=false;
  $('formEvento').reset();$('data').value=hojeISO();
  $('tituloEditor').textContent='Novo evento';$('salvar').textContent='Adicionar à lista';$('excluir').hidden=true;
  renderizar();
}
function confirmarDescarte() { return !estado.formularioAlterado || confirm('Há campos ainda não salvos na lista. Deseja descartá-los?'); }
function selecionar(key) {
  if (!confirmarDescarte()) return;
  const e=estado.agenda.find(x=>x._key===key);if(!e)return;
  estado.selecionado=key;estado.formularioAlterado=false;
  for(const campo of campos) $(campo).value=e[campo] || '';
  $('tituloEditor').textContent='Editar compromisso';$('salvar').textContent='Salvar na lista';$('excluir').hidden=false;
  renderizar();
}
function lerFormulario() {
  const obj={};for(const campo of campos){const val=$(campo).value.trim();if(val)obj[campo]=val;}
  if (!/^https:\/\/[^\s/]+/i.test(obj.link || 'https://exemplo.org')) { $('link').setCustomValidity('Use um endereço começando por https://');$('link').reportValidity();return null; }
  $('link').setCustomValidity('');
  if (!$('formEvento').reportValidity()) return null;
  return obj;
}
function salvarNaLista({ silencioso = false } = {}) {
  const obj=lerFormulario();if(!obj)return false;
  if(estado.selecionado){const i=estado.agenda.findIndex(e=>e._key===estado.selecionado);if(i<0)return false;estado.agenda[i]={...obj,_key:estado.selecionado};}
  else {const id=chave();estado.agenda.push({...obj,_key:id});estado.selecionado=id;}
  estado.formularioAlterado=false;estado.alterado=true;
  $('tituloEditor').textContent='Editar compromisso';$('salvar').textContent='Salvar na lista';$('excluir').hidden=false;
  renderizar();if(!silencioso)mensagem('Evento salvo na lista. Clique em “Publicar alterações” para atualizar o site.','alerta');
  return true;
}
async function carregar() {
  $('publicar').disabled=true;mensagem('Carregando os eventos do GitHub…');
  try {
    const r=await fetch(API,{cache:'no-store',credentials:'same-origin'});
    const data=await r.json().catch(()=>({erro:'Não foi possível interpretar a resposta do servidor.'}));
    if(!r.ok)throw new Error(data.erro || `Erro HTTP ${r.status}`);
    if(!Array.isArray(data.agenda)||!data.sha)throw new Error('A resposta da agenda está incompleta.');
    estado.agenda=data.agenda.map(e=>({...e,_key:chave()}));estado.sha=data.sha;estado.alterado=false;estado.formularioAlterado=false;
    formularioEmBranco();mensagem('Agenda carregada. Você já pode cadastrar ou editar compromissos.','sucesso');
  }catch(e){mensagem('Não foi possível abrir a agenda: '+e.message,'erro');$('listaEventos').textContent='Verifique a configuração do Cloudflare Access e do token do GitHub.';}
}
async function publicar() {
  if(estado.formularioAlterado && !salvarNaLista({silencioso:true}))return;
  if(!estado.alterado)return;
  $('publicar').disabled=true;mensagem('Enviando alterações ao GitHub…');
  try {
    const agenda=estado.agenda.map(({_key,...e})=>e);
    const r=await fetch(API,{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sha:estado.sha,agenda})});
    const data=await r.json().catch(()=>({erro:'Resposta inválida do servidor.'}));
    if(!r.ok)throw new Error(data.erro || `Erro HTTP ${r.status}`);
    estado.sha=data.sha;estado.alterado=false;estado.formularioAlterado=false;
    renderizar();mensagem(data.aviso || 'Alterações enviadas com sucesso.','sucesso');
  }catch(e){mensagem('Não foi possível publicar: '+e.message,'erro');atualizarResumo();}
}
$('formEvento').addEventListener('submit',e=>{e.preventDefault();salvarNaLista();});
$('formEvento').addEventListener('input',()=>{estado.formularioAlterado=true;$('link').setCustomValidity('');});
$('novo').addEventListener('click',()=>{if(confirmarDescarte()){formularioEmBranco();$('titulo').focus();}});
$('cancelar').addEventListener('click',()=>{if(confirmarDescarte())formularioEmBranco();});
$('excluir').addEventListener('click',()=>{
  const e=estado.agenda.find(x=>x._key===estado.selecionado);if(!e)return;
  if(!confirm(`Excluir “${e.titulo}” da agenda? A exclusão só será pública depois de publicar.`))return;
  estado.agenda=estado.agenda.filter(x=>x._key!==e._key);estado.alterado=true;formularioEmBranco();mensagem('Evento excluído da lista. Publique as alterações para efetivar.','alerta');
});
$('publicar').addEventListener('click',publicar);
$('busca').addEventListener('input',renderizar);$('filtro').addEventListener('change',renderizar);
$('ordenarAgenda').addEventListener('click',()=>{
  estado.ordemDesc=!estado.ordemDesc;
  const botao=$('ordenarAgenda');
  const descricao=estado.ordemDesc
    ? 'Mais recentes primeiro. Clique para mostrar os mais antigos primeiro.'
    : 'Mais antigos primeiro. Clique para mostrar os mais recentes primeiro.';
  botao.setAttribute('aria-pressed',String(estado.ordemDesc));
  botao.setAttribute('aria-label',descricao);
  botao.title=descricao;
  renderizar();
});
window.addEventListener('beforeunload',e=>{if(estado.alterado||estado.formularioAlterado){e.preventDefault();e.returnValue='';}});
carregar();
