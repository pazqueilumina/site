import {geocodeDestination} from '../../../server_lib/geocode.js';
import {validarLocais} from '../../../server_lib/locais.js';

/* Marcadores dos centros visitados. Não consulta nem devolve o endereço residencial. */
const IDENT='PazQueIlumina/1.0 (https://pazqueilumina.com.br; pazqueilumina@gmail.com)';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const json=(data,status=200)=>new Response(JSON.stringify(data),{
 status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
});
export async function onRequestPost({request}){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({erro:'Origem não autorizada.'},403);
 if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return json({erro:'Envie JSON.'},415);
 let locais;
 try{
  const raw=await request.text();
  if(raw.length>12000)return json({erro:'Solicitação muito grande.'},413);
  const body=JSON.parse(raw);
  if(!Array.isArray(body?.locais)||body.locais.length>12)throw Error('Envie até 12 locais por consulta.');
  locais=validarLocais(body.locais);
 }catch(e){return json({erro:'Locais inválidos: '+String(e.message||'dados incorretos').slice(0,120)},400);}
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
 const pontos=[],erros=[];
 for(const local of locais){
  try{
   const point=await geocodeDestination(local,provider,cache);
   if(!Number.isFinite(point.lat)||!Number.isFinite(point.lon))throw Error('Coordenadas indisponíveis.');
   if(point.aproximado&&!point.manual&&!point.link)throw Error('Endereço sem número confirmado; marcador omitido.');
   pontos.push({id:local.id,latitude:point.lat,longitude:point.lon,
    precisao:point.manual?'manual':point.link?'link':'exata'});
  }catch(e){
   erros.push({id:local.id,motivo:String(e.message||'Não foi possível localizar o centro.').slice(0,140)});
  }
 }
 return json({pontos,erros});
}
