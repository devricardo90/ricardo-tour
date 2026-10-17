/**
 * RT-115: builds the Owner review page (single HTML, images inlined) for the Rocinha commercial closing, from the same
 * draft data the preview uses. Internal costs are never included; provisional prices appear labelled "NÃO PUBLICAR".
 * Usage: npx tsx scripts/rt-115-review-page.ts <captures dir> <out.html> [--sem-precos]
 * --sem-precos: visual-review version (no provisional prices anywhere; "Valores em validação"). Use captures taken with ?precos=ocultos.
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROCINHA_BENEFITS,
  ROCINHA_CONTENT,
  ROCINHA_GROUP_SIZE,
  ROCINHA_MIN_AGE,
  ROCINHA_PROVISIONAL_PRICING,
  ROCINHA_SUBTITLE,
  ROCINHA_TITLE,
  ROCINHA_WHATSAPP_MESSAGE,
} from "../lib/catalog/drafts/rocinha.draft";

const [capDir, outFile] = process.argv.slice(2);
const noPrices = process.argv.includes("--sem-precos");
const img = (f: string) => `data:image/jpeg;base64,${fs.readFileSync(path.join(capDir, f)).toString("base64")}`;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const c = ROCINHA_CONTENT;
type L = "pt" | "en" | "es";
const H = {
  pt: { sub: "Subtítulo", short: "Descrição curta", about: "Descrição completa", ben: "Benefícios", facts: "Informações", route: "Roteiro", inc: "Incluído", exc: "Não incluído", opt: "Serviços opcionais de terceiros", prac: "Informações práticas", acc: "Acessibilidade", op: "Condições operacionais", faq: "Perguntas frequentes", wa: "Mensagem de WhatsApp", dur: "Duração", grp: "Participantes", age: "Idade mínima", meet: "Ponto de encontro" },
  en: { sub: "Subtitle", short: "Short description", about: "Full description", ben: "Benefits", facts: "Key facts", route: "Itinerary", inc: "Included", exc: "Not included", opt: "Optional third-party services", prac: "Practical information", acc: "Accessibility", op: "Operating conditions", faq: "FAQ", wa: "WhatsApp message", dur: "Duration", grp: "Participants", age: "Minimum age", meet: "Meeting point" },
  es: { sub: "Subtítulo", short: "Descripción corta", about: "Descripción completa", ben: "Beneficios", facts: "Información", route: "Itinerario", inc: "Incluido", exc: "No incluido", opt: "Servicios opcionales de terceros", prac: "Información práctica", acc: "Accesibilidad", op: "Condiciones operativas", faq: "Preguntas frecuentes", wa: "Mensaje de WhatsApp", dur: "Duración", grp: "Participantes", age: "Edad mínima", meet: "Punto de encuentro" },
};
const pane = (l: L) => {
  const h = H[l];
  return `<div class="pane" id="pane-${l}" role="tabpanel" aria-labelledby="tab-${l}"${l === "pt" ? "" : " hidden"}>
  <h3 class="tname">${esc(ROCINHA_TITLE[l])}</h3>
  <p class="lede">${esc(ROCINHA_SUBTITLE[l])}</p>
  <dl class="facts"><div><dt>${h.dur}</dt><dd>${esc(c.durationLabel?.[l] ?? "")}</dd></div><div><dt>${h.grp}</dt><dd>${esc(ROCINHA_GROUP_SIZE[l])}</dd></div><div><dt>${h.age}</dt><dd>${esc(ROCINHA_MIN_AGE[l])}</dd></div><div><dt>${h.meet}</dt><dd>${esc(c.meetingPoint?.[l] ?? "")}</dd></div></dl>
  <h4>${h.short}</h4><p>${esc(c.summary?.[l] ?? "")}</p>
  <h4>${h.about}</h4>${(c.description?.[l] ?? "").split("\n\n").map((p) => `<p>${esc(p)}</p>`).join("")}
  <h4>${h.ben}</h4><ul>${ROCINHA_BENEFITS[l].map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
  <h4>${h.route}</h4><ol>${c.itinerary.map((s) => `<li><b>${esc(s.title[l] ?? "")}</b>${s.description?.[l] ? ` — ${esc(s.description[l]!)}` : ""}</li>`).join("")}</ol>
  <div class="two"><div><h4>${h.inc}</h4><ul>${(c.inclusions?.[l] ?? []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div><div><h4>${h.exc}</h4><ul>${(c.exclusions?.[l] ?? []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
  <h4>${h.opt}</h4><p>${esc(c.optionalServicesNote?.[l] ?? "")}</p>
  <h4>${h.prac}</h4><p>${esc(c.requirements?.[l] ?? "")}</p>
  <h4>${h.acc}</h4><p>${esc(c.accessibility?.[l] ?? "")}</p>
  <h4>${h.op}</h4><p>${esc(c.operationalConditions?.[l] ?? "")}</p>
  <h4>${h.faq}</h4>${(c.faq ?? []).map((f) => `<details><summary>${esc(f.question[l] ?? "")}</summary><p>${esc(f.answer[l] ?? "")}</p></details>`).join("")}
  <h4>${h.wa}</h4><pre>${esc(ROCINHA_WHATSAPP_MESSAGE[l])}</pre>
</div>`;
};
const brl = (cents: number) => `R$ ${(cents / 100).toFixed(0)}`;
const html = `<title>${noPrices ? "Rocinha revisão visual" : "Rocinha revisão interna"}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=Inter:wght@400;500;600&display=swap">
<style>
/* Layout: Owner review sheet in the Ricardo Tour dark identity: status band, commercial sheet, PT/EN/ES texts in tabs, captures, blockers. */
:root{--bg:#0b0e11;--raised:#15191d;--ink:#f4f0e8;--muted:#cac7bf;--subtle:#9da3a5;--rule:rgba(255,255,255,.1);--gold:#c8a86b;--gold-bright:#e8c780;--ok-bg:#132a18;--ok-ink:#a8e2b0;--wait-bg:#3a2f12;--wait-ink:#f3d58a;--pend-bg:#22262b;--pend-ink:#d7dadb;--stop-bg:#3a1414;--stop-ink:#f3b0b0;--display:"Cormorant Garamond",Georgia,serif;--body:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:dark}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;line-height:1.55;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:28px 56px}
main{max-width:1120px;margin:0 auto;display:grid;gap:32px}
h1,h2,.tname{font-family:var(--display);font-weight:600;line-height:1.1;margin:0;text-wrap:balance}
h1{font-size:clamp(30px,4.4vw,42px)}h2{font-size:27px}.tname{font-size:26px}
h4{margin:18px 0 6px;font-size:12.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
p{margin:0 0 8px;max-width:72ch}.lede{color:var(--muted)}
section{display:grid;gap:14px;min-width:0}
.eyebrow{font-size:12.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);font-weight:600}
.status{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.st{border-radius:12px;padding:14px 16px;display:grid;gap:4px}.st b{font-size:12.5px;letter-spacing:.12em}.st span{font-size:14px}
.ok{background:var(--ok-bg);color:var(--ok-ink)}.wait{background:var(--wait-bg);color:var(--wait-ink)}.pend{background:var(--pend-bg);color:var(--pend-ink)}.stop{background:var(--stop-bg);color:var(--stop-ink)}
.card{background:var(--raised);border:1px solid var(--rule);border-radius:14px;padding:18px 20px;min-width:0}
table{border-collapse:collapse;width:100%;font-size:14px;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--rule);vertical-align:top}th{color:var(--gold);font-size:12px;letter-spacing:.1em;text-transform:uppercase}td{color:var(--muted)}td:first-child{color:var(--ink);font-weight:500}
.wrap{overflow-x:auto}
.warn{border:1px solid #e0a63c;background:#2e2108;color:#f3cf86;border-radius:10px;padding:12px 14px}
.tabs{display:flex;gap:8px;flex-wrap:wrap}.tabs button{font:inherit;font-size:14px;border:1px solid rgba(200,168,107,.45);background:transparent;color:var(--gold-bright);border-radius:999px;padding:7px 14px;cursor:pointer}.tabs button[aria-selected="true"]{background:var(--gold);color:var(--bg)}
.tabs button:focus-visible,summary:focus-visible{outline:2px solid var(--gold-bright);outline-offset:2px}
ul,ol{margin:0;padding-left:20px;color:var(--muted);display:grid;gap:4px}
.facts{display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin:12px 0 0}.facts div{background:var(--bg);border:1px solid var(--rule);border-radius:10px;padding:10px 12px}.facts dt{font-size:12px;color:var(--subtle)}.facts dd{margin:2px 0 0;font-weight:600}
.two{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
details{border-top:1px solid var(--rule);padding:8px 0}summary{cursor:pointer;font-weight:600}details p{color:var(--muted);margin-top:6px}
pre{white-space:pre-wrap;font-family:ui-monospace,Consolas,monospace;font-size:13px;color:var(--gold-bright);background:var(--bg);border:1px solid var(--rule);border-radius:8px;padding:10px 12px;margin:0}
.shots{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}figure{margin:0;display:grid;gap:6px;min-width:0}figure img{width:100%;height:auto;border-radius:10px;border:1px solid var(--rule)}figcaption{font-size:13px;color:var(--subtle)}
footer{font-size:13px;color:var(--subtle)}
</style>
<main>
<header style="display:grid;gap:10px">
  <p class="eyebrow">Ricardo Tour · Sprint 10 · RT-112 / RT-115 · Favela Rocinha</p>
  <h1>${noPrices ? "Revisão visual da Rocinha" : "Revisão interna da Rocinha"}</h1>
  <p class="lede">${noPrices ? "Design aprovado, textos em português, inglês e espanhol, fotos e vídeo. Sem preços: aparecem como Valores em validação." : "Uso interno: inclui preços provisórios. Não compartilhar nem publicar."} Nada publicado; nenhum preço alterado no site.</p>
</header>
<section class="status" aria-label="Estado">
  <div class="st ok"><b>VISUAL APPROVED</b><span>Layout RT-114 v2, fotos e vídeo</span></div>
  <div class="st wait"><b>CONTENT REVIEW REQUIRED</b><span>Textos PT/EN/ES aguardando seu parecer</span></div>
  <div class="st pend"><b>OPERATIONAL VALIDATION PENDING</b><span>Checklist de segurança, custos e tributos, requisitos físicos, horários</span></div>
  <div class="st stop"><b>PRODUCTION NOT AUTHORIZED</b><span>Sem push, merge, deploy ou migration</span></div>
</section>
<section class="card" aria-labelledby="sheet-h">
  <h2 id="sheet-h">Ficha comercial</h2>
  <div class="wrap"><table><tbody>
    <tr><td>Modelo</td><td>Exclusivamente privativo · 1 a 4 pessoas · adultos 18+ · PT/EN/ES conforme disponibilidade do guia · reserva com confirmação humana</td></tr>
    <tr><td>Duração</td><td>Aproximadamente 3 horas</td></tr>
    <tr><td>Encontro</td><td>Região da estação de metrô São Conrado; local exato por WhatsApp; transporte do hotel não incluído</td></tr>
    <tr><td>Reserva e pagamento</td><td>Solicitação → verificação humana → proposta → sinal de 30% → confirmação → saldo de 70% antes do início · PIX, cartão de crédito, dinheiro · sem pagamento automático</td></tr>
    <tr><td>Cancelamento</td><td>Política escalonada aprovada como princípio; prazos e percentuais dependem do RT-81</td></tr>
  </tbody></table></div>
  ${noPrices
    ? `<div class="warn" role="note"><b>Preço: Valores em validação.</b> Os valores não fazem parte desta versão de revisão visual.</div>`
    : `<div class="warn" role="note"><b>VERSÃO INTERNA — PREÇOS PROVISÓRIOS — NÃO PUBLICAR.</b> Preço fechado por reserva: ${ROCINHA_PROVISIONAL_PRICING.map((r) => `${r.participants} ${r.participants === 1 ? "pessoa" : "pessoas"} ${brl(r.totalCents)}`).join(" · ")}. Dependem da validação de custos, tributos e operação. Custos internos estão só no Manual Mestre (seção confidencial).</div>`}
</section>
<section aria-labelledby="texts-h">
  <h2 id="texts-h">Textos para revisão</h2>
  <p class="lede">São os mesmos textos da página local, sem reescrita. Nomes em inglês e espanhol: proposta atual nas abas; sua preferência inicial (ainda não aplicada) é “Rocinha Favela — Private Cultural Tour” e “Tour Privado por la Favela de Rocinha”.</p>
  <div class="tabs" role="tablist" aria-label="Idioma"><button role="tab" id="tab-pt" aria-controls="pane-pt" aria-selected="true">Português</button><button role="tab" id="tab-en" aria-controls="pane-en" aria-selected="false" tabindex="-1">English</button><button role="tab" id="tab-es" aria-controls="pane-es" aria-selected="false" tabindex="-1">Español</button></div>
  <div class="card">${pane("pt")}${pane("en")}${pane("es")}</div>
</section>
<section aria-labelledby="shots-h">
  <h2 id="shots-h">Página local</h2>
  <div class="shots">
    <figure><img src="${img("desktop-top.jpg")}" alt="Topo da página no computador com título, capa e botão Solicitar disponibilidade" loading="lazy"><figcaption>${noPrices ? "Computador: abertura, preço como Valores em validação" : "Computador: abertura (tabela provisória só no modo revisão, abaixo dos botões)"}</figcaption></figure>
    <figure><img src="${img("full-1.jpg")}" alt="Seções Sobre a experiência, informações essenciais, benefícios e roteiro" loading="lazy"><figcaption>Sobre a experiência, informações essenciais, roteiro</figcaption></figure>
    <figure><img src="${img("full-2.jpg")}" alt="Seções incluído, não incluído, serviços opcionais, condições e perguntas frequentes" loading="lazy"><figcaption>Inclusões, serviços opcionais, condições, perguntas frequentes</figcaption></figure>
    <figure><img src="${img("mobile-top.jpg")}" alt="Topo da página no celular com a barra fixa" loading="lazy"><figcaption>Celular: abertura com barra fixa</figcaption></figure>
    <figure><img src="${img("mobile-video-poster.jpg")}" alt="Bloco do vídeo no celular" loading="lazy"><figcaption>Celular: vídeo (versão leve, toca só após clique)</figcaption></figure>
    <figure><img src="${img("desktop-gallery-3.jpg")}" alt="Galeria na foto do mural com a inscrição visível" loading="lazy"><figcaption>Galeria: foto 3 com a inscrição visível do mural</figcaption></figure>
  </div>
</section>
<section class="card" aria-labelledby="block-h">
  <h2 id="block-h">O que ainda impede a publicação</h2>
  <ul>
    <li>Sua aprovação destes textos e dos nomes em inglês e espanhol (gate de conteúdo, RT-120).</li>
    <li>Validação dos preços: custos completos, tributos, taxa de cartão e margem mínima.</li>
    <li>Termos e condições: cancelamento, clima, responsabilidades com prestadores locais (RT-81, RT-118).</li>
    <li>Checklist operacional: prestadores, mototáxi, capacetes, percurso, regra de suspensão, emergência, requisitos físicos, verificação jurídica.</li>
    <li>Comprovantes escritos das autorizações de imagem; identidade do artista do mural.</li>
    <li>Técnico: ligação da página pública, campos fora do banco (FAQ, condições, vídeo), carga controlada (RT-119), Lighthouse em Preview isolado, proteção da API de reservas (RT-110).</li>
  </ul>
</section>
<section class="card" aria-labelledby="ev-h">
  <h2 id="ev-h">Testes</h2>
  <p class="lede">796 testes aprovados (35 no arquivo da página, 6 novos do conteúdo), lint e typecheck limpos, build de produção OK. Navegação em computador PT/EN/ES e celular sem erros, botão visível sem rolar 4/4, acessibilidade 12/12. Vídeo: nenhum byte antes do play; no 4G lento a versão leve começa em 0,7 s sem travar. Nenhum custo interno aparece na página. Lighthouse fica para o Preview isolado.</p>
</section>
<footer>Manual Mestre v0.2 (Google Drive) · docs/product/rt-115-rocinha-owner-review-pack.md · commit local 4cdff5c · branch sprint10/tours-content</footer>
</main>
<script>
(function(){var tabs=[].slice.call(document.querySelectorAll('[role="tab"]'));function show(i){tabs.forEach(function(t,j){var on=i===j;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!on;});}
tabs.forEach(function(t,i){t.addEventListener('click',function(){show(i)});t.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();var n=(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;show(n);tabs[n].focus();}});});})();
</script>
`;
fs.writeFileSync(outFile, html);
console.log(`written ${outFile} (${(html.length / 1024).toFixed(0)} KB)`);
