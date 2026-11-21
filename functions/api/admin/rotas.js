import {address,hash,readCache,writeCache,geocodeOrigin,geocodeDestination} from '../../../server_lib/geocode.js';
/* Cálculo de rotas rodoviárias para o Dashboard do Palestrante.
 * A origem residencial é um segredo do Cloudflare Pages (ORIGEM_DESLOCAMENTOS),
 * jamais armazenado no repositório público ou retornado na resposta.
 * Geocodificação: Nominatim (OSM); roteamento: OSRM. Cache longo e uso leve.
 */
const ORIGIN_SECRET='ORIGEM_DESLOCAMENTOS';
const OSRM='https://router.project-osrm.org/table/v1/driving/';
const IDENT='PazQueIlumina/1.0 (https://pazqueilumina.com.br; pazqueilumina@gmail.com)';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function json(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
function validLocal(x){
 return x&&typeof x==='object'&&!Array.isArray(x)&&/^[a-z0-9:_-]{1,120}$/.test(x.id||'')&&
  typeof x.endereco==='string'&&x.endereco.length>=4&&x.endereco.length<=500&&
  ['bairro','cidade','uf','nome'].every(k=>x[k]===undefined||(typeof x[k]==='string'&&x[k].length<=180))&&
  (x.maps===undefined||(typeof x.maps==='string'&&x.maps.length<=500&&/^https:\/\/[^\s]+$/i.test(x.maps)))&&
  ((x.latitude===undefined&&x.longitude===undefined)||
   (typeof x.latitude==='string'&&typeof x.longitude==='string'&&
    /^-?\d{1,2}(?:\.\d{1,7})?$/.test(x.latitude)&&
    /^-?\d{1,2}(?:\.\d{1,7})?$/.test(x.longitude)&&
    Number(x.latitude)>= -34&&Number(x.latitude)<=6&&
    Number(x.longitude)>= -75&&Number(x.longitude)<= -33));
}
export async function onRequestPost({request,env}){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({erro:'Origem não autorizada.'},403);
 if(!(request.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))return json({erro:'Envie JSON.'},415);
 const origin=String(env[ORIGIN_SECRET]||'').trim();
 if(!origin)return json({codigo:'ORIGEM_NAO_CONFIGURADA',erro:'Configure o segredo ORIGEM_DESLOCAMENTOS no Cloudflare Pages para ativar o cálculo automático.'},503);
 if(origin.length>250)return json({erro:'A origem configurada é inválida.'},503);
 let body;
 try{const raw=await request.text();if(raw.length>12000)return json({erro:'Solicitação muito grande.'},413);body=JSON.parse(raw);}catch{return json({erro:'JSON inválido.'},400);}
 if(!Array.isArray(body?.locais)||body.locais.length>20||body.locais.some(x=>!validLocal(x)))return json({erro:'Lista de locais inválida.'},400);
 const unique=[...new Map(body.locais.map(x=>[x.id,x])).values()];
 const cache=typeof caches!=='undefined'?caches.default:null;
 let lastProviderCall=0;
 async function provider(url){
  const elapsed=Date.now()-lastProviderCall;
  if(elapsed<1150)await delay(1150-elapsed);
  lastProviderCall=Date.now();
  const res=await fetch(url,{headers:{'User-Agent':IDENT,'Referer':'https://pazqueilumina.com.br/','Accept':'application/json'},signal:AbortSignal.timeout(12000)});
  if(!res.ok)throw Error('Serviço de mapas indisponível (HTTP '+res.status+').');
  return res.json();
 }
 const rotas=[],erros=[];
 let originPoint;
 try{originPoint=await geocodeOrigin(origin,provider,cache);}catch{ return json({erro:'Não foi possível localizar a origem configurada. Verifique o endereço e tente novamente.',codigo:'ORIGEM_INVALIDA'},502);}
 if(!originPoint)return json({erro:'Origem não localizada no mapa. Confira a configuração privada.',codigo:'ORIGEM_INVALIDA'},502);
 for(const place of unique){
  const destination=address(place),key='route-v6-'+await hash(origin+'|'+destination+'|'+(place.nome||'')+'|'+(place.latitude||'')+'|'+(place.longitude||'')+'|'+(place.maps||''));
  try{
   const hit=await readCache(cache,key);
   if(hit?.km>0){rotas.push({id:place.id,km:hit.km,aproximado:!!hit.aproximado});continue;}
   const target=await geocodeDestination(place,provider,cache);
   const coords=[originPoint,target].map(p=>p.lon+','+p.lat).join(';');
   const url=OSRM+coords+'?annotations=distance';
   const matrix=await provider(url);
   const outbound=Number(matrix?.distances?.[0]?.[1]),inbound=Number(matrix?.distances?.[1]?.[0]);
   if(matrix?.code!=='Ok'||!Number.isFinite(outbound)||!Number.isFinite(inbound)||outbound<0||inbound<0)throw Error('Rota rodoviária não disponível.');
   const km=Math.round((outbound+inbound)/100)/10;
   if(km<=0||km>10000)throw Error('Distância fora do intervalo esperado.');
   const result={km,aproximado:originPoint.aproximado||target.aproximado};
   rotas.push({id:place.id,...result});
   await writeCache(cache,key,result,2592000);
  }catch(e){erros.push({id:place.id,erro:String(e?.message||'Não foi possível calcular a rota.').slice(0,140)});}
 }
 return json({rotas,erros,fonte:'OpenStreetMap / ArcGIS / Google Maps (coordenadas do link) / OSRM'});
}
