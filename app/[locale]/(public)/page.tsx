import type { Metadata } from "next";
import HeroSection from "@/components/hero-section";
import { ReservationsSection } from "@/components/reservations-section";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { getLanguageAlternates } from "@/i18n/routing";
import dynamic from "next/dynamic";

const TravelerSupport = dynamic(() => import("@/components/testimonials"), {
    loading: () => <div className="section-spacing h-96 animate-pulse" />,
});

const FooterSection = dynamic(() => import("@/components/footer"));

function getHomeMetadataCopy(locale: string) {
    switch (locale) {
        case "en":
            return {
                title: "Rick Travel | Rio de Janeiro Experiences",
                description: "Rick Travel offers guided tours, local tourism experiences, personalized travel orientation, and traveler support in Rio de Janeiro, Brazil.",
            };
        case "es":
            return {
                title: "Rick Travel | Experiencias en Rio de Janeiro",
                description: "Rick Travel ofrece tours guiados, experiencias de turismo local, orientacion personalizada y soporte para viajeros en Rio de Janeiro, Brasil.",
            };
        case "sv":
            return {
                title: "Rick Travel | Upplevelser i Rio de Janeiro",
                description: "Rick Travel erbjuder guidade turer, lokala turismupplevelser, personlig reseorientering och resenarstod i Rio de Janeiro, Brasilien.",
            };
        default:
            return {
                title: "Rick Travel | Passeios exclusivos no Rio de Janeiro",
                description: "A Rick Travel oferece passeios guiados, experiencias de turismo local, orientacao personalizada e suporte ao viajante no Rio de Janeiro, Brasil.",
            };
    }
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const copy = getHomeMetadataCopy(locale);
    const path = `/${locale}`;

    return {
        title: copy.title,
        description: copy.description,
        alternates: {
            canonical: path,
            languages: getLanguageAlternates(),
        },
        openGraph: {
            title: copy.title,
            description: copy.description,
            url: path,
        },
        twitter: {
            title: copy.title,
            description: copy.description,
        },
    };
}

export default function Home() {
    return (
        <>
            <HeroSection />

            <div
                className="relative overflow-hidden bg-[#071826] text-white"
                style={{
                    backgroundImage:
                        "radial-gradient(1200px 560px at 50% 0%, rgba(255,255,255,0.07), transparent 58%), linear-gradient(180deg, #081b2a 0%, #071826 32%, #0a1f30 100%)",
                }}
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(200,168,107,0.08),transparent)]" />
                <div className="pointer-events-none absolute inset-x-0 top-[30rem] h-px bg-white/8" />

                <ReservationsSection />

                <FadeInSection delay={0.2}>
                    <TravelerSupport />
                </FadeInSection>

                <FooterSection />
            </div>
        </>
    );
}
