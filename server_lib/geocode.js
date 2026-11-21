/* Geocodificação comum ao Dashboard e à verificação de endereços. */
const NOMINATIM='https://nominatim.openstreetmap.org/search';
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
 if(/\bcinco\b/i.test(s))return s.replace(/\bcinco\b/ig,'5');
 if(/\b5\b/.test(s))return s.replace(/\b5\b/g,'Cinco');
 return null;
}
function houseNumber(value){
 const match=String(value||'').match(/,\s*(?:n(?:[º°o.]|[uú]mero)?\s*)?(\d+[a-z]?)(?=\s|$|[–-])/i);
 return match?match[1].toLowerCase():null;
}
function normalizeHouse(value){return String(value||'').toLowerCase().replace(/\s+/g,'').replace(/^0+(?=\d)/,'');}
function manualPoint(local){
 if(local.latitude===undefined&&local.longitude===undefined)return null;
 const lat=Number(local.latitude),lon=Number(local.longitude);
 if(typeof local.latitude!=='string'||typeof local.longitude!=='string'||
  !/^-?\d{1,2}(?:\.\d{1,7})?$/.test(local.latitude)||
  !/^-?\d{1,2}(?:\.\d{1,7})?$/.test(local.longitude)||
  !Number.isFinite(lat)||!Number.isFinite(lon)||lat< -34||lat>6||lon< -75||lon> -33)
  throw Error('Coordenadas manuais inválidas.');
 return {lat,lon,manual:true,aproximado:true};
}
function sameStreet(result,street){
 const a=result.address||{};
 const candidate=a.road||a.pedestrian||a.residential||a.footway||a.path||
  ((result.class==='highway'||result.addresstype==='road')?result.name:'')||'';
 const clean=s=>normalize(s)
  .replace(/^(?:rua|r|avenida|av|travessa|praca|estrada|alameda)\s+/,'')
  .replace(/\bsouza\b/g,'sousa').replace(/\b5\b/g,'cinco');
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
async function geocode(q,criteria={},provider,cache){
  const mode=criteria.mode||'origin';
  const key='geo-v4-'+await hash(mode+'|'+q.toLocaleLowerCase('pt-BR')+'|'+(criteria.houseNumber||''));
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
  const candidates=data.filter(x=>{
   if(x.address?.country_code!=='br'||!sameCity(x,criteria.city))return false;
   if(mode==='name'){
    if(!sameName(x,criteria.name))return false;
    if(criteria.bairro&&!normalize(x.display_name).includes(normalize(criteria.bairro)))return false;
    if(criteria.houseNumber&&x.address?.house_number&&normalizeHouse(x.address.house_number)!==normalizeHouse(criteria.houseNumber))return false;
   }else if(mode==='street'){
    if(!sameStreet(x,criteria.street))return false;
   }else if(!(x.address?.road||x.address?.pedestrian||x.address?.residential||x.address?.footway||x.address?.house_number))return false;
   return true;
  });
  const wanted=normalizeHouse(criteria.houseNumber);
  const exact=mode==='street'&&wanted?candidates.find(x=>normalizeHouse(x.address?.house_number)===wanted):null;
  // Não usar as coordenadas de outro número de imóvel.
  const streetLevel=candidates.find(x=>!x.address?.house_number&&
   (x.class==='highway'||x.addresstype==='road'||['residential','pedestrian','living_street','tertiary','secondary','primary','footway'].includes(x.type)));
  const named=mode==='name'?candidates.find(x=>!x.address?.house_number||(wanted&&normalizeHouse(x.address.house_number)===wanted)):null;
  const found=exact||streetLevel||named;
  if(!found)return null;
  const lat=Number(found.lat),lon=Number(found.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat>6||lat< -34||lon< -75||lon> -33)return null;
  const point={lat,lon,aproximado:!exact};
  await writeCache(cache,key,point,2592000);
  return point;
 }
 async function geocodeDestination(local,provider,cache){
  const manual=manualPoint(local);
  if(manual)return manual;
  const queries=geocodeQueries(local),street=streetName(local.endereco),alias=streetAlias(street);
  let approximate=null;
  for(let i=0;i<queries.length;i++){
   const query=queries[i];
   let point;
   try{
    point=await geocode(query.q,{mode:query.mode,street,name:local.nome,city:local.cidade,
     bairro:local.bairro,houseNumber:houseNumber(local.endereco),fallback:query.fallback},provider,cache);
   }catch(e){
    if(approximate)return approximate;
    throw e;
   }
   if(!point)continue;
   if(!point.aproximado)return point;
   approximate ||=point;
   // Rua localizada: tentar a grafia alternativa para confirmar o número antes de aceitar aproximação.
   if(!alias||i>=1)return approximate;
  }
  if(approximate)return approximate;
  throw Error('Endereço não localizado no mapa, mesmo após buscas alternativas.');
 }
async function geocodeOrigin(origin,provider,cache){return geocode(origin,{},provider,cache);}
export {address,hash,readCache,writeCache,geocodeOrigin,geocodeDestination};
