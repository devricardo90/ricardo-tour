import type { Metadata } from "next";
import Link from "next/link";
import { PUBLISHED_SNAPSHOT, PROTOTYPE_OFFER } from "@/lib/catalog/mock/tour-content.mock";

export const metadata: Metadata = { title: "RT-114 · Tour page prototypes — Ricardo Tour", robots: { index: false, follow: false } };

/** Index of the RT-114 prototypes (rebuild lab only). */
export default async function TourContentPreviewIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">RT-114 — protótipos da página de passeio (dados MOCK)</h1>
      <p className="mt-2 text-sm text-muted-foreground">Somente os 4 passeios existentes. Fatos publicados = cópia verificada de 16/10/2026; demais campos são fictícios.</p>
      <ul className="mt-6 space-y-2">
        {Object.values(PUBLISHED_SNAPSHOT).map((tour) => (
          <li key={tour.id} className="flex flex-wrap gap-3">
            <span className="font-medium">{PROTOTYPE_OFFER[tour.id]?.title ?? tour.title}</span>
            {(["pt", "en", "es"] as const).map((l) => (
              <Link key={l} className="underline" href={`/${l}/rebuild-lab/tour-content-preview/${tour.id}`}>{l.toUpperCase()}</Link>
            ))}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">Idioma atual: {locale}</p>
    </div>
  );
}
