/* ============================================================
   DADOS DO SITE — "Estudos e Reflexões Espíritas"
   ------------------------------------------------------------
   ESTE É O ÚNICO ARQUIVO QUE VOCÊ PRECISA EDITAR para
   atualizar o conteúdo do site.

   ── VÍDEOS ─────────────────────────────────────────────────
   Cada linha em "videos" é uma palestra do canal:
     id  → código do vídeo no YouTube (o que vem depois de ?v=)
     t   → título como aparecerá no site
     s   → série/tema (ver chaves em SÉRIES abaixo)
     d   → data de publicação (aproximada) AAAA-MM-DD
     dur → duração

   Para ADICIONAR um vídeo novo do canal: copie uma linha,
   cole no TOPO da lista e troque os dados.

   Para incluir áudio ou PPT de uma palestra, acrescente os
   campos na linha:  audio: "link", slides: "link"

   ── AGENDA ─────────────────────────────────────────────────
   Cada evento: { data: "AAAA-MM-DD", titulo, local, horario }
   Eventos que já passaram desaparecem do site sozinhos.
   ============================================================ */

const DADOS = {

  /* ---------- Informações gerais ---------- */
  site: {
    nome: "Estudos e Reflexões Espíritas",
    tagline: "Conhecimento para a vida melhor",
    autor: "Alexandre Alves",
    canalNome: "Caminhando com Jesus",
    canalYoutube: "https://www.youtube.com/@alvalexandre5131",
    instagram: "https://www.instagram.com/consolador.cec/",
    /* ANÁLISE DE VISITAS (GoatCounter — opcional)
       Crie a conta gratuita em https://www.goatcounter.com,
       escolha um nome (ex.: "estudosespiritas") e preencha:
       goatcounter: "https://SEUNOME.goatcounter.com/count"
       Enquanto estiver vazio, nada é carregado. */
    analytics: { goatcounter: "https://pazqueilumina.goatcounter.com/count" },
    email: "alexmalves352005@gmail.com",
    whatsapp: "(00) 00000-0000",
    endereco: "Rua Exemplo, 123 — Cidade/UF"
  },

  /* ---------- Séries / temas das palestras ----------
     Chaves usadas no campo "s" de cada vídeo.
     As miniaturas e etiquetas de cor seguem a série.     */
  series: {
    "ultimos-dias": "Os Últimos Dias de Jesus",
    "ministerio":   "O Ministério de Jesus",
    "parabolas":    "Parábolas",
    "evangelho":    "Histórias do Evangelho",
    "doutrina":     "Doutrina e História",
    "temas":        "Reflexões"
  },

  /* ---------- Banner da página inicial ---------- */
  hero: {
    titulo: "Espiritismo",
    subtitulo: "Conhecimento, reflexão e prática para o bem, hoje e sempre.",
    citacao: "O Espiritismo é uma ciência que trata da natureza, origem e destino dos Espíritos.",
    autorCitacao: "Allan Kardec"
  },

  /* ---------- Citação no rodapé da barra lateral ---------- */
  citacaoMenu: {
    texto: "Fora da caridade não há salvação.",
    autor: "Allan Kardec"
  },

  /* ============================================================
     VÍDEOS DO CANAL (do mais recente para o mais antigo)
     Datas aproximadas conforme informadas pelo YouTube.
     ============================================================ */
  videos: [
    { id: "LkVBXqm3hxU", t: "O CRISTO CONSOLADOR - O Evangelho Segundo o Espiritismo, Cap VI", s: "doutrina", d: "2026-11-16", dur: "00:52:12", audio: "/audio/O%20CRISTO%20CONSOLADOR%20-%20O%20Evangelho%20Segundo%20o%20Espiritismo%20Cap%20VI.mp3", audioPlataforma: "Cloudflare Pages", slides: "/pdf/ESE%20-%20Cap%20VI%20-%20O%20CRISTO%20CONSOLADOR.pdf" },
    { id: "kzVKjXgBc-c", t: "DESVENDANDO O PERISPÍRITO", s: "doutrina", d: "2026-11-12", dur: "01:01:46", audio: "/audio/DESVENDANDO%20O%20PERISP%C3%8DRITO.mp3", audioPlataforma: "Cloudflare Pages" },
    { id: "Dsv3EV-JIfU", t: "PRISIONEIROS DOS PRÓPRIOS PENSAMENTOS - Como a fixação mental aprisiona o espírito", s: "temas", d: "2026-11-10", dur: "00:48:16", audio: "https://archive.org/details/prisioneiros-dos-pro-prios-pensamentos-como-a-fixacao-mental-aprisiona-o-espirito", audioPlataforma: "Internet Archive", slides: "https://archive.org/details/fixacao-mental" },
    { id: "f6S0ckF1-Mo", t: "A PRISÃO DE JESUS: SERÁ QUE JUDAS FOI APENAS UM TRAIDOR?", s: "ultimos-dias", d: "2026-11-07", dur: "1:02:36", audio: "https://archive.org/details/a-prisa-o-de-jesus-sera-que-judas-foi-apenas-um-traidor", audioPlataforma: "Internet Archive" },
    { id: "Xpw_979dH5g", t: "DO OUTRO LADO DA VIDA - O que a Doutrina Espírita nos ensina sobre a morte?", s: "temas", d: "2026-11-05", dur: "54:50", audio: "https://archive.org/details/do-outro-lado-da-vida-o-que-a-doutrina-espirita-nos-ensina-sobre-a-morte", audioPlataforma: "Internet Archive", slides: "https://archive.org/details/o-fenomeno-da-morte" },
    { id: "ozvzhlxV9BQ", t: "A RESSURREIÇÃO DE LÁZARO NOS DIAS ATUAIS", s: "evangelho", d: "2026-10-29", dur: "52:13", audio: "https://archive.org/details/a-ressurreica-o-de-la-zaro-nos-dias-atuais", audioPlataforma: "Internet Archive", slides: "/pdf/A%20Ressurrei%C3%A7%C3%A3o%20de%20L%C3%A1zaro%20nos%20Dias%20Atuais.pdf" },
    { id: "aBEagdlUK-I", t: "O QUINTO DOS ÚLTIMOS DIAS DE JESUS - A AGONIA DE JESUS NO JARDIM DO GETSÊMANI", s: "ultimos-dias", d: "2026-10-28", dur: "59:06", audio: "https://archive.org/details/o-quinto-dos-u-ltimos-dias-de-jesus-a-agonia-de-jesus-no-jardim-do-getsemani", audioPlataforma: "Internet Archive" },
    { id: "9_PTBIyq5XU", t: "O QUARTO DOS ÚLTIMOS DIAS DE JESUS - JESUS SE DESPEDE DOS SEUS DISCÍPULOS", s: "ultimos-dias", d: "2026-10-24", dur: "1:02:45", audio: "https://archive.org/details/o-quarto-dos-u-ltimos-dias-de-jesus-jesus-se-despede-dos-seus-discipulos", audioPlataforma: "Internet Archive" },
    { id: "7qv2bb9ZHo0", t: "A FORÇA INVISÍVEL DA FÉ: COMO SUPERAR O MEDO, A DOR E O DESÂNIMO", s: "temas", d: "2026-10-24", dur: "37:03", audio: "https://archive.org/details/a-forc-a-invisi-vel-da-fe-como-superar-o-medo-a-dor-e-o-desanimo", audioPlataforma: "Internet Archive" },
    { id: "3LpwcYUjAvE", t: "O QUARTO DOS ÚLTIMOS DIAS DE JESUS: AS NEGAÇÕES DE PEDRO - A VINDA DO CONSOLADOR PROMETIDO", s: "ultimos-dias", d: "2026-10-17", dur: "1:01:01", audio: "https://archive.org/details/o-quarto-dos-u-ltimos-dias-de-jesus-as-negaco-es-de-pedro-a-vinda-do-consolador-prometido", audioPlataforma: "Internet Archive" },
    { id: "sLQaEz-7NV4", t: "QUE MARCAS ESTAMOS DEIXANDO NO CORAÇÃO DAS NOSSAS CRIANÇAS?", s: "temas", d: "2026-10-17", dur: "46:50", audio: "https://archive.org/details/que-marcas-estamos-deixando-no-coraca-o-das-nossas-crianc-as", audioPlataforma: "Internet Archive" },
    { id: "JpJBbmSHIag", t: "ANTES DE AMAR O MUNDO, APRENDA A AMAR QUEM MORA COM VOCÊ", s: "temas", d: "2026-10-17", dur: "38:08", audio: "https://archive.org/details/antes-de-amar-o-mundo-aprenda-a-amar-quem-mora-com-voce", audioPlataforma: "Internet Archive" },
    { id: "sejFaiKaOlo", t: "O QUARTO DOS ÚLTIMOS DIAS DE JESUS - O LAVA-PÉS E A ÚLTIMA CEIA", s: "ultimos-dias", d: "2026-10-10", dur: "57:52", audio: "https://archive.org/details/o-quarto-dos-u-ltimos-dias-de-jesus-o-lava-pe-s-e-a-u-ltima-ceia", audioPlataforma: "Internet Archive" },
    { id: "XMa_vzRZofE", t: "O ESCÂNDALO É NECESSÁRIO, MAS AI DAQUELE POR QUEM O ESCÂNDALO VEM", s: "temas", d: "2026-10-07", dur: "39:49", audio: "https://archive.org/details/o-esca-ndalo-e-necessa-rio-mas-ai-daquele-por-quem-o-esca-ndalo-vem", audioPlataforma: "Internet Archive", slides: "https://archive.org/details/escandalos_202611" },
    { id: "pDQCpDGBdlk", t: "LUZ NA ESCURIDÃO - COMO O CONHECIMENTO DA DOUTRINA ESPÍRITA LIBERTA DO MEDO E DA INCERTEZA", s: "temas", d: "2026-10-07", dur: "1:02:17", audio: "https://archive.org/details/luz-na-escurida-o-como-o-conhecimento-da-doutrina-espi-rita-liberta-do-medo-e-da-incerteza", audioPlataforma: "Internet Archive" },
    { id: "fAu11O-o0BA", t: "O MAIS LONGO DOS ÚLTIMOS DIAS DE JESUS - A PARÁBOLA DOS TALENTOS E O PLANO PARA PRENDER JESUS", s: "ultimos-dias", d: "2026-10-07", dur: "1:01:25", audio: "https://archive.org/details/o-mais-longo-dos-u-ltimos-dias-de-jesus-a-para-bola-dos-talentos-e-o-plano-para-prender-jesus", audioPlataforma: "Internet Archive" },
    { id: "DALv81xCFTI", t: "Lâmpadas Acesas na Transição Planetária: A Parábola das Dez Virgens e o Chamado à Vigilância", s: "parabolas", d: "2026-10-07", dur: "17:20", audio: "https://archive.org/details/lampadas-acesas-na-transicao-planetaria-a-parabola-das-dez-virgens-e-o-chamado-a-vigilancia", audioPlataforma: "Internet Archive" },
    { id: "gMrjxSMDWLk", t: "O TERCEIRO DOS ÚLTIMOS DIAS DE JESUS (PARTE 3) - AS PARÁBOLAS DO JUÍZO FINAL", s: "ultimos-dias", d: "2026-10-07", dur: "58:25", audio: "https://archive.org/details/o-terceiro-dos-u-ltimos-dias-de-jesus-parte-3-as-para-bolas-do-jui-zo-final", audioPlataforma: "Internet Archive" },
    { id: "x35kJlvyRnw", t: "AS TENTAÇÕES DE JESUS: FATO OU ALEGORIA? Uma interpretação espírita do episódio no deserto", s: "evangelho", d: "2026-10-07", dur: "50:16", audio: "https://archive.org/details/as-tentaco-es-de-jesus-fato-ou-alegoria-uma-interpretacao-espirita-do-episodio-no-deserto", audioPlataforma: "Internet Archive" },
    { id: "BnEyAM4iw4U", t: "VIVENDO EM COLETIVIDADE - UM RAIO X DA SOCIEDADE ATUAL E COMO MELHORAR O CONVÍVIO SOCIAL", s: "temas", d: "2026-10-07", dur: "34:52", audio: "https://archive.org/details/vivendo-em-coletividade-um-raio-x-da-sociedade-atual-e-como-melhorar-o-convi-vio-social", audioPlataforma: "Internet Archive" },
    { id: "W0pNwqssi4Q", t: "O TERCEIRO DOS ÚLTIMOS DIAS DE JESUS (PARTE 2) - O SERMÃO DOS OITO AIS - O ÓBOLO DA VIÚVA", s: "ultimos-dias", d: "2026-10-07", dur: "1:03:56", audio: "https://archive.org/details/o-terceiro-dos-u-ltimos-dias-de-jesus-parte-2-o-serma-o-dos-oito-ais-o-o-bolo-da-viuva", audioPlataforma: "Internet Archive" },
    { id: "VmwrWV0_clI", t: "CÉU, INFERNO E PURGATÓRIO: O DESTINO DO ESPÍRITO DEPOIS DA MORTE", s: "temas", d: "2026-10-07", dur: "1:01:00", audio: "https://archive.org/details/ceu-inferno-e-purgatorio-o-destino-do-espirito-depois-da-morte", audioPlataforma: "Internet Archive" },
    { id: "cleEnB0teVA", t: "POR QUE A FAMÍLIA NOS DESAFIA TANTO?", s: "temas", d: "2026-10-07", dur: "44:11", audio: "https://archive.org/details/por-que-a-familia-nos-desafia-tanto", audioPlataforma: "Internet Archive" },
    { id: "lNgatTGk_Uk", t: "O TERCEIRO DOS ÚLTIMOS DIAS DE JESUS - PARÁBOLA DAS BODAS, TRIBUTO A CÉSAR E O MAIOR DOS MANDAMENTOS", s: "ultimos-dias", d: "2026-10-07", dur: "1:00:09", audio: "https://archive.org/details/o-terceiro-dos-ultimos-dias-de-jesus-parabola-das-bodas-tributo-a-cesar-e-o-maior-dos-mandamentos", audioPlataforma: "Internet Archive" },
    { id: "shVIB1i8ZG8", t: "O QUE NOS ESPERA DEPOIS DA MORTE?", s: "temas", d: "2026-09-07", dur: "1:15:35", audio: "https://archive.org/details/o-que-nos-espera-depois-da-morte", audioPlataforma: "Internet Archive" },
    { id: "x5ZuqrN0wC8", t: "O SEGUNDO DOS ÚLTIMOS DIAS DO MINISTÉRIO DE JESUS - A EXPULSÃO DOS VENDILHÕES DO TEMPLO", s: "ultimos-dias", d: "2026-09-07", dur: "59:30", audio: "https://archive.org/details/o-segundo-dos-ultimos-dias-do-ministerio-de-jesus-a-expulsao-dos-vendilhoes-do-templo", audioPlataforma: "Internet Archive" },
    { id: "Use3-Vb1avU", t: "O Suicídio à Luz da Doutrina Espírita: Reflexões e Esperança no Setembro Amarelo", s: "temas", d: "2026-09-07", dur: "1:01:07", audio: "https://archive.org/details/o-suicidio-a-luz-da-doutrina-espirita-reflexoes-e-esperanca-no-setembro-amarelo", audioPlataforma: "Internet Archive" },
    { id: "Sf3flHM9JFU", t: "O PRIMEIRO DOS ÚLTIMOS DIAS DE JESUS - A ENTRADA TRIUNFAL EM JERUSALÉM", s: "ultimos-dias", d: "2026-09-07", dur: "57:54", audio: "https://archive.org/details/o-primeiro-dos-ultimos-dias-de-jesus-a-entrada-triunfal-em-jerusalem", audioPlataforma: "Internet Archive" },
    { id: "JZ0ds7rQ5ig", t: "UM TOQUE DE ESPERANÇA - A HISTÓRIA DA MULHER HEMORROÍSSA", s: "evangelho", d: "2026-09-07", dur: "54:03", audio: "https://archive.org/details/um-toque-de-esperanca-a-historia-da-mulher-hemorroissa", audioPlataforma: "Internet Archive" },
    { id: "xu1KHYtiYPg", t: "A TRANSFORMAÇÃO DE ZAQUEU", s: "evangelho", d: "2026-09-07", dur: "51:33", audio: "https://archive.org/details/a-transformaca-o-de-zaqueu", audioPlataforma: "Internet Archive" },
    { id: "o7d3qoE6Vy0", t: "O 3° ANO DO MINISTÉRIO DE JESUS - MARÇO DE 33 d.C. - A CURA DOS CEGOS EM JERICÓ - O ENCONTRO COM ZAQUEU", s: "ministerio", d: "2026-09-07", dur: "53:15", audio: "https://archive.org/details/o-3-ano-do-ministerio-de-jesus-marco-de-33-d.-c.-a-cura-dos-cegos-em-jerico-o-encontro-com-zaqueu", audioPlataforma: "Internet Archive" },
    { id: "NwIy3BPTG-E", t: "PRECISAMOS CONVERSAR SOBRE A CARIDADE", s: "temas", d: "2026-09-07", dur: "45:23", audio: "https://archive.org/details/precisamos-conversar-sobre-a-caridade", audioPlataforma: "Internet Archive" },
    { id: "PHKEkWEG5dI", t: "O TERCEIRO ANO DO MINISTÉRIO DE JESUS - O INÍCIO DE MARÇO DE 33 d. C. - A RESSURREIÇÃO DE LÁZARO", s: "ministerio", d: "2026-09-07", dur: "55:39", audio: "https://archive.org/details/o-terceiro-ano-do-ministerio-de-jesus-o-inicio-de-marco-de-33-d.-c.-a-ressurreicao-de-lazaro", audioPlataforma: "Internet Archive" },
    { id: "hWcHXmQe45c", t: "A RESSURREIÇÃO DE LÁZARO - JESUS ESTÁ TE CHAMANDO: VEM PRA FORA", s: "evangelho", d: "2026-09-07", dur: "45:19", audio: "https://archive.org/details/a-ressurreica-o-de-la-zaro-jesus-esta-te-chamando-vem-pra-fora", audioPlataforma: "Internet Archive" },
    { id: "BE-cIL_nwbQ", t: "VOCÊ É FELIZ?", s: "temas", d: "2026-09-07", dur: "16:45", audio: "https://archive.org/details/voce-e-feliz", audioPlataforma: "Internet Archive" },
    { id: "ylLmmTI_tPk", t: "PEGADAS NA AREIA", s: "temas", d: "2026-09-07", dur: "2:16", audio: "https://archive.org/details/pegadas-na-areia", audioPlataforma: "Internet Archive" },
    { id: "JKX_--35cl0", t: "O TERCEIRO ANO DO MINISTÉRIO DE JESUS - O FINAL DO MÊS DE FEVEREIO DE 33 d.C. - UM CONVITE À PRECE", s: "ministerio", d: "2026-09-07", dur: "1:02:13", audio: "https://archive.org/details/o-terceiro-ano-do-ministe-rio-de-jesus-o-final-do-me-s-de-fevereio-de-33-d.-c.-u", audioPlataforma: "Internet Archive" },
    { id: "RngWsY4Bn1M", t: "A PATERNIDADE À LUZ DA DOUTRINA ESPÍRITA - UM CONVITE À RESPONSABILIDADE, AO AFETO E AO EXEMPLO", s: "temas", d: "2026-08-07", dur: "1:00:04" },
    { id: "igDTJfGqSsI", t: "O TERCEIRO ANO DO MINISTÉRIO DE JESUS - MÊS DE FEVEREIRO DO ANO 33 d.C.", s: "ministerio", d: "2026-08-07", dur: "1:01:28" },
    { id: "--QRLDpkM2s", t: "O SEMEADOR - UMA REFLEXÃO SOBRE A RECEPÇÃO DA MENSAGEM DIVINA", s: "parabolas", d: "2026-08-07", dur: "31:22" },
    { id: "uvJeB8s0Wag", t: "UM TOQUE DE ESPERANÇA - A HISTÓRIA DA MULHER HEMORROÍSSA", s: "evangelho", d: "2026-08-07", dur: "43:30" },
    { id: "qPFSuTpbMoM", t: "O TERCEIRO ANO DO MINISTÉRIO DE JESUS - MESES DE JANEIRO E FEVEREIRO DO ANO 33 d. C.", s: "ministerio", d: "2026-08-07", dur: "59:21" },
    { id: "QiJMUFk5G9Y", t: "A MULHER SAMARITANA - A INESQUECÍVEL HISTÓRIA DE MIRIAM E JESUS", s: "evangelho", d: "2026-08-07", dur: "32:04" },
    { id: "NHeeYOnHHxE", t: "O FINAL DO SEGUNDO ANO DO MISTÉRIO DE JESUS - MESES DE NOVEMBRO E DEZEMBRO DO ANO DE 32 d.C.", s: "ministerio", d: "2026-08-07", dur: "1:00:37" },
    { id: "g7OHiTcm08Q", t: "O VASO ESCOLHIDO - A CONVERSÃO DE SAULO DE TARSO", s: "evangelho", d: "2026-08-07", dur: "51:24" },
    { id: "XsI7bo5RuCQ", t: "O SEGUNDO ANO DO MINISTÉRIO DE JESUS - MÊS DE OUTUBRO DO ANO DE 32 d.C.", s: "ministerio", d: "2026-08-07", dur: "59:45" },
    { id: "6kYIvawPNjE", t: "ESPÍRITOS QUE ENCARNARAM NO SÉCULO XVI, NA FRANÇA, E REENCARNARAM NO BRASIL", s: "doutrina", d: "2026-08-07", dur: "47:40" },
    { id: "lKNpRlHrP5Q", t: "O SEGUNDO ANO DO MINISTÉRIO DE JESUS - MESES DE SETEMBRO E OUTUBRO DO ANO 32 d.C.", s: "ministerio", d: "2026-07-07", dur: "55:11" },
    { id: "TgXNVEjCTEk", t: "O BATISMO DE JESUS", s: "evangelho", d: "2026-07-07", dur: "24:41" },
    { id: "gZVZToR0yg0", t: "OS EVANGELHOS E OS EVANGELISTAS - Características dos textos e a personalidade de seus escritores", s: "doutrina", d: "2026-07-07", dur: "59:36" },
    { id: "WV7469nnKuY", t: "O SEGUNDO ANO DO MINISTÉRIO DE JESUS - MESES DE JULHO E AGOSTO DO ANO 32 d. C.", s: "ministerio", d: "2026-07-07", dur: "1:01:06" },
    { id: "b7w7fkoaFp4", t: "A PARÁBOLA DA COMPAIXÃO - QUANDO A CARIDADE SALVA VIDAS", s: "parabolas", d: "2026-07-07", dur: "7:21" },
    { id: "03UIWDPlG_U", t: "O SEGUNDO ANO DO MINISTÉRIO DE JESUS - MESES DE ABRIL, MAIO E JUNHO DO ANO 32 d. C.", s: "ministerio", d: "2026-07-07", dur: "56:39" },
    { id: "wsriatvWvfM", t: "A REVELAÇÃO DA MISSÃO DE KARDEC", s: "doutrina", d: "2026-07-07", dur: "53:25", slides: "https://drive.google.com/file/d/1fBA6OhKXeX4wIzmLZdo7SH-LXGOLU7zD/view?usp=sharing" },
    { id: "dv3OEzKY7Co", t: "O Segundo Ano do Ministério de Jesus - Meses de Fevereiro e Março do Ano de 32 d. C.", s: "ministerio", d: "2026-07-07", dur: "59:47" },
    { id: "5OpTAvoGYiE", t: "O INÍCIO DO SEGUNDO ANO DO MINISTÉRIO DE JESUS - MÊS DE JANEIRO DO ANO 32", s: "ministerio", d: "2026-06-07", dur: "1:00:52" },
    { id: "TctVpaY7txc", t: "QUE QUERES QUE EU TE FAÇA? Procedimentos para se alcançar a cura real", s: "temas", d: "2026-06-07", dur: "49:46" },
    { id: "m_TGvAQYHGM", t: "O PRIMEIRO ANO DO MINISTÉRIO DE JESUS - OUTUBRO, NOVEMBRO E DEZEMBRO DO ANO DE 31 d. C.", s: "ministerio", d: "2026-06-07", dur: "53:50" },
    { id: "u3Y89hyzD_g", t: "Bem-aventurados os mansos porque eles herdarão a Terra", s: "temas", d: "2026-06-07", dur: "33:52" },
    { id: "n4DpA-H8V4s", t: "A FÉ RACIOCINADA", s: "temas", d: "2026-06-07", dur: "48:05" },
    { id: "sixuPJmMdxk", t: "O Primeiro Ano do Ministério de Jesus - Julho, Agosto e Setembro do ano 31 d.C.", s: "ministerio", d: "2026-06-07", dur: "1:00:16" },
    { id: "qInQXaad5t8", t: "O Poder da Gratidão", s: "temas", d: "2026-06-07", dur: "51:40" },
    { id: "gorersQfT9c", t: "A BÊNÇÃO DA DOR", s: "temas", d: "2026-06-07", dur: "54:26" },
    { id: "ZbKpq7RUQro", t: "O Sermão da Montanha", s: "evangelho", d: "2026-06-07", dur: "1:00:43" },
    { id: "vB3Kp0Dqjx0", t: "Tudo passa, a mensagem de Maria de Nazaré para Chico Xavier", s: "temas", d: "2026-05-07", dur: "3:39" },
    { id: "Hn75G4EYaSw", t: "A parábola da enxada", s: "parabolas", d: "2026-05-07", dur: "4:00" },
    { id: "yvwRHfnsR54", t: "Essa não é uma história sobre balões", s: "temas", d: "2026-05-07", dur: "2:43" },
    { id: "9OjNbJN3XjQ", t: "A História do Zé", s: "temas", d: "2026-05-07", dur: "5:48" },
    { id: "IQooPJ9idf4", t: "A vida e obra de Eurípides Barsanulfo", s: "doutrina", d: "2026-05-07", dur: "1:10:06" },
    { id: "Dlpdfxi1InE", t: "AS PRIMEIRAS CURAS E PREGAÇÕES DE JESUS", s: "ministerio", d: "2026-05-07", dur: "1:00:48" },
    { id: "fmasUI9YVco", t: "Maternidade, sublime missão divina", s: "temas", d: "2026-05-07", dur: "56:55" },
    { id: "YjKGJhkIcP0", t: "O Início do Ministério de Jesus (Janeiro a Maio do ano 31)", s: "ministerio", d: "2026-05-07", dur: "59:23" },
    { id: "zE__enMjSow", t: "Prescrições para uma boa sintonia no lar", s: "temas", d: "2026-05-07", dur: "1:04:30" },
    { id: "kpLFAuhPpW8", t: "Nas Terras de Chico - Parte 2 - Uberaba", s: "doutrina", d: "2026-05-07", dur: "58:19" },
    { id: "bXqtDG0sc_U", t: "O NASCIMENTO E A INFÂNCIA DE JESUS", s: "evangelho", d: "2026-05-07", dur: "57:44" },
    { id: "FlC8A8V1Pnw", t: "Nas Terras de Chico - Parte 1 - Pedro Leopoldo", s: "doutrina", d: "2026-05-07", dur: "58:28" },
    { id: "8WTBEBeBnzI", t: "JESUS E AS PARÁBOLAS, A VINDA DE JESUS", s: "parabolas", d: "2026-05-07", dur: "57:39" },
    { id: "mWCO2BmFKfc", t: "Bem-aventurados os que têm um puro coração", s: "temas", d: "2026-05-07", dur: "29:56" },
    { id: "4z3sxeha_HM", t: "As Curas de Jesus", s: "evangelho", d: "2026-04-07", dur: "55:52" }
  ],

  /* ============================================================
     SHORTS DO CANAL (exibidos na página "Vídeos")
     id → código do vídeo · t → título
     ============================================================ */
  // Shorts administrados em data/shorts.json; a lista é carregada dinamicamente.
  shorts: [],

  /* ============================================================
     AGENDA DE APRESENTAÇÕES
     Campos: data (AAAA-MM-DD) · titulo · local (centro espírita)
     · endereco (opcional) · horario
     O site exibe automaticamente apenas os eventos futuros;
     os que já passaram vão para o histórico na página da Agenda.
     ============================================================ */
  agenda: [
    {
      "id": "evt-e8f23a63-b2f6-440b-a563-c9f5c1a5b5f3",
      "data": "2026-03-24",
      "horario": "14:30",
      "titulo": "Nas Terras de Chico – Parte 2 (Uberaba)",
      "local": "Consolador - Comunidade Espírita Cristã",
      "link": "https://www.youtube.com/watch?v=kpLFAuhPpW8&list=PLzyEmRoyAJYn2OMh6OP3r-1xJQeyj7Ov3&index=2",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-273602bb-b245-4eae-8ae7-a16eec81c5f9",
      "data": "2026-04-24",
      "horario": "19:00",
      "titulo": "Programa Pelos Caminhos de Jesus",
      "local": "Web Rádio Cristo Consolador",
      "link": "https://www.youtube.com/watch?v=YjKGJhkIcP0&list=PLzyEmRoyAJYl_FI05c_Ei3xijFMYjg31k&index=2&t=5s",
      "localId": "web-radio-cristo-consolador"
    },
    {
      "id": "evt-0001",
      "data": "2026-10-07",
      "horario": "18:00",
      "titulo": "O Escândalo É Necessário, Mas Ai Daquele por Quem o Escândalo Vem",
      "local": "Lar de Frei Luiz"
    },
    {
      "id": "evt-0002",
      "data": "2026-10-09",
      "horario": "20:00",
      "titulo": "Jesus no Lar (6º Capítulo)",
      "local": "Consolador - Comunidade Espírita Cristã",
      "endereco": "Instagram (online)"
    },
    {
      "id": "evt-0003",
      "data": "2026-10-16",
      "horario": "19:00",
      "titulo": "O Terceiro Ano do Ministério de Jesus (Parte 13)",
      "local": "Cristo Consolador",
      "endereco": "YouTube (online)"
    },
    {
      "id": "evt-0004",
      "data": "2026-10-19",
      "horario": "19:00",
      "titulo": "Espíritos Que Vieram no Séc. XVI na França e Reencarnaram no Brasil",
      "local": "Grupo Espírita Fabiano",
      "endereco": "Rua Paulo Silva Araújo, 52",
      "bairro": "Méier",
      "localId": "grupo-espirita-fabiano"
    },
    {
      "id": "evt-0005",
      "data": "2026-10-23",
      "horario": "19:00",
      "titulo": "O Terceiro Ano do Ministério de Jesus (Parte 14)",
      "local": "Cristo Consolador",
      "endereco": "YouTube (online)"
    },
    {
      "id": "evt-0006",
      "data": "2026-11-03",
      "horario": "20:00",
      "titulo": "A Parábola do Bom Samaritano",
      "local": "Aliança do Divino Pastor",
      "endereco": "Rua Jardim Botânico, 94",
      "bairro": "Jardim Botânico",
      "localId": "alianca-do-divino-pastor"
    },
    {
      "id": "evt-0007",
      "data": "2026-11-04",
      "horario": "17:00",
      "titulo": "O Fenômeno da Morte",
      "local": "Lar Paulo de Tarso",
      "endereco": "Rua Souza Lima, 433, Copacabana, Rio de Janeiro"
    },
    {
      "id": "evt-0008",
      "data": "2026-11-04",
      "horario": "20:00",
      "titulo": "Do Outro Lado da Vida",
      "local": "Consolador - Comunidade Espírita Cristã",
      "endereco": "Rua Cinco de Julho, 276, Copacabana, Rio de Janeiro"
    },
    {
      "id": "evt-0009",
      "data": "2026-11-09",
      "horario": "20:00",
      "titulo": "Fixação Mental",
      "local": "Consolador - Comunidade Espírita Cristã",
      "endereco": "Rua Cinco de Julho, 276, Copacabana, Rio de Janeiro"
    },
    {
      "id": "evt-346a4526-2dcd-4dcd-be70-2c003e4dd667",
      "data": "2026-11-11",
      "horario": "19:30",
      "titulo": "A noite em que o céu tocou a Terra: O nascimento de Jesus",
      "local": "Grupo Espírita Fonte Viva",
      "localId": "grupo-espirita-fonte-viva"
    },
    {
      "id": "evt-0010",
      "data": "2026-11-13",
      "horario": "19:00",
      "titulo": "O Quinto Dos Últimos Dias de Jesus (Parte 1)",
      "local": "Cristo Consolador",
      "endereco": "YouTube (online)"
    },
    {
      "id": "evt-0011",
      "data": "2026-11-20",
      "horario": "20:00",
      "titulo": "Programa Pelos Caminhos de Jesus",
      "local": "Web Rádio Cristo Consolador (YouTube)",
      "link": "https://www.youtube.com/c/WebRadioCristoConsolador"
    },
    {
      "id": "evt-0012",
      "data": "2026-11-27",
      "horario": "19:00",
      "titulo": "O Sexto dos Últimos Dias de Jesus: Jesus diante de Pilatos",
      "local": "Consolador - Comunidade Espírita Cristã",
      "link": "https://www.youtube.com/watch?v=mFmnlpiIo-I&t=251s",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-0013",
      "data": "2026-11-27",
      "horario": "20:00",
      "titulo": "Live no Instagram",
      "local": "Consolador - Comunidade Espírita Cristã",
      "endereco": "Instagram (online)"
    },
    {
      "id": "evt-0014",
      "data": "2026-11-27",
      "horario": "20:00",
      "titulo": "Programa Pelos Caminhos de Jesus",
      "local": "Web Rádio Cristo Consolador (YouTube)",
      "link": "https://www.youtube.com/c/WebRadioCristoConsolador"
    },
    {
      "id": "evt-0015",
      "data": "2026-11-28",
      "horario": "18:00",
      "titulo": "A Bênção da Dor",
      "local": "Grupo Espírita Saint Germain",
      "endereco": "Rua Domingos Cabral, 111",
      "bairro": "Freguesia (Jacarepaguá)",
      "localId": "grupo-espirita-saint-germain"
    },
    {
      "id": "evt-10013244-3ebe-4e5b-b7b7-05f17640b393",
      "data": "2026-12-02",
      "horario": "20:00",
      "titulo": "A noite em que o céu tocou a Terra: O nascimento de Jesus",
      "local": "Aliança do Divino Pastor",
      "localId": "alianca-do-divino-pastor"
    },
    {
      "id": "evt-0016",
      "data": "2026-12-04",
      "horario": "20:00",
      "titulo": "Programa Pelos Caminhos de Jesus",
      "local": "Web Rádio Cristo Consolador (YouTube)",
      "link": "https://www.youtube.com/c/WebRadioCristoConsolador"
    },
    {
      "id": "evt-0017",
      "data": "2026-12-08",
      "horario": "19:30",
      "titulo": "A Fixação Mental",
      "local": "Cruzada dos Militares Espíritas",
      "endereco": "Praça General Tibúrcio, 83 – Subsolo, coluna 25 (Edifício Praia Vermelha)",
      "bairro": "Urca",
      "localId": "cruzada-dos-militares-espiritas"
    },
    {
      "id": "evt-0018",
      "data": "2026-12-09",
      "horario": "20:00",
      "titulo": "Vá e Não Peques Mais",
      "local": "Consolador - Comunidade Espírita Cristã",
      "endereco": "Rua Cinco de Julho, 276, Copacabana, Rio de Janeiro",
      "bairro": "Copacabana",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-0019",
      "data": "2026-12-11",
      "horario": "20:00",
      "titulo": "Programa Pelos Caminhos de Jesus",
      "local": "Web Rádio Cristo Consolador (YouTube)",
      "link": "https://www.youtube.com/c/WebRadioCristoConsolador"
    },
    {
      "id": "evt-6e9557ee-e448-48f4-b63d-d70f1924d25a",
      "data": "2026-12-16",
      "horario": "17:00",
      "titulo": "O Cristo que precisamos descobrir",
      "local": "Lar Paulo de Tarso",
      "localId": "lar-paulo-de-tarso"
    },
    {
      "id": "evt-0020",
      "data": "2026-12-16",
      "horario": "19:30",
      "titulo": "O Caminho da Vida",
      "local": "Associação Espírita União Fraterna",
      "endereco": "Rua Diniz Cordeiro, 23",
      "bairro": "Botafogo",
      "localId": "associacao-espirita-uniao-fraterna"
    },
    {
      "id": "evt-0021",
      "data": "2026-12-18",
      "horario": "20:00",
      "titulo": "Programa Pelos Caminhos de Jesus",
      "local": "Web Rádio Cristo Consolador (YouTube)",
      "link": "https://www.youtube.com/c/WebRadioCristoConsolador"
    },
    {
      "id": "evt-0022",
      "data": "2026-12-19",
      "horario": "20:00",
      "titulo": "A Vinda de Jesus",
      "local": "Centro Espírita Cristófilos",
      "endereco": "Rua Martins Ferreira, 57",
      "bairro": "Botafogo",
      "localId": "centro-espirita-cristofilos"
    },
    {
      "id": "evt-0023",
      "data": "2026-12-23",
      "horario": "20:00",
      "titulo": "Homenagem a Yvonne do Amaral Pereira",
      "local": "Consolador - Comunidade Espírita Cristã",
      "endereco": "Rua Cinco de Julho, 276, Copacabana, Rio de Janeiro",
      "bairro": "Copacabana",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-0024",
      "data": "2026-12-25",
      "horario": "20:00",
      "titulo": "Live de Natal",
      "local": "Consolador - Comunidade Espírita Cristã",
      "endereco": "Instagram (online)"
    },
    {
      "id": "evt-0025",
      "data": "2026-12-28",
      "horario": "20:00",
      "titulo": "Ano Novo, vida nova: o que precisamos transformar em nós?",
      "local": "Grupo Espírita Fabiano",
      "endereco": "Rua Paulo Silva Araújo, 52",
      "bairro": "Méier",
      "localId": "grupo-espirita-fabiano"
    },
    {
      "id": "evt-10013245",
      "data": "2027-01-04",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013246",
      "data": "2027-01-26",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013247",
      "data": "2027-02-10",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013248",
      "data": "2027-02-27",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013249",
      "data": "2027-03-10",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013250",
      "data": "2027-03-29",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013251",
      "data": "2027-04-14",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013252",
      "data": "2027-04-26",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013253",
      "data": "2027-05-08",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013254",
      "data": "2027-05-25",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013255",
      "data": "2027-06-07",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013256",
      "data": "2027-06-23",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013257",
      "data": "2027-07-05",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013258",
      "data": "2027-07-20",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013259",
      "data": "2027-08-16",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013260",
      "data": "2027-08-25",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013261",
      "data": "2027-09-08",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013262",
      "data": "2027-09-25",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013263",
      "data": "2027-10-04",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013264",
      "data": "2027-10-19",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013265",
      "data": "2027-11-16",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013266",
      "data": "2027-11-27",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013267",
      "data": "2027-12-06",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    },
    {
      "id": "evt-10013268",
      "data": "2027-12-18",
      "horario": "20:00",
      "titulo": "Tema a definir",
      "local": "Consolador - Comunidade Espírita Cristã",
      "localId": "consolador-comunidade-espirita-crista"
    }
  ],

  /* ---------- Página "Livro" ---------- */
  livro: {
    titulo: "A Bênção da Dor",
    autor: "Alexandre Alves",
    texto: [
      "Quando tudo parecia caminhar muito bem na sua vida, eis que surge o inusitado. A paz, que tranquilizava seu coração, é substituída por uma dor alucinante, com o poder de lhe paralisar. O céu, tão azul, torna-se encoberto por nuvens ameaçadoras, prenunciando a tormenta. E agora?",
      "Prezado leitor, a dor também bateu à minha porta, e, de repente, uma tempestade assustadora inundou todo o meu ser. Inércia, lamentos e aflições me dominavam. Era preciso reagir. Não poderia permitir que a dor me dominasse.",
      "Foi nesse momento que a Doutrina Espírita surgiu em minha vida, como um farol a iluminar o meu caminho. Aos poucos, fui percebendo que a dor foi o grande presente que Deus me deu, e que eu era capaz de vencê-la.",
      "Neste livro, eu lhe convido a vivenciar histórias e reflexões que me ajudaram a superar essa tempestade. Você perceberá que, por mais difícil que possa parecer, a dor é uma bênção que Deus coloca na sua vida para sua evolução.",
      "Desejo que as páginas deste livro lhe conduzam ao caminho da superação. Que, ao final da leitura, você perceba a grande bênção que foi sua dor, pois ela lhe transformou num ser bem mais humano e feliz."
    ]
  },

  /* ---------- Página "Sobre" ----------
     Textos em parágrafos. Aceita links no formato
     [texto do link](https://endereco) como no exemplo abaixo. */
  sobre: {
    texto: [
      "Sou militar aposentado, após uma trajetória dedicada à carreira militar.",
      "Atualmente, sou trabalhador do [Consolador – Comunidade Espírita Cristã](https://www.instagram.com/consolador.cec/), onde participo das atividades da instituição e me dedico ao estudo e à divulgação dos ensinamentos espíritas.",
      "Estudioso da Doutrina Espírita, dedico-me ao aprofundamento das obras fundamentais do Espiritismo e de seus principais autores, buscando relacionar os ensinamentos doutrinários e o Evangelho de Jesus aos desafios da vida cotidiana.",
      "Como palestrante espírita, abordo temas relacionados à fé raciocinada, à reforma íntima, à família, à caridade, ao perdão, à esperança, à responsabilidade espiritual e ao desenvolvimento moral.",
      "Autor do Livro A Bênção da Dor, Editora Viseu.",
      "Meu propósito é compartilhar uma mensagem de esperança, consolo, conhecimento e transformação interior, tendo como referências os ensinamentos de Jesus e os princípios apresentados por Allan Kardec."
    ]
  },

  /* ---------- Página "Contato" ---------- */
  contato: {
    mensagem: "Fale conosco para dúvidas, sugestões de temas ou para agendar uma apresentação em seu centro ou grupo de estudos."
  }
};
