/* Validação geográfica individual; não exige endereço residencial nem rota. */
import {geocodeDestination} from '../../../server_lib/geocode.js';
import {validarLocais} from '../../../server_lib/locais.js';
const IDENT='PazQueIlumina/1.0 (https://pazqueilumina.com.br; pazqueilumina@gmail.com)';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function json(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
export async function onRequestPost({request}){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({erro:'Origem não autorizada.'},403);
 if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return json({erro:'Envie JSON.'},415);
 if(Number(request.headers.get('Content-Length')||0)>2500)return json({erro:'Solicitação muito grande.'},413);
 let local;
 try{
  const raw=await request.text();
  if(raw.length>2500)return json({erro:'Solicitação muito grande.'},413);
  local=validarLocais([JSON.parse(raw)?.local])[0];
 }catch(e){return json({erro:'Local inválido: '+String(e.message||'dados incorretos').slice(0,100)},400);}
 const cache=typeof caches!=='undefined'?caches.default:null;
 let lastCall=0;
 async function provider(url){
  const elapsed=Date.now()-lastCall;
  if(elapsed<1150)await delay(1150-elapsed);
  lastCall=Date.now();
  const res=await fetch(url,{headers:{'User-Agent':IDENT,'Referer':'https://pazqueilumina.com.br/','Accept':'application/json'},signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw Error('Serviço de mapas indisponível (HTTP '+res.status+').');
  return res.json();
 }
 try{
  const point=await geocodeDestination(local,provider,cache);
  const status=point.manual?'manual':point.link?'link':point.aproximado?'aproximado':'ok';
  const motivo=point.manual?'Coordenadas informadas manualmente; endereço não verificado.':
   point.link?'Coordenadas extraídas do link do Google Maps; confira o ponto no mapa.':
   point.interpolado?'Número correspondente, mas posição estimada pelo ArcGIS.':
   point.aproximado?'Rua localizada; número não confirmado.':
   'Número correspondente localizado por '+(point.fonte||'serviço de mapas')+'.';
  return json({id:local.id,status,motivo,fonte:point.fonte||'',
   ...(Number.isFinite(point.lat)&&Number.isFinite(point.lon)?{latitude:point.lat,longitude:point.lon}:{})});
 }catch(e){
  const msg=String(e?.message||'Falha na consulta.');
  if(msg.startsWith('Endereço não localizado no mapa'))return json({id:local.id,status:'erro',motivo:'Endereço não localizado no mapa.'});
  return json({id:local.id,status:'pendente',motivo:'Não foi possível concluir a consulta ao serviço de mapas.'});
 }
}
