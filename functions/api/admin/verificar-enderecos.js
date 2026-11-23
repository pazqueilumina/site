/* Validação geográfica individual; não exige endereço residencial nem rota. */
import {geocodeDestination} from '../../../server_lib/geocode.js';
import {validarLocais} from '../../../server_lib/locais.js';
const IDENT='PazQueIlumina/1.0 (https://pazqueilumina.com.br; pazqueilumina@gmail.com)';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function distanciaMetros(lat1,lon1,lat2,lon2){
 const rad=Math.PI/180,dLat=(lat2-lat1)*rad,dLon=(lon2-lon1)*rad;
 const a=Math.sin(dLat/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin(dLon/2)**2;
 return 6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
}
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
 // A conferência persistida tem origem explícita. Não chamar de "manual não verificado"
 // o que já foi conferido pelo responsável ou pelo verificador OSM.
 const cadastradas=!!local.latitude&&!!local.longitude;
 if(cadastradas&&local.verificacaoEndereco==='responsavel')
  return json({id:local.id,status:'endereco-conferido',fonte:'Responsável',
   motivo:'Correspondência entre endereço e coordenadas conferida no mapa pelo responsável.',
   latitude:Number(local.latitude),longitude:Number(local.longitude)});
 if(cadastradas&&local.verificacaoCoordenadas==='conferido')
  return json({id:local.id,status:'conferido',fonte:'Responsável',
   motivo:'Coordenadas conferidas no mapa pelo responsável.',latitude:Number(local.latitude),longitude:Number(local.longitude)});
 if(cadastradas&&local.verificacaoCoordenadas==='osm')
  return json({id:local.id,status:'ok',fonte:'OpenStreetMap',
   motivo:'Coordenadas obtidas em verificação exata do OpenStreetMap e salvas no cadastro.',
   latitude:Number(local.latitude),longitude:Number(local.longitude)});
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
  // Verificação do endereço deve ignorar coordenadas já salvas: elas são o
  // ponto a conferir, e não uma prova automática de correspondência.
  const busca=cadastradas?{...local,latitude:undefined,longitude:undefined}:local;
  const point=await geocodeDestination(busca,provider,cache);
  if(cadastradas){
   if(point.link)return json({id:local.id,status:'link',fonte:'Google Maps',
    motivo:'Há um ponto no link do Google Maps; o endereço não foi confirmado automaticamente.'});
   if(point.aproximado)return json({id:local.id,status:'manual',fonte:point.fonte||'',
    motivo:'Coordenadas cadastradas; o serviço de mapas não confirmou o número exato do imóvel.'});
   const distancia=distanciaMetros(Number(local.latitude),Number(local.longitude),point.lat,point.lon);
   if(distancia>75)return json({id:local.id,status:'divergente',fonte:point.fonte||'',
    motivo:'O endereço foi encontrado, mas o ponto cadastrado difere em '+Math.round(distancia)+' m. Confira no mapa; as coordenadas não foram alteradas.'});
   return json({id:local.id,status:'ok',fonte:point.fonte||'',
    motivo:'Endereço e coordenadas conferidos pelo '+(point.fonte||'serviço de mapas')+' (diferença de '+Math.round(distancia)+' m).',
    latitude:Number(local.latitude),longitude:Number(local.longitude)});
  }
  const status=point.manual?'manual':point.link?'link':point.aproximado?'aproximado':'ok';
  const motivo=point.manual?'Coordenadas informadas manualmente; endereço não verificado.':
   point.link?'Coordenadas extraídas do link do Google Maps; confira o ponto no mapa.':
   point.interpolado?'Número correspondente, mas posição estimada pelo ArcGIS.':
   point.nomeLocalizado&&point.aproximado?'Instituição localizada pelo nome; número do imóvel não confirmado.':
   point.aproximado?'Rua localizada; número não confirmado.':
   point.nomeLocalizado?'Instituição e número localizados no OpenStreetMap.':
   'Número correspondente localizado por '+(point.fonte||'serviço de mapas')+'.';
  return json({id:local.id,status,motivo,fonte:point.fonte||'',nomeLocalizado:!!point.nomeLocalizado,
   ...(Number.isFinite(point.lat)&&Number.isFinite(point.lon)?{latitude:point.lat,longitude:point.lon}:{})});
 }catch(e){
  const msg=String(e?.message||'Falha na consulta.');
  if(cadastradas&&msg.startsWith('Endereço não localizado no mapa'))
   return json({id:local.id,status:'manual',motivo:'Coordenadas cadastradas; o serviço de mapas não localizou o endereço para conferência.'});
  if(msg.startsWith('Endereço não localizado no mapa'))return json({id:local.id,status:'erro',motivo:'Endereço não localizado no mapa.'});
  return json({id:local.id,status:'pendente',motivo:'Não foi possível concluir a consulta ao serviço de mapas.'});
 }
}
