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

const trustItems = [
  {
    icon: ShieldCheck,
    title: "Atendimento com operacao credenciada",
    description:
      "Receba orientacao para passeios e roteiros com equipe local e suporte humano.",
  },
  {
    icon: Clock3,
    title: "Resposta mais rapida e organizada",
    description:
      "Use o formulario para pedir orcamento, validar disponibilidade e alinhar detalhes.",
  },
  {
    icon: MessageCircleMore,
    title: "Contato para roteiro personalizado",
    description:
      "Ideal para familias, grupos privados e viajantes que querem ajustar o passeio ao perfil da viagem.",
  },
];

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

            <div className="grid gap-4 md:grid-cols-3">
              {trustItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-[24px] border border-white/8 bg-[#0d2436] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.18)]"
                  >
                    <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[#d8c18f]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">
                      {item.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/62">{item.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-[28px] border border-white/8 bg-[#0d2436] p-6 md:p-8">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                Como o atendimento funciona
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-[#091d2c] px-4 py-4 text-sm leading-7 text-white/70">
                  Fale pelo WhatsApp para tirar duvidas rapidas sobre agenda, roteiro e formato do passeio.
                </div>
                <div className="rounded-[22px] border border-white/8 bg-[#091d2c] px-4 py-4 text-sm leading-7 text-white/70">
                  Use o formulario para enviar nome, e-mail e telefone de retorno com mais contexto da viagem.
                </div>
                <div className="rounded-[22px] border border-white/8 bg-[#091d2c] px-4 py-4 text-sm leading-7 text-white/70">
                  A reserva feita no site funciona como pre-reserva: a equipe confirma disponibilidade e proximos passos manualmente.
                </div>
                <div className="rounded-[22px] border border-white/8 bg-[#091d2c] px-4 py-4 text-sm leading-7 text-white/70">
                  Nenhum pagamento online e iniciado nesta versao; valores e forma de pagamento sao alinhados pela equipe.
                </div>
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
