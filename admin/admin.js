'use strict';
const API = '/api/admin/agenda';
const $ = id => document.getElementById(id);
const campos = ['data', 'horario', 'titulo', 'local', 'endereco', 'link', 'mapa'];
const estado = { agenda: [], sha: null, selecionado: null, alterado: false, formularioAlterado: false, sequencia: 0, ordemDesc: false, importacao: null, locais: [], relatorioCsv: null };
const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
function chave() { return 'e' + (++estado.sequencia); }
function hojeISO() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function mensagem(texto, tipo = '') { $('mensagemTexto').textContent = texto; $('mensagem').className = 'mensagem' + (tipo ? ' ' + tipo : ''); $('mensagem').hidden = false; }
function atualizarResumo() {
  const hoje = hojeISO();
  $('total').textContent = estado.agenda.length;
  $('futuros').textContent = estado.agenda.filter(e => e.data >= hoje).length;
  $('passados').textContent = estado.agenda.filter(e => e.data < hoje).length;
  $('situacao').textContent = estado.alterado ? 'Não publicado' : 'Atualizada';
  $('situacao').style.color = estado.alterado ? '#94691f' : '#3a795e';
  $('publicar').disabled = !estado.sha || !estado.alterado;
  $('importarCsv').disabled = !estado.sha || !$('arquivoCsv').files?.length;
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
  if (!filtrados.length) { const p=document.createElement('p');p.className='vazio';p.textContent='Nenhum evento encontrado.';lista.append(p); }
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
  if (estado.importacao) renderizarPreviaCsv();
}
function formularioEmBranco() {
  estado.selecionado=null; estado.formularioAlterado=false;
  $('formEvento').reset();$('idLocal').value='';$('data').value=hojeISO();atualizarAvisoLocal();
  $('tituloEditor').textContent='Novo evento';$('salvar').textContent='Adicionar à lista';$('excluir').hidden=true;
  renderizar();
}
function confirmarDescarte() { return !estado.formularioAlterado || confirm('Há campos ainda não salvos na lista. Deseja descartá-los?'); }
function selecionar(key) {
  if (!confirmarDescarte()) return;
  const e=estado.agenda.find(x=>x._key===key);if(!e)return;
  estado.selecionado=key;estado.formularioAlterado=false;
  for(const campo of campos) $(campo).value=e[campo] || '';
  $('idLocal').value=e.localId||'';
  atualizarAvisoLocal();
  $('tituloEditor').textContent='Editar compromisso';$('salvar').textContent='Salvar na lista';$('excluir').hidden=false;
  renderizar();
}
function lerFormulario() {
  const obj={};for(const campo of campos){const val=$(campo).value.trim();if(val)obj[campo]=val;}
  if($('idLocal').value && estado.locais.some(l=>l.id===$('idLocal').value&&normalizarCsv(l.nome)===normalizarCsv(obj.local))) obj.localId=$('idLocal').value;
  if (!/^https:\/\/[^\s/]+/i.test(obj.link || 'https://exemplo.org')) { $('link').setCustomValidity('Use um endereço começando por https://');$('link').reportValidity();return null; }
  $('link').setCustomValidity('');
  if (obj.mapa && !/^https:\/\/[^\s/]+/i.test(obj.mapa)) { $('mapa').setCustomValidity('Use um endereço https:// válido.');$('mapa').reportValidity();return null; }
  $('mapa').setCustomValidity('');
  if (!$('formEvento').reportValidity()) return null;
  return obj;
}
function salvarNaLista({ silencioso = false } = {}) {
  const obj=lerFormulario();if(!obj)return false;
  const anterior = estado.selecionado ? estado.agenda.find(e=>e._key===estado.selecionado) : null;
  // O editor mantém o bairro do CSV quando os dados do local não mudam.
  if (anterior && anterior.local === obj.local && (anterior.endereco || '') === (obj.endereco || '') && anterior.bairro) obj.bairro = anterior.bairro;
  else {
    const cadastrado = estado.locais.find(l => l.id === obj.localId);
    if (cadastrado?.bairro && normalizarCsv(obj.endereco) === normalizarCsv(cadastrado.endereco)) obj.bairro = cadastrado.bairro;
  }
  if(estado.selecionado){const i=estado.agenda.findIndex(e=>e._key===estado.selecionado);if(i<0)return false;estado.agenda[i]={...obj,_key:estado.selecionado};}
  else {const id=chave();estado.agenda.push({...obj,_key:id});estado.selecionado=id;}
  estado.formularioAlterado=false;estado.alterado=true;
  $('tituloEditor').textContent='Editar compromisso';$('salvar').textContent='Salvar na lista';$('excluir').hidden=false;
  renderizar();if(!silencioso)mensagem('Evento salvo na lista. Clique em “Publicar alterações” para atualizar o site.','alerta');
  return true;
}
async function carregar() {
  $('publicar').disabled=true;$('importarCsv').disabled=true;mensagem('Carregando os eventos do GitHub…');
  try {
    const r=await fetch(API,{cache:'no-store',credentials:'same-origin'});
    const data=await r.json().catch(()=>({erro:'Não foi possível interpretar a resposta do servidor.'}));
    if(!r.ok)throw new Error(data.erro || `Erro HTTP ${r.status}`);
    if(!Array.isArray(data.agenda)||!data.sha)throw new Error('A resposta da agenda está incompleta.');
    estado.agenda=data.agenda.map(e=>({...e,_key:chave()}));estado.sha=data.sha;estado.alterado=false;estado.formularioAlterado=false;cancelarImportacaoCsv();
    await carregarLocais();
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
    renderizar();if(estado.relatorioCsv)renderizarRelatorioCsv();mensagem(data.aviso || 'Alterações enviadas com sucesso.','sucesso');
  }catch(e){mensagem('Não foi possível publicar: '+e.message,'erro');atualizarResumo();}
}


/* CSV da agenda: a importação só acrescenta registros; a publicação permanece manual. */
const CABECALHOS_CSV = {
  data: ['data', 'dia'], horario: ['horario', 'hora'],
  titulo: ['titulo', 'palestra', 'atividade', 'evento', 'tema'],
  local: ['local', 'instituicao'], endereco: ['endereco'], bairro: ['bairro'], link: ['link', 'url']
};
function normalizarCsv(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim().replace(/\s+/g, ' ');
}
function colunaCsv(valor) {
  const cab = normalizarCsv(valor).replace(/[^a-z0-9]/g, '');
  return Object.keys(CABECALHOS_CSV).find(campo => CABECALHOS_CSV[campo].includes(cab)) || null;
}
function lerTabelaCsv(texto, separador) {
  const registros = []; let valores = [], celula = '', aspas = false, aposAspas = false, linha = 1, inicio = 1;
  function terminarRegistro() {
    valores.push(celula);
    if (valores.some(v => v.trim())) registros.push({ linha: inicio, valores });
    valores = []; celula = ''; aposAspas = false; inicio = linha + 1;
  }
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { celula += '"'; i++; }
        else { aspas = false; aposAspas = true; }
      } else if (c === '\r' || c === '\n') {
        celula += '\n'; if (c === '\r' && texto[i + 1] === '\n') i++; linha++;
      } else celula += c;
    } else if (c === separador) {
      valores.push(celula); celula = ''; aposAspas = false;
    } else if (c === '\r' || c === '\n') {
      terminarRegistro(); if (c === '\r' && texto[i + 1] === '\n') i++; linha++;
    } else if (c === '"' && !celula && !aposAspas) {
      aspas = true;
    } else if (c === '"') {
      throw new Error(`Aspas em posição inválida na linha ${linha}.`);
    } else if (aposAspas && c !== ' ' && c !== '\t') {
      throw new Error(`Texto inesperado depois das aspas na linha ${linha}.`);
    } else if (!aposAspas) celula += c;
  }
  if (aspas) throw new Error(`Aspas sem fechamento na linha ${inicio}.`);
  if (valores.length || celula.length || aposAspas) terminarRegistro();
  return registros;
}
function prepararCsv(texto) {
  const tentativas = [';', ','].map(separador => {
    try {
      const linhas = lerTabelaCsv(texto, separador);
      const cabecalhos = (linhas[0]?.valores || []).map(colunaCsv);
      const obrigatorios = ['data', 'horario', 'titulo', 'local'];
      const pontuacao = obrigatorios.filter(c => cabecalhos.includes(c)).length;
      return { linhas, cabecalhos, pontuacao, separador };
    } catch (erro) { return { erro, pontuacao: -1 }; }
  }).sort((a, b) => b.pontuacao - a.pontuacao);
  const melhor = tentativas[0];
  if (melhor.pontuacao < 4) {
    const erro = tentativas.find(t => t.erro)?.erro;
    throw new Error(erro?.message || 'Cabeçalho inválido. Use as colunas data;horario;titulo;local;endereco;bairro;link.');
  }
  if (new Set(melhor.cabecalhos.filter(Boolean)).size !== melhor.cabecalhos.filter(Boolean).length) {
    throw new Error('O arquivo CSV contém colunas repetidas no cabeçalho.');
  }
  if (melhor.linhas.length < 2) throw new Error('O arquivo CSV não contém eventos.');
  if (melhor.linhas.length > 501) throw new Error('O CSV pode conter no máximo 500 eventos.');
  return melhor.linhas.slice(1).map(linha => {
    const obj = {};
    melhor.cabecalhos.forEach((campo, i) => { if (campo) obj[campo] = (linha.valores[i] || '').trim(); });
    return { linha: linha.linha, evento: obj, colunasExtras: linha.valores.slice(melhor.cabecalhos.length).some(v => v.trim()) };
  });
}
function normalizarDataCsv(valor) {
  const s = String(valor || '').trim();
  const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!br && !iso) return null;
  const ano = Number(br ? br[3] : iso[1]), mes = Number(br ? br[2] : iso[2]), dia = Number(br ? br[1] : iso[3]);
  if (ano < 1000 || ano > 9999 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}
function normalizarHorarioCsv(valor) {
  const s = String(valor || '').trim().toLowerCase();
  const m = /^(\d{1,2})(?::(\d{2})(?::(\d{2}))?|h(\d{0,2}))$/.exec(s);
  if (!m) return null;
  const horas = Number(m[1]), minutos = Number(m[2] ?? m[4] ?? '0');
  if (horas > 23 || minutos > 59 || (m[3] && m[3] !== '00')) return null;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}
function validarEventoCsv(item) {
  if (item.colunasExtras) return { erro: 'Há mais colunas preenchidas que no cabeçalho.' };
  const e = { ...item.evento };
  e.data = normalizarDataCsv(e.data);
  e.horario = normalizarHorarioCsv(e.horario);
  if (!e.data) return { erro: item.evento.data ? 'Data inválida. Use DD/MM/AAAA ou AAAA-MM-DD.' : 'Data obrigatória não informada.' };
  if (!e.horario) return { erro: item.evento.horario ? 'Horário inválido. Use HH:MM.' : 'Horário obrigatório não informado.' };
  if (!e.titulo || !e.local) return { erro: [!e.titulo && 'Título', !e.local && 'Local'].filter(Boolean).join(' e ') + ' obrigatório(s) não informado(s).' };
  for (const campo of [...campos, 'bairro']) {
    const limite = ['endereco', 'link', 'mapa'].includes(campo) ? 500 : 180;
    if (String(e[campo] || '').length > limite) return { erro: `O campo ${campo} excede ${limite} caracteres.` };
  }
  if (e.link && !/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(e.link)) return { erro: 'O link deve começar por https:// e ser válido.' };
  const local = encontrarLocal(e.local);
  if (local) {
    const semEndereco = !e.endereco;
    if (semEndereco) e.endereco=local.endereco;
    if (!e.bairro && local.bairro && !/(youtube|instagram|online|zoom|meet\.google|teams\.microsoft)/i.test(e.endereco || '')) e.bairro = local.bairro;
    if (semEndereco || normalizarCsv(e.endereco) === normalizarCsv(local.endereco)) { e.localId=local.id; if(local.maps)e.mapa=local.maps; }
    e.local=local.nome;
  }
  const evento = {};
  for (const campo of [...campos, 'bairro', 'localId']) if (e[campo]) evento[campo] = e[campo];
  return { evento };
}
function identidadeEventoCsv(e) {
  return [e.data, e.horario, normalizarCsv(e.titulo), normalizarCsv(e.local)].join('|');
}
function avaliarImportacaoCsv() {
  const chaves = new Set(estado.agenda.map(identidadeEventoCsv));
  const resultado = []; let novos = 0, duplicados = 0, invalidos = 0;
  for (const item of estado.importacao?.registros || []) {
    const validado = validarEventoCsv(item);
    if (validado.erro) { resultado.push({ ...item, status: 'Inválido', detalhe: validado.erro }); invalidos++; continue; }
    const e = validado.evento, identidade = identidadeEventoCsv(e);
    if (chaves.has(identidade)) { resultado.push({ ...item, evento: e, status: 'Duplicado', detalhe: 'Já existe na agenda ou neste arquivo.' }); duplicados++; }
    else { chaves.add(identidade); resultado.push({ ...item, evento: e, status: 'Novo', detalhe: '' }); novos++; }
  }
  const total = estado.agenda.length + novos;
  let erroGeral = '';
  if (total > 500) erroGeral = `A agenda aceita até 500 eventos. Após a importação seriam ${total}.`;
  else if (estado.sha && JSON.stringify({ sha: estado.sha, agenda: [...estado.agenda, ...resultado.filter(r => r.status === 'Novo').map(r => r.evento)].map(({ _key, ...e }) => e) }).length > 200000)
    erroGeral = 'A agenda excederia o limite de tamanho aceito para publicação. Importe menos eventos.';
  return { resultado, novos, duplicados, invalidos, erroGeral };
}
function adicionarCelulaCsv(tr, valor, classe = '') {
  const td = document.createElement('td'); td.textContent = valor || '—'; if (classe) td.className = classe; tr.append(td);
}
function renderizarPreviaCsv() {
  if (!estado.importacao) return;
  const a = avaliarImportacaoCsv();
  $('arquivoCsvNome').textContent = `Arquivo: ${estado.importacao.nome} · Revise os registros antes de acrescentá-los.`;
  const resumo = $('resumoCsv'); resumo.replaceChildren();
  for (const [texto, numero, classe] of [['Novos', a.novos, 'resumo-novos'], ['Duplicados ignorados', a.duplicados, 'resumo-duplicados'], ['Inválidos', a.invalidos, 'resumo-erros']]) {
    const span = document.createElement('span'); span.className = classe; span.textContent = `${texto}: ${numero}`; resumo.append(span);
  }
  const aviso = $('avisoCsv');
  const problemas = a.resultado.filter(r => r.status === 'Inválido');
  const detalhes = problemas.slice(0, 5).map(r => `Linha ${r.linha}: ${r.detalhe}`).join(' ');
  aviso.textContent = a.erroGeral || (problemas.length ? `Os ${problemas.length} registros inválidos serão rejeitados. ${detalhes}${problemas.length > 5 ? ' Consulte a tabela para ver os demais erros.' : ''}` : '');
  aviso.hidden = !aviso.textContent;
  const tbody = $('linhasCsv'); tbody.replaceChildren();
  for (const r of a.resultado) {
    const tr = document.createElement('tr'), e = r.evento;
    adicionarCelulaCsv(tr, String(r.linha));
    for (const campo of ['data', 'horario', 'titulo', 'local', 'endereco', 'bairro', 'link']) adicionarCelulaCsv(tr, e[campo]);
    adicionarCelulaCsv(tr, r.status === 'Inválido' ? `Inválido: ${r.detalhe}` : r.status,
      r.status === 'Novo' ? 'status-novo' : r.status === 'Duplicado' ? 'status-duplicado' : 'status-invalido');
    tbody.append(tr);
  }
  $('confirmarCsv').disabled = !estado.sha || a.novos === 0 || !!a.erroGeral;
  $('baixarErrosPrevia').hidden = a.invalidos === 0;
}
function atualizarArquivoCsvSelecionado() {
  const arquivo = $('arquivoCsv').files?.[0];
  $('arquivoCsvSelecionado').textContent = arquivo ? arquivo.name : 'Nenhum arquivo selecionado';
  $('importarCsv').disabled = !estado.sha || !arquivo;
}
function cancelarImportacaoCsv() {
  estado.importacao = null;
  $('painelCsv').hidden = true;
  $('arquivoCsv').value = '';
  atualizarArquivoCsvSelecionado();
}
async function abrirImportacaoCsv(arquivo) {
  if (!arquivo) return;
  if (!/\.csv$/i.test(arquivo.name)) { mensagem('Selecione um arquivo com extensão .csv.', 'erro'); return; }
  if (arquivo.size > 512000) { mensagem('O arquivo CSV deve ter até 500 KB.', 'erro'); return; }
  try {
    const bytes = await arquivo.arrayBuffer();
    let texto;
    try { texto = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { texto = new TextDecoder('windows-1252').decode(bytes); }
    const registros = prepararCsv(texto.replace(/^\uFEFF/, ''));
    estado.relatorioCsv=null;$('relatorioCsv').hidden=true;
    estado.importacao = { nome: arquivo.name, registros };
    $('painelCsv').hidden = false;
    renderizarPreviaCsv();
    $('painelCsv').scrollIntoView({ behavior: 'smooth', block: 'start' });
    mensagem('Arquivo CSV lido. Confira a prévia antes de acrescentar os eventos.', 'alerta');
  } catch (erro) {
    cancelarImportacaoCsv();
    mensagem(`Não foi possível ler o CSV: ${erro.message}`, 'erro');
  }
}
function confirmarImportacaoCsv() {
  if (!estado.importacao || !estado.sha) return;
  const a = avaliarImportacaoCsv();
  if (!a.novos || a.erroGeral) { renderizarPreviaCsv(); return; }
  if (!confirm(`Acrescentar ${a.novos} evento(s) à agenda? ${a.invalidos} inválido(s) serão rejeitados e ${a.duplicados} duplicado(s) ignorados. Os eventos atuais serão mantidos. Depois será necessário clicar em “Publicar alterações”.`)) return;
  for (const r of a.resultado) if (r.status === 'Novo') estado.agenda.push({ ...r.evento, _key: chave() });
  estado.alterado = true;
  estado.relatorioCsv={ nome: estado.importacao.nome, ...a };
  cancelarImportacaoCsv();
  renderizar();renderizarRelatorioCsv();
  mensagem(`${a.novos} evento(s) acrescentado(s); ${a.invalidos} rejeitado(s); ${a.duplicados} duplicado(s) ignorado(s). Consulte o relatório abaixo. Clique em “Publicar alterações” para atualizar o site.`, 'alerta');
}
/* Cadastro de locais: sugestão sem bloquear locais informados manualmente. */
function encontrarLocal(nome) { return estado.locais.find(l => normalizarCsv(l.nome) === normalizarCsv(nome)); }
async function carregarLocais() {
  try {
    const r=await fetch('/api/admin/locais',{cache:'no-store',credentials:'same-origin'});
    const d=await r.json(); if(!r.ok||!Array.isArray(d.locais))throw new Error(d.erro||'Cadastro indisponível');
    estado.locais=d.locais;
  } catch(e) { estado.locais=[]; console.warn('Cadastro de locais indisponível:',e.message); }
  const lista=$('opcoesLocais');lista.replaceChildren();
  for(const local of estado.locais) { const opt=document.createElement('option');opt.value=local.nome;lista.append(opt); }
}
function atualizarAvisoLocal() {
  const l=encontrarLocal($('local').value);
  $('avisoLocal').textContent=l
    ? 'Local cadastrado: ao selecionar, o endereço e o link do mapa serão preenchidos. O link da transmissão não será alterado.'
    : 'Local não cadastrado: você pode preencher os dados manualmente ou cadastrá-lo em “Locais”.';
}
function aplicarLocalDigitado() {
  const l=encontrarLocal($('local').value);
  if (!l) { $('idLocal').value=''; atualizarAvisoLocal();return; }
  $('local').value=l.nome;$('idLocal').value=l.id;
  $('endereco').value=l.endereco;
  $('mapa').value=l.maps||'';
  estado.formularioAlterado=true;
  atualizarAvisoLocal();
}
function textoCsvCelula(v) { let s=String(v??''); if(/^[\s]*[=+@-]/.test(s))s="'"+s; return /[;"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function baixarRelatorioCsv(a) {
  if(!a)return;
  const linhas=[['linha','data','horario','titulo','local','endereco','bairro','link','status','motivo']];
  for(const r of a.resultado.filter(x=>x.status!=='Novo')) linhas.push([r.linha,r.evento.data||'',r.evento.horario||'',r.evento.titulo||'',r.evento.local||'',r.evento.endereco||'',r.evento.bairro||'',r.evento.link||'',r.status==='Inválido'?'Rejeitado':'Duplicado',r.detalhe]);
  const csv='\uFEFF'+linhas.map(row=>row.map(textoCsvCelula).join(';')).join('\r\n')+'\r\n';
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='relatorio-importacao-agenda.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function renderizarRelatorioCsv() {
  const a=estado.relatorioCsv;if(!a)return;
  $('relatorioCsv').hidden=false;
  $('resumoRelatorioCsv').textContent=`Arquivo: ${a.nome} · ${a.novos} adicionados à lista · ${a.invalidos} rejeitados · ${a.duplicados} duplicados ignorados. ${estado.alterado ? 'Publicação ainda pendente.' : 'Alterações publicadas.'}`;
  const corpo=$('linhasErrosCsv');corpo.replaceChildren();
  const erros=a.resultado.filter(r=>r.status==='Inválido');
  if(!erros.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=6;td.textContent='Nenhum registro rejeitado.';tr.append(td);corpo.append(tr);}
  for(const r of erros){const tr=document.createElement('tr');for(const v of [r.linha,r.evento.data,r.evento.horario,r.evento.titulo,r.evento.local,r.detalhe])adicionarCelulaCsv(tr,String(v||''));corpo.append(tr);}
  $('baixarErrosCsv').disabled=a.invalidos===0&&a.duplicados===0;
}
$('local').addEventListener('input',()=>{ $('idLocal').value=''; atualizarAvisoLocal(); });
$('local').addEventListener('change',aplicarLocalDigitado);
$('baixarErrosPrevia').addEventListener('click',()=>baixarRelatorioCsv(avaliarImportacaoCsv()));
$('baixarErrosCsv').addEventListener('click',()=>baixarRelatorioCsv(estado.relatorioCsv));
$('selecionarCsv').addEventListener('click', () => $('arquivoCsv').click());
$('arquivoCsv').addEventListener('change', atualizarArquivoCsvSelecionado);
$('importarCsv').addEventListener('click', () => abrirImportacaoCsv($('arquivoCsv').files?.[0]));
$('cancelarCsv').addEventListener('click', cancelarImportacaoCsv);
$('confirmarCsv').addEventListener('click', confirmarImportacaoCsv);

$('fecharMensagem').addEventListener('click',()=>{ $('mensagem').hidden = true; });
$('formEvento').addEventListener('submit',e=>{e.preventDefault();salvarNaLista();});
$('formEvento').addEventListener('input',()=>{estado.formularioAlterado=true;$('link').setCustomValidity('');$('mapa').setCustomValidity('');});
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
