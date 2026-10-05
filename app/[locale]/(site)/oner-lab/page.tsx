import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnerWidget } from "@/components/site/oner/oner-widget";

// Oner production widget validation route (integration lab). Hidden on purpose: noindex, not in the sitemap, not
// linked from the Home/header/footer. PT only: the provider confirmed only language="pt-br"; EN/ES are unknown.
// The widget renders only on the Oner-authorized domain (https://www.ricardotour.com); locally it is expected to be absent.
// Independent of RT-38 (/voos) and its mock data.
export const metadata: Metadata = {
  title: "Oner widget validation | Ricardo Tour",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default async function OnerLabPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "pt") notFound();

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-[12px] uppercase tracking-wide opacity-60">Validação interna de integração (Oner) — não indexada</p>
      <h1 className="mt-2 text-[28px] font-medium">Busca de voos e hotéis</h1>
      <div className="mt-6">
        <OnerWidget />
      </div>
    </section>
  );
}
