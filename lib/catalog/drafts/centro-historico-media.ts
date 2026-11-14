import type { LocalizedText, TourContentRecord } from "@/lib/catalog/tour-content";

/** RT-116: Owner-selected media for the local, production-hidden preview only. */
export const CENTRO_ID = "cmlibniq40000z4zqkbujnutt";
export const CENTRO_TITLE: LocalizedText = {
  pt: "Centro Histórico e Cultural do Rio",
  en: "Historic and Cultural Centre of Rio",
  es: "Centro Histórico y Cultural de Río",
};

const DIR = "/media/tours/centro-historico-cultural";
const SOURCE = "Owner selection, 17/10/2026; Drive: RICARDO TOUR / MIDIAS / 03_CENTRO_HISTORICO_CULTURAL_RIO / SELECIONADAS_OWNER.";
/** Own photos: authorised for commercial use by the Owner's declaration of 28/10/2026 (RT-116). */
const RIGHTS = `Owner, 28/10/2026: own photo of Ricardo Tour, authorised for commercial use (declaration recorded in RT-116). ${SOURCE}`;

// Owner, 28/10/2026 (RT-116): material without proven rights is out of the public selection. The Museu do Amanhã
// photo (Pexels; photographer and licence never verified) was removed from the gallery and from the repository.
// Owner, 14/11/2026: the Real Gabinete photo (img-1337, former position 0 and gallery cover) leaves the gallery, with no
// replacement. The remaining photos keep their positions (1–5) so a content load touches only the removed rows; the
// Candelária photo becomes the gallery cover. The Home/listing card cover (OWN_TOUR_COVERS) is a separate decision.
const images: TourContentRecord["images"] = [
  {
    position: 1, src: `${DIR}/centro-historico-img-1802.webp`, isCover: true, rightsStatus: "OWNER_ATTESTED", rightsNote: RIGHTS,
    alt: { pt: "Fachada da Igreja da Candelária no centro do Rio", en: "Facade of Candelária Church in central Rio", es: "Fachada de la iglesia de la Candelaria en el centro de Río" },
  },
  {
    position: 2, src: `${DIR}/centro-historico-img-1328.webp`, isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: RIGHTS,
    alt: { pt: "Fachada de uma igreja histórica no centro do Rio", en: "Facade of a historic church in central Rio", es: "Fachada de una iglesia histórica en el centro de Río" },
  },
  {
    position: 3, src: `${DIR}/centro-historico-img-1321.webp`, isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: RIGHTS,
    alt: { pt: "Fachada do Palácio Tiradentes", en: "Facade of Tiradentes Palace", es: "Fachada del Palacio Tiradentes" },
  },
  {
    position: 4, src: `${DIR}/centro-historico-img-1332.webp`, isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: RIGHTS,
    alt: { pt: "Comércio de rua na região do SAARA, no centro do Rio", en: "Street shops in the SAARA district of central Rio", es: "Comercios en las calles de la zona del SAARA, en el centro de Río" },
  },
  {
    position: 5, src: `${DIR}/centro-historico-img-1136.webp`, isCover: false, rightsStatus: "OWNER_ATTESTED", rightsNote: RIGHTS,
    alt: { pt: "Interior de uma igreja histórica, com bancos e altar", en: "Interior of a historic church, with pews and an altar", es: "Interior de una iglesia histórica, con bancos y altar" },
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
