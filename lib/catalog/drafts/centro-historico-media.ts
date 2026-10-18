import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";

/** RT-116: Owner-selected media for the local, production-hidden preview only. */
export const CENTRO_ID = "cmlibniq40000z4zqkbujnutt";
export const CENTRO_TITLE: LocalizedText = {
  pt: "Centro Histórico e Cultural do Rio",
  en: "Historic and Cultural Centre of Rio",
  es: "Centro Histórico y Cultural de Río",
};

const DIR = "/media/tours/centro-historico-cultural";
const RIGHTS = "Owner selection, 17/10/2026; Drive: RICARDO TOUR / MIDIAS / 03_CENTRO_HISTORICO_CULTURAL_RIO / SELECIONADAS_OWNER. Editorially approved for local preview. Commercial use and image rights remain under review in REGISTRO_LICENCAS_E_DIREITOS.";

const images: TourContentRecord["images"] = [
  {
    position: 0, src: `${DIR}/centro-historico-img-1337.webp`, isCover: true, rightsStatus: "UNVERIFIED", rightsNote: RIGHTS,
    alt: { pt: "Fachada do Real Gabinete Português de Leitura, com o nome da instituição acima da entrada", en: "Facade of the Royal Portuguese Reading Room, with its name above the entrance", es: "Fachada del Real Gabinete Portugués de Lectura, con su nombre sobre la entrada" },
  },
  {
    position: 1, src: `${DIR}/centro-historico-img-1802.webp`, isCover: false, rightsStatus: "UNVERIFIED", rightsNote: RIGHTS,
    alt: { pt: "Fachada da Igreja da Candelária no centro do Rio", en: "Facade of Candelária Church in central Rio", es: "Fachada de la iglesia de la Candelaria en el centro de Río" },
  },
  {
    position: 2, src: `${DIR}/centro-historico-img-1328.webp`, isCover: false, rightsStatus: "UNVERIFIED", rightsNote: RIGHTS,
    alt: { pt: "Fachada de uma igreja histórica no centro do Rio", en: "Facade of a historic church in central Rio", es: "Fachada de una iglesia histórica en el centro de Río" },
  },
  {
    position: 3, src: `${DIR}/centro-historico-img-1321.webp`, isCover: false, rightsStatus: "UNVERIFIED", rightsNote: RIGHTS,
    alt: { pt: "Fachada do Palácio Tiradentes", en: "Facade of Tiradentes Palace", es: "Fachada del Palacio Tiradentes" },
  },
  {
    position: 4, src: `${DIR}/centro-historico-img-1332.webp`, isCover: false, rightsStatus: "UNVERIFIED", rightsNote: RIGHTS,
    alt: { pt: "Comércio de rua na região do SAARA, no centro do Rio", en: "Street shops in the SAARA district of central Rio", es: "Comercios en las calles de la zona del SAARA, en el centro de Río" },
  },
  {
    position: 5, src: `${DIR}/centro-historico-img-1136.webp`, isCover: false, rightsStatus: "UNVERIFIED", rightsNote: RIGHTS,
    alt: { pt: "Interior de uma igreja histórica, com bancos e altar", en: "Interior of a historic church, with pews and an altar", es: "Interior de una iglesia histórica, con bancos y altar" },
  },
  {
    position: 6, src: `${DIR}/centro-historico-museu-do-amanha.webp`, isCover: false, rightsStatus: "UNVERIFIED", rightsNote: `${RIGHTS} Museum photo: original Pexels page, photographer and licence still unverified.`,
    alt: { pt: "Edifício do Museu do Amanhã junto à área portuária do Rio", en: "Museum of Tomorrow building by Rio's port area", es: "Edificio del Museo del Mañana junto a la zona portuaria de Río" },
  },
];

/** No route, price, duration, pickup, inclusion or operator is asserted here. */
export const CENTRO_MEDIA_PREVIEW: TourContentRecord = {
  tripId: CENTRO_ID,
  status: "DRAFT",
  source: "Owner media selection and commercial name, 17/10/2026; operational and sales facts pending RT-112/RT-115.",
  languages: [],
  itinerary: [],
  images,
};
