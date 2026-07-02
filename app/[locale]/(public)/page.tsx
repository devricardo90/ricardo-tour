import type { Metadata } from "next";
import HeroSection from "@/components/hero-section";
import { ReservationsSection } from "@/components/reservations-section";
import { FadeInSection } from "@/components/ui/fade-in-section";
import { getLanguageAlternates } from "@/i18n/routing";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";

const TravelerSupport = dynamic(() => import("@/components/testimonials"), {
    loading: () => <div className="section-spacing h-96 animate-pulse" />,
});

const FooterSection = dynamic(() => import("@/components/footer"));

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "HomePage.Metadata" });
    const copy = {
        title: t("title"),
        description: t("description"),
    };
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
