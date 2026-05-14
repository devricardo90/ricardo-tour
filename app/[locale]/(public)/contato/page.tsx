import type { Metadata } from "next";
import { ShieldCheck, Clock3, MessageCircleMore, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { PUBLIC_SITE_URL } from "@/lib/public-site-url";
import { buildWhatsAppQuoteUrl } from "@/lib/whatsapp";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = `/${locale}/contato`;

  return {
    title: "Contato e Orcamento | Rick Travel",
    description:
      "Solicite orcamento para passeios no Rio de Janeiro com guias credenciados Cadastur. Entre em contato conosco.",
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: "Contato e Orcamento | Rick Travel",
      description:
        "Solicite orcamento para passeios no Rio de Janeiro com guias credenciados Cadastur.",
      url: `${PUBLIC_SITE_URL}${path}`,
      siteName: "Rick Travel",
      locale: "pt_BR",
      type: "website",
    },
  };
}

export default function ContatoPage() {
  const whatsappUrl = buildWhatsAppQuoteUrl({ locale: "pt", source: "home" });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071826] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(1200px 560px at 50% -10%, rgba(255,255,255,0.09), transparent 58%), linear-gradient(180deg, rgba(200,168,107,0.06) 0%, transparent 18%)",
        }}
      />

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-20 pt-28 lg:px-12 lg:pt-32">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_440px] lg:items-start">
          <section className="space-y-8">
            <div className="surface-dark-solid p-6 md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d8c18f]">
                <MessageCircleMore className="h-3.5 w-3.5" />
                Orcamento e atendimento
              </div>

              <h1 className="mt-6 max-w-[12ch] text-balance text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
                Fale com a Rick Travel sobre sua viagem no Rio
              </h1>

              <p className="mt-5 max-w-3xl text-[15px] leading-8 text-white/68 md:text-lg">
                Solicite orcamento, tire duvidas sobre roteiros e receba apoio para
                montar uma experiencia mais segura, organizada e personalizada com
                equipe local credenciada.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chip-dark transition-colors hover:text-white"
                >
                  <MessageCircleMore className="h-3.5 w-3.5" />
                  WhatsApp oficial
                </a>
                <span className="chip-dark">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Guias credenciados
                </span>
                <span className="chip-dark">
                  <Clock3 className="h-3.5 w-3.5" />
                  Orcamento e agenda sem pagamento online
                </span>
                <span className="chip-dark">
                  <MapPin className="h-3.5 w-3.5" />
                  Rio de Janeiro com operacao local
                </span>
              </div>
            </div>

          </section>

          <aside className="lg:sticky lg:top-24">
            <ContactForm />
          </aside>
        </div>
      </main>
    </div>
  );
}
