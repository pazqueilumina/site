// Monitor de e-mails do painel administrativo.
// Protegido por functions/api/admin/_middleware.js (Cloudflare Access).
// Requer binding D1 EMAIL_DB apontando para o banco do Worker pazqueilumina-lembretes.
// Nunca expor payload_json, destinatários, hashes, IDs do Resend ou segredos.
function respond(body,status=200) {
  return new Response(JSON.stringify(body), {status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'private, no-store',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'same-origin'
  }});
}
const safeCount = n => Number.isFinite(Number(n)) ? Math.max(0,Number(n)) : 0;
const safeText = (value,max=160) => String(value||'').replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[e-mail]').slice(0,max);
const VALID_TABLES = new Set(['reminder_deliveries','monthly_deliveries','email_worker_runs']);
async function tableExists(db,name) {
  if(!VALID_TABLES.has(name)) throw Error('Tabela não permitida');
  return !!(await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(name).first());
}
async function deliveryStats(db,table,cutoff,now) {
  if(!VALID_TABLES.has(table) || table==='email_worker_runs') throw Error('Tabela inválida');
  const row = await db.prepare(`SELECT
    COUNT(*) AS total,
    COALESCE(SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END),0) AS sent,
    COALESCE(SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END),0) AS failed,
    COALESCE(SUM(CASE WHEN status='sending' AND lease_until < ? THEN 1 ELSE 0 END),0) AS stalled,
    MAX(CASE WHEN status='sent' THEN updated_at ELSE NULL END) AS last_sent_at,
    MAX(updated_at) AS last_activity_at
    FROM ${table} WHERE updated_at >= ?`).bind(now,cutoff).first();
  const recent = await db.prepare(`SELECT status,attempts,last_error,updated_at,
    ${table==='reminder_deliveries' ? 'reminder_type,event_id' : 'month_key'}
    FROM ${table}
    WHERE updated_at >= ? AND (status='failed' OR (status='sending' AND lease_until < ?))
    ORDER BY updated_at DESC LIMIT 8`).bind(cutoff,now).all();
  return {
    total:safeCount(row?.total),sent:safeCount(row?.sent),failed:safeCount(row?.failed),stalled:safeCount(row?.stalled),
    lastSentAt:row?.last_sent_at||null,lastActivityAt:row?.last_activity_at||null,
    failures:(Array.isArray(recent?.results)?recent.results:[]).map(item=>({
      kind:table==='reminder_deliveries'?'lembrete':'mensal',
      category:table==='reminder_deliveries'?String(item.reminder_type||'').slice(0,8):String(item.month_key||'').slice(0,18),
      eventId:table==='reminder_deliveries'?String(item.event_id||'').slice(0,64):null,
      status:item.status==='failed'?'failed':'stalled',
      attempts:safeCount(item.attempts),at:item.updated_at||null,
      error:safeText(item.last_error|| (item.status==='sending'?'Envio interrompido ou expirado.':'Falha não detalhada.'))
    }))
  };
}
export async function onRequestGet({env}) {
  if(!env.EMAIL_DB || typeof env.EMAIL_DB.prepare!=='function') {
    return respond({status:'not_configured',message:'Vincule o banco D1 pazqueilumina-lembretes ao projeto Pages com o nome EMAIL_DB.'});
  }
  const db=env.EMAIL_DB;
  try {
    const [hasReminder,hasMonthly,hasRuns]=await Promise.all([
      tableExists(db,'reminder_deliveries'),tableExists(db,'monthly_deliveries'),tableExists(db,'email_worker_runs')
    ]);
    if(!hasReminder) return respond({status:'incomplete',message:'Tabela de lembretes não encontrada no D1 vinculado. Confira o banco selecionado.'});
    const now=new Date(), nowIso=now.toISOString(),cutoff=new Date(now.getTime()-30*86400000).toISOString();
    const reminder=await deliveryStats(db,'reminder_deliveries',cutoff,nowIso);
    const monthly=hasMonthly?await deliveryStats(db,'monthly_deliveries',cutoff,nowIso):null;
    let runs=[];
    if(hasRuns) {
      const result=await db.prepare(`SELECT job,last_run_at,last_success_at,last_error_at,last_error
        FROM email_worker_runs WHERE job IN ('cron','reminders','monthly','test_templates','test_monthly')`).all();
      runs=(Array.isArray(result?.results)?result.results:[]).map(r=>({
        job:String(r.job||''),lastRunAt:r.last_run_at||null,lastSuccessAt:r.last_success_at||null,
        lastErrorAt:r.last_error_at||null,error:r.last_error?safeText(r.last_error):null
      }));
    }
    const cron=runs.find(r=>r.job==='cron')||null;
    const staleCron=!!cron?.lastRunAt && (now.getTime()-Date.parse(cron.lastRunAt)>15*60000);
    const executionErrors=runs.filter(r=>!!r.error);
    const failures=[...reminder.failures,...(monthly?.failures||[])].sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,12);
    return respond({
      status:'ok',windowDays:30,
      deliveries:{
        sent:reminder.sent+(monthly?.sent||0),failed:reminder.failed+(monthly?.failed||0),
        stalled:reminder.stalled+(monthly?.stalled||0),
        lastSentAt:[reminder.lastSentAt,monthly?.lastSentAt].filter(Boolean).sort().at(-1)||null,
        reminders:reminder,monthly:monthly?{...monthly,failures:undefined}:null,
        monthlyReady:hasMonthly,failures
      },
      monitor:{
        installed:hasRuns,pending:hasRuns&&!cron,lastRunAt:cron?.lastRunAt||null,lastSuccessAt:cron?.lastSuccessAt||null,
        stale:staleCron,executionErrors:executionErrors.length,
        errors:executionErrors.map(r=>({job:r.job,error:r.error,at:r.lastErrorAt})).slice(0,8)
      },
      checkedAt:nowIso
    });
  } catch(e) {
    // Não retornar SQL nem detalhes internos ao navegador.
    return respond({status:'error',message:'Não foi possível consultar o histórico de e-mails no D1.'},503);
  }
}
