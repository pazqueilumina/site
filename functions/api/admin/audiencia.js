// Estatísticas de audiência do Cloudflare Web Analytics (RUM).
// Protegido pelo middleware de /api/admin; token disponível somente no servidor.
const ACCOUNT_ID = 'b17d97afddd9521b943b02ad8940faa3';
const HOSTS = ['pazqueilumina.com.br', 'www.pazqueilumina.com.br'];
const QUERY = `query SiteAudience($account: string!, $start: Date!, $end: Date!) {
 viewer {
  accounts(filter: {accountTag: $account}) {
   totals: rumPageloadEventsAdaptiveGroups(
    limit: 1,
    filter: {date_geq: $start, date_leq: $end, requestHost_in: ["pazqueilumina.com.br", "www.pazqueilumina.com.br"]}
   ) { count sum { visits } }
   countries: rumPageloadEventsAdaptiveGroups(
    limit: 10,
    orderBy: [sum_visits_DESC],
    filter: {date_geq: $start, date_leq: $end, requestHost_in: ["pazqueilumina.com.br", "www.pazqueilumina.com.br"]}
   ) { sum { visits } dimensions { countryName } }
  }
 }
}`;
function respond(payload,status=200){
 return new Response(JSON.stringify(payload),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'));
const safeNumber=n=>Number.isFinite(Number(n))?Math.max(0,Math.round(Number(n))):0;
export async function onRequestGet({request,env}){
 const url=new URL(request.url),start=url.searchParams.get('inicio')||'',end=url.searchParams.get('fim')||'';
 if(!validDate(start)||!validDate(end)||start>end)return respond({erro:'Informe um período válido.'},400);
 if(end>new Date().toISOString().slice(0,10))return respond({erro:'A data final não pode ser futura.'},400);
 if(!env.CF_ANALYTICS_TOKEN)return respond({status:'pendente',mensagem:'Configure o segredo CF_ANALYTICS_TOKEN no projeto Cloudflare Pages.'});
 const account=env.CF_ACCOUNT_ID||ACCOUNT_ID;
 try{
  const upstream=await fetch('https://api.cloudflare.com/client/v4/graphql',{
   method:'POST',
   headers:{Authorization:'Bearer '+env.CF_ANALYTICS_TOKEN,'Content-Type':'application/json'},
   body:JSON.stringify({query:QUERY,variables:{account,start,end}}),
   cache:'no-store'
  });
  if(!upstream.ok){
   if(upstream.status===401||upstream.status===403)return respond({erro:'A Cloudflare recusou o acesso. Confira a permissão Account Analytics: Read do token.'},502);
   return respond({erro:'Cloudflare Analytics indisponível (HTTP '+upstream.status+').'},502);
  }
  const payload=await upstream.json();
  if(Array.isArray(payload.errors)&&payload.errors.length){
   const message=payload.errors.map(e=>String(e.message||'')).join(' ');
   if(/older than|maximum|duration|time range|range too|exceeds|retention|notOlderThan|too large/i.test(message)){
    return respond({status:'limite_periodo',mensagem:'A Cloudflare não disponibiliza dados para todo esse período. Selecione um intervalo mais recente ou menor.'});
   }
   if(/not authorized|unauthorized|permission|access denied|does not have access/i.test(message)){
    return respond({erro:'Token sem permissão para consultar as estatísticas da conta Cloudflare.'},502);
   }
   return respond({erro:'A consulta de Web Analytics foi rejeitada. Confira se o recurso está habilitado no projeto.'},502);
  }
  const accounts=payload?.data?.viewer?.accounts;
  if(!Array.isArray(accounts)||!accounts.length)return respond({erro:'Conta Cloudflare não encontrada ou sem acesso a Web Analytics.'},502);
  const record=accounts[0],total=Array.isArray(record.totals)?record.totals[0]:null;
  const visits=safeNumber(total?.sum?.visits),views=safeNumber(total?.count);
  const countries=(Array.isArray(record.countries)?record.countries:[])
   .map(c=>({pais:String(c?.dimensions?.countryName||'').slice(0,70),visitas:safeNumber(c?.sum?.visits)}))
   .filter(c=>c.visitas>0).slice(0,8);
  return respond({status:'ok',visitas:visits,visualizacoes:views,paises:countries,inicio:start,fim:end});
 }catch(err){
  return respond({erro:'Não foi possível consultar as estatísticas da Cloudflare neste momento.'},502);
 }
}
