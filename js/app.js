/* ============================================================
   APP — Estudos e Reflexões Espíritas
   Renderiza o layout (barra lateral, topo) e as páginas a
   partir dos dados de js/dados.js
   ============================================================ */

"use strict";

/* ---------------- ÍCONES (SVG inline) ---------------- */

function icone(nome, extra) {
  const corpos = {
    inicio: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    apresentacao: '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="12" y1="17" x2="12" y2="20"/><line x1="8" y1="21" x2="16" y2="21"/>',
    video: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
    audio: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    slides: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    agenda: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    tema: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.83z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    pessoa: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    coracao: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    email: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    busca: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    seta: '<polyline points="9 18 15 12 9 6"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    externo: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    livro: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    folha: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    espirito: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8L21.5 17.5l-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
    cruz: '<line x1="12" y1="4" x2="12" y2="20"/><line x1="5" y1="10" x2="19" y2="10"/>',
    play: '<polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>'
  };
  return '<svg class="icone' + (extra ? " " + extra : "") + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (corpos[nome] || "") + "</svg>";
}

const LOGO_LOTUS =
  '<svg class="logo-icone" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M24 8c4.5 5.5 6.5 10 6.5 15.5 0 5.5-2.6 9.7-6.5 12-3.9-2.3-6.5-6.5-6.5-12C17.5 18 19.5 13.5 24 8z"/>' +
  '<path d="M24 35.5c-5.5.4-11.5-2.2-15.5-8.5 4.8-1.4 9-.6 12.3 2.3"/>' +
  '<path d="M24 35.5c5.5.4 11.5-2.2 15.5-8.5-4.8-1.4-9-.6-12.3 2.3"/>' +
  '<path d="M10.5 27.5C8.6 30.2 7.5 33 7.4 36.4c3-.1 5.6-1 7.7-2.5"/>' +
  '<path d="M37.5 27.5c1.9 2.7 3 5.5 3.1 8.9-3-.1-5.6-1-7.7-2.5"/>' +
  "</svg>";

/* ---------------- CENAS ILUSTRADAS (SVG) ---------------- */

let _cenaSeq = 0;

function cena(chave) {
  const id = "cena" + (++_cenaSeq);
  const cenas = {
    amanhecer: `
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fdf4e4"/><stop offset="0.55" stop-color="#f9dcae"/><stop offset="1" stop-color="#f0b077"/>
      </linearGradient></defs>
      <rect width="400" height="225" fill="url(#${id})"/>
      <circle cx="205" cy="128" r="44" fill="#f7c877" opacity="0.9"/>
      <circle cx="205" cy="128" r="58" fill="#f9d896" opacity="0.35"/>
      <path d="M0 150 L70 98 L140 150 L215 104 L290 152 L400 108 L400 225 L0 225 Z" fill="#d8b98c" opacity="0.55"/>
      <path d="M0 172 L85 128 L175 172 L255 138 L345 176 L400 152 L400 225 L0 225 Z" fill="#9a8260" opacity="0.6"/>
      <rect y="150" width="400" height="30" fill="#ffffff" opacity="0.14"/>
      <g fill="#4a3f2e" opacity="0.85">
        <polygon points="352,80 366,112 338,112"/>
        <polygon points="352,94 370,130 334,130"/>
        <polygon points="352,110 374,150 330,150"/>
        <rect x="349" y="148" width="6" height="14"/>
      </g>`,
    evangelho: `
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eaf1f8"/><stop offset="1" stop-color="#d3e2f0"/>
      </linearGradient></defs>
      <rect width="400" height="225" fill="url(#${id})"/>
      <g stroke="#e9d9b8" stroke-width="2" opacity="0.9">
        <line x1="200" y1="28" x2="200" y2="44"/><line x1="160" y1="36" x2="172" y2="48"/>
        <line x1="240" y1="36" x2="228" y2="48"/><line x1="140" y1="62" x2="156" y2="70"/>
        <line x1="260" y1="62" x2="244" y2="70"/>
      </g>
      <circle cx="200" cy="66" r="14" fill="#f2c879" opacity="0.9"/>
      <path d="M200 62 l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9z" fill="#fff" opacity="0.95"/>
      <g>
        <path d="M200 92 C 178 82, 148 82, 128 92 L 128 158 C 148 148, 178 148, 200 158 C 222 148, 252 148, 272 158 L 272 92 C 252 82, 222 82, 200 92 Z" fill="#ffffff" stroke="#1e3a5f" stroke-width="3"/>
        <line x1="200" y1="92" x2="200" y2="158" stroke="#1e3a5f" stroke-width="3"/>
        <g stroke="#8fa8c4" stroke-width="2.4" stroke-linecap="round">
          <line x1="144" y1="106" x2="184" y2="100"/><line x1="144" y1="118" x2="184" y2="112"/><line x1="144" y1="130" x2="172" y2="126"/>
          <line x1="216" y1="100" x2="256" y2="106"/><line x1="216" y1="112" x2="256" y2="118"/><line x1="216" y1="126" x2="244" y2="130"/>
        </g>
      </g>`,
    maos: `
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f9ece7"/><stop offset="1" stop-color="#f0d8d0"/>
      </linearGradient></defs>
      <rect width="400" height="225" fill="url(#${id})"/>
      <path d="M200 62 c 14 -20 44 -16 44 8 c 0 20 -26 36 -44 50 c -18 -14 -44 -30 -44 -50 c 0 -24 30 -28 44 -8 z" fill="#c96b5e" opacity="0.9"/>
      <g fill="none" stroke="#1e3a5f" stroke-width="4" stroke-linecap="round" opacity="0.75">
        <path d="M112 150 c 26 -18 58 -26 88 -26 c 30 0 62 8 88 26"/>
        <path d="M96 172 c 30 -22 66 -32 104 -32 c 38 0 74 10 104 32"/>
      </g>
      <g stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.8">
        <line x1="170" y1="86" x2="182" y2="98"/><line x1="200" y1="78" x2="200" y2="94"/>
      </g>`,
    semente: `
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f4f1de"/><stop offset="0.6" stop-color="#e8ecc9"/><stop offset="1" stop-color="#d8e2b8"/>
      </linearGradient></defs>
      <rect width="400" height="225" fill="url(#${id})"/>
      <circle cx="200" cy="150" r="40" fill="#f4c97b" opacity="0.85"/>
      <path d="M0 158 L90 118 L180 158 L270 120 L360 160 L400 140 L400 225 L0 225 Z" fill="#b9c391" opacity="0.6"/>
      <g fill="#4c7a45">
        <path d="M200 150 C 200 120 200 100 200 84 L 206 84 C 206 104 206 126 206 150 Z"/>
        <path d="M202 108 C 178 106 164 92 162 70 C 186 72 200 86 202 108 Z"/>
        <path d="M204 122 C 228 120 242 106 244 84 C 220 86 206 100 204 122 Z" opacity="0.85"/>
        <path d="M178 154 q 22 -12 44 0 q -22 14 -44 0 z" opacity="0.4"/>
      </g>`,
    luz: `
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eef1f9"/><stop offset="1" stop-color="#ccd8ee"/>
      </linearGradient></defs>
      <rect width="400" height="225" fill="url(#${id})"/>
      <g stroke="#8fa3c9" stroke-width="2.5" opacity="0.7">
        <line x1="200" y1="34" x2="200" y2="62"/><line x1="152" y1="48" x2="166" y2="70"/>
        <line x1="248" y1="48" x2="234" y2="70"/><line x1="120" y1="82" x2="142" y2="96"/>
        <line x1="280" y1="82" x2="258" y2="96"/>
      </g>
      <circle cx="200" cy="118" r="30" fill="#f4d489" opacity="0.55"/>
      <circle cx="200" cy="118" r="18" fill="#f7dd9e"/>
      <path d="M200 96 c 5 8 9 13 9 20 c 0 8 -4 15 -9 22 c -5 -7 -9 -14 -9 -22 c 0 -7 4 -12 9 -20 z" fill="#e8b455"/>
      <path d="M0 158 L400 158 L400 225 L0 225 Z" fill="#1e3a5f" opacity="0.18"/>
      <g stroke="#1e3a5f" stroke-width="3" stroke-linecap="round" opacity="0.5">
        <path d="M150 176 q 50 18 100 0"/>
      </g>`,
    familia: `
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#faf1e0"/><stop offset="1" stop-color="#f0dfc2"/>
      </linearGradient></defs>
      <rect width="400" height="225" fill="url(#${id})"/>
      <g fill="#1e3a5f" opacity="0.8">
        <circle cx="150" cy="92" r="15"/>
        <path d="M150 110 c -22 0 -34 14 -36 34 l 72 0 c -2 -20 -14 -34 -36 -34 z"/>
        <circle cx="250" cy="98" r="13"/>
        <path d="M250 114 c -19 0 -29 12 -31 30 l 62 0 c -2 -18 -12 -30 -31 -30 z"/>
        <circle cx="200" cy="120" r="10"/>
        <path d="M200 132 c -15 0 -23 10 -25 24 l 50 0 c -2 -14 -10 -24 -25 -24 z" opacity="0.85"/>
      </g>
      <path d="M200 84 c 8 -11 25 -9 25 5 c 0 11 -15 20 -25 28 c -10 -8 -25 -17 -25 -28 c 0 -14 17 -16 25 -5 z" fill="#c96b5e" opacity="0.85"/>`,
    montanha: `
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#edf3f1"/><stop offset="1" stop-color="#d2e2db"/>
      </linearGradient></defs>
      <rect width="400" height="225" fill="url(#${id})"/>
      <path d="M0 150 L100 74 L190 150 L280 88 L400 156 L400 225 L0 225 Z" fill="#a8c3b4" opacity="0.7"/>
      <path d="M0 178 L110 118 L220 178 L320 128 L400 172 L400 225 L0 225 Z" fill="#5f7d6d" opacity="0.65"/>
      <path d="M100 74 L124 92 L112 100 L132 116 L100 74 Z" fill="#ffffff" opacity="0.7"/>
      <path d="M280 88 L302 106 L290 112 L308 128 L280 88 Z" fill="#ffffff" opacity="0.7"/>
      <path d="M170 225 C 200 190 240 185 262 160 C 250 196 220 208 208 225 Z" fill="#f7f3e8" opacity="0.9"/>`
  };
  return (
    '<svg class="cena" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    (cenas[chave] || cenas.amanhecer) +
    "</svg>"
  );
}

/* ---------------- SÉRIES (aparência por série) ---------------- */

const APARENCIA_SERIE = {
  "ultimos-dias": { etiqueta: "ÚLTIMOS DIAS", classe: "etiqueta-ultimos-dias", icone: "cruz",    cor: "areia",     arte: "luz" },
  "ministerio":   { etiqueta: "MINISTÉRIO",   classe: "etiqueta-ministerio",   icone: "pessoa",   cor: "azul",     arte: "montanha" },
  "parabolas":    { etiqueta: "PARÁBOLAS",    classe: "etiqueta-parabolas",    icone: "folha",    cor: "verde",    arte: "semente" },
  "evangelho":    { etiqueta: "EVANGELHO",    classe: "etiqueta-evangelho",    icone: "livro",    cor: "roxo",     arte: "evangelho" },
  "doutrina":     { etiqueta: "DOUTRINA",     classe: "etiqueta-doutrina",     icone: "espirito", cor: "vermelho", arte: "amanhecer" },
  "temas":        { etiqueta: "TEMA",         classe: "etiqueta-temas",        icone: "coracao",  cor: "areia",    arte: "maos" }
};

/* ---------------- NORMALIZAÇÃO DOS DADOS ---------------- */

function prepararApresentacoes() {
  return (DADOS.videos || []).map((v, i) => {
    const aparencia = APARENCIA_SERIE[v.s] || APARENCIA_SERIE.temas;
    return {
      id: v.id,
      titulo: titleCase(v.t),
      serie: v.s,
      serieNome: (DADOS.series && DADOS.series[v.s]) || "Temas e Reflexões",
      etiquetaClasse: aparencia.etiqueta,
      etiquetaClasseCss: aparencia.classe,
      iconeTema: aparencia.icone,
      corTema: aparencia.cor,
      data: v.d,
      duracao: v.dur || "",
      thumb: "https://i.ytimg.com/vi/" + v.id + "/hq720.jpg",
      youtube: "https://www.youtube.com/watch?v=" + v.id,
      audio: v.audio || null,
      audioPlataforma: v.audioPlataforma || null,
      slides: v.slides || null,
      autor: DADOS.site.autor || "",
      local: DADOS.site.canalNome || "YouTube",
      descricao: v.descricao || "",
      arte: aparencia.arte === "maos" && i % 2 ? "familia" : aparencia.arte
    };
  });
}

/* ---------------- UTILITÁRIOS ---------------- */

const MESES_ABREV = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
const MESES_CURTO = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

function escapar(texto) {
  return String(texto == null ? "" : texto)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* "A PRISÃO DE JESUS" → "A Prisão de Jesus"
   Palavras ligas em minúscula; numerais romanos e siglas (d.C.) preservados. */
const PALAVRAS_MENORES = new Set(["de","da","do","das","dos","e","em","no","na","nos","nas","para","por","com","que","a","o","as","os","um","uma","ao","à","às","aos","se","ou","como"]);
function titleCase(titulo) {
  return String(titulo || "").split(/\s+/).map((p, i) => {
    if (!p) return p;
    const nucleo = p.replace(/[^\p{L}\p{N}.º°]/gu, "");
    // Numeral romano (XVI, IX…) → manter
    if (/^[XxVvIi]{2,}$/.test(nucleo)) return p;
    // Sigla com maiúscula interna (d.C., 6º) → manter
    if (/[A-ZÁÉÍÓÚÂÊÔÃÕÇÜ]/.test(p.slice(1)) && p !== p.toUpperCase()) return p;
    const minuscula = p.toLocaleLowerCase("pt-BR");
    if (i > 0 && PALAVRAS_MENORES.has(minuscula.replace(/[^\p{L}]/gu, ""))) return minuscula;
    return minuscula.charAt(0).toLocaleUpperCase("pt-BR") + minuscula.slice(1);
  }).join(" ");
}

function fmtData(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return d + " de " + MESES_ABREV[m - 1] + " de " + a;
}

function fmtAgendaBloco(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return { dia: String(d), mes: MESES_CURTO[m - 1] };
}

/* 20:00 → "20h" · 19:30 → "19h30" */
function fmtHora(h) {
  const [hh, mm] = String(h || "").split(":");
  if (!mm || mm === "00") return (hh || "") + "h";
  return hh + "h" + mm;
}

/* Link do Google Maps para o endereço.
   Eventos online: YouTube → canal; Instagram → perfil. */
function linkMaps(endereco) {
  if (!endereco) return null;
  const e = endereco.toLowerCase();
  if (e.includes("youtube")) return DADOS.site.canalYoutube;
  if (e.includes("instagram")) return DADOS.site.instagram || "https://www.instagram.com/consolador.cec/";
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(endereco);
}

function ordenarPorDataDesc(lista) {
  return [...lista].sort((x, y) => (x.data < y.data ? 1 : x.data > y.data ? -1 : 0));
}

function proximosEventos() {
  const hoje = new Date();
  const chave = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
  return (DADOS.agenda || [])
    .filter((e) => e.data >= chave)
    .sort((x, y) => (x.data > y.data ? 1 : -1));
}

/* ---------------- MENU (BARRA LATERAL) ---------------- */

const MENU = [
  { pagina: "inicio", rotulo: "Início", icone: "inicio" },
  { pagina: "apresentacoes", rotulo: "Apresentações", icone: "apresentacao" },
  { pagina: "videos", rotulo: "Vídeos", icone: "video" },
  { pagina: "audios", rotulo: "Áudios", icone: "audio" },
  { pagina: "slides", rotulo: "Slides (PPT)", icone: "slides" },
  { pagina: "agenda", rotulo: "Agenda", icone: "agenda" },
  { pagina: "livro", rotulo: "Livro", icone: "livro" },
  { divisor: true },
  { pagina: "sobre", rotulo: "Sobre", icone: "info" },
  { pagina: "contato", rotulo: "Contato", icone: "email" }
];

function renderizarSidebar() {
  const paginaAtual = document.body.dataset.page;
  const itens = MENU.map((item) => {
    if (item.divisor) return '<hr class="menu-divisor">';
    if (item.emBreve) {
      return (
        '<li class="menu-item"><span title="Disponível em breve">' + icone(item.icone) +
        escapar(item.rotulo) + '<span class="tag-em-breve">em breve</span></span></li>'
      );
    }
    const arquivo = item.pagina === "inicio" ? "index.html" : item.pagina + ".html";
    return (
      '<li class="menu-item"><a href="' + arquivo + '"' +
      (item.pagina === paginaAtual ? ' class="ativo"' : "") + ">" +
      icone(item.icone) + escapar(item.rotulo) + "</a></li>"
    );
  }).join("");

  document.getElementById("sidebar").innerHTML =
    '<a class="logo-bloco" href="index.html" aria-label="' + escapar(DADOS.site.nome) + ' — Início">' +
    '<img class="logo-img" src="img/logo-menu.png" alt="' + escapar(DADOS.site.nome + " — " + DADOS.site.tagline) + '">' +
    "</a>" +
    '<ul class="menu">' + itens + "</ul>" +
    '<div class="citacao-menu"><p>“' + escapar(DADOS.citacaoMenu.texto) +
    '”</p><cite>— ' + escapar(DADOS.citacaoMenu.autor) + "</cite></div>";
}

function renderizarTopbar() {
  document.getElementById("topbar").innerHTML =
    '<button class="btn-menu-mobile" id="btnMenu" aria-label="Abrir menu">' + icone("menu") + "</button>" +
    '<div class="busca">' + icone("busca") +
    '<input type="search" id="campoBusca" placeholder="Buscar apresentações, temas, autores, eventos..." aria-label="Buscar"></div>';

  const btn = document.getElementById("btnMenu");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlayMenu");
  if (btn) {
    btn.addEventListener("click", () => {
      sidebar.classList.toggle("aberta");
      overlay.classList.toggle("visivel", sidebar.classList.contains("aberta"));
    });
    overlay.addEventListener("click", () => {
      sidebar.classList.remove("aberta");
      overlay.classList.remove("visivel");
    });
  }
}

/* ---------------- COMPONENTES REUTILIZÁVEIS ---------------- */

/* Fallback de thumbnail: o YouTube devolve uma imagem cinza 120×90 (ou erro 404)
   quando o vídeo não tem a versão HD. Troca por hqdefault e, se persistir,
   remove a imagem para revelar a ilustração de fundo. */
window.__thumbCarregou = function (img) {
  if (img.naturalWidth >= 300) return;
  if (img.src.indexOf("hq720") > -1) img.src = img.src.replace("hq720", "hqdefault");
  else img.remove();
};
window.__thumbErro = function (img) {
  if (img.src.indexOf("hq720") > -1) img.src = img.src.replace("hq720", "hqdefault");
  else img.remove();
};

/* Camada visual da miniatura: ilustração de fundo + thumbnail real do vídeo por cima */
function camadaMidia(item) {
  return (
    cena(item.arte) +
    (item.thumb
      ? '<img class="thumb-img" src="' + escapar(item.thumb) + '" alt="" loading="lazy" onload="__thumbCarregou(this)" onerror="__thumbErro(this)">'
      : "")
  );
}

function miniatura(item) {
  return (
    '<div class="miniatura">' + camadaMidia(item) +
    (item.duracao ? '<span class="selo-duracao">' + escapar(item.duracao) + "</span>" : "") +
    "</div>"
  );
}

function cartaoApresentacao(item) {
  const link = item.youtube || "#";
  return (
    '<article class="cartao">' +
    '<a href="' + escapar(link) + '" target="_blank" rel="noopener" aria-label="' + escapar(item.titulo) + '">' +
    miniatura(item) + "</a>" +
    '<div class="cartao-corpo">' +
    '<h3><a href="' + escapar(link) + '" target="_blank" rel="noopener">' + escapar(item.titulo) + "</a></h3>" +
    '<div class="cartao-meta">' +
    "<span>" + icone("agenda") + fmtData(item.data) + "</span>" +
    "<span>" + icone("tema") + escapar(item.serieNome) + "</span>" +
    "</div>" +
    '<div class="cartao-rodape">' +
    '<span class="etiqueta ' + item.etiquetaClasseCss + '">' + item.etiquetaClasse + "</span>" +
    (item.youtube ? '<a class="link-icone" href="' + escapar(item.youtube) + '" target="_blank" rel="noopener">Assistir ' + icone("externo") + "</a>" : "") +
    "</div></div></article>"
  );
}

/* Item da agenda.
   compacto=true (home): data + tema + [pin] centro | [relógio] horário.
   completo (agenda): horário sob a data; centro; endereço linkado ao Maps. */
function itemAgenda(evento, compacto) {
  const bloco = fmtAgendaBloco(evento.data);
  const hora = fmtHora(evento.horario);

  if (compacto) {
    return (
      '<article class="item-agenda">' +
      '<div class="agenda-data"><div class="agenda-dia">' + bloco.dia + '</div><div class="agenda-mes">' + bloco.mes + '</div><div class="agenda-hora">' + escapar(hora) + "</div></div>" +
      '<div class="agenda-info"><h3>' + escapar(evento.titulo) + "</h3>" +
      '<div class="agenda-detalhes">' +
      '<span class="agenda-campo">' + icone("pin") + escapar(evento.local) + "</span>" +
      "</div></div></article>"
    );
  }

  const maps = linkMaps(evento.endereco);
  const tituloLink = !maps ? ""
    : maps.indexOf("google.com/maps") > -1 ? "Ver no Google Maps"
    : maps.indexOf("youtube") > -1 ? "Abrir no YouTube"
    : "Abrir no Instagram";
  const linhaEndereco = evento.endereco
    ? (maps
        ? '<div class="agenda-linha"><a class="agenda-endereco" href="' + escapar(maps) + '" target="_blank" rel="noopener" title="' + tituloLink + '">' + icone("pin") + escapar(evento.endereco) + icone("externo") + "</a></div>"
        : '<div class="agenda-linha"><span class="agenda-endereco">' + icone("pin") + escapar(evento.endereco) + "</span></div>")
    : "";

  return (
    '<article class="item-agenda">' +
    '<div class="agenda-data"><div class="agenda-dia">' + bloco.dia + '</div><div class="agenda-mes">' + bloco.mes + '</div><div class="agenda-hora">' + escapar(hora) + "</div></div>" +
    '<div class="agenda-info"><h3>' + escapar(evento.titulo) + "</h3>" +
    '<div class="agenda-linha"><span class="agenda-centro">' + escapar(evento.local) + "</span></div>" +
    linhaEndereco +
    "</div>" + icone("seta", "agenda-seta") +
    "</article>"
  );
}

function itemAgendaPassado(evento) {
  const item = itemAgenda(evento, false).replace('class="item-agenda"', 'class="item-agenda item-agenda--passado"');
  return item;
}

/* Temas em destaque: calculados a partir das séries e vídeos */
function pintarTemas() {
  const contagens = {};
  (DADOS.videos || []).forEach((v) => { contagens[v.s] = (contagens[v.s] || 0) + 1; });
  const entradas = Object.entries(DADOS.series || {})
    .map(([chave, nome]) => ({ chave, nome, ...(APARENCIA_SERIE[chave] || APARENCIA_SERIE.temas), total: contagens[chave] || 0 }))
    .sort((a, b) => b.total - a.total);
  return entradas.map((t) =>
    '<a class="item-tema" href="apresentacoes.html?serie=' + encodeURIComponent(t.chave) + '" title="Ver a série ' + escapar(t.nome) + '">' +
    '<span class="tema-icone tema-icone--' + t.cor + '">' + icone(t.icone) + "</span>" +
    "<span><h3>" + escapar(t.nome) + "</h3><p>" + t.total + " apresentações</p></span></a>"
  ).join("");
}

function cabecalhoSecao(titulo, linkArquivo, rotuloLink) {
  return (
    '<div class="cabecalho-secao"><h2>' + titulo + "</h2>" +
    (linkArquivo ? '<a class="link-ver-todas" href="' + linkArquivo + '">' + (rotuloLink || "Ver todas →") + "</a>" : "") +
    "</div>"
  );
}

/* ---------------- PÁGINA: INÍCIO ---------------- */

function renderizarInicio() {
  const principal = document.getElementById("principal");
  const lista = ordenarPorDataDesc(prepararApresentacoes());
  const destaque = lista[0];
  const ultimas = lista.slice(1, 5);
  const eventos = proximosEventos().slice(0, 4);

  principal.innerHTML =
    '<section class="hero">' +
    '<img class="hero-fundo" src="img/banner-paisagem.png" alt="">' +
    '<div class="hero-conteudo">' +
    "<h1>" + escapar(DADOS.hero.titulo) + "</h1>" +
    '<p class="hero-subtitulo">' + escapar(DADOS.hero.subtitulo) + "</p>" +
    '<p class="hero-citacao">“' + escapar(DADOS.hero.citacao) + '”<cite>— ' + escapar(DADOS.hero.autorCitacao) + "</cite></p>" +
    "</div></section>" +

    '<div class="grade-home">' +
    "<div>" +
    '<section class="secao">' + cabecalhoSecao("Apresentação em destaque", "apresentacoes.html") +
    '<article class="cartao-destaque">' +
    '<div class="destaque-midia">' + camadaMidia(destaque) +
    (destaque.duracao ? '<span class="selo-duracao">' + escapar(destaque.duracao) + "</span>" : "") +
    "</div>" +
    '<div class="destaque-info">' +
    '<span class="etiqueta ' + destaque.etiquetaClasseCss + '">' + destaque.etiquetaClasse + "</span>" +
    "<h3>" + escapar(destaque.titulo) + "</h3>" +
    '<div class="destaque-meta">' +
    "<span>" + icone("agenda") + fmtData(destaque.data) + "</span>" +
    "<span>" + icone("tema") + escapar(destaque.serieNome) + "</span>" +
    "<span>" + icone("pessoa") + escapar(destaque.autor) + "</span>" +
    "</div>" +
    (destaque.descricao ? '<p class="destaque-descricao">' + escapar(destaque.descricao) + "</p>" : "") +
    '<div class="acoes">' +
    '<a class="botao-acao" href="' + escapar(destaque.youtube) + '" target="_blank" rel="noopener">' + icone("play") + "Assistir vídeo</a>" +
    (destaque.audio
      ? '<a class="botao-acao" href="' + escapar(destaque.audio) + '" target="_blank" rel="noopener">' + icone("audio") + "Ouvir áudio</a>"
      : '<span class="botao-acao botao-acao--desabilitado">' + icone("audio") + "Áudio não disponível</span>") +
    (destaque.slides
      ? '<a class="botao-acao" href="' + escapar(destaque.slides) + '" target="_blank" rel="noopener">' + icone("download") + "Baixar slides (PPT)</a>"
      : '<span class="botao-acao botao-acao--desabilitado">' + icone("download") + "Apresentação não disponível</span>") +
    "</div></div></article></section>" +

    '<section class="secao">' + cabecalhoSecao("Últimas apresentações", "apresentacoes.html") +
    '<div class="grade-cartoes" id="listaUltimas">' +
    (lista.length ? ultimas.map(cartaoApresentacao).join("") : '<div class="vazio">Nenhuma apresentação cadastrada ainda.</div>') +
    "</div></section>" +
    "</div>" +

    '<aside class="coluna-lateral">' +
    '<section class="secao">' + cabecalhoSecao("Agenda de apresentações", "agenda.html", "Ver agenda completa →") +
    '<div class="agenda-lista">' +
    (eventos.length ? eventos.map((e) => itemAgenda(e, true)).join("") : '<div class="vazio">Nova agenda em preparação. Volte em breve!</div>') +
    "</div></section>" +
    '<section class="secao">' + cabecalhoSecao("Temas em destaque", "apresentacoes.html") +
    '<div class="lista-temas">' + pintarTemas() + "</div></section>" +
    "</aside></div>";

  window.__filtroLista = function (termo) {
    const t = termo.trim().toLowerCase();
    const alvo = document.getElementById("listaUltimas");
    if (!alvo) return;
    if (!t) { alvo.innerHTML = ultimas.map(cartaoApresentacao).join(""); return; }

    // Busca em TODAS as palestras E nos Shorts
    const palestras = lista.filter((a) => [a.titulo, a.autor, a.serieNome].join(" ").toLowerCase().includes(t));
    const shortsAchados = (DADOS.shorts || [])
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.t.toLowerCase().includes(t));

    let html = "";
    if (palestras.length) {
      html += '<p class="dica-busca">Palestras que combinam com a busca:</p>' +
        palestras.map(cartaoApresentacao).join("");
    }
    if (shortsAchados.length) {
      html += '<p class="dica-busca">Shorts que combinam:</p>' +
        shortsAchados.map(({ s, i }) => cartaoShort(s, i)).join("");
    }
    if (!html) {
      html = '<div class="vazio" style="grid-column:1/-1">Nada encontrado para “' + escapar(termo) + '”.<br><br>' +
        '<a class="botao-acao" href="agenda.html?q=' + encodeURIComponent(termo) + '">Procurar na Agenda</a></div>';
    }
    alvo.innerHTML = html;
  };
}

/* ---------------- LISTA COM FILTRO POR SÉRIE (compartilhada) ---------------- */

function pintarListaComSerie(containerId, lista, filtroSerie) {
  const grade = document.getElementById(containerId);
  const filtradas = filtroSerie ? lista.filter((a) => a.serie === filtroSerie) : lista;
  grade.innerHTML = filtradas.length
    ? filtradas.map(cartaoApresentacao).join("")
    : '<div class="vazio" style="grid-column:1/-1">Nenhuma apresentação encontrada.</div>';
}

function montarChipsSerie(containerSel, filtroSerie, aoTrocar) {
  const cont = document.querySelector(containerSel);
  const params = new URLSearchParams(location.search);
  let serieAtiva = filtroSerie || params.get("serie") || "todas";
  const chaves = Object.entries(DADOS.series || {});
  cont.innerHTML =
    '<button class="chip-filtro' + (serieAtiva === "todas" ? " ativo" : "") + '" data-serie="todas">Todas</button>' +
    chaves.map(([chave, nome]) =>
      '<button class="chip-filtro' + (serieAtiva === chave ? " ativo" : "") + '" data-serie="' + chave + '">' + escapar(nome) + "</button>"
    ).join("");
  cont.addEventListener("click", (ev) => {
    const botao = ev.target.closest(".chip-filtro");
    if (!botao) return;
    serieAtiva = botao.dataset.serie;
    cont.querySelectorAll(".chip-filtro").forEach((b) => b.classList.toggle("ativo", b === botao));
    aoTrocar(serieAtiva === "todas" ? null : serieAtiva);
  });
  return serieAtiva === "todas" ? null : serieAtiva;
}

/* ---------------- PÁGINA: APRESENTAÇÕES ---------------- */

function renderizarApresentacoes() {
  const principal = document.getElementById("principal");
  const termoInicial = new URLSearchParams(location.search).get("q") || "";
  const lista = ordenarPorDataDesc(prepararApresentacoes());
  let filtroSerie = null;

  principal.innerHTML =
    "<h1 class=\"titulo-pagina\">Apresentações</h1>" +
    '<p class="subtitulo-pagina">Todas as palestras do canal ' + escapar(DADOS.site.canalNome) + ' — filtráveis por série e tema.</p>' +
    '<div class="pagina-barra"><div class="filtros" id="filtrosSerie"></div></div>' +
    '<div class="grade-cartoes" id="gradeApresentacoes"></div>';

  filtroSerie = montarChipsSerie("#filtrosSerie", null, (serie) => {
    filtroSerie = serie;
    aplicar(termoBuscaAtual());
  });

  function termoBuscaAtual() {
    return document.getElementById("campoBusca") ? document.getElementById("campoBusca").value : termoInicial;
  }

  function aplicar(termo) {
    const t = (termo || "").trim().toLowerCase();
    const listaFiltrada = lista.filter((a) => {
      const porSerie = !filtroSerie || a.serie === filtroSerie;
      const porTexto = !t || [a.titulo, a.autor, a.serieNome].join(" ").toLowerCase().includes(t);
      return porSerie && porTexto;
    });
    const grade = document.getElementById("gradeApresentacoes");
    grade.innerHTML = listaFiltrada.length
      ? listaFiltrada.map(cartaoApresentacao).join("")
      : '<div class="vazio" style="grid-column:1/-1">Nenhuma apresentação encontrada.</div>';
  }

  aplicar(termoInicial);
  window.__filtroLista = aplicar;
}

/* ---------------- PÁGINA: VÍDEOS ---------------- */

/* Cartão de Short (página Vídeos) */
const ARTES_SHORT = ["luz", "semente", "evangelho", "montanha", "maos", "familia"];

function cartaoShort(s, i) {
  const item = {
    arte: ARTES_SHORT[i % ARTES_SHORT.length],
    thumb: "https://i.ytimg.com/vi/" + s.id + "/mqdefault.jpg",
    duracao: ""
  };
  const link = "https://www.youtube.com/shorts/" + s.id;
  return (
    '<article class="cartao">' +
    miniatura(item) +
    '<div class="cartao-corpo">' +
    "<h3>" + escapar(s.t) + "</h3>" +
    '<div class="cartao-rodape">' +
    '<span class="etiqueta etiqueta-short">SHORT</span>' +
    '<a class="link-icone" href="' + escapar(link) + '" target="_blank" rel="noopener">Assistir ' + icone("externo") + "</a>" +
    "</div></div></article>"
  );
}

function renderizarVideos() {
  const principal = document.getElementById("principal");
  const shorts = (DADOS.shorts || []);
  const termoInicial = new URLSearchParams(location.search).get("q") || "";

  function pintar(termo) {
    const t = (termo || "").trim().toLowerCase();
    const filtrados = t ? shorts.filter((s) => s.t.toLowerCase().includes(t)) : shorts;
    const grade = document.getElementById("gradeVideos");
    grade.innerHTML = filtrados.length
      ? filtrados.map(cartaoShort).join("")
      : '<div class="vazio" style="grid-column:1/-1">Nenhum short encontrado.</div>';
  }

  principal.innerHTML =
    "<h1 class=\"titulo-pagina\">Vídeos</h1>" +
    '<p class="subtitulo-pagina">Shorts e momentos especiais do canal ' + escapar(DADOS.site.canalNome) + '. As palestras completas estão na página Apresentações.</p>' +
    '<div class="pagina-barra"><div class="acoes" style="margin:0">' +
    '<a class="botao-acao botao-acao--primario" href="apresentacoes.html">Ver apresentações</a>' +
    '<a class="botao-acao" href="' + escapar(DADOS.site.canalYoutube) + '" target="_blank" rel="noopener">' + icone("video") + " Ver canal no YouTube " + icone("externo") + "</a>" +
    "</div></div>" +
    '<div class="grade-cartoes" id="gradeVideos"></div>';

  pintar(termoInicial);
  window.__filtroLista = pintar;
}

/* ---------------- PÁGINA: ÁUDIOS ---------------- */

function renderizarAudios() {
  const principal = document.getElementById("principal");
  const lista = prepararApresentacoes().filter((a) => a.audio);
  let filtroSerie = null;

  function itemAudio(a) {
    return (
      '<article class="item-audio">' +
      '<a class="audio-play" href="' + escapar(a.audio) + '" target="_blank" rel="noopener" aria-label="Ouvir ' + escapar(a.titulo) + '" title="Ouvir em ' + escapar(a.audioPlataforma || "link externo") + '">' + icone("play") + "</a>" +
      '<div class="audio-info"><h3>' + escapar(a.titulo) + "</h3>" +
      '<div class="audio-detalhes">' +
      "<span>" + icone("agenda") + fmtData(a.data) + "</span>" +
      "<span>" + icone("pessoa") + escapar(a.autor) + "</span>" +
      (a.duracao ? "<span>" + icone("relogio") + escapar(a.duracao) + "</span>" : "") +
      "</div></div>" +
      '<span class="plataforma">' + escapar(a.audioPlataforma || "ÁUDIO") + "</span>" +
      "</article>"
    );
  }

  function pintar(termo) {
    const t = (termo || "").trim().toLowerCase();
    const filtradas = lista.filter((a) => {
      const porSerie = !filtroSerie || a.serie === filtroSerie;
      const porTexto = !t || [a.titulo, a.autor, a.serieNome].join(" ").toLowerCase().includes(t);
      return porSerie && porTexto;
    });
    const alvo = document.getElementById("listaAudios");
    alvo.innerHTML = filtradas.length
      ? filtradas.map(itemAudio).join("")
      : '<div class="vazio">Nenhum áudio encontrado.</div>';
  }

  principal.innerHTML =
    "<h1 class=\"titulo-pagina\">Áudios das palestras</h1>" +
    '<p class="subtitulo-pagina">Ouça as apresentações na íntegra — os arquivos abrem no player externo (Google Drive, Internet Archive ou outra plataforma).</p>' +
    '<div class="filtros" id="filtrosSerie" style="margin-bottom:20px"></div>' +
    '<div class="lista-audios" id="listaAudios"></div>';

  filtroSerie = montarChipsSerie("#filtrosSerie", null, (serie) => {
    filtroSerie = serie;
    pintar(document.getElementById("campoBusca") ? document.getElementById("campoBusca").value : "");
  });

  pintar("");
  window.__filtroLista = pintar;
}

/* ---------------- PÁGINA: SLIDES ---------------- */

function renderizarSlides() {
  const principal = document.getElementById("principal");
  const lista = prepararApresentacoes().filter((a) => a.slides);

  function cartaoSlide(a) {
    return (
      '<article class="cartao">' +
      miniatura(a, { comPlay: false }) +
      '<div class="cartao-corpo">' +
      "<h3>" + escapar(a.titulo) + "</h3>" +
      '<div class="cartao-meta"><span>' + icone("agenda") + fmtData(a.data) + "</span></div>" +
      '<div class="cartao-rodape">' +
      '<span class="etiqueta ' + a.etiquetaClasseCss + '">' + a.etiquetaClasse + "</span>" +
      '<a class="link-icone" href="' + escapar(a.slides) + '" target="_blank" rel="noopener">Baixar PPT ' + icone("download") + "</a>" +
      "</div></div></article>"
    );
  }

  function pintar(termo) {
    const t = (termo || "").trim().toLowerCase();
    const filtradas = t
      ? lista.filter((a) => [a.titulo, a.autor, a.serieNome].join(" ").toLowerCase().includes(t))
      : lista;
    const alvo = document.getElementById("gradeSlides");
    alvo.innerHTML = filtradas.length
      ? filtradas.map(cartaoSlide).join("")
      : '<div class="vazio" style="grid-column:1/-1">Nenhum material encontrado.</div>';
  }

  principal.innerHTML =
    "<h1 class=\"titulo-pagina\">Slides das apresentações</h1>" +
    '<p class="subtitulo-pagina">Baixe os arquivos de apresentação (PPT) para estudar ou reutilizar nos seus grupos de estudo.</p>' +
    '<div class="grade-cartoes" id="gradeSlides"></div>';

  pintar("");
  window.__filtroLista = pintar;
}

/* ---------------- PÁGINA: AGENDA ---------------- */

function renderizarAgenda() {
  const principal = document.getElementById("principal");
  const eventos = proximosEventos();

  // Eventos já realizados (do mais recente para o mais antigo)
  const hoje = new Date();
  const chaveHoje = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
  const passados = (DADOS.agenda || [])
    .filter((e) => e.data < chaveHoje)
    .sort((x, y) => (x.data < y.data ? 1 : -1));

  function pintar(termo) {
    const t = (termo || "").trim().toLowerCase();
    const filtraEvento = (e) => !t || [e.titulo, e.local].join(" ").toLowerCase().includes(t);
    const filtrados = eventos.filter(filtraEvento);
    const filtradosPassados = passados.filter(filtraEvento);

    const alvo = document.getElementById("listaAgenda");
    alvo.innerHTML = filtrados.length
      ? filtrados.map((e) => itemAgenda(e, false)).join("")
      : '<div class="vazio">Nenhum evento futuro corresponde à busca.</div>';

    const alvoPassados = document.getElementById("secaoPassados");
    if (alvoPassados) {
      alvoPassados.style.display = filtradosPassados.length ? "" : "none";
      document.getElementById("listaPassados").innerHTML = filtradosPassados.map(itemAgendaPassado).join("");
    }
  }

  principal.innerHTML =
    "<h1 class=\"titulo-pagina\">Agenda de apresentações</h1>" +
    '<p class="subtitulo-pagina">Próximos encontros, palestras e estudos abertos. Participe — a entrada é gratuita.</p>' +
    '<div class="agenda-lista" id="listaAgenda"></div>' +
    '<section class="secao" id="secaoPassados" style="margin-top:38px">' +
    '<div class="cabecalho-secao"><h2>Eventos passados</h2></div>' +
    '<div class="agenda-lista agenda-passados" id="listaPassados"></div>' +
    "</section>";

  pintar("");
  window.__filtroLista = pintar;
}

/* ---------------- PÁGINA: LIVRO ---------------- */

function renderizarLivro() {
  const principal = document.getElementById("principal");
  const livro = DADOS.livro || { titulo: "A Bênção da Dor", autor: "Alexandre Alves", texto: [] };
  const paragrafos = livro.texto
    .map((t) => "<p>" + escapar(t) + "</p>")
    .join("");

  principal.innerHTML =
    "<h1 class=\"titulo-pagina\">Livro</h1>" +
    '<p class="subtitulo-pagina">' + escapar("A Bênção da Dor — " + livro.autor) + "</p>" +
    '<div class="pagina-texto">' +
    '<a href="https://a.co/d/009jVo22" target="_blank" rel="noopener" title="Conheça o livro na Amazon">' +
    '<img class="livro-capa" src="img/capa-livro.png" alt="Capa do livro ' + escapar(livro.titulo) + '"></a>' +
    paragrafos +
    "</div>";
}

/* ---------------- PÁGINA: SOBRE ---------------- */

function renderizarSobre() {
  const principal = document.getElementById("principal");
  // Converte [texto](https://url) em link após escapar o texto (com segurança)
  const comLinks = (t) =>
    escapar(t).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const paragrafos = (DADOS.sobre.texto || [])
    .map((t) => "<p" + (t.startsWith("\"") || t.startsWith("“") ? ' class="serif-citacao"' : "") + ">" + comLinks(t) + "</p>")
    .join("");
  principal.innerHTML =
    "<h1 class=\"titulo-pagina\">Sobre</h1>" +
    '<p class="subtitulo-pagina">Conheça o propósito deste trabalho de divulgação.</p>' +
    '<div class="pagina-texto">' +
    '<img class="sobre-foto" src="img/alexandre.jpg" alt="' + escapar(DADOS.site.autor) + '">' +
    paragrafos +
    "</div>";
}

/* ---------------- PÁGINA: CONTATO ---------------- */

function renderizarContato() {
  const principal = document.getElementById("principal");
  principal.innerHTML =
    "<h1 class=\"titulo-pagina\">Contato</h1>" +
    '<p class="subtitulo-pagina">' + escapar(DADOS.contato.mensagem) + "</p>" +
    '<div class="pagina-texto">' +
    '<div class="contato-lista">' +
    '<div class="contato-item">' + icone("email") + "<span>E-mail: <a href=\"mailto:" + escapar(DADOS.site.email) + "\">" + escapar(DADOS.site.email) + "</a></span></div>" +
    '<div class="contato-item">' + icone("video") + "<span>YouTube: <a href=\"" + escapar(DADOS.site.canalYoutube) + '" target="_blank" rel="noopener">' + escapar(DADOS.site.canalNome) + "</a></span></div>" +
    '<div class="contato-item">' + icone("instagram") + "<span>Instagram: <a href=\"https://www.instagram.com/pazqueilumina/\" target=\"_blank\" rel=\"noopener\">Paz que Ilumina</a></span></div>" +
    "</div></div>";
}

/* ---------------- BUSCA GLOBAL ---------------- */

const PAGINAS_COM_LISTA = ["inicio", "apresentacoes", "videos", "audios", "slides", "agenda"];

function configurarBusca() {
  const campo = document.getElementById("campoBusca");
  if (!campo) return;

  const termoInicial = new URLSearchParams(location.search).get("q");
  if (termoInicial) campo.value = termoInicial;

  const paginaAtual = document.body.dataset.page;
  const emLista = PAGINAS_COM_LISTA.includes(paginaAtual);

  campo.addEventListener("input", () => {
    if (emLista && window.__filtroLista) window.__filtroLista(campo.value);
  });

  campo.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter") return;
    const termo = campo.value.trim();
    if (!termo) return;
    // Enter busca na própria página (quando ela tem lista); fora delas, vai para Apresentações
    const destino = emLista && paginaAtual !== "inicio"
      ? paginaAtual + ".html?q=" + encodeURIComponent(termo)
      : "apresentacoes.html?q=" + encodeURIComponent(termo);
    location.href = destino;
  });
}

/* ---------------- ANÁLISE DE VISITAS (GoatCounter) ----------------
   Ativa quando DADOS.site.analytics.goatcounter estiver preenchido.
   Registra: visualização da página e cliques em "Assistir" (por vídeo). */

function registrarCliqueVideo(nome) {
  try {
    if (window.goatcounter && window.goatcounter.count) {
      window.goatcounter.count({ path: "assistir: " + nome, event: true });
    }
  } catch (e) { /* silencioso */ }
}

function configurarAnalytics() {
  const cfg = DADOS.site && DADOS.site.analytics;
  if (!cfg || !cfg.goatcounter) return;

  // Carrega o script do GoatCounter
  const s = document.createElement("script");
  s.async = true;
  s.setAttribute("data-goatcounter", cfg.goatcounter);
  s.src = "//gc.zgo.at/count.js";
  document.body.appendChild(s);

  // Cliques em links de vídeo: identifica o vídeo pelo cartão
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href*="youtube.com"], a[href*="youtu.be"]');
    if (!a) return;
    const cartao = a.closest("article");
    const titulo = cartao ? cartao.querySelector("h3") : null;
    registrarCliqueVideo(titulo ? titulo.textContent.trim().slice(0, 80) : (a.getAttribute("data-video") || "link YouTube"));
  });
}

/* ---------------- INICIALIZAÇÃO ---------------- */

document.addEventListener("DOMContentLoaded", () => {
  renderizarSidebar();
  renderizarTopbar();

  const pagina = document.body.dataset.page;
  const renderizadores = {
    inicio: renderizarInicio,
    apresentacoes: renderizarApresentacoes,
    videos: renderizarVideos,
    audios: renderizarAudios,
    slides: renderizarSlides,
    agenda: renderizarAgenda,
    livro: renderizarLivro,
    sobre: renderizarSobre,
    contato: renderizarContato
  };
  (renderizadores[pagina] || renderizarInicio)();

  configurarBusca();
  configurarAnalytics();
});
