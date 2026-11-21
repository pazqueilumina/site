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
function normalize(value){
 return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}
function streetName(value){
 return String(value||'').split(',')[0].replace(/\s+(?:n[º°o.]?\s*)?\d+[a-z]?\s*$/i,'').trim();
}
// O cadastro preserva a grafia oficial; só a busca aceita Souza/Sousa.
function streetAlias(value){
 const s=String(value||'');
 if(/\bsouza\b/i.test(s))return s.replace(/\bsouza\b/ig,'Sousa');
 if(/\bsousa\b/i.test(s))return s.replace(/\bsousa\b/ig,'Souza');
 return null;
}
function sameStreet(result,street){
 const a=result.address||{};
 const candidate=a.road||a.pedestrian||a.residential||a.footway||a.path||
  ((result.class==='highway'||result.addresstype==='road')?result.name:'')||'';
 const clean=s=>normalize(s)
  .replace(/^(?:rua|r|avenida|av|travessa|praca|estrada|alameda)\s+/,'')
  .replace(/\bsouza\b/g,'sousa');
 const expected=clean(street),actual=clean(candidate);
 return !!(expected&&actual&&(expected===actual||
  (expected.includes(actual)&&actual.length>=8)||
  (actual.includes(expected)&&expected.length>=8)));
}
function sameCity(result,city){
 const a=result.address||{},cityName=a.city||a.town||a.municipality||a.village||'';
 return !city||!cityName||normalize(cityName)===normalize(city);
}
function sameName(result,name){
 const n=normalize(name),label=normalize(result.name||''),display=normalize(result.display_name||'');
 return !!(n&&(label===n||display===n||display.startsWith(n+' ')));
}
function geocodeQueries(local){
 const street=streetName(local.endereco),alias=streetAlias(street);
 const streetVariants=[street,...(alias?[alias]:[])].filter(Boolean);
 const byName=[local.nome,local.bairro,local.cidade,local.uf,'Brasil'].filter(Boolean).join(', ');
 const list=[{q:address(local),mode:'street',fallback:false}];
 // Primeiro tentamos o número também com a grafia alternativa.
 if(alias)list.push({q:address({...local,endereco:local.endereco.replace(street,alias)}),mode:'street',fallback:true});
 // Depois buscamos a rua sem número, com e sem bairro, sem usar o centro da cidade como destino.
 for(const name of streetVariants){
  list.push({q:[name,local.bairro,local.cidade,local.uf,'Brasil'].filter(Boolean).join(', '),mode:'street',fallback:true});
  list.push({q:[name,local.cidade,local.uf,'Brasil'].filter(Boolean).join(', '),mode:'street',fallback:true});
 }
 if(local.nome)list.push({q:byName,mode:'name',fallback:true});
 return list.filter((x,i,arr)=>arr.findIndex(y=>normalize(y.q)===normalize(x.q))===i);
}
function validLocal(x){
 return x&&typeof x==='object'&&!Array.isArray(x)&&/^[a-z0-9:_-]{1,120}$/.test(x.id||'')&&
  typeof x.endereco==='string'&&x.endereco.length>=4&&x.endereco.length<=500&&
  ['bairro','cidade','uf','nome'].every(k=>x[k]===undefined||(typeof x[k]==='string'&&x[k].length<=180));
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
 async function geocode(q,criteria={}){
  const mode=criteria.mode||'origin';
  const key='geo-v3-'+await hash(mode+'|'+q.toLocaleLowerCase('pt-BR'));
  const hit=await readCache(cache,key);
  if(hit?.lat!=null&&hit?.lon!=null)return hit;
  const url=new URL(NOMINATIM);
  url.searchParams.set('q',q);
  url.searchParams.set('format','json');
  url.searchParams.set('addressdetails','1');
  url.searchParams.set('countrycodes','br');
  url.searchParams.set('limit','5');
  const data=await provider(url.toString());
  if(!Array.isArray(data)||!data.length)return null;
  const found=data.find(x=>{
   if(x.address?.country_code!=='br'||!sameCity(x,criteria.city))return false;
   if(mode==='name'){
    if(!sameName(x,criteria.name))return false;
    // Não aceitar uma instituição homônima de outro bairro.
    if(criteria.bairro&&!normalize(x.display_name).includes(normalize(criteria.bairro)))return false;
   }else if(mode==='street'){
    if(!sameStreet(x,criteria.street))return false;
   }else if(!(x.address?.road||x.address?.pedestrian||x.address?.residential||x.address?.footway||x.address?.house_number))return false;
   return true;
  });
  if(!found)return null;
  const lat=Number(found.lat),lon=Number(found.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat>6||lat< -34||lon< -75||lon> -33)return null;
  const point={lat,lon,aproximado:!!criteria.fallback||!found.address?.house_number};
  await writeCache(cache,key,point,2592000);
  return point;
 }
 async function geocodeDestination(local){
  const queries=geocodeQueries(local);
  for(const query of queries){
   const point=await geocode(query.q,{mode:query.mode,street:streetName(local.endereco),name:local.nome,city:local.cidade,bairro:local.bairro,fallback:query.fallback});
   if(point)return point;
  }
  throw Error('Endereço não localizado no mapa, mesmo após buscas alternativas.');
 }
 const rotas=[],erros=[];
 let originPoint;
 try{originPoint=await geocode(origin);}catch{ return json({erro:'Não foi possível localizar a origem configurada. Verifique o endereço e tente novamente.',codigo:'ORIGEM_INVALIDA'},502);}
 if(!originPoint)return json({erro:'Origem não localizada no mapa. Confira a configuração privada.',codigo:'ORIGEM_INVALIDA'},502);
 for(const place of unique){
  const destination=address(place),key='route-v3-'+await hash(origin+'|'+destination+'|'+(place.nome||''));
  try{
   const hit=await readCache(cache,key);
   if(hit?.km>0){rotas.push({id:place.id,km:hit.km,aproximado:!!hit.aproximado});continue;}
   const target=await geocodeDestination(place);
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
