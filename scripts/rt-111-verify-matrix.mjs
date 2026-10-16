#!/usr/bin/env node
/**
 * RT-111 (RT-RB-S10-01): read-only verification of the content gap matrix
 * (docs/product/rt-s10-01-content-gap-matrix.md) against production.
 * Only GET requests to public pages and the public /api/trips endpoint. No writes, no database access.
 * Usage: node scripts/rt-111-verify-matrix.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "https://www.ricardotour.com";

const TOURS = [
  {
    id: "cmlhxkpy9000028zq27rhytew",
    title: "Cristo Redentor + Pão de Açúcar",
    price: "385.00",
    image: "imagem-pao-de-acucar.jpg",
    expect: ["5–6 horas", "Passeio Clássico", "Cristo Redentor", "Bondinho do Pão de Açúcar", "Vista da Baía de Guanabara",
      "Transporte em van", "Guia turístico", "Ingresso Cristo Redentor", "Ingresso Pão de Açúcar", "Alimentação"],
    descriptionPt: "Visite os dois pontos turísticos mais famosos do Rio",
  },
  {
    id: "cmli1a6im000034zqqzc9sppb",
    title: "Tour Favela Rocinha com Guia Local",
    price: "120.00",
    image: "imagem-tour-favela-rocinha.jpg",
    expect: ["3–4 horas", "Experiência Cultural", "Vista panorâmica da Rocinha", "Interação com comunidade local", "Cultura e história",
      "Guia local", "Transporte", "Passeio guiado", "maior favela do Brasil"],
    descriptionPt: "Conheça a cultura local da maior favela do Brasil",
  },
  {
    id: "cmlibniq40000z4zqkbujnutt",
    title: "Confeitaria Colombo + City Tour Rio",
    price: "245.00",
    image: "confeitaria-colombo-city-tour.jpeg",
    expect: ["5 horas", "City Tour", "Cristo Redentor", "Vista panorâmica da cidade", "Centro histórico", "Guia bilíngue",
      "Transporte ida e volta", "Paradas para fotos", "Ingresso opcional trem ou van", "principal cartão-postal do Brasil", "colombo r "],
    descriptionPt: "Explore o principal cartão-postal do Brasil",
  },
  {
    id: "cmljo0s1u0000t0zqa0bpd23p",
    title: "Tour Privado Premium Rio de Janeiro",
    price: "900.00",
    image: "imagem-igreja-centro-rio.jpg",
    expect: ["8 horas", "Premium", "Roteiro personalizado", "Santa Teresa", "Escadaria Selarón", "Guia privado",
      "Transporte executivo", "Flexibilidade total de roteiro", "Ingressos"],
    descriptionPt: "Experiência exclusiva e personalizada pelos principais pontos do Rio",
  },
];

const decode = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"');

let failures = 0;
const check = (ok, label) => {
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
};

const api = await (await fetch(`${BASE}/api/trips`)).json();
const apiTrips = Array.isArray(api) ? api : api.trips ?? [];
check(apiTrips.length === 4, `/api/trips returns exactly 4 tours (got ${apiTrips.length})`);

for (const t of TOURS) {
  const pages = {};
  for (const locale of ["pt", "en", "es"]) {
    const res = await fetch(`${BASE}/${locale}/tours/${t.id}`);
    pages[locale] = { status: res.status, html: await res.text() };
  }
  const pt = pages.pt.html;
  const visible = decode(pt);
  check(pages.pt.status === 200, `${t.id} pt page 200`);
  check(visible.includes(t.title), `${t.id} title "${t.title}"`);
  check(pt.includes(`"price":"${t.price}"`) && pt.includes('"priceCurrency":"BRL"'), `${t.id} JSON-LD price ${t.price} BRL`);
  check(pt.includes(t.image), `${t.id} image ${t.image}`);
  for (const s of t.expect) check(visible.includes(s), `${t.id} contains "${s}"`);
  for (const locale of ["en", "es"]) {
    check(decode(pages[locale].html).includes(t.descriptionPt), `${t.id} ${locale} page shows the PORTUGUESE description`);
  }
  const fromApi = apiTrips.find((x) => x.id === t.id);
  check(Boolean(fromApi) && ["en", "es", "sv"].every((l) => fromApi.description?.[l] === fromApi.description?.pt),
    `${t.id} /api/trips description identical in pt/en/es/sv`);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
