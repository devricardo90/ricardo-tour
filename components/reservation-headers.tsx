'use client'

import { useTranslations } from 'next-intl';

interface ReservationHeadersProps {
    children: React.ReactNode;
}

export function ReservationHeaders({ children }: ReservationHeadersProps) {
    const t = useTranslations('HomePage.Reservations');

    return (
        <section id="reservas" className="mx-auto max-w-6xl px-5 py-12 md:py-16 lg:px-8 lg:py-20">
            <div className="mx-auto mb-8 max-w-2xl text-center md:mb-10">
                <div className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d8c18f]">
                    {"Passeios dispon\u00edveis"}
                </div>
                <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">{t('title')}</h2>
                <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-7 text-white/64 md:text-base">
                    {t('subtitle')}
                </p>
            </div>

            {children}
        </section>
    );
}
