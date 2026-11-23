// Estatísticas de mídia do GoatCounter. Protegido por /api/admin/_middleware.js.
// A chave GOATCOUNTER_API_TOKEN permanece apenas no Cloudflare Pages (secret).
const HOST = 'https://pazqueilumina.goatcounter.com';
const TIPOS = new Set(['video','audio','pdf','short']);
const MAX_PAGINAS = 12;
const resposta = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' }
});
const numero = valor => Number.isFinite(Number(valor)) ? Math.max(0, Math.round(Number(valor))) : 0;
function hojeSP() {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit'
  }).formatToParts(new Date());
  const campos = Object.fromEntries(partes.filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
  return { ano: campos.year, mes: campos.month };
}
function periodo(ano, mes) {
  // São Paulo: UTC-3. Sem horário de verão no período de operação do projeto.
  const inicio = new Date(Date.UTC(ano, mes === null ? 0 : mes - 1, 1, 3));
  const proximo = mes === null ? new Date(Date.UTC(ano + 1, 0, 1, 3)) : new Date(Date.UTC(ano, mes, 1, 3));
  return { inicio, fim: new Date(Math.min(Date.now(), proximo.getTime() - 1000)) };
}
function analisarCaminho(valor) {
  const match = /^\/?midia\/(video|audio|pdf|short)\/((?:PAL|SHO)-\d{4,})$/i.exec(String(valor || ''));
  if (!match) return null;
  const tipo = match[1].toLowerCase(), id = match[2].toUpperCase();
  if (!TIPOS.has(tipo) || ((tipo === 'short') !== id.startsWith('SHO-'))) return null;
  return { tipo, id };
}
function erroHttp(status) {
  if (status === 401 || status === 403) return 'Chave GoatCounter inválida ou sem permissão para ler estatísticas.';
  if (status === 429) return 'Limite temporário de consultas do GoatCounter. Tente novamente em um minuto.';
  return 'GoatCounter indisponível (HTTP ' + status + ').';
}
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const anoTxt = url.searchParams.get('ano') || '', mesTxt = url.searchParams.get('mes') || '';
  if (!/^\d{4}$/.test(anoTxt) || (mesTxt && !/^(?:[1-9]|1[0-2])$/.test(mesTxt))) {
    return resposta({ erro: 'Informe ano (AAAA) e, opcionalmente, mês (1 a 12).' }, 400);
  }
  const ano = Number(anoTxt), mes = mesTxt ? Number(mesTxt) : null, hoje = hojeSP();
  if (ano < 2024 || ano > hoje.ano || (ano === hoje.ano && mes !== null && mes > hoje.mes)) {
    return resposta({ erro: 'O período é inválido ou futuro.' }, 400);
  }
  if (!env.GOATCOUNTER_API_TOKEN) {
    return resposta({ status: 'pendente', mensagem: 'Configure GOATCOUNTER_API_TOKEN como segredo no projeto Cloudflare Pages para ativar os rankings.' });
  }
  const { inicio, fim } = periodo(ano, mes);
  if (inicio > fim) return resposta({ erro: 'O período ainda não começou.' }, 400);
  const excluidos = new Set(), resultados = new Map(), dias = new Map();
  let paginas = 0;
  try {
    for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
      const destino = new URL(HOST + '/api/v0/stats/hits');
      destino.searchParams.set('start', inicio.toISOString());
      destino.searchParams.set('end', fim.toISOString());
      destino.searchParams.set('group', 'day');
      destino.searchParams.set('limit', '100');
      if (excluidos.size) destino.searchParams.set('exclude_paths', [...excluidos].join(','));
      const upstream = await fetch(destino.toString(), {
        headers: { Authorization: 'Bearer ' + env.GOATCOUNTER_API_TOKEN, Accept: 'application/json', 'Content-Type': 'application/json' },
        cache: 'no-store'
      });
      if (!upstream.ok) return resposta({ erro: erroHttp(upstream.status) }, 502);
      const payload = await upstream.json();
      if (!Array.isArray(payload.hits)) return resposta({ erro: 'O GoatCounter retornou dados inesperados.' }, 502);
      paginas++;
      let novos = 0;
      for (const hit of payload.hits) {
        const pid = Number(hit.path_id);
        if (Number.isInteger(pid) && pid > 0 && !excluidos.has(String(pid))) {
          excluidos.add(String(pid)); novos++;
        }
        const midia = analisarCaminho(hit.path);
        if (!midia) continue;
        const chave = midia.tipo + '/' + midia.id;
        const atual = resultados.get(chave) || { tipo: midia.tipo, id: midia.id, titulo: '', acessos: 0 };
        atual.acessos += numero(hit.count);
        if (!atual.titulo && hit.title) atual.titulo = String(hit.title).slice(0, 180).replace(/^(?:Vídeo|Áudio|PDF|Short):\s*/i, '');
        resultados.set(chave, atual);
        for (const stat of Array.isArray(hit.stats) ? hit.stats : []) {
          const data = String(stat.day || '').slice(0, 10);
          if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) continue;
          let quantidade = Number(stat.daily);
          if (!Number.isFinite(quantidade) && Array.isArray(stat.hourly)) quantidade = stat.hourly.reduce((s, n) => s + numero(n), 0);
          if (!Number.isFinite(quantidade) || quantidade <= 0) continue;
          const valor = dias.get(data) || { data, video: 0, audio: 0, pdf: 0, short: 0 };
          valor[midia.tipo] += numero(quantidade);
          dias.set(data, valor);
        }
      }
      if (payload.more !== true) break;
      if (!novos) return resposta({ erro: 'Paginação do GoatCounter não avançou. Consulta interrompida para evitar duplicações.' }, 502);
      if (pagina === MAX_PAGINAS - 1) return resposta({ erro: 'Existem mais registros que o limite seguro da consulta. Escolha um período menor.' }, 502);
      await new Promise(resolve => setTimeout(resolve, 330));
    }
    const ranking = [...resultados.values()].filter(r => r.acessos > 0)
      .sort((a, b) => b.acessos - a.acessos || a.id.localeCompare(b.id));
    const totais = { video: 0, audio: 0, pdf: 0, short: 0 };
    for (const item of ranking) totais[item.tipo] += item.acessos;
    const evolucao = [...dias.values()].sort((a, b) => a.data.localeCompare(b.data))
      .map(d => ({ ...d, total: d.video + d.audio + d.pdf + d.short }));
    return resposta({
      status: 'ok', ano, mes, inicio: inicio.toISOString(), fim: fim.toISOString(),
      totais, total: Object.values(totais).reduce((a, b) => a + b, 0),
      ranking, evolucao, paginas, atualizadoEm: new Date().toISOString(),
      metrica: 'Contagem de eventos do GoatCounter; não mede reprodução concluída nem download confirmado.'
    });
  } catch (err) {
    return resposta({ erro: 'Não foi possível consultar o GoatCounter neste momento.' }, 502);
  }
}
