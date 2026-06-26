'use client'

import { OptimizedImage } from "@/components/ui/optimized-image";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeTripImage } from "@/lib/image-utils";
import { useLocale, useTranslations } from "next-intl";
import { ptBR, enUS, es, sv, type Locale } from "date-fns/locale";
import { TourMediaBadges } from "@/components/trips/tour-media-badges";
import { motion } from "motion/react";
import { Link } from "@/i18n/routing";
import { getLocalizedField } from "@/lib/localized-field";
import { TripCardData } from "@/lib/types";

interface TripCardProps {
    trip: TripCardData;
}

function PhysicalLevelBadge({ level }: { level: string }) {
    const labels: Record<string, { label: string; className: string; icon: string }> = {
        LIGHT: { label: "Leve", className: "level-light", icon: "L" },
        MODERATE: { label: "Moderado", className: "level-moderate", icon: "M" },
        HARD: { label: "Dificil", className: "level-hard", icon: "H" },
        EXTREME: { label: "Extremo", className: "level-extreme", icon: "E" },
    };
    const data = labels[level] || labels.LIGHT;
    return (
        <span className={data.className}>
            {data.icon} {data.label}
        </span>
    );
}

export function TripCard({ trip }: TripCardProps) {
    const locale = useLocale();
    const t = useTranslations("TripCard");
    const startDate = trip.startDate ? new Date(trip.startDate) : null;
    const endDate = trip.endDate ? new Date(trip.endDate) : null;
    const title = getLocalizedField<string>(trip.title, locale) || "Trip";

    const localeMap: Record<string, Locale> = {
        pt: ptBR,
        en: enUS,
        es: es,
        sv: sv,
    };
    const dateLocale = localeMap[locale] || ptBR;
    const imageAlt = `${title} - ${trip.city}${trip.location ? ", " + trip.location : ""}`;

    return (
        <div className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-white/8 bg-[#0d2436] text-white shadow-[0_16px_44px_rgba(0,0,0,0.2)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-white/14 hover:shadow-[0_22px_58px_rgba(0,0,0,0.28)]">
            <div className="relative aspect-[1.45] w-full overflow-hidden bg-[#071826]">
                <OptimizedImage
                    src={normalizeTripImage(trip.imageUrl)}
                    alt={imageAlt}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={75}
                />

                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.06),rgba(0,0,0,0.06),rgba(0,0,0,0.58))]" />

                <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-[#071826]/58 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm">
                    <MapPin className="h-3 w-3" />
                    {trip.city}
                </div>

                {trip.childrenAllowed === false ? (
                    <div className="absolute right-16 top-3 rounded-full border border-white/10 bg-red-500/85 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm">
                        +18
                    </div>
                ) : null}

                <TourMediaBadges showFavorite />
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div>
                    <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.03em] text-white md:text-lg">{title}</h3>
                    {trip.location ? (
                        <div className="mt-1.5 flex items-center text-sm text-white/62">
                            <MapPin className="mr-1 h-3.5 w-3.5 shrink-0" />
                            {trip.location}
                        </div>
                    ) : null}
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                    {trip.durationDays ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] font-medium text-white/72">
                            <Clock className="h-3 w-3" />
                            {trip.durationDays} {trip.durationDays === 1 ? "dia" : "dias"}
                        </span>
                    ) : null}
                    {trip.physicalLevel ? <PhysicalLevelBadge level={String(trip.physicalLevel)} /> : null}
                    {trip.maxGuests ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[11px] font-medium text-white/72">
                            <Users className="h-3 w-3" />
                            {t("maxGuests", { count: trip.maxGuests })}
                        </span>
                    ) : null}
                </div>

                {startDate ? (
                    <div className="mt-3 flex items-center text-[13px] text-white/60">
                        <Calendar className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                        {format(startDate, "dd 'de' MMMM", { locale: dateLocale })}
                        {endDate ? ` - ${format(endDate, "dd 'de' MMMM", { locale: dateLocale })}` : ""}
                    </div>
                ) : null}

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                    <div>
                        <p className="text-[11px] text-white/50">{t("pricePerPerson")}</p>
                        <p className="mt-1 text-xl font-semibold leading-none tracking-[-0.02em] text-white md:text-[22px]">
                            R$ {(trip.priceCents / 100).toFixed(2).replace(".", ",")}
                        </p>
                    </div>

                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                        <Button
                            asChild
                            className="h-11 min-w-[112px] shrink-0 rounded-xl bg-white px-4 text-sm text-slate-900 transition-all duration-200 hover:bg-white/92"
                        >
                            <Link href={`/tours/${trip.id}`}>{t("reserveNow")}</Link>
                        </Button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
