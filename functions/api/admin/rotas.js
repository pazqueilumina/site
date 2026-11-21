/* Cálculo de rotas rodoviárias para o Dashboard do Palestrante.
 * A origem residencial é um segredo do Cloudflare Pages (ORIGEM_DESLOCAMENTOS),
 * jamais armazenado no repositório público ou retornado na resposta.
 * Geocodificação: Nominatim (OSM); roteamento: OSRM. Cache longo e uso leve.
 */
const ORIGIN_SECRET='ORIGEM_DESLOCAMENTOS';
const NOMINATIM='https://nominatim.openstreetmap.org/search';
const OSRM='https://router.project-osrm.org/table/v1/driving/';
const IDENT='PazQueIlumina/1.0 (https://pazqueilumina.com.br; pazqueilumina@gmail.com)';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function json(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
async function hash(value){
 const data=new TextEncoder().encode(value);
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',data));
 return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
async function readCache(cache,key){
 if(!cache)return null;
 try{const hit=await cache.match(new Request('https://pazqueilumina.com.br/__interno/rotas/'+key));return hit?await hit.json():null;}catch{return null;}
}
async function writeCache(cache,key,value,ttl){
 if(!cache)return;
 try{await cache.put(new Request('https://pazqueilumina.com.br/__interno/rotas/'+key),new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json','Cache-Control':'public, max-age='+ttl}}));}catch{/* Cache pode estar indisponível em desenvolvimento. */}
}
function address(local){
 return [local.endereco,local.bairro,local.cidade,local.uf,'Brasil'].filter(Boolean).join(', ');
}
function validLocal(x){
 return x&&typeof x==='object'&&!Array.isArray(x)&&/^[a-z0-9:_-]{1,120}$/.test(x.id||'')&&
  typeof x.endereco==='string'&&x.endereco.length>=4&&x.endereco.length<=500&&
  ['bairro','cidade','uf'].every(k=>x[k]===undefined||(typeof x[k]==='string'&&x[k].length<=180));
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
 async function geocode(q){
  const key='geo-v1-'+await hash(q.toLocaleLowerCase('pt-BR'));
  const hit=await readCache(cache,key);
  if(hit?.lat!=null&&hit?.lon!=null)return hit;
  const url=new URL(NOMINATIM);
  url.searchParams.set('q',q);
  url.searchParams.set('format','json');
  url.searchParams.set('addressdetails','1');
  url.searchParams.set('countrycodes','br');
  url.searchParams.set('limit','3');
  const data=await provider(url.toString());
  if(!Array.isArray(data)||!data.length)throw Error('Endereço não localizado no mapa.');
  const found=data.find(x=>x.address?.country_code==='br'&&(x.address?.road||x.address?.pedestrian||x.address?.residential||x.address?.footway||x.address?.house_number));
  if(!found)throw Error('Endereço sem precisão suficiente no mapa.');
  const lat=Number(found.lat),lon=Number(found.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat>6||lat< -34||lon< -75||lon> -33)throw Error('Coordenadas fora do Brasil.');
  const point={lat,lon,aproximado:!found.address?.house_number};
  await writeCache(cache,key,point,2592000);
  return point;
 }
 const rotas=[],erros=[];
 let originPoint;
 try{originPoint=await geocode(origin);}catch{ return json({erro:'Não foi possível localizar a origem configurada. Verifique o endereço e tente novamente.',codigo:'ORIGEM_INVALIDA'},502);}
 for(const place of unique){
  const destination=address(place),key='route-v1-'+await hash(origin+'|'+destination);
  try{
   const hit=await readCache(cache,key);
   if(hit?.km>0){rotas.push({id:place.id,km:hit.km,aproximado:!!hit.aproximado});continue;}
   const target=await geocode(destination);
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
 return json({rotas,erros,fonte:'OpenStreetMap / OSRM'});
}
