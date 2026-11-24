/* Formatação de exibição dos títulos das palestras em todo o site.
   Separadores com espaços (-, – e —) iniciam trecho com maiúscula;
   hífens internos de palavras compostas permanecem inalterados.
   Não modifica os títulos originais salvos no cadastro. */
function formatarTituloSite(titulo) {
  const nomesProprios = [
    ["doutrina espírita", "Doutrina Espírita"],
    ["espírito santo", "Espírito Santo"],
    ["chico xavier", "Chico Xavier"],
    ["luiz gonzaga", "Luiz Gonzaga"],
    ["pedro leopoldo", "Pedro Leopoldo"],
    ["eurípides barsanulfo", "Eurípides Barsanulfo"],
    ["setembro amarelo", "Setembro Amarelo"],
    ["francisco de assis", "Francisco de Assis"],
    ["zé", "Zé"],
    ["jesus", "Jesus"], ["cristo", "Cristo"], ["deus", "Deus"],
    ["consolador", "Consolador"], ["espiritismo", "Espiritismo"],
    ["evangelho", "Evangelho"], ["kardec", "Kardec"],
    ["allan", "Allan"], ["judas", "Judas"], ["lázaro", "Lázaro"],
    ["pedro", "Pedro"], ["zaqueu", "Zaqueu"], ["jerusalém", "Jerusalém"],
    ["getsêmani", "Getsêmani"], ["césar", "César"], ["miriam", "Miriam"],
    ["saulo", "Saulo"], ["tarso", "Tarso"], ["maria", "Maria"],
    ["nazaré", "Nazaré"], ["frança", "França"], ["brasil", "Brasil"],
    ["uberaba", "Uberaba"], ["terra", "Terra"], ["chico", "Chico"], ["jericó", "Jericó"]
  ];
  let texto = String(titulo || "").toLocaleLowerCase("pt-BR");
  texto = texto.replace(/\bd\.\s*c\./g, "d.C.").replace(/\ba\.\s*c\./g, "a.C.");
  texto = texto.replace(/\braio x\b/g, "raio X");
  texto = texto.replace(/(?<!\p{L})(?:ii|iii|iv|vi|vii|viii|ix|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx)(?!\p{L})/gu,
    numeral => numeral.toUpperCase());
  for (const [nome, grafia] of nomesProprios) {
    texto = texto.replace(new RegExp("(^|[^\\p{L}])(" + nome + ")(?=$|[^\\p{L}])", "giu"),
      (_, antes) => antes + grafia);
  }
  return texto.replace(/(^|[.!?]\s+|\s+[-–—]\s+)([\p{L}])/gu,
    (_, inicio, letra) => inicio + letra.toLocaleUpperCase("pt-BR"));
}
