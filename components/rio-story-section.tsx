import Image from "next/image";
import { RioStoryVideo } from "@/components/rio-story-video";

// Canonical approved Home copy (RT-12/13 "rio" keys); media are the Owner-approved Rio Story assets.
const copy = {
  pt: {
    heading: "Rio de Janeiro, em foco.",
    intro: "Histórias, cenários e experiências que revelam diferentes formas de viver o Rio.",
    mediaLabel: "Vídeo editorial e duas fotografias do Rio.",
    video: { kicker: "Vídeo editorial", title: "Cenas do Rio", alt: "Praia no Rio de Janeiro, com o Morro Dois Irmãos ao fundo." },
    videoLabels: { play: "Reproduzir vídeo: Cenas do Rio", pause: "Pausar vídeo: Cenas do Rio", replay: "Reproduzir novamente: Cenas do Rio" },
    photos: [
      { kicker: "Atmosfera", title: "Luz de fim de tarde", alt: "Pôr do sol sobre o mar, emoldurado por palmeiras." },
      { kicker: "Cultura", title: "Arquitetura e patrimônio", alt: "Interior de uma igreja, com detalhes arquitetônicos e ornamentação dourada." },
    ],
  },
  en: {
    heading: "Rio de Janeiro, in focus.",
    intro: "Stories, settings, and experiences that reveal different ways to experience Rio.",
    mediaLabel: "Editorial video and two photographs of Rio.",
    video: { kicker: "Editorial video", title: "Scenes of Rio", alt: "A beach in Rio de Janeiro, with the Dois Irmãos peaks in the background." },
    videoLabels: { play: "Play video: Scenes of Rio", pause: "Pause video: Scenes of Rio", replay: "Replay video: Scenes of Rio" },
    photos: [
      { kicker: "Atmosphere", title: "Late-afternoon light", alt: "Sunset over the sea, framed by palm trees." },
      { kicker: "Culture", title: "Architecture and heritage", alt: "Interior of a church, with architectural details and gilded ornamentation." },
    ],
  },
  es: {
    heading: "Río de Janeiro, en foco.",
    intro: "Historias, escenarios y experiencias que revelan distintas formas de vivir Río.",
    mediaLabel: "Vídeo editorial y dos fotografías de Río.",
    video: { kicker: "Vídeo editorial", title: "Imágenes de Río", alt: "Playa en Río de Janeiro, con el Morro Dois Irmãos al fondo." },
    videoLabels: { play: "Reproducir vídeo: Imágenes de Río", pause: "Pausar vídeo: Imágenes de Río", replay: "Volver a reproducir: Imágenes de Río" },
    photos: [
      { kicker: "Atmósfera", title: "Luz del atardecer", alt: "Atardecer sobre el mar, enmarcado por palmeras." },
      { kicker: "Cultura", title: "Arquitectura y patrimonio", alt: "Interior de una iglesia, con detalles arquitectónicos y ornamentación dorada." },
    ],
  },
} as const;

const MEDIA = "/media/rio-story";
const photoMedia = [
  { src: `${MEDIA}/rio-story-sunset.jpg`, position: "50% 38%" },
  { src: `${MEDIA}/rio-story-church.jpg`, position: "50% 45%" },
];

function Caption({ kicker, title, reserveButton = false }: { kicker: string; title: string; reserveButton?: boolean }) {
  return (
    <figcaption
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 from-35% via-black/45 via-70% to-transparent px-5 pb-5 pt-16 ${
        reserveButton ? "pr-20" : ""
      }`}
    >
      <span className="block text-[12px] font-medium uppercase tracking-[0.16em] text-[#E8C780]">{kicker}</span>
      <span
        className="mt-1 block text-[20px] leading-[1.15] text-[#F4F0E8] md:text-[24px]"
        style={{ fontFamily: "var(--journey-display), serif" }}
      >
        {title}
      </span>
    </figcaption>
  );
}

export function RioStorySection({ locale }: { locale: string }) {
  const t = copy[locale as keyof typeof copy] ?? copy.pt;

  return (
    <section aria-labelledby="rio-story-heading" className="bg-[#F3EFE6] px-5 text-[#171A1E] md:px-10 lg:px-12">
      <div className="mx-auto max-w-[1280px] border-t border-[#CFC7BA] py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#53565A] md:text-[13px]">Rio Story</p>
          <h2
            id="rio-story-heading"
            className="mt-4 text-balance text-[32px] font-medium leading-[1.05] md:text-[44px]"
            style={{ fontFamily: "var(--journey-display), serif" }}
          >
            {t.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.6] text-[#53565A]">{t.intro}</p>
        </div>

        <div
          role="group"
          aria-label={t.mediaLabel}
          className="mt-10 grid grid-cols-2 gap-3 md:mt-12 md:h-[clamp(360px,34vw,480px)] md:grid-cols-[1.5fr_1fr_1fr] md:gap-4"
        >
          <figure className="relative col-span-2 aspect-[4/5] overflow-hidden rounded-2xl bg-[#171A1E] md:col-span-1 md:aspect-auto md:h-full">
            <RioStoryVideo
              desktopSrc={`${MEDIA}/rio-story-desktop.mp4`}
              mobileSrc={`${MEDIA}/rio-story-mobile.mp4`}
              poster={`${MEDIA}/rio-story-poster.jpg`}
              posterAlt={t.video.alt}
              posterPosition="50% 52%"
              sizes="(max-width: 767px) 92vw, 44vw"
              labels={t.videoLabels}
            />
            <Caption kicker={t.video.kicker} title={t.video.title} reserveButton />
          </figure>

          {t.photos.map((photo, i) => (
            <figure key={photo.title} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#171A1E] md:aspect-auto md:h-full">
              <Image
                src={photoMedia[i].src}
                alt={photo.alt}
                fill
                sizes="(max-width: 767px) 46vw, 28vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                style={{ objectPosition: photoMedia[i].position }}
              />
              <Caption kicker={photo.kicker} title={photo.title} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
