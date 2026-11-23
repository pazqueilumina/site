// Inscritos públicos — API administrativa protegida pelo Cloudflare Access.
// EMAIL_DB aponta para o mesmo D1 do Worker, mas sem expor tokens ou segredos.
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers});}
function number(value){return Math.max(0,Number(value)||0);}
const zero={total:0,active:0,pending:0,unsubscribed:0,weekly:0};
async function hasTable(db){return !!(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='monthly_subscribers'").first());}
async function hasWeeklyColumn(db){const r=await db.prepare('PRAGMA table_info(monthly_subscribers)').all();return (r.results||[]).some(x=>x.name==='weekly_opt_in');}

const saoPauloOffsetFormatter=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',timeZoneName:'shortOffset'});
function saoPauloMidnight(dateKey){
 const [y,m,d]=dateKey.split('-').map(Number),base=Date.UTC(y,m-1,d);
 const offsetAt=ms=>{
  const zone=saoPauloOffsetFormatter.formatToParts(new Date(ms)).find(p=>p.type==='timeZoneName')?.value;
  const match=/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zone||'');
  if(!match)throw Error('Fuso horário indisponível');
  return (match[1]==='+'?1:-1)*(Number(match[2])*60+Number(match[3]||0))*60000;
 };
 let instant=base-offsetAt(base);instant=base-offsetAt(instant);
 return new Date(instant).toISOString();
}
function validDateKey(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s||''))return false;
 const [y,m,d]=s.split('-').map(Number);
 return y>=2020&&y<=2100&&new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)===s;
}
function nextDateKey(s){const [y,m,d]=s.split('-').map(Number);return new Date(Date.UTC(y,m-1,d+1)).toISOString().slice(0,10);}
function subscriberPeriodParams(url){
 const month=url.searchParams.get('month')||'',year=url.searchParams.get('year')||'';
 const from=url.searchParams.get('from')||'',to=url.searchParams.get('to')||'';
 const annual=!!year&&!month;
 if((!annual&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))||(annual&&!/^\d{4}$/.test(year))||(year&&month)
   ||!validDateKey(from)||!validDateKey(to)||from>to)return null;
 if((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000>400)return null;
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 const currentMonth=parts.year+'-'+parts.month,currentYear=Number(parts.year);
 if(annual){
  const y=Number(year);if(y<2020||y>currentYear)return null;
  const start=year+'-01-01',end=String(y+1)+'-01-01',current=y===currentYear;
  return {month:null,year,monthStart:saoPauloMidnight(start),monthEnd:saoPauloMidnight(end),
   cutoff:current?new Date().toISOString():saoPauloMidnight(end),
   currentMonth:current,periodStart:saoPauloMidnight(from),periodEnd:saoPauloMidnight(nextDateKey(to))};
 }
 if(!validDateKey(month+'-01')||month>currentMonth)return null;
 const [y,m]=month.split('-').map(Number),nextMonth=new Date(Date.UTC(y,m,1)).toISOString().slice(0,10);
 return {month,year:null,monthStart:saoPauloMidnight(month+'-01'),monthEnd:saoPauloMidnight(nextMonth),
  cutoff:month===currentMonth?new Date().toISOString():saoPauloMidnight(nextMonth),
  currentMonth:month===currentMonth,periodStart:saoPauloMidnight(from),periodEnd:saoPauloMidnight(nextDateKey(to))};
}
const zeroMonthly={new:0,confirmed:0,confirmedFromNew:0,weekly:0,cancelled:0,activeAtEnd:0};
function filters(url){
  const q=(url.searchParams.get('q')||'').trim().slice(0,120);
  const status=url.searchParams.get('status')||'todos';
  if(!['todos','active','pending','unsubscribed'].includes(status))return null;
  const clauses=[],bind=[];
  if(status!=='todos'){clauses.push('status=?');bind.push(status);}
  if(q){clauses.push("email LIKE ? ESCAPE '\\'");bind.push('%'+q.replace(/[\\%_]/g,'\\$&')+'%');}
  return {q,status,where:clauses.length?' WHERE '+clauses.join(' AND '):'',bind};
}
function csvCell(value){
  let s=String(value??'');
  if(/^[=+\-@\t\r]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
function csvResponse(rows){
  const fields=['email','status','weekly_opt_in','created_at','confirmed_at','unsubscribed_at'];
  const lines=[fields.join(';')].concat(rows.map(row=>fields.map(k=>csvCell(row[k])).join(';')));
  return new Response('\uFEFF'+lines.join('\r\n'),{status:200,headers:{
    'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="inscritos-pazqueilumina.csv"',
    'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'
  }});
}
export async function onRequestGet({env,request}){
  const db=env.EMAIL_DB;
  if(!db?.prepare)return json({status:'not_configured',message:'Binding EMAIL_DB não configurado no Cloudflare Pages.'},503);
  const url=new URL(request.url),filter=filters(url);
  if(!filter)return json({erro:'Filtro de situação inválido.'},400);
  const wantsStats=url.searchParams.get('stats')==='1';
  const period=wantsStats?subscriberPeriodParams(url):null;
  if(wantsStats&&!period)return json({erro:'Mês, ano ou intervalo de datas inválido.'},400);
  const rawPage=Number(url.searchParams.get('page')||1);
  if(!Number.isInteger(rawPage)||rawPage<1||rawPage>100000)return json({erro:'Página inválida.'},400);
  try{
    if(!await hasTable(db)){
      if(wantsStats)return json({status:'ok',summary:zero,monthly:zeroMonthly,periodNew:0,month:period.month,year:period.year,historicalEstimated:!period.currentMonth,weeklyHistoricalExact:false});
      if(url.searchParams.get('format')==='csv')return csvResponse([]);
      return json({status:'ok',summary:zero,items:[],total:0,page:1,pageSize:50});
    }
    const weekly=await hasWeeklyColumn(db);
    const weeklyExpr=weekly?'weekly_opt_in':'0';
    const summaryRow=await db.prepare("SELECT COUNT(*) AS total, SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) AS active, SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status='unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed, SUM(CASE WHEN status='active' AND "+weeklyExpr+"=1 THEN 1 ELSE 0 END) AS weekly FROM monthly_subscribers").first();
    const summary=Object.fromEntries(Object.keys(zero).map(k=>[k,number(summaryRow?.[k])]));
    if(wantsStats){
      const weeklyPredicate=weekly?'weekly_opt_in=1':'0=1';
      const statement=`SELECT
        COALESCE(SUM(CASE WHEN created_at>=? AND created_at<? THEN 1 ELSE 0 END),0) AS new,
        COALESCE(SUM(CASE WHEN confirmed_at>=? AND confirmed_at<? THEN 1 ELSE 0 END),0) AS confirmed,
        COALESCE(SUM(CASE WHEN created_at>=? AND created_at<? AND confirmed_at IS NOT NULL THEN 1 ELSE 0 END),0) AS confirmedFromNew,
        COALESCE(SUM(CASE WHEN ${weeklyPredicate} AND confirmed_at>=? AND confirmed_at<? THEN 1 ELSE 0 END),0) AS weekly,
        COALESCE(SUM(CASE WHEN unsubscribed_at>=? AND unsubscribed_at<? THEN 1 ELSE 0 END),0) AS cancelled,
        COALESCE(SUM(CASE WHEN confirmed_at IS NOT NULL AND confirmed_at<? AND (unsubscribed_at IS NULL OR unsubscribed_at>=?)
          AND status IN ('active','unsubscribed') THEN 1 ELSE 0 END),0) AS activeAtEnd
        FROM monthly_subscribers`;
      const row=await db.prepare(statement).bind(
        period.monthStart,period.monthEnd,
        period.monthStart,period.monthEnd,
        period.monthStart,period.monthEnd,
        period.monthStart,period.monthEnd,
        period.monthStart,period.monthEnd,
        period.cutoff,period.cutoff
      ).first();
      const monthly=Object.fromEntries(Object.keys(zeroMonthly).map(key=>[key,number(row?.[key])]));
      if(period.currentMonth)monthly.activeAtEnd=summary.active;
      const periodRow=await db.prepare('SELECT COUNT(*) AS total FROM monthly_subscribers WHERE created_at>=? AND created_at<?')
        .bind(period.periodStart,period.periodEnd).first();
      return json({status:'ok',summary,monthly,periodNew:number(periodRow?.total),month:period.month,year:period.year,
        historicalEstimated:!period.currentMonth,weeklyHistoricalExact:false});
    }
    if(url.searchParams.get('summary')==='1')return json({status:'ok',summary});
    const fields='email,status,'+weeklyExpr+' AS weekly_opt_in,created_at,confirmed_at,unsubscribed_at';
    if(url.searchParams.get('format')==='csv'){
      const r=await db.prepare('SELECT '+fields+' FROM monthly_subscribers'+filter.where+' ORDER BY created_at DESC LIMIT 5001').bind(...filter.bind).all();
      const rows=r.results||[];
      if(rows.length>5000)return json({erro:'Exportação acima de 5000 registros. Aplique um filtro.'},413);
      return csvResponse(rows);
    }
    const count=await db.prepare('SELECT COUNT(*) AS total FROM monthly_subscribers'+filter.where).bind(...filter.bind).first();
    const total=number(count?.total),pageSize=50,page=Math.min(rawPage,Math.max(1,Math.ceil(total/pageSize)));
    const result=await db.prepare('SELECT '+fields+' FROM monthly_subscribers'+filter.where+' ORDER BY CASE status WHEN \'active\' THEN 0 WHEN \'pending\' THEN 1 ELSE 2 END, created_at DESC LIMIT ? OFFSET ?').bind(...filter.bind,pageSize,(page-1)*pageSize).all();
    return json({status:'ok',summary,items:result.results||[],total,page,pageSize});
  }catch(error){
    console.error('Falha na consulta administrativa de inscritos.');
    return json({status:'error',message:'Não foi possível consultar as inscrições no banco de dados.'},503);
  }
}
export async function onRequestPost({env,request}){
  const db=env.EMAIL_DB;
  if(!db?.prepare)return json({erro:'Banco de dados não configurado.'},503);
  // Proteção contra CSRF, além da autenticação Cloudflare Access da rota /api/admin.
  const origin=request.headers.get('Origin');
  if(origin!==new URL(request.url).origin || (request.headers.get('Sec-Fetch-Site') && request.headers.get('Sec-Fetch-Site')!=='same-origin'))
    return json({erro:'Origem não autorizada.'},403);
  if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))
    return json({erro:'Formato inválido.'},415);
  const raw=await request.text();
  if(raw.length>512)return json({erro:'Solicitação inválida.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({erro:'Dados inválidos.'},400);}
  const email=String(body?.email||'').trim().toLowerCase();
  if(body?.action!=='cancel'||body?.confirm!==true||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return json({erro:'Solicitação de cancelamento inválida.'},400);
  try{
    if(!await hasTable(db))return json({erro:'Inscrição não encontrada.'},404);
    const now=new Date().toISOString();
    const cols=await db.prepare('PRAGMA table_info(monthly_subscribers)').all();
    const existing=new Set((cols.results||[]).map(x=>x.name));
    const assignments=["status='unsubscribed'","unsubscribed_at=?","unsubscribe_token=NULL","verify_hash=NULL","verify_expires_at=NULL"];
    if(existing.has('weekly_opt_in'))assignments.push('weekly_opt_in=0');
    if(existing.has('weekly_verify_hash'))assignments.push('weekly_verify_hash=NULL');
    if(existing.has('weekly_verify_expires_at'))assignments.push('weekly_verify_expires_at=NULL');
    const r=await db.prepare("UPDATE monthly_subscribers SET "+assignments.join(',')+" WHERE email=? AND status IN ('active','pending')").bind(now,email).run();
    if(r.meta?.changes!==1)return json({erro:'Inscrição não encontrada ou já cancelada.'},409);
    return json({status:'ok',message:'Inscrição cancelada. O endereço não receberá novos envios públicos.'});
  }catch(error){
    console.error('Falha no cancelamento administrativo de inscrição.');
    return json({erro:'Não foi possível cancelar a inscrição.'},503);
  }
}
