// Série diária do Cloudflare Web Analytics. Separada da consulta de totais para não
// comprometer os indicadores existentes caso a consulta de série falhe.
const ACCOUNT_ID='b17d97afddd9521b943b02ad8940faa3';
const QUERY=`query DailyAudience($account: string!, $start: Date!, $end: Date!) {
 viewer {
  accounts(filter: {accountTag: $account}) {
   daily: rumPageloadEventsAdaptiveGroups(
    limit: 1000,
    orderBy: [date_ASC],
    filter: {date_geq: $start, date_leq: $end, requestHost_in: ["pazqueilumina.com.br", "www.pazqueilumina.com.br"]}
   ) { dimensions { date } sum { visits } }
  }
 }
}`;
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'));
const safeNumber=n=>Number.isFinite(Number(n))?Math.max(0,Math.round(Number(n))):0;
export async function onRequestGet({request,env}){
 const url=new URL(request.url),start=url.searchParams.get('inicio')||'',end=url.searchParams.get('fim')||'';
 if(!validDate(start)||!validDate(end)||start>end)return respond({erro:'Informe um período válido.'},400);
 if(end>new Date().toISOString().slice(0,10))return respond({erro:'A data final não pode ser futura.'},400);
 if(!env.CF_ANALYTICS_TOKEN)return respond({status:'pendente',mensagem:'Configure o segredo CF_ANALYTICS_TOKEN no Cloudflare Pages.',inicio:start,fim:end});
 try{
  const upstream=await fetch('https://api.cloudflare.com/client/v4/graphql',{
   method:'POST',
   headers:{Authorization:'Bearer '+env.CF_ANALYTICS_TOKEN,'Content-Type':'application/json'},
   body:JSON.stringify({query:QUERY,variables:{account:env.CF_ACCOUNT_ID||ACCOUNT_ID,start,end}}),
   cache:'no-store'
  });
  if(!upstream.ok)return respond({erro:'Não foi possível consultar a evolução de visitas (HTTP '+upstream.status+').'},502);
  const payload=await upstream.json();
  if(Array.isArray(payload.errors)&&payload.errors.length){
   const message=payload.errors.map(e=>String(e.message||'')).join(' ');
   if(/older than|maximum|duration|time range|range too|exceeds|retention|notOlderThan|too large/i.test(message))
    return respond({status:'limite_periodo',mensagem:'A Cloudflare não disponibiliza a série diária para todo esse período. Selecione um intervalo mais recente ou menor.',inicio:start,fim:end});
   return respond({erro:'A Cloudflare recusou a consulta da evolução diária. Confira as permissões de leitura de Analytics.'},502);
  }
  const accounts=payload?.data?.viewer?.accounts;
  if(!Array.isArray(accounts)||!accounts.length)return respond({erro:'Conta Cloudflare não encontrada ou sem acesso.'},502);
  const rows=Array.isArray(accounts[0].daily)?accounts[0].daily:[];
  const days=rows.map(r=>({data:String(r?.dimensions?.date||''),visitas:safeNumber(r?.sum?.visits)}))
   .filter(r=>validDate(r.data)&&r.data>=start&&r.data<=end);
  return respond({status:'ok',inicio:start,fim:end,dias:days});
 }catch(err){return respond({erro:'Não foi possível consultar a evolução das visitas neste momento.'},502);}
}
