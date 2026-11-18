/* Utilitários de agenda. Não executa JavaScript vindo do repositório. */
export function localizarArrayAgenda(source) {
  const match = /\bagenda\s*:\s*\[/.exec(source);
  if (!match) throw new Error('A propriedade agenda não foi encontrada em js/dados.js.');
  const start = match.index + match[0].lastIndexOf('[');
  let depth = 0, quote = '', escape = false, lineComment = false, blockComment = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && next === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === quote) quote = '';
      continue;
    }
    if (c === '/' && next === '/') { lineComment = true; i++; continue; }
    if (c === '/' && next === '*') { blockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
    if (c === '[') depth++;
    if (c === ']' && --depth === 0) return { start, end: i, raw: source.slice(start, i + 1) };
  }
  throw new Error('A lista de agenda está incompleta.');
}

// O formato antigo contém objetos JS com chaves sem aspas; aceitamos somente
// objetos planos com propriedades de texto, sem eval ou Function.
export function lerAgenda(source) {
  const { raw } = localizarArrayAgenda(source);
  const events = [];
  const body = raw.slice(1, -1);
  const objectRe = /\{([^{}]*)\}/g;
  let match, previousEnd = 0;
  while ((match = objectRe.exec(body))) {
    if (!/^\s*,?\s*$/.test(body.slice(previousEnd, match.index))) {
      throw new Error('Formato inesperado entre eventos da agenda.');
    }
    previousEnd = objectRe.lastIndex;
    const props = {};
    const obj = match[1];
    const propRe = /\s*(?:"([A-Za-z][A-Za-z0-9_]*)"|([A-Za-z][A-Za-z0-9_]*))\s*:\s*("(?:\\.|[^"\\])*")\s*(?:,|$)/gy;
    let pos = 0;
    while (pos < obj.length) {
      propRe.lastIndex = pos;
      const found = propRe.exec(obj);
      if (!found) {
        if (!obj.slice(pos).trim()) break;
        throw new Error('Formato de evento não reconhecido.');
      }
      props[found[1] || found[2]] = JSON.parse(found[3]);
      pos = propRe.lastIndex;
    }
    events.push(props);
  }
  if (!/^\s*$/.test(body.slice(previousEnd))) throw new Error('Formato inesperado no final da agenda.');
  return events;
}

function dataValida(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validarAgenda(input) {
  if (!Array.isArray(input) || input.length > 500) throw new Error('A agenda deve ter no máximo 500 eventos.');
  const keys = ['data', 'horario', 'titulo', 'local', 'endereco', 'link'];
  const output = input.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Evento ${index + 1} inválido.`);
    const obj = {};
    for (const key of keys) {
      if (item[key] !== undefined && typeof item[key] !== 'string') throw new Error(`Campo ${key} inválido no evento ${index + 1}.`);
      const val = (item[key] || '').trim();
      if (val.length > (key === 'endereco' || key === 'link' ? 500 : 180)) throw new Error(`Campo ${key} muito longo no evento ${index + 1}.`);
      if (val) obj[key] = val;
    }
    if (!dataValida(obj.data || '')) throw new Error(`Data inválida no evento ${index + 1}.`);
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(obj.horario || '')) throw new Error(`Horário inválido no evento ${index + 1}.`);
    if (!obj.titulo || !obj.local) throw new Error(`Preencha título e local do evento ${index + 1}.`);
    if (obj.link && !/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(obj.link)) throw new Error(`O link do evento ${index + 1} deve começar com https://.`);
    return obj;
  });
  output.sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario) || a.titulo.localeCompare(b.titulo, 'pt-BR'));
  return output;
}

export function substituirAgenda(source, events) {
  const { start, end } = localizarArrayAgenda(source);
  const json = JSON.stringify(validarAgenda(events), null, 2).replace(/\n/g, '\n  ');
  return source.slice(0, start) + json + source.slice(end + 1);
}
