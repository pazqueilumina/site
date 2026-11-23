/* Validação do cadastro de locais; os dados nunca são executados como JavaScript. */
const campos = ['id', 'nome', 'endereco', 'bairro', 'cidade', 'uf', 'maps', 'latitude', 'longitude', 'kmIdaVolta', 'verificacaoCoordenadas'];
const normalizar = valor => String(valor).normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ');
export function validarLocais(input) {
  if (!Array.isArray(input) || input.length > 500) throw new Error('O cadastro aceita até 500 locais.');
  const ids = new Set(), nomes = new Set();
  return input.map((item, i) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`Local ${i + 1} inválido.`);
    const obj = {};
    for (const key of campos) {
      if (item[key] !== undefined && typeof item[key] !== 'string') throw new Error(`Campo ${key} inválido no local ${i + 1}.`);
      const val = (item[key] || '').trim();
      if (val.length > (['endereco', 'maps'].includes(key) ? 500 : 180)) throw new Error(`Campo ${key} muito longo no local ${i + 1}.`);
      if (val) obj[key] = val;
    }
    if (!obj.id || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(obj.id)) throw new Error(`ID inválido no local ${i + 1}.`);
    if (!obj.nome || !obj.endereco || !obj.cidade || !obj.uf) throw new Error(`Preencha nome, endereço, cidade e UF no local ${i + 1}.`);
    obj.uf = obj.uf.toUpperCase();
    if (!/^[A-Z]{2}$/.test(obj.uf)) throw new Error(`UF inválida no local ${i + 1}.`);
    if (obj.maps && !/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(obj.maps)) throw new Error(`Link do mapa inválido no local ${i + 1}.`);
    if (Boolean(obj.latitude) !== Boolean(obj.longitude)) throw new Error(`Preencha latitude e longitude juntas no local ${i + 1}.`);
    if (obj.latitude) {
      const valid = (v, min, max) => /^-?\d{1,2}(?:\.\d{1,7})?$/.test(v) && Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max;
      if (!valid(obj.latitude, -34, 6) || !valid(obj.longitude, -75, -33)) throw new Error(`Coordenadas fora do Brasil ou inválidas no local ${i + 1}.`);
    }
    // Origem de conferência persistente, sem alterar latitude/longitude.
    if (obj.verificacaoCoordenadas && !['osm', 'conferido'].includes(obj.verificacaoCoordenadas))
      throw new Error(`Origem da conferência inválida no local ${i + 1}.`);
    if (obj.verificacaoCoordenadas && !obj.latitude)
      throw new Error(`Conferência sem coordenadas no local ${i + 1}.`);
    if (obj.kmIdaVolta) {
      const km = Number(obj.kmIdaVolta);
      if (!/^(?:[0-9]{1,4})(?:\.[0-9])?$/.test(obj.kmIdaVolta) || !Number.isFinite(km) || km <= 0 || km > 2000) throw new Error(`Distância de ida e volta inválida no local ${i + 1}.`);
      obj.kmIdaVolta = String(km);
    }
    const nome = normalizar(obj.nome);
    if (ids.has(obj.id) || nomes.has(nome)) throw new Error(`Local duplicado: ${obj.nome}.`);
    ids.add(obj.id); nomes.add(nome);
    return obj;
  }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
