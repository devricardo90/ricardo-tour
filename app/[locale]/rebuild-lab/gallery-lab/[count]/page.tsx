import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/components/site/media/image-gallery";
import { resolveTourContentCopy } from "@/components/site/tour/content/tour-content-copy";
import { siteBody, siteDisplay } from "@/app/[locale]/(site)/fonts";
import "@/app/[locale]/(site)/site-theme.css";

export const metadata: Metadata = { title: "RT-116 · Gallery quantity lab — Ricardo Tour", robots: { index: false, follow: false } };

/** Only photos whose rights are already recorded: the four tour photos (Owner attestation, RT-79) and the Rio Story
 *  photos (RT-32 "OWNER ORIGINAL"). Seven distinct files exist; the 8-image scenario repeats one, and says so. */
const RIGHTS_RECORDED = [
  { src: "/images/trips/imagem-pao-de-acucar.jpg", alt: "Mirante do Pão de Açúcar (retrato)", objectPosition: "35% 55%" },
  { src: "/images/trips/imagem-tour-favela-rocinha.jpg", alt: "Rocinha (retrato)", objectPosition: "50% 40%" },
  { src: "/images/trips/confeitaria-colombo-city-tour.jpeg", alt: "Mesa com vista (retrato)", objectPosition: "50% 50%" },
  { src: "/images/trips/imagem-igreja-centro-rio.jpg", alt: "Igreja da Candelária (retrato)", objectPosition: "50% 35%" },
  { src: "/media/rio-story/rio-story-sunset.jpg", alt: "Pôr do sol na praia (paisagem)", objectPosition: "50% 50%" },
  { src: "/media/rio-story/rio-story-church.jpg", alt: "Interior de igreja (paisagem)", objectPosition: "50% 50%" },
  { src: "/media/rio-story/rio-story-poster.jpg", alt: "Guarda-sol na praia (paisagem)", objectPosition: "50% 50%" },
];

export default async function GalleryLabPage({ params }: { params: Promise<{ locale: string; count: string }> }) {
  const { locale, count } = await params;
  const n = Number(count);
  if (![1, 3, 5, 8].includes(n)) notFound();
  const t = resolveTourContentCopy(locale);
  const images = Array.from({ length: n }, (_, i) => {
    const img = RIGHTS_RECORDED[i % RIGHTS_RECORDED.length];
    return i >= RIGHTS_RECORDED.length ? { ...img, alt: `${img.alt} — repetida apenas para testar quantidade` } : img;
  });
  return (
    <div className={`site-theme ${siteDisplay.variable} ${siteBody.variable}`}>
      <div className="min-h-screen bg-[var(--site-charcoal,#0B0E11)] px-5 py-8 text-[var(--site-on-dark,#F4F0E8)] md:px-10" data-testid="gallery-lab">
        <div className="mx-auto max-w-[900px]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--site-gold,#C8A86B)]">RT-116 · cenário com {n} imagem(ns)</p>
          <p className="mt-2 text-[14px] text-[var(--site-on-dark-muted,#CAC7BF)]">
            Somente fotos com direitos já registrados (4 fotos dos passeios + 3 do Rio Story). {n === 8 ? "A 8ª imagem é repetida, apenas para testar a quantidade." : null}
          </p>
          <div className="mt-6">
            <ImageGallery images={images} labels={{ gallery: t.gallery, prev: t.galleryPrev, next: t.galleryNext, thumb: t.galleryThumb, position: t.galleryPosition }} priority />
          </div>
        </div>
      </div>
    </div>
  );
}
