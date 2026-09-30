import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/routing";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { normalizeTripImage } from "@/lib/image-utils";
import { getLocalizedField } from "@/lib/localized-field";
import { asLocalizedText } from "@/lib/types";
import { MapPin, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

// scripts/import-real-trips.mjs stores "summary\n\nDuracao: X.\n\nCategoria: Y.\n\n..." in
// `description`. `durationDays` is only a schema default (1), so duration is read from here.
function parseDescription(text: string) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const field = (label: string) =>
    blocks.find((b) => b.startsWith(`${label}:`))?.slice(label.length + 1).trim().replace(/\.$/, "") || null;
  const lead = blocks.find((b) => !/^(Duracao|Categoria|Inclusoes|Exclusoes):/.test(b));
  const summary = lead ? lead.split(/(?<=[.!?])\s+/)[0] : null;
  return { summary, duration: field("Duracao"), category: field("Categoria") };
}

function isCityOnly(location: string | null, city: string) {
  const norm = (s: string) => s.trim().toLowerCase();
  return !location || norm(location) === norm(city);
}

interface ExperiencesInRioSectionProps {
  locale: string;
}

const copy = {
  pt: {
    eyebrow: "EXPERIÊNCIAS NO RIO",
    heading: "O que você pode viver no Rio",
    intro: "Roteiros reais, guiados por especialistas locais, prontos para reservar.",
    viewAll: "Ver todos os passeios",
    viewDetails: "Ver detalhes",
    pricePerPerson: "Preço por pessoa",
    empty: "Nossos roteiros no Rio estão sendo atualizados. Volte em breve.",
  },
  en: {
    eyebrow: "EXPERIENCES IN RIO",
    heading: "What you can experience in Rio",
    intro: "Real, guided itineraries led by local specialists, ready to book.",
    viewAll: "See all tours",
    viewDetails: "View details",
    pricePerPerson: "Price per person",
    empty: "Our Rio itineraries are being updated. Check back soon.",
  },
  es: {
    eyebrow: "EXPERIENCIAS EN RÍO",
    heading: "Lo que puedes vivir en Río",
    intro: "Itinerarios reales, guiados por especialistas locales, listos para reservar.",
    viewAll: "Ver todos los tours",
    viewDetails: "Ver detalles",
    pricePerPerson: "Precio por persona",
    empty: "Nuestros itinerarios en Río se están actualizando. Vuelve pronto.",
  },
} as const;

function resolveCopy(locale: string) {
  return copy[locale as keyof typeof copy] ?? copy.pt;
}

export async function ExperiencesInRioSection({ locale }: ExperiencesInRioSectionProps) {
  const t = resolveCopy(locale);

  // Same query shape as components/trip-list.tsx. The exact canonical city value is
  // deliberate: lowercase "rio de janeiro" records are admin drafts with mismatched copy.
  const trips = await prisma.trip.findMany({
    where: { isPublished: true, city: "Rio de Janeiro" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <section
      id="experiences"
      aria-labelledby="experiences-in-rio-heading"
      className="relative bg-[#0B0E11] px-5 py-20 text-[#F4F0E8] md:px-10 md:py-28 lg:px-12"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#C8A86B] md:text-[13px]">
            {t.eyebrow}
          </p>
          <h2
            id="experiences-in-rio-heading"
            className="mt-4 text-[32px] leading-[1.02] font-medium md:text-[44px]"
            style={{ fontFamily: "var(--journey-display), serif" }}
          >
            {t.heading}
          </h2>
          <p className="mt-5 max-w-lg text-[13px] leading-[1.6] text-[#CAC7BF]">{t.intro}</p>
        </div>

        {trips.length === 0 ? (
          <p className="mt-14 text-sm text-[#9DA3A5]">{t.empty}</p>
        ) : (
          <ul
            className={`mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-4 md:overflow-visible [&::-webkit-scrollbar]:hidden ${
              trips.length % 4 === 0 && trips.length % 3 !== 0 ? "xl:grid-cols-4" : "lg:grid-cols-3"
            }`}
          >
            {trips.map((trip) => {
              const title = getLocalizedField<string>(asLocalizedText(trip.title), locale);
              const { summary, duration, category } = parseDescription(
                getLocalizedField<string>(asLocalizedText(trip.description), locale) ?? "",
              );
              const price = (trip.priceCents / 100).toFixed(2).replace(".", ",");

              return (
                <li key={trip.id} className="w-[82%] shrink-0 snap-start md:w-auto md:shrink">
                  <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[#15191D]">
                    <div className="relative aspect-[5/4] w-full shrink-0 overflow-hidden bg-[#0B0E11]">
                      <OptimizedImage
                        src={normalizeTripImage(trip.imageUrl)}
                        alt={title}
                        fill
                        sizes="(max-width: 767px) 82vw, (max-width: 1023px) 46vw, 30vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0"
                      />
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div>
                        {category ? (
                          <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-[#C8A86B]">{category}</p>
                        ) : null}
                        <h3 className="text-[20px] font-semibold leading-[1.1] text-[#F4F0E8]">{title}</h3>
                        {!isCityOnly(trip.location, trip.city) ? (
                          <div className="mt-2 flex items-center gap-1 text-[13px] text-[#9DA3A5]">
                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>{trip.location}</span>
                          </div>
                        ) : null}
                      </div>

                      {summary ? (
                        <p className="line-clamp-2 text-[13px] leading-[1.45] text-[#CAC7BF]">{summary}</p>
                      ) : null}

                      <div className="mt-auto flex flex-col gap-4 pt-1">
                        {duration ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-[#CAC7BF]">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {duration}
                            </span>
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                          <div>
                            <p className="text-[11px] text-[#9DA3A5]">{t.pricePerPerson}</p>
                            <p className="mt-0.5 text-lg font-semibold text-[#F4F0E8]">R$ {price}</p>
                          </div>
                          <Link
                            href={`/tours/${trip.id}`}
                            aria-label={`${t.viewDetails} — ${title}`}
                            className="shrink-0 rounded-lg border border-[#C8A86B]/40 px-4 py-2 text-[13px] font-medium text-[#E8C780] transition-colors hover:border-[#C8A86B] hover:bg-[#C8A86B]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8C780]"
                          >
                            {t.viewDetails}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-12">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-[14px] font-medium text-[#E8C780] underline underline-offset-4 hover:text-[#C8A86B]"
          >
            {t.viewAll}
          </Link>
        </div>
      </div>
    </section>
  );
}
